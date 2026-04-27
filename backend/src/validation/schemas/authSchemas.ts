import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email('A valid email address is required');
const passwordSchema = z.string().min(1, 'Password is required');

export const registerBodySchema = z.object({
    email: emailSchema,
    password: passwordSchema
});

export const loginBodySchema = z.object({
    email: emailSchema,
    password: passwordSchema
});

export const googleAuthBodySchema = z.object({
    credential: z.string().trim().min(1, 'Google credential is required')
});
