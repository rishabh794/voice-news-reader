import { z } from 'zod';

export const handleIntentBodySchema = z.object({
    query: z.string().trim().min(1, 'Query is required and must be a non-empty string.')
});
