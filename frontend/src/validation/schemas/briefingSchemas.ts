import { z } from 'zod';
import { articleSchema } from './newsSchemas';
import { topicListSchema } from './topicPreferencesSchemas';
import { AI_HISTORY_CATEGORIES } from '../../types/news';

export const briefingSectionSchema = z.object({
    topic: z.enum(AI_HISTORY_CATEGORIES as any),
    summary: z.string(),
    articles: z.array(articleSchema)
});

export const briefingSchema = z.object({
    _id: z.string(),
    userId: z.string(),
    date: z.string(),
    topics: topicListSchema,
    script: z.string(),
    sections: z.array(briefingSectionSchema),
    emailSentAt: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string()
});

export const briefingPreferencesSchema = z.object({
    enabled: z.boolean(),
    emailEnabled: z.boolean()
});

export const getBriefingResponseSchema = z.object({
    briefing: briefingSchema.nullable()
});

export const generateBriefingResponseSchema = z.object({
    briefing: briefingSchema
});

export const getBriefingSettingsResponseSchema = z.object({
    settings: briefingPreferencesSchema
});

export const updateBriefingSettingsResponseSchema = z.object({
    settings: briefingPreferencesSchema
});

export const getBriefingHistoryResponseSchema = z.object({
    briefings: z.array(briefingSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number()
    })
});
