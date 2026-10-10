import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../../src/index.js';
import { CSRF_HEADER } from '../helpers/testHelpers.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_that_is_at_least_32_chars_long_for_security';

describe('Auth Middleware — verifyToken', () => {
    it('should accept a valid JWT from cookie', async () => {
        const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, JWT_SECRET, { expiresIn: '15m' });

        // /api/auth/me is a GET protected by verifyToken
        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', `token=${token}`);

        // It should pass auth (user might not exist in DB → 404, but NOT 401/403)
        expect([200, 404]).toContain(res.status);
    });

    it('should accept a valid JWT from Authorization Bearer header', async () => {
        const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, JWT_SECRET, { expiresIn: '15m' });

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 404]).toContain(res.status);
    });

    it('should reject request with no token', async () => {
        const res = await request(app).get('/api/auth/me');

        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/no token provided/i);
    });

    it('should reject an expired token with TOKEN_EXPIRED code', async () => {
        const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, JWT_SECRET, { expiresIn: '0s' });

        // Small delay to ensure expiration
        await new Promise(r => setTimeout(r, 100));

        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', `token=${token}`);

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('code', 'TOKEN_EXPIRED');
    });

    it('should reject a tampered/invalid token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', 'token=this.is.not.a.valid.jwt');

        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/invalid token/i);
    });
});

describe('CSRF Middleware', () => {
    it('should allow GET requests without X-Requested-With', async () => {
        const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, JWT_SECRET, { expiresIn: '15m' });

        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', `token=${token}`);

        // GET requests should bypass CSRF — should not get 403
        expect(res.status).not.toBe(403);
    });

    it('should block POST without X-Requested-With header', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com', password: 'pass123' });

        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/CSRF/i);
    });

    it('should block incorrect X-Requested-With value', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('X-Requested-With', 'NotXMLHttpRequest')
            .send({ email: 'test@test.com', password: 'pass123' });

        expect(res.status).toBe(403);
    });

    it('should allow POST with valid X-Requested-With header', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set(CSRF_HEADER)
            .send({ email: 'test@test.com', password: 'pass123' });

        // Should NOT be 403 — might be 400 (bad credentials), but CSRF passed
        expect(res.status).not.toBe(403);
    });
});
