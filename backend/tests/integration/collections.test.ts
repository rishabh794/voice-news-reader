import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import { Collection } from '../../src/models/Collection.js';
import {
    CSRF_HEADER,
    createAuthenticatedUser,
    randomObjectId,
} from '../helpers/testHelpers.js';

describe('Collections — GET /api/collections', () => {
    it('should auto-create a default collection when none exist', async () => {
        const { authGet } = await createAuthenticatedUser();

        const res = await authGet('/api/collections');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toHaveProperty('name', 'All Saved');
        expect(res.body[0]).toHaveProperty('isDefault', true);
    });

    it('should return all user collections sorted by creation order', async () => {
        const { authGet, authPost } = await createAuthenticatedUser();

        // Create 2 extra collections (default is auto-created on first GET)
        await authGet('/api/collections'); // triggers default creation
        await authPost('/api/collections').send({ name: 'Favorites', icon: 'Heart' });
        await authPost('/api/collections').send({ name: 'Read Later', icon: 'Clock' });

        const res = await authGet('/api/collections');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(3);
        expect(res.body[0].name).toBe('All Saved');
        expect(res.body[1].name).toBe('Favorites');
        expect(res.body[2].name).toBe('Read Later');
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app).get('/api/collections');
        expect(res.status).toBe(401);
    });
});

describe('Collections — POST /api/collections', () => {
    it('should create a new collection', async () => {
        const { authPost } = await createAuthenticatedUser();

        const res = await authPost('/api/collections')
            .send({ name: 'Tech News', icon: 'Laptop' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('name', 'Tech News');
        expect(res.body).toHaveProperty('icon', 'Laptop');
        expect(res.body).toHaveProperty('isDefault', false);
    });

    it('should reject duplicate collection names for the same user', async () => {
        const { authPost, authGet } = await createAuthenticatedUser();

        // Trigger default
        await authGet('/api/collections');

        await authPost('/api/collections').send({ name: 'My List' });

        const res = await authPost('/api/collections').send({ name: 'My List' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/already exists/i);
    });

    it('should reject empty or missing name', async () => {
        const { authPost } = await createAuthenticatedUser();

        const noName = await authPost('/api/collections').send({});
        expect(noName.status).toBe(400);

        const emptyName = await authPost('/api/collections').send({ name: '  ' });
        expect(emptyName.status).toBe(400);
    });

    it('should default icon to "Folder" when not provided', async () => {
        const { authPost } = await createAuthenticatedUser();

        const res = await authPost('/api/collections')
            .send({ name: 'No Icon Collection' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('icon', 'Folder');
    });

    it('should allow different users to have collections with the same name', async () => {
        const user1 = await createAuthenticatedUser({ email: 'user1@test.com' });
        const user2 = await createAuthenticatedUser({ email: 'user2@test.com' });

        const res1 = await user1.authPost('/api/collections').send({ name: 'Shared Name' });
        const res2 = await user2.authPost('/api/collections').send({ name: 'Shared Name' });

        expect(res1.status).toBe(201);
        expect(res2.status).toBe(201);
    });
});

describe('Collections — DELETE /api/collections/:id', () => {
    it('should delete a non-default collection', async () => {
        const { authPost, authDelete, authGet } = await createAuthenticatedUser();

        const createRes = await authPost('/api/collections')
            .send({ name: 'To Delete' });
        const collectionId = createRes.body._id;

        const deleteRes = await authDelete(`/api/collections/${collectionId}`);
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body).toHaveProperty('message', 'Collection deleted');

        // Verify it's gone
        const collection = await Collection.findById(collectionId);
        expect(collection).toBeNull();
    });

    it('should prevent deleting the default collection', async () => {
        const { authGet, authDelete } = await createAuthenticatedUser();

        // Trigger auto-creation of default
        const listRes = await authGet('/api/collections');
        const defaultId = listRes.body[0]._id;

        const res = await authDelete(`/api/collections/${defaultId}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/cannot delete.*default/i);
    });

    it('should return 404 for non-existent collection', async () => {
        const { authDelete } = await createAuthenticatedUser();
        const fakeId = randomObjectId();

        const res = await authDelete(`/api/collections/${fakeId}`);
        expect(res.status).toBe(404);
    });

    it('should not allow deleting another user\'s collection', async () => {
        const user1 = await createAuthenticatedUser({ email: 'owner@test.com' });
        const user2 = await createAuthenticatedUser({ email: 'attacker@test.com' });

        const createRes = await user1.authPost('/api/collections')
            .send({ name: 'Private' });

        const res = await user2.authDelete(`/api/collections/${createRes.body._id}`);
        expect(res.status).toBe(404); // treated as "not found" for this user
    });
});
