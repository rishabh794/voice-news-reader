import mongoose from 'mongoose';
import type { Response } from 'express';
import { SavedArticle } from '../models/SavedArticle.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

interface SaveArticlePayload {
    title?: unknown;
    description?: unknown;
    url?: unknown;
    image?: unknown;
    publishedAt?: unknown;
    sourceName?: unknown;
}

const normalizeOptionalString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

export const addSavedArticle = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userId = req.user.id;
        const payload = req.body as SaveArticlePayload;

        const title = normalizeOptionalString(payload.title);
        const url = normalizeOptionalString(payload.url);

        if (!title || !url) {
            return res.status(400).json({ error: 'Article title and url are required' });
        }

        const description = normalizeOptionalString(payload.description) || '';
        const image = normalizeOptionalString(payload.image) || '';
        const sourceName = normalizeOptionalString(payload.sourceName) || '';

        const publishedAtRaw = normalizeOptionalString(payload.publishedAt);
        let publishedAt: Date | undefined;

        if (publishedAtRaw) {
            const parsedDate = new Date(publishedAtRaw);
            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({ error: 'Invalid publishedAt date' });
            }
            publishedAt = parsedDate;
        }

        const existingArticle = await SavedArticle.findOne({ userId, url });
        if (existingArticle) {
            return res.status(200).json(existingArticle);
        }

        const articleToSave = {
            userId,
            title,
            description,
            url,
            image,
            sourceName,
            ...(publishedAt ? { publishedAt } : {})
        };

        const savedArticle = await SavedArticle.create(articleToSave);

        return res.status(201).json(savedArticle);
    } catch (error: unknown) {
        const isDuplicateKeyError =
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: unknown }).code === 11000;

        if (isDuplicateKeyError) {
            const userId = req.user?.id;
            const url = normalizeOptionalString((req.body as SaveArticlePayload)?.url);
            const alreadySaved = userId && url ? await SavedArticle.findOne({ userId, url }) : null;
            if (alreadySaved) {
                return res.status(200).json(alreadySaved);
            }
        }

        console.error('Add Saved Article Error:', error);
        return res.status(500).json({ error: 'Server error while saving article' });
    }
};

export const getSavedArticles = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userId = req.user.id;
        const savedArticles = await SavedArticle.find({ userId }).sort({ savedAt: -1 });

        return res.json(savedArticles);
    } catch (error) {
        console.error('Get Saved Articles Error:', error);
        return res.status(500).json({ error: 'Server error while fetching saved articles' });
    }
};

export const deleteSavedArticle = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userId = req.user.id;
        const rawId = req.params.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid saved article id' });
        }

        const deleted = await SavedArticle.findOneAndDelete({ _id: id, userId });
        if (!deleted) {
            return res.status(404).json({ error: 'Saved article not found' });
        }

        return res.json({ message: 'Saved article removed' });
    } catch (error) {
        console.error('Delete Saved Article Error:', error);
        return res.status(500).json({ error: 'Server error while deleting saved article' });
    }
};
