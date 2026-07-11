import type { Response } from 'express';
import { searchGNews } from '../services/tools.js';
import { History } from '../models/History.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { classifyIntent, generateSummary, classifyNewsCategory } from '../services/pipeline.js';

export const handleIntent = async (req: AuthRequest, res: Response): Promise<any> => {
    const { query } = req.body as { query: string };

    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated.' });
    }

    try {
        const aiResponse = await classifyIntent(query);

        if (aiResponse.action === 'search' && aiResponse.topic) {
            const topic = aiResponse.topic.trim();
            console.log(`\nAGENT TRIGGERED: Fetching articles for "${topic}"...`);

            const { rawArticles, llmObservation } = await searchGNews(topic);

            if (rawArticles.length === 0) {
                return res.json({
                    action: 'search',
                    topic,
                    message: 'No articles found related to this topic',
                    summary: '',
                    articles: []
                });
            }

            const summary = await generateSummary(topic, llmObservation);
            const category = await classifyNewsCategory(topic, summary, llmObservation);

            const historyRecord = new History({
                userId: req.user.id,
                query: topic,
                summary,
                category,
                articles: rawArticles,
            });
            await historyRecord.save();

            return res.json({
                action: 'search',
                topic,
                summary,
                category,
                articles: rawArticles
            });
        }

        return res.json(aiResponse);
    } catch (error: unknown) {
        console.error('API error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('timed out')) {
            return res.status(504).json({ error: 'LLM request timed out. Please retry.', detail: message });
        }
        return res.status(502).json({ error: 'Failed to reach LLM.', detail: message });
    }
};
