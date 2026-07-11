import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { AuthRequest } from './authMiddleware.js';
import { takeToken } from '../services/redis.js';

export interface RateLimitConfig {
    resource: string;
    perUser: number;
    windowSeconds: number;
    burst?: number;
    keyExtractor?: 'user' | 'ip';
}

const getResetTimestamp = (remaining: number, capacity: number, refillRate: number): number => {
    const tokensNeeded = capacity - remaining;
    const secondsToRefill = tokensNeeded / refillRate;
    return Math.floor((Date.now() + secondsToRefill * 1000) / 1000);
};

const getRetryAfterSeconds = (remaining: number, refillRate: number): number => {
    if (remaining >= 1) return 0;
    const tokensNeeded = 1 - remaining;
    return Math.ceil(tokensNeeded / refillRate);
};

export const rateLimit = (config: RateLimitConfig): RequestHandler => {
    const capacity = config.burst || Math.ceil(config.perUser * 1.5);
    const refillRate = config.perUser / config.windowSeconds;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const keyExtractor = config.keyExtractor || 'user';
        let key = '';

        if (keyExtractor === 'ip') {
            key = `rl:ip:${req.ip}:${config.resource}`;
        } else {
            const authReq = req as AuthRequest;
            if (!authReq.user) {
                // Should not happen if verifyToken is called before rateLimit, but fallback to IP if needed
                key = `rl:ip:${req.ip}:${config.resource}`;
            } else {
                key = `rl:user:${authReq.user.id}:${config.resource}`;
            }
        }

        const result = await takeToken(key, capacity, refillRate);

        if (!result) {
            // Fail-open: Redis is down or script failed
            next();
            return;
        }

        const { allowed, remaining } = result;

        if (allowed) {
            res.set('X-RateLimit-Limit', String(config.perUser));
            res.set('X-RateLimit-Remaining', String(Math.floor(remaining)));
            res.set('X-RateLimit-Reset', String(getResetTimestamp(remaining, capacity, refillRate)));
            next();
        } else {
            const retryAfter = getRetryAfterSeconds(remaining, refillRate);
            res.set('Retry-After', String(retryAfter));
            res.set('X-RateLimit-Remaining', '0');
            res.status(429).json({
                error: 'Too many requests',
                retryAfter,
                resource: config.resource
            });
        }
    };
};
