import { redisClient } from './redis.js';

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
