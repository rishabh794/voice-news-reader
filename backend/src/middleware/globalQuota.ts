import type { Request, Response, NextFunction, RequestHandler } from 'express';

interface GlobalTokenBucket {
    tokens: number;
    lastRefill: number;
    capacity: number;
    refillRate: number;
}

const GLOBAL_QUOTAS = {
    // 100 req/day = ~4.16/hour. I'll configure to allow a slight burst but strict hourly cap.
    gnews: { capacity: 80, refillRate: 80 / 3600 },
    groq: { capacity: 200, refillRate: 200 / 3600 }
};

const globalBuckets = new Map<string, GlobalTokenBucket>();

for (const [resource, quota] of Object.entries(GLOBAL_QUOTAS)) {
    globalBuckets.set(resource, {
        tokens: quota.capacity,
        lastRefill: Date.now(),
        capacity: quota.capacity,
        refillRate: quota.refillRate
    });
}

const refillBucket = (bucket: GlobalTokenBucket): void => {
    const now = Date.now();
    const timePassedSeconds = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timePassedSeconds * bucket.refillRate;
    
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
};

export const globalQuota = (api: 'gnews' | 'groq'): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const bucket = globalBuckets.get(api);

        if (!bucket) {
            next();
            return;
        }

        refillBucket(bucket);

        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            next();
        } else {
            // Calculate retry-after
            const tokensNeeded = 1 - bucket.tokens;
            const retryAfter = Math.ceil(tokensNeeded / bucket.refillRate);

            res.set('Retry-After', String(retryAfter));
            res.status(429).json({
                error: `Global API quota exceeded for ${api}. Please try again later.`,
                retryAfter,
                resource: `global:${api}`
            });
        }
    };
};
