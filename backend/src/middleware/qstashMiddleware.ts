import type { Request, Response, NextFunction } from 'express';
import { Receiver } from '@upstash/qstash';
import dotenv from 'dotenv';

dotenv.config();

let receiver: Receiver | null = null;

if (process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY) {
    receiver = new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY
    });
} else {
    console.warn('QStash signing keys not set. QStash signature verification will be skipped.');
}

/**
 * Middleware to verify that requests to cron endpoints actually come from Upstash QStash.
 * Falls through if QStash keys are not configured (for local development).
 */
export const verifyQStashSignature = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!receiver) {
        if (process.env.NODE_ENV === 'production') {
            res.status(500).json({ error: 'QStash not configured' });
            return;
        }
        // In development without QStash keys, allow through
        console.warn('[QStash] No receiver configured — skipping signature verification.');
        next();
        return;
    }

    try {
        const signature = req.headers['upstash-signature'] as string | undefined;

        if (!signature) {
            res.status(401).json({ error: 'Missing QStash signature.' });
            return;
        }

        // QStash sends the raw body, which Express has already parsed.
        // We need to reconstruct it for verification.
        const body = req.rawBody?.toString('utf8') ?? '';

        const isValid = await receiver.verify({
            signature,
            body
        });

        if (!isValid) {
            res.status(401).json({ error: 'Invalid QStash signature.' });
            return;
        }

        next();
    } catch (error) {
        console.error('[QStash] Signature verification failed:', error);
        res.status(401).json({ error: 'QStash signature verification failed.' });
    }
};
