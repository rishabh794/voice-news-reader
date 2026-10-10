import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import { User } from '../../src/models/User.js';
import { AI_NEWS_CATEGORIES } from '../../src/utils/historyCategories.js';
import { createAuthenticatedUser } from '../helpers/testHelpers.js';

describe('TopicPreferences — GET /api/topics', () => {
    it('should return empty topics array for new user', async () => {
        const { authGet } = await createAuthenticatedUser();

        const res = await authGet('/api/topics');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('topics');
        expect(res.body.topics).toEqual([]);
    });

    it('should return saved topics after updating', async () => {
        const { authGet, authPut, userId } = await createAuthenticatedUser();

        await authPut('/api/topics').send({ topics: ['Technology', 'Science'] });

        const res = await authGet('/api/topics');

        expect(res.status).toBe(200);
        expect(res.body.topics).toEqual(['Technology', 'Science']);
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app).get('/api/topics');
        expect(res.status).toBe(401);
    });
});

describe('TopicPreferences — PUT /api/topics', () => {
    it('should update topics successfully', async () => {
        const { authPut } = await createAuthenticatedUser();

        const res = await authPut('/api/topics')
            .send({ topics: ['Business', 'Health', 'Sports'] });

        expect(res.status).toBe(200);
        expect(res.body.topics).toEqual(expect.arrayContaining(['Business', 'Health', 'Sports']));
    });

    it('should reject invalid topic values', async () => {
        const { authPut } = await createAuthenticatedUser();

        const res = await authPut('/api/topics')
            .send({ topics: ['Technology', 'InvalidCategory', 'Politics', 'FakeNews'] });

        expect(res.status).toBe(400);
    });

    it('should deduplicate topics', async () => {
        const { authPut } = await createAuthenticatedUser();

        const res = await authPut('/api/topics')
            .send({ topics: ['Science', 'Science', 'Science'] });

        expect(res.status).toBe(200);
        expect(res.body.topics).toEqual(['Science']);
    });

    it('should accept all valid category values', async () => {
        const { authPut } = await createAuthenticatedUser();

        const res = await authPut('/api/topics')
            .send({ topics: [...AI_NEWS_CATEGORIES] });

        expect(res.status).toBe(200);
        expect(res.body.topics).toHaveLength(AI_NEWS_CATEGORIES.length);
    });

    it('should reject non-array topics', async () => {
        const { authPut } = await createAuthenticatedUser();

        const res = await authPut('/api/topics')
            .send({ topics: 'Technology' });

        expect(res.status).toBe(400);
    });

    it('should allow clearing all topics', async () => {
        const { authPut, authGet } = await createAuthenticatedUser();

        // First set some
        await authPut('/api/topics').send({ topics: ['Technology'] });

        // Then clear
        const res = await authPut('/api/topics').send({ topics: [] });

        expect(res.status).toBe(200);
        expect(res.body.topics).toEqual([]);
    });

    it('should isolate topics between users', async () => {
        const user1 = await createAuthenticatedUser({ email: 'topic1@test.com' });
        const user2 = await createAuthenticatedUser({ email: 'topic2@test.com' });

        await user1.authPut('/api/topics').send({ topics: ['Technology', 'Science'] });
        await user2.authPut('/api/topics').send({ topics: ['Sports'] });

        const res1 = await user1.authGet('/api/topics');
        const res2 = await user2.authGet('/api/topics');

        expect(res1.body.topics).toEqual(['Technology', 'Science']);
        expect(res2.body.topics).toEqual(['Sports']);
    });
});
