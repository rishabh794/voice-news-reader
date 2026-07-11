import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: ReturnType<typeof createClient> | null = null;

if (process.env.REDIS_URL) {
    redisClient = createClient({ 
        url: process.env.REDIS_URL,
        socket: {
            connectTimeout: 20000,
            reconnectStrategy: (retries) => {
                if (retries > 10) return new Error('Retry timeout');
                return 2000;
            }
        }
    });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    redisClient.connect().catch(console.error);
} else {
    console.warn('REDIS_URL not set. Redis features will act as a no-op.');
}

export { redisClient };

/**
 * Token Bucket Lua script.
 * KEYS[1] = bucket key
 * ARGV[1] = capacity
 * ARGV[2] = refillRate (tokens per second)
 * ARGV[3] = now (timestamp in ms)
 * 
 * Returns: { allowed (1 or 0), remaining tokens }
 */
const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(bucket[1])
local lastRefill = tonumber(bucket[2])

if not tokens or not lastRefill then
    tokens = capacity
    lastRefill = now
else
    local elapsedSeconds = (now - lastRefill) / 1000
    if elapsedSeconds > 0 then
        tokens = math.min(capacity, tokens + (elapsedSeconds * refillRate))
        lastRefill = now
    end
end

if tokens >= 1 then
    tokens = tokens - 1
    redis.call('HMSET', key, 'tokens', tostring(tokens), 'lastRefill', tostring(lastRefill))
    local ttl = math.ceil(capacity / refillRate)
    redis.call('EXPIRE', key, ttl)
    return { 1, tostring(tokens) }
else
    return { 0, tostring(tokens) }
end
`;

export interface TokenBucketResult {
    allowed: boolean;
    remaining: number;
}

export const takeToken = async (
    key: string,
    capacity: number,
    refillRate: number
): Promise<TokenBucketResult | null> => {
    if (!redisClient?.isReady) {
        // Fail-open if Redis is down
        return null;
    }

    try {
        const now = Date.now();
        // eval command takes: script, { keys: [key], arguments: [args] } in node-redis v4
        const result = await redisClient.eval(
            TOKEN_BUCKET_SCRIPT,
            {
                keys: [key],
                arguments: [capacity.toString(), refillRate.toString(), now.toString()]
            }
        ) as [number, string];

        const allowed = result[0] === 1;
        const remaining = parseFloat(result[1]);

        return { allowed, remaining };
    } catch (error) {
        console.error('Redis token bucket error:', error);
        // Fail-open on script error
        return null;
    }
};
