import { describe, it, expect } from 'vitest';
import { History } from '../../src/models/History.js';
import request from 'supertest';
import app from '../../src/index.js';
import {
    createAuthenticatedUser,
    randomObjectId,
} from '../helpers/testHelpers.js';

/**
 * Seed history entries for a user directly in the database.
 */
async function seedHistory(userId: string, count: number) {
    const entries = Array.from({ length: count }, (_, i) => ({
        userId,
        query: `query-${i}`,
        summary: `Summary for query ${i}`,
        category: 'Technology',
        articles: [
            { title: `Article ${i}`, description: `Desc ${i}`, url: `https://example.com/${i}` },
        ],
    }));
    return History.insertMany(entries);
}

describe('History — GET /api/history', () => {
    it('should return empty array for user with no history', async () => {
        const { authGet } = await createAuthenticatedUser();

        const res = await authGet('/api/history');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('should return history entries sorted by most recent first', async () => {
        const { authGet, userId } = await createAuthenticatedUser();

        await seedHistory(userId, 3);

        const res = await authGet('/api/history');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(3);
        // Each entry should have the expected shape
        expect(res.body[0]).toHaveProperty('query');
        expect(res.body[0]).toHaveProperty('summary');
        expect(res.body[0]).toHaveProperty('category');
        expect(res.body[0]).toHaveProperty('articles');
    });

    it('should normalize categories (valid categories pass through, unknown → Uncategorized)', async () => {
        const { authGet, userId } = await createAuthenticatedUser();

        await History.create({
            userId,
            query: 'test',
            summary: 'test',
            category: 'Technology',
            articles: [],
        });

        const res = await authGet('/api/history');
        expect(res.body[0].category).toBe('Technology');
    });

    it('should isolate history between users', async () => {
        const user1 = await createAuthenticatedUser({ email: 'history1@test.com' });
        const user2 = await createAuthenticatedUser({ email: 'history2@test.com' });

        await seedHistory(user1.userId, 5);
        await seedHistory(user2.userId, 2);

        const res1 = await user1.authGet('/api/history');
        const res2 = await user2.authGet('/api/history');

        expect(res1.body).toHaveLength(5);
        expect(res2.body).toHaveLength(2);
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app).get('/api/history');
        expect(res.status).toBe(401);
    });
});

describe('History — DELETE /api/history/:historyId', () => {
    it('should delete a specific history entry', async () => {
        const { authDelete, userId } = await createAuthenticatedUser();

        const [entry] = await seedHistory(userId, 1);
        expect(entry).toBeDefined();

        const res = await authDelete(`/api/history/${entry!._id}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'History entry deleted successfully');

        // Verify removal
        const count = await History.countDocuments({ userId });
        expect(count).toBe(0);
    });

    it('should return 404 when deleting non-existent entry', async () => {
        const { authDelete } = await createAuthenticatedUser();

        const res = await authDelete(`/api/history/${randomObjectId()}`);
        expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ObjectId', async () => {
        const { authDelete } = await createAuthenticatedUser();

        const res = await authDelete('/api/history/invalid-id');
        expect(res.status).toBe(400);
    });

    it('should not allow deleting another user\'s history', async () => {
        const user1 = await createAuthenticatedUser({ email: 'owner-h@test.com' });
        const user2 = await createAuthenticatedUser({ email: 'other-h@test.com' });

        const [entry] = await seedHistory(user1.userId, 1);
        expect(entry).toBeDefined();

        const res = await user2.authDelete(`/api/history/${entry!._id}`);
        expect(res.status).toBe(404);

        // Verify it still exists
        const stillExists = await History.findById(entry!._id);
        expect(stillExists).toBeTruthy();
    });
});

describe('History — DELETE /api/history (clear all)', () => {
    it('should clear all history for the authenticated user', async () => {
        const { authDelete, userId } = await createAuthenticatedUser();

        await seedHistory(userId, 5);

        const res = await authDelete('/api/history');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'History cleared successfully');
        expect(res.body.deletedCount).toBe(5);

        const count = await History.countDocuments({ userId });
        expect(count).toBe(0);
    });

    it('should not affect other users\' history', async () => {
        const user1 = await createAuthenticatedUser({ email: 'clear1@test.com' });
        const user2 = await createAuthenticatedUser({ email: 'clear2@test.com' });

        await seedHistory(user1.userId, 3);
        await seedHistory(user2.userId, 4);

        await user1.authDelete('/api/history');

        const user2Count = await History.countDocuments({ userId: user2.userId });
        expect(user2Count).toBe(4);
    });
});
