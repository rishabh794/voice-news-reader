import { z } from 'zod';
import { AI_NEWS_CATEGORIES } from '../../utils/historyCategories.js';

export const updateTopicsBodySchema = z.object({
    topics: z.array(z.enum(AI_NEWS_CATEGORIES as unknown as [string, ...string[]])).max(8)
});
