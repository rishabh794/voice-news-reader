import type { Response } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { searchGNews } from '../services/tools.js';
import { feedCache } from '../services/feedCache.js';

const CACHE_TTL_SECONDS = 600 * 60; // 60 minutes

export const getPersonalizedFeed = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const user = await User.findById(req.user.id).lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const topics = user.topicPreferences || [];
        if (topics.length === 0) {
            return res.json({
                articles: [],
                hasTopics: false,
                topics: []
            });
        }

        let allArticles: any[] = [];

        for (const topic of topics) {
            const cacheKey = `feed:global:${topic}`;

            // 1. Check cache
            const cachedArticles = await feedCache.get<any[]>(cacheKey);
            if (cachedArticles && cachedArticles.length > 0) {
                allArticles.push(...cachedArticles.map(a => ({ ...a, topic })));
                continue;
            }

            // 2. Fetch from GNews
            const { rawArticles } = await searchGNews(topic);

            // 3. Save to cache ONLY if we got results (prevents caching 429 empty arrays)
            if (rawArticles && rawArticles.length > 0) {
                await feedCache.set(cacheKey, rawArticles, CACHE_TTL_SECONDS);
                allArticles.push(...rawArticles.map((a: any) => ({ ...a, topic })));
            } else {
                console.warn(`No articles fetched for topic: ${topic}. Not caching.`);
            }

            // Respect 1 req/sec rate limit of GNews free tier by adding a 1050ms delay
            await new Promise(resolve => setTimeout(resolve, 1050));
        }

        // Deduplicate by URL
        const uniqueArticlesMap = new Map<string, any>();
        allArticles.forEach(article => {
            if (article.url && !uniqueArticlesMap.has(article.url)) {
                uniqueArticlesMap.set(article.url, article);
            }
        });

        const uniqueArticles = Array.from(uniqueArticlesMap.values());

        // Sort by publishedAt descending
        uniqueArticles.sort((a, b) => {
            const dateA = new Date(a.publishedAt || 0).getTime();
            const dateB = new Date(b.publishedAt || 0).getTime();
            return dateB - dateA;
        });

        res.json({
            articles: uniqueArticles,
            hasTopics: true,
            topics
        });

    } catch (error) {
        console.error('Get Feed Error:', error);
        res.status(500).json({ error: 'Server error while fetching personalized feed' });
    }
};
