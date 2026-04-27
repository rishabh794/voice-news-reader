import { z } from 'zod';
import { AI_HISTORY_CATEGORIES } from '../../types/news';
import { articleListSchema } from './newsSchemas';

export const intentRequestSchema = z.object({
    query: z.string().trim().min(1, 'Please enter a search query.')
});

const searchIntentSchema = z.object({
    action: z.literal('search'),
    topic: z.string().trim().min(1),
    summary: z.string().optional().default(''),
    category: z.enum(AI_HISTORY_CATEGORIES).optional(),
    articles: articleListSchema,
    message: z.string().optional()
});

const nonSearchIntentSchema = z.object({
    action: z.enum(['history', 'unknown']),
    topic: z.string().nullable()
});

export const searchIntentResponseSchema = searchIntentSchema;
export const intentResponseSchema = z.union([searchIntentSchema, nonSearchIntentSchema]);
