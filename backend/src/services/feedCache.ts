import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: ReturnType<typeof createClient> | null = null;

if (process.env.REDIS_URL) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    redisClient.connect().catch(console.error);
} else {
    console.warn('REDIS_URL not set. feedCache will act as a no-op / passthrough.');
}

export const feedCache = {
    async get<T>(key: string): Promise<T | null> {
        if (!redisClient?.isReady) return null;
        try {
            const data = await redisClient.get(key);
            if (data) return JSON.parse(data) as T;
        } catch (error) {
            console.error('Redis get error:', error);
        }
        return null;
    },
    
    async set(key: string, data: any, ttlSeconds: number): Promise<void> {
        if (!redisClient?.isReady) return;
        try {
            await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }
};
