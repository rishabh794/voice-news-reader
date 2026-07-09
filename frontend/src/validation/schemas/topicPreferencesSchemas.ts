import { z } from 'zod';
import { AI_HISTORY_CATEGORIES } from '../../types/news';
import { articleSchema } from './newsSchemas';

export const topicListSchema = z.array(z.enum(AI_HISTORY_CATEGORIES as any));

export const getTopicsResponseSchema = z.object({
    topics: topicListSchema
});

export const updateTopicsResponseSchema = z.object({
    topics: topicListSchema
});

export const personalizedFeedResponseSchema = z.object({
    articles: z.array(articleSchema),
    hasTopics: z.boolean(),
    topics: topicListSchema
});
