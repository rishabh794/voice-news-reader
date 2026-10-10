import request from 'supertest';
import app from '../../src/index.js';
import { User } from '../../src/models/User.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

/**
 * Standard request headers required for all state-changing requests
 * (CSRF protection requires X-Requested-With).
 */
export const CSRF_HEADER = { 'X-Requested-With': 'XMLHttpRequest' };

/**
 * Create a verified user directly in the database.
 * Returns the user document and a supertest agent pre-authenticated with cookies.
 */
export async function createAuthenticatedUser(overrides: {
    email?: string;
    password?: string;
} = {}) {
    const email = overrides.email ?? `user-${Date.now()}@test.com`;
    const password = overrides.password ?? 'StrongPass123!';

    // Register
    await request(app)
        .post('/api/auth/register')
        .set(CSRF_HEADER)
        .send({ email, password });

    // Verify email directly in DB
    await User.updateOne({ email }, { isEmailVerified: true });

    // Login and capture cookies
    const loginRes = await request(app)
        .post('/api/auth/login')
        .set(CSRF_HEADER)
        .send({ email, password });

    const cookies = (loginRes.headers['set-cookie'] || []) as unknown as string[];

    const user = await User.findOne({ email });

    return {
        user: user!,
        userId: String(user!._id),
        email,
        cookies,
        /** Helper to make authenticated GET requests */
        authGet: (url: string) =>
            request(app)
                .get(url)
                .set('Cookie', cookies),
        /** Helper to make authenticated POST requests */
        authPost: (url: string) =>
            request(app)
                .post(url)
                .set('Cookie', cookies)
                .set(CSRF_HEADER),
        /** Helper to make authenticated PUT requests */
        authPut: (url: string) =>
            request(app)
                .put(url)
                .set('Cookie', cookies)
                .set(CSRF_HEADER),
        /** Helper to make authenticated DELETE requests */
        authDelete: (url: string) =>
            request(app)
                .delete(url)
                .set('Cookie', cookies)
                .set(CSRF_HEADER),
    };
}

/**
 * Create a Google-only user (no password, no local provider).
 */
export async function createGoogleOnlyUser(email = `google-${Date.now()}@test.com`) {
    const user = await User.create({
        email,
        googleId: `google-id-${Date.now()}`,
        isEmailVerified: true,
        providers: { local: false, google: true },
    });
    return user;
}

/**
 * Create an unverified local user.
 */
export async function createUnverifiedUser(
    email = `unverified-${Date.now()}@test.com`,
    password = 'StrongPass123!'
) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        email,
        password: hashedPassword,
        isEmailVerified: false,
        verificationToken: 'test-verification-token',
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        providers: { local: true, google: false },
    });
    return { user, password };
}

/**
 * Generate a valid MongoDB ObjectId.
 */
export function randomObjectId(): string {
    return new mongoose.Types.ObjectId().toString();
}

/**
 * Build a fake article payload for saving.
 */
export function buildArticlePayload(overrides: Record<string, unknown> = {}) {
    return {
        title: `Article ${Date.now()}`,
        url: `https://example.com/article-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        description: 'Test article description',
        image: 'https://example.com/image.jpg',
        sourceName: 'Test Source',
        publishedAt: new Date().toISOString(),
        ...overrides,
    };
}
