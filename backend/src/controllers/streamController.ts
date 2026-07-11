import type { Response } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { searchGNews } from '../services/tools.js';
import { History } from '../models/History.js';
import { classifyIntent, generateSummary, classifyNewsCategory } from '../services/pipeline.js';

export const handleStreamSearch = async (req: AuthRequest, res: Response): Promise<void> => {
    const { query } = req.query;

    if (!req.user) {
        res.status(401).json({ error: 'User not authenticated.' });
        return;
    }
    
    if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Missing or invalid query parameter' });
        return;
    }

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    const sendEvent = (event: string, data: object) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    let aborted = false;
    req.on('close', () => {
        aborted = true;
    });

    // Heartbeat every 15s to keep connection alive
    const heartbeat = setInterval(() => {
        if (!aborted) res.write(': ping\n\n');
    }, 15000);

    try {
        // Stage 1: Intent classification
        const intent = await classifyIntent(query);
        if (aborted) return;
        sendEvent('intent', intent);

        if (intent.action !== 'search' || !intent.topic) {
            sendEvent('complete', {});
            return;
        }

        const topic = intent.topic.trim();

        // Stage 2: Fetch articles
        const { rawArticles, llmObservation } = await searchGNews(topic);
        if (aborted) return;
        
        sendEvent('articles', { articles: rawArticles, count: rawArticles.length });

        if (rawArticles.length === 0) {
            sendEvent('complete', {});
            return;
        }

        // Stage 3: Summarize
        const summary = await generateSummary(topic, llmObservation);
        if (aborted) return;
        sendEvent('summary', { text: summary });

        // Stage 4: Categorize
        const category = await classifyNewsCategory(topic, summary, llmObservation);
        if (aborted) return;
        sendEvent('category', { category });

        // Stage 5: Save history
        const historyRecord = new History({
            userId: req.user.id,
            query: topic,
            summary,
            category,
            articles: rawArticles,
        });
        await historyRecord.save();
        
        sendEvent('complete', { historyId: historyRecord._id });
    } catch (error: unknown) {
        console.error('SSE Pipeline error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        sendEvent('error', { message, stage: 'pipeline' });
    } finally {
        clearInterval(heartbeat);
        res.end();
    }
};
