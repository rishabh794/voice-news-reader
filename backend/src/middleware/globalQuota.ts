import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { takeToken } from '../services/redis.js';

interface QuotaConfig {
    capacity: number;
    refillRate: number;
}

const GLOBAL_QUOTAS: Record<string, QuotaConfig> = {
    // 100 req/day = ~4.16/hour. Allow a slight burst but strict hourly cap.
    gnews: { capacity: 80, refillRate: 80 / 3600 },
    groq: { capacity: 200, refillRate: 200 / 3600 }
};

export const globalQuota = (api: 'gnews' | 'groq'): RequestHandler => {
    const config = GLOBAL_QUOTAS[api];

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!config) {
            next();
            return;
        }

        const key = `global:quota:${api}`;
        const result = await takeToken(key, config.capacity, config.refillRate);

        if (!result) {
            // Fail-open: Redis is down or script failed
            next();
            return;
        }

        if (result.allowed) {
            next();
        } else {
            const retryAfter = Math.ceil((1 - result.remaining) / config.refillRate);
            res.set('Retry-After', String(retryAfter));
            res.status(429).json({
                error: `Global API quota exceeded for ${api}. Please try again later.`,
                retryAfter,
                resource: `global:${api}`
            });
        }
    };
};
