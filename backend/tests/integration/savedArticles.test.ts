import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import { SavedArticle } from '../../src/models/SavedArticle.js';
import { Collection } from '../../src/models/Collection.js';
import {
    createAuthenticatedUser,
    buildArticlePayload,
    randomObjectId,
} from '../helpers/testHelpers.js';

describe('SavedArticles — POST /api/saved-articles', () => {
    it('should save a new article and auto-assign to default collection', async () => {
        const { authPost, userId } = await createAuthenticatedUser();

        const payload = buildArticlePayload();
        const res = await authPost('/api/saved-articles').send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('title', payload.title);
        expect(res.body).toHaveProperty('url', payload.url);
        expect(res.body).toHaveProperty('collectionId');

        // Verify a default collection was created
        const defaultCollection = await Collection.findOne({ userId, isDefault: true });
        expect(defaultCollection).toBeTruthy();
        expect(res.body.collectionId).toBe(String(defaultCollection!._id));
    });

    it('should return existing article instead of creating duplicate', async () => {
        const { authPost } = await createAuthenticatedUser();

        const payload = buildArticlePayload();

        const first = await authPost('/api/saved-articles').send(payload);
        expect(first.status).toBe(201);

        const second = await authPost('/api/saved-articles').send(payload);
        expect(second.status).toBe(200); // not 201 — idempotent
        expect(second.body._id).toBe(first.body._id);
    });

    it('should save to a specific collection when collectionId is provided', async () => {
        const { authPost, authGet } = await createAuthenticatedUser();

        // Create a custom collection
        const collRes = await authPost('/api/collections').send({ name: 'Tech' });
        const collectionId = collRes.body._id;

        const payload = buildArticlePayload({ collectionId });
        const res = await authPost('/api/saved-articles').send(payload);

        expect(res.status).toBe(201);
        expect(res.body.collectionId).toBe(collectionId);
    });

    it('should reject missing title or url', async () => {
        const { authPost } = await createAuthenticatedUser();

        const noTitle = await authPost('/api/saved-articles')
            .send(buildArticlePayload({ title: undefined }));
        expect(noTitle.status).toBe(400);

        const noUrl = await authPost('/api/saved-articles')
            .send(buildArticlePayload({ url: undefined }));
        expect(noUrl.status).toBe(400);
    });

    it('should reject invalid publishedAt date', async () => {
        const { authPost } = await createAuthenticatedUser();

        const res = await authPost('/api/saved-articles')
            .send(buildArticlePayload({ publishedAt: 'not-a-date' }));

        expect(res.status).toBe(400);
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app)
            .post('/api/saved-articles')
            .set('X-Requested-With', 'XMLHttpRequest')
            .send(buildArticlePayload());

        expect(res.status).toBe(401);
    });
});

describe('SavedArticles — GET /api/saved-articles', () => {
    it('should return all saved articles for the user', async () => {
        const { authPost, authGet } = await createAuthenticatedUser();

        await authPost('/api/saved-articles').send(buildArticlePayload());
        await authPost('/api/saved-articles').send(buildArticlePayload());

        const res = await authGet('/api/saved-articles');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
    });

    it('should filter by collectionId when provided', async () => {
        const { authPost, authGet } = await createAuthenticatedUser();

        // Create a collection
        const collRes = await authPost('/api/collections').send({ name: 'Filtered' });
        const collectionId = collRes.body._id;

        // Save one article to the custom collection
        await authPost('/api/saved-articles').send(buildArticlePayload({ collectionId }));
        // Save another to default
        await authPost('/api/saved-articles').send(buildArticlePayload());

        const filtered = await authGet(`/api/saved-articles?collectionId=${collectionId}`);

        expect(filtered.status).toBe(200);
        expect(filtered.body).toHaveLength(1);
        expect(filtered.body[0].collectionId).toBe(collectionId);
    });

    it('should isolate articles between users', async () => {
        const user1 = await createAuthenticatedUser({ email: 'sa1@test.com' });
        const user2 = await createAuthenticatedUser({ email: 'sa2@test.com' });

        await user1.authPost('/api/saved-articles').send(buildArticlePayload());
        await user1.authPost('/api/saved-articles').send(buildArticlePayload());

        const res = await user2.authGet('/api/saved-articles');
        expect(res.body).toHaveLength(0);
    });
});

describe('SavedArticles — DELETE /api/saved-articles/:id', () => {
    it('should delete a saved article', async () => {
        const { authPost, authDelete, userId } = await createAuthenticatedUser();

        const saved = await authPost('/api/saved-articles').send(buildArticlePayload());
        const articleId = saved.body._id;

        const res = await authDelete(`/api/saved-articles/${articleId}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Saved article removed');

        const count = await SavedArticle.countDocuments({ userId });
        expect(count).toBe(0);
    });

    it('should return 404 for non-existent article', async () => {
        const { authDelete } = await createAuthenticatedUser();

        const res = await authDelete(`/api/saved-articles/${randomObjectId()}`);
        expect(res.status).toBe(404);
    });

    it('should not allow deleting another user\'s article', async () => {
        const user1 = await createAuthenticatedUser({ email: 'del-owner@test.com' });
        const user2 = await createAuthenticatedUser({ email: 'del-attacker@test.com' });

        const saved = await user1.authPost('/api/saved-articles').send(buildArticlePayload());

        const res = await user2.authDelete(`/api/saved-articles/${saved.body._id}`);
        expect(res.status).toBe(404);
    });
});

describe('SavedArticles — PUT /api/saved-articles/:id', () => {
    it('should update collectionId for a saved article', async () => {
        const { authPost, authPut } = await createAuthenticatedUser();

        // Create article
        const saved = await authPost('/api/saved-articles').send(buildArticlePayload());

        // Create a new collection to move it to
        const collRes = await authPost('/api/collections').send({ name: 'Move Here' });

        const res = await authPut(`/api/saved-articles/${saved.body._id}`)
            .send({ collectionId: collRes.body._id });

        expect(res.status).toBe(200);
        expect(res.body.collectionId).toHaveProperty('_id', collRes.body._id);
    });

    it('should update isRead status', async () => {
        const { authPost, authPut } = await createAuthenticatedUser();

        const saved = await authPost('/api/saved-articles').send(buildArticlePayload());

        const res = await authPut(`/api/saved-articles/${saved.body._id}`)
            .send({ isRead: true });

        expect(res.status).toBe(200);
        expect(res.body.isRead).toBe(true);
    });

    it('should reject update with no fields', async () => {
        const { authPost, authPut } = await createAuthenticatedUser();

        const saved = await authPost('/api/saved-articles').send(buildArticlePayload());

        const res = await authPut(`/api/saved-articles/${saved.body._id}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/no update fields/i);
    });

    it('should reject invalid collectionId', async () => {
        const { authPost, authPut } = await createAuthenticatedUser();

        const saved = await authPost('/api/saved-articles').send(buildArticlePayload());

        const res = await authPut(`/api/saved-articles/${saved.body._id}`)
            .send({ collectionId: 'invalid-id' });

        expect(res.status).toBe(400);
    });
});
