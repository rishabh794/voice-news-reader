import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import { User } from '../../src/models/User.js';
import {
    CSRF_HEADER,
    createAuthenticatedUser,
    createGoogleOnlyUser,
    createUnverifiedUser,
} from '../helpers/testHelpers.js';

/**
 * Email verification tests.
 * Tests verify-email and resend-verification flows that the existing auth.test.ts doesn't cover.
 */
describe('Auth — Email Verification', () => {
    describe('POST /api/auth/verify-email', () => {
        it('should verify a user with a valid token and auto-login', async () => {
            const { user } = await createUnverifiedUser();

            const res = await request(app)
                .post('/api/auth/verify-email')
                .set(CSRF_HEADER)
                .send({ token: 'test-verification-token' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Email verified successfully');
            expect(res.body).toHaveProperty('email', user.email);

            // Should set auth cookies
            const cookies = (res.headers['set-cookie'] || []) as unknown as string[];
            expect(cookies.some((c: string) => c.includes('token='))).toBe(true);
            expect(cookies.some((c: string) => c.includes('refreshToken='))).toBe(true);

            // DB should reflect verified status
            const updated = await User.findById(user._id);
            expect(updated?.isEmailVerified).toBe(true);
            expect(updated?.verificationToken).toBeNull();
        });

        it('should reject an expired verification token', async () => {
            const { user } = await createUnverifiedUser();
            await User.updateOne(
                { _id: user._id },
                { verificationTokenExpiresAt: new Date(Date.now() - 1000) } // already expired
            );

            const res = await request(app)
                .post('/api/auth/verify-email')
                .set(CSRF_HEADER)
                .send({ token: 'test-verification-token' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Invalid or expired verification token');
        });

        it('should reject a missing token', async () => {
            const res = await request(app)
                .post('/api/auth/verify-email')
                .set(CSRF_HEADER)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Verification token is required');
        });
    });

    describe('POST /api/auth/resend-verification', () => {
        it('should accept a valid unverified email (and not reveal whether the user exists)', async () => {
            const { user } = await createUnverifiedUser();

            const res = await request(app)
                .post('/api/auth/resend-verification')
                .set(CSRF_HEADER)
                .send({ email: user.email });

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/verification email has been sent/i);
        });

        it('should reject if email is already verified', async () => {
            const { email } = await createAuthenticatedUser();

            const res = await request(app)
                .post('/api/auth/resend-verification')
                .set(CSRF_HEADER)
                .send({ email });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/already verified/i);
        });

        it('should return success even for non-existent emails (anti-enumeration)', async () => {
            const res = await request(app)
                .post('/api/auth/resend-verification')
                .set(CSRF_HEADER)
                .send({ email: 'nobody@example.com' });

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/verification email has been sent/i);
        });
    });
});

describe('Auth — Login Edge Cases', () => {
    it('should reject login for a Google-only account', async () => {
        const googleUser = await createGoogleOnlyUser();

        const res = await request(app)
            .post('/api/auth/login')
            .set(CSRF_HEADER)
            .send({ email: googleUser.email, password: 'whatever123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Google/i);
    });

    it('should reject login for an unverified user with requiresVerification flag', async () => {
        const { user, password } = await createUnverifiedUser();

        const res = await request(app)
            .post('/api/auth/login')
            .set(CSRF_HEADER)
            .send({ email: user.email, password });

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('requiresVerification', true);
    });

    it('should reject login with empty email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set(CSRF_HEADER)
            .send({ email: '', password: 'pass' });

        expect(res.status).toBe(400);
    });

    it('should reject login with wrong password', async () => {
        const { email } = await createAuthenticatedUser();

        const res = await request(app)
            .post('/api/auth/login')
            .set(CSRF_HEADER)
            .send({ email, password: 'WrongPassword!' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it('should reject login for non-existent user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set(CSRF_HEADER)
            .send({ email: 'nonexist@test.com', password: 'anything' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/invalid credentials/i);
    });
});

describe('Auth — Registration Edge Cases', () => {
    it('should reject registration for a Google-only account email', async () => {
        const googleUser = await createGoogleOnlyUser();

        const res = await request(app)
            .post('/api/auth/register')
            .set(CSRF_HEADER)
            .send({ email: googleUser.email, password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Google/i);
    });

    it('should normalize email to lowercase and trim', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .set(CSRF_HEADER)
            .send({ email: '  TEST@Example.COM  ', password: 'password123' });

        expect(res.status).toBe(201);

        const user = await User.findOne({ email: 'test@example.com' });
        expect(user).toBeTruthy();
    });

    it('should reject registration with missing fields', async () => {
        const noEmail = await request(app)
            .post('/api/auth/register')
            .set(CSRF_HEADER)
            .send({ password: 'password123' });

        expect(noEmail.status).toBe(400);

        const noPassword = await request(app)
            .post('/api/auth/register')
            .set(CSRF_HEADER)
            .send({ email: 'test2@test.com' });

        expect(noPassword.status).toBe(400);
    });
});

describe('Auth — GET /api/auth/me', () => {
    it('should return current user email for authenticated user', async () => {
        const { authGet, email } = await createAuthenticatedUser();

        const res = await authGet('/api/auth/me');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('email', email);
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });
});

describe('Auth — POST /api/auth/logout', () => {
    it('should clear cookies and remove refresh token from DB', async () => {
        const { authPost, userId, cookies } = await createAuthenticatedUser();

        const res = await authPost('/api/auth/logout');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Logged out successfully');

        // Refresh token should be removed from DB
        const user = await User.findById(userId);
        expect(user?.refreshTokens.length).toBe(0);
    });
});
