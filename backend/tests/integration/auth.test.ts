import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import { User } from '../../src/models/User.js';

describe('Auth Endpoints', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('X-Requested-With', 'XMLHttpRequest')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('message', 'User created successfully');
        });

        it('should fail if email is already taken', async () => {
            await request(app)
                .post('/api/auth/register')
                .set('X-Requested-With', 'XMLHttpRequest')
                .send({ email: 'test@example.com', password: 'password123' });

            const res = await request(app)
                .post('/api/auth/register')
                .set('X-Requested-With', 'XMLHttpRequest')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(res.status).toBe(400); // Because we check explicitly for duplicate before save now, or 409
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .set('X-Requested-With', 'XMLHttpRequest')
                .send({ email: 'test@example.com', password: 'password123' });
        });

        it('should login and return access and refresh cookies', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set('X-Requested-With', 'XMLHttpRequest')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('email', 'test@example.com');

            // Verify cookies
            const cookies = (res.headers['set-cookie'] || []) as unknown as string[];
            expect(cookies).toBeDefined();
            expect(cookies.some((cookie: string) => cookie.includes('token='))).toBeTruthy();
            expect(cookies.some((cookie: string) => cookie.includes('refreshToken='))).toBeTruthy();
        });
    });

    describe('POST /api/auth/refresh', () => {
        let refreshToken: string;

        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .set('X-Requested-With', 'XMLHttpRequest')
                .send({ email: 'test@example.com', password: 'password123' });

            const res = await request(app)
                .post('/api/auth/login')
                .set('X-Requested-With', 'XMLHttpRequest')
                .send({ email: 'test@example.com', password: 'password123' });

            const cookies = (res.headers['set-cookie'] || []) as unknown as string[];
            const refreshCookie = cookies.find((c: string) => c && c.startsWith('refreshToken='));
            if (refreshCookie) {
                const parts = refreshCookie.split(';')[0]?.split('=');
                if (parts && parts.length > 1) {
                    refreshToken = parts[1] as string;
                }
            }
        });

        it('should rotate tokens given a valid refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .set('X-Requested-With', 'XMLHttpRequest')
                .set('Cookie', `refreshToken=${refreshToken}`);

            expect(res.status).toBe(200);

            const cookies = (res.headers['set-cookie'] || []) as unknown as string[];
            expect(cookies).toBeDefined();
            expect(cookies.some((cookie: string) => cookie.includes('token='))).toBeTruthy();
            expect(cookies.some((cookie: string) => cookie.includes('refreshToken='))).toBeTruthy();

            // Check that DB was updated (Token Rotation)
            const user = await User.findOne({ email: 'test@example.com' });
            expect(user?.refreshTokens).not.toContain(refreshToken); // old token removed
            expect(user?.refreshTokens.length).toBe(1); // new token added
        });

        it('should fail with a fake refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .set('X-Requested-With', 'XMLHttpRequest')
                .set('Cookie', `refreshToken=fake_hacker_token`);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid refresh token');
        });
    });

    describe('CSRF Edge Cases', () => {
        it('should fail if X-Requested-With header is missing', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('error', 'CSRF Protection: Missing or invalid X-Requested-With header.');
        });
    });
});
