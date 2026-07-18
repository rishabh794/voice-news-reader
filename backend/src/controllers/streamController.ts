import type { Response } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { searchGNews } from '../services/tools.js';
import { History } from '../models/History.js';
import { classifyIntent, generateSummary, classifyNewsCategory, rewriteForGNews } from '../services/pipeline.js';

export const handleStreamSearch = async (req: AuthRequest, res: Response): Promise<void> => {
    const { query, context: contextRaw } = req.query;

    let parsedContext = undefined;
    if (typeof contextRaw === 'string') {
        try {
            parsedContext = JSON.parse(contextRaw);
        } catch (e) {
            console.warn('Failed to parse context', e);
        }
    }

    // Always set SSE headers first so all responses use SSE format
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    const sendEvent = (event: string, data: object) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    if (!req.user) {
        sendEvent('error', { message: 'User not authenticated.' });
        res.end();
        return;
    }

    if (!query || typeof query !== 'string') {
        sendEvent('error', { message: 'Missing or invalid query parameter' });
        res.end();
        return;
    }

    const abortController = new AbortController();
    const { signal } = abortController;
    let aborted = false;

    req.on('close', () => {
        aborted = true;
        abortController.abort();
    });

    // Heartbeat every 15s to keep connection alive
    const heartbeat = setInterval(() => {
        if (!aborted) res.write(': ping\n\n');
    }, 15000);

    try {
        // Stage 1: Intent classification
        const intent = await classifyIntent(query as string, signal, parsedContext);
        if (aborted) return;
        sendEvent('intent', intent);

        if ((intent.action !== 'search' && intent.action !== 'refine') || !intent.topic) {
            sendEvent('complete', {});
            return;
        }

        const topic = intent.topic.trim();

        // Stage 1.5: Optimize query for GNews
        const optimizedQuery = await rewriteForGNews(topic, signal);
        if (aborted) return;
        sendEvent('query_optimized', { original: topic, optimized: optimizedQuery });

        // Stage 2: Fetch articles using the optimized query
        const { rawArticles, llmObservation } = await searchGNews(optimizedQuery, signal);
        if (aborted) return;

        sendEvent('articles', { articles: rawArticles, count: rawArticles.length });

        if (rawArticles.length === 0) {
            sendEvent('complete', {});
            return;
        }

        // Stage 3: Summarize
        const summary = await generateSummary(topic, llmObservation, signal);
        if (aborted) return;
        sendEvent('summary', { text: summary });

        // Stage 4: Categorize
        const category = await classifyNewsCategory(topic, summary, llmObservation, signal);
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
