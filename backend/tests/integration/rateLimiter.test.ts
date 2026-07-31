import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import * as redisService from '../../src/services/redis.js';
import { vi } from 'vitest';

describe('Rate Limiter', () => {
    // Mock takeToken to easily simulate rate limits
    beforeEach(() => {
        let requestCount = 0;
        vi.spyOn(redisService, 'takeToken').mockImplementation(async () => {
            requestCount++;
            if (requestCount <= 8) {
                return { allowed: true, remaining: 8 - requestCount };
            }
            return { allowed: false, remaining: 0 };
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should allow requests under the limit', async () => {
        // Send 3 requests (well under the limit)
        for (let i = 0; i < 3; i++) {
            const res = await request(app)
                .post('/api/auth/login')
                .set('X-Requested-With', 'XMLHttpRequest')
                .set('X-Forwarded-For', '127.0.0.1') // simulate IP
                .send({});

            // It should return 400 Bad Request because email/password are missing, 
            // but it should NOT return 429 Too Many Requests
            expect(res.status).not.toBe(429);
        }
    });

    it('should allow up to burst limit but eventually block with 429', async () => {
        const ip = '192.168.1.100'; // Use a distinct IP to ensure a fresh rate limit bucket

        let blocked = false;
        let responseStatus;

        // Burst limit is 8. Sending 15 requests should guarantee we hit the 429 block.
        for (let i = 0; i < 15; i++) {
            const res = await request(app)
                .post('/api/auth/login')
                .set('X-Requested-With', 'XMLHttpRequest')
                .set('X-Forwarded-For', ip)
                .send({});

            if (res.status === 429) {
                blocked = true;
                responseStatus = res;
                break;
            }
        }

        expect(blocked).toBe(true);
        expect(responseStatus?.headers).toHaveProperty('retry-after');
        expect(responseStatus?.body).toHaveProperty('error', 'Too many requests');
    });
});
