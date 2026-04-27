import { z } from 'zod';

export const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.');

export const passwordSchema = z
    .string()
    .min(1, 'Password is required.');

export const authCredentialsSchema = z.object({
    email: emailSchema,
    password: passwordSchema
});

export const googleCredentialSchema = z.object({
    credential: z.string().trim().min(1, 'Google credential is required.')
});

export const authResponseSchema = z.object({
    token: z.string().min(1, 'Missing auth token in response.'),
    email: z.string().email('Invalid account email in response.'),
    authProvider: z.enum(['local', 'google']).optional()
});

export const registerResponseSchema = z.object({
    message: z.string().min(1, 'Missing registration confirmation message.')
});
