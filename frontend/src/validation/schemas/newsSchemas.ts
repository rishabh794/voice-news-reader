import { z } from 'zod';
import { AI_HISTORY_CATEGORIES } from '../../types/news';

const historyCategorySchema = z.enum(AI_HISTORY_CATEGORIES).or(z.literal('Uncategorized'));

export const newsSourceSchema = z.object({
    name: z.string().optional()
});

export const articleSchema = z.object({
    _id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    url: z.string(),
    image: z.string().optional(),
    publishedAt: z.string().optional(),
    source: newsSourceSchema.optional(),
    sourceName: z.string().optional()
});

export const articleListSchema = z.array(articleSchema);

export const savedArticleSchema = z.object({
    _id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string().optional().default(''),
    url: z.string(),
    image: z.string().optional().default(''),
    publishedAt: z.string().optional(),
    sourceName: z.string().optional().default(''),
    savedAt: z.string()
});

export const savedArticleListSchema = z.array(savedArticleSchema);

export const historyEntrySchema = z.object({
    _id: z.string(),
    userId: z.string(),
    query: z.string(),
    summary: z.string(),
    category: historyCategorySchema.optional(),
    articles: articleListSchema,
    timestamp: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

export const historyEntryListSchema = z.array(historyEntrySchema);
