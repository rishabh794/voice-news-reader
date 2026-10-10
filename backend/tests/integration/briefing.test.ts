import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import { User } from '../../src/models/User.js';
import { Briefing } from '../../src/models/Briefing.js';
import { createAuthenticatedUser } from '../helpers/testHelpers.js';

/**
 * Briefing controller tests.
 * External services (GNews, Groq) are mocked to avoid real API calls.
 */

// Mock the briefingService to avoid GNews/Groq calls
vi.mock('../../src/services/briefingService.js', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        // Override generateUserBriefing to return a fake briefing
        generateUserBriefing: vi.fn().mockImplementation(async (userId: string) => {
            const date = actual.getTodayDateISO();
            return Briefing.findOneAndUpdate(
                { userId, date },
                {
                    topics: ['Technology'],
                    script: 'Test briefing script.',
                    sections: [{
                        topic: 'Technology',
                        summary: 'Test summary',
                        articles: [{
                            title: 'Test Article',
                            description: 'Desc',
                            url: 'https://example.com',
                            image: '',
                            publishedAt: new Date().toISOString(),
                            source: { name: 'Test', url: 'https://test.com' },
                        }],
                    }],
                },
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );
        }),
        generateAllBriefings: vi.fn().mockResolvedValue({ generated: 1, emailed: 0, errors: 0 }),
    };
});

describe('Briefing — GET /api/briefing/latest', () => {
    it('should return null when no briefing exists for today', async () => {
        const { authGet } = await createAuthenticatedUser();

        const res = await authGet('/api/briefing/latest');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('briefing', null);
    });

    it('should return today\'s briefing when one exists', async () => {
        const { authGet, authPost } = await createAuthenticatedUser();

        // Generate one first
        await authPost('/api/briefing/generate');

        const res = await authGet('/api/briefing/latest');

        expect(res.status).toBe(200);
        expect(res.body.briefing).toBeTruthy();
        expect(res.body.briefing).toHaveProperty('script');
        expect(res.body.briefing).toHaveProperty('sections');
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app).get('/api/briefing/latest');
        expect(res.status).toBe(401);
    });
});

describe('Briefing — POST /api/briefing/generate', () => {
    it('should generate a briefing for the user', async () => {
        const { authPost } = await createAuthenticatedUser();

        const res = await authPost('/api/briefing/generate');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('briefing');
        expect(res.body.briefing).toHaveProperty('script', 'Test briefing script.');
    });
});

describe('Briefing — Settings', () => {
    it('should return default settings for new user', async () => {
        const { authGet } = await createAuthenticatedUser();

        const res = await authGet('/api/briefing/settings');

        expect(res.status).toBe(200);
        expect(res.body.settings).toEqual({ enabled: false, emailEnabled: false });
    });

    it('should update briefing settings', async () => {
        const { authPut, authGet } = await createAuthenticatedUser();

        const res = await authPut('/api/briefing/settings')
            .send({ enabled: true, emailEnabled: true });

        expect(res.status).toBe(200);
        expect(res.body.settings.enabled).toBe(true);
        expect(res.body.settings.emailEnabled).toBe(true);

        // Verify persisted
        const getRes = await authGet('/api/briefing/settings');
        expect(getRes.body.settings.enabled).toBe(true);
    });

    it('should allow partial updates', async () => {
        const { authPut } = await createAuthenticatedUser();

        const res = await authPut('/api/briefing/settings')
            .send({ enabled: true }); // only enabled, no emailEnabled

        expect(res.status).toBe(200);
        expect(res.body.settings.enabled).toBe(true);
        expect(res.body.settings.emailEnabled).toBe(false); // unchanged
    });
});

describe('Briefing — GET /api/briefing/history', () => {
    it('should return paginated briefing history', async () => {
        const { authPost, authGet, userId } = await createAuthenticatedUser();

        // Seed a few briefings with different dates
        await Briefing.create([
            { userId, date: '2026-10-01', topics: ['Technology'], script: 'Day 1', sections: [] },
            { userId, date: '2026-10-02', topics: ['Science'], script: 'Day 2', sections: [] },
            { userId, date: '2026-10-03', topics: ['Sports'], script: 'Day 3', sections: [] },
        ]);

        const res = await authGet('/api/briefing/history?page=1&limit=2');

        expect(res.status).toBe(200);
        expect(res.body.briefings).toHaveLength(2);
        expect(res.body.pagination).toEqual({
            page: 1,
            limit: 2,
            total: 3,
            totalPages: 2,
        });
    });

    it('should return empty results for user with no briefings', async () => {
        const { authGet } = await createAuthenticatedUser();

        const res = await authGet('/api/briefing/history');

        expect(res.status).toBe(200);
        expect(res.body.briefings).toEqual([]);
        expect(res.body.pagination.total).toBe(0);
    });

    it('should reject limit greater than 30', async () => {
        const { authGet } = await createAuthenticatedUser();

        const res = await authGet('/api/briefing/history?limit=100');

        expect(res.status).toBe(400);
    });

    it('should allow maximum limit of 30', async () => {
        const { authGet } = await createAuthenticatedUser();

        const res = await authGet('/api/briefing/history?limit=30');

        expect(res.status).toBe(200);
        expect(res.body.pagination.limit).toBe(30);
    });
});

describe('Briefing — GET /api/briefing/:id', () => {
    it('should return a specific briefing by ID', async () => {
        const { authGet, userId } = await createAuthenticatedUser();

        const briefing = await Briefing.create({
            userId,
            date: '2026-10-05',
            topics: ['World'],
            script: 'Specific briefing',
            sections: [],
        });

        const res = await authGet(`/api/briefing/${briefing._id}`);

        expect(res.status).toBe(200);
        expect(res.body.briefing).toHaveProperty('script', 'Specific briefing');
    });

    it('should return 404 for non-existent briefing', async () => {
        const { authGet } = await createAuthenticatedUser();
        const fakeId = '507f1f77bcf86cd799439011';

        const res = await authGet(`/api/briefing/${fakeId}`);
        expect(res.status).toBe(404);
    });

    it('should not allow accessing another user\'s briefing', async () => {
        const user1 = await createAuthenticatedUser({ email: 'br-owner@test.com' });
        const user2 = await createAuthenticatedUser({ email: 'br-attacker@test.com' });

        const briefing = await Briefing.create({
            userId: user1.userId,
            date: '2026-10-06',
            topics: ['Technology'],
            script: 'Private',
            sections: [],
        });

        const res = await user2.authGet(`/api/briefing/${briefing._id}`);
        expect(res.status).toBe(404);
    });
});
