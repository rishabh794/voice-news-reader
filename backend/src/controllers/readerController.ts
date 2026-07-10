import type { Response, Request } from 'express';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import axios from 'axios';
import { SavedArticle } from '../models/SavedArticle.js';
import mongoose from 'mongoose';

export const parseArticle = async (req: Request, res: Response): Promise<any> => {
    try {
        const { url, savedArticleId } = req.query;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'Article URL is required' });
        }

        // Check cache first if savedArticleId is provided
        let savedDoc = null;
        if (savedArticleId && typeof savedArticleId === 'string' && mongoose.Types.ObjectId.isValid(savedArticleId)) {
            savedDoc = await SavedArticle.findById(savedArticleId);
            if (savedDoc && savedDoc.readerData) {
                return res.json(savedDoc.readerData);
            }
        }

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10s timeout
        });

        const html = response.data;
        const dom = new JSDOM(html, { url });
        const document = dom.window.document;
        
        // Remove common newsletter and signup cruft before parsing
        const junkPhrases = [
            'get the latest news',
            'delivered to your inbox',
            'sign up for',
            'subscribe to',
            'by signing up',
            'i acknowledge that i have read',
            'terms of service and privacy policy'
        ];
        
        const textElements = document.querySelectorAll('p, div, span, a, li');
        textElements.forEach(el => {
            const text = el.textContent?.toLowerCase().trim() || '';
            if (text.length > 5 && text.length < 200) {
                for (const phrase of junkPhrases) {
                    if (text.includes(phrase)) {
                        el.parentNode?.removeChild(el);
                        break;
                    }
                }
            }
        });
        
        const reader = new Readability(document);
        const article = reader.parse();

        if (!article) {
            return res.status(404).json({ error: 'Could not parse article content' });
        }

        const readerData = {
            title: article.title,
            content: article.content, // HTML content
            textContent: article.textContent,
            length: article.length,
            excerpt: article.excerpt,
            byline: article.byline,
            dir: article.dir,
            siteName: article.siteName,
            lang: article.lang
        };

        // Cache it if we found the saved document
        if (savedDoc) {
            savedDoc.readerData = readerData;
            await savedDoc.save();
        }

        return res.json(readerData);
    } catch (error) {
        console.error('Reader Parse Error:', error);
        return res.status(500).json({ error: 'Failed to fetch or parse the article' });
    }
};
