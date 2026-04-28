import express, { type Request, type Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import Groq from 'groq-sdk';
import { verifyToken } from '../middleware/authMiddleware.ts';

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const TRANSCRIBE_TIMEOUT_MS = 25000;

fs.mkdirSync('uploads', { recursive: true });

const upload = multer({ dest: 'uploads/' });

const safeUnlink = async (path: string) => {
    try {
        await fs.promises.unlink(path);
    } catch {}
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(new Error('Transcription request timed out.'));
        }, timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
    }
};

router.post('/', verifyToken, upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
    let actualFilePath = '';

    try {
        if (!req.file) {
            res.status(400).json({ error: 'No audio file provided' });
            return;
        }

        actualFilePath = `${req.file.path}.webm`;
        await fs.promises.rename(req.file.path, actualFilePath);

        const transcription = await withTimeout(
            groq.audio.transcriptions.create({
                file: fs.createReadStream(actualFilePath),
                model: 'whisper-large-v3-turbo',
                response_format: 'json',
                language: 'en',
            }),
            TRANSCRIBE_TIMEOUT_MS
        );

        res.json({ text: transcription.text });

    } catch (error) {
        console.error('Whisper Error:', error);
        const message = error instanceof Error ? error.message : '';
        if (message.includes('timed out')) {
            res.status(504).json({ error: 'Transcription timed out. Please retry.' });
            return;
        }
        res.status(500).json({ error: 'Failed to transcribe audio' });
    } finally {
        await safeUnlink(actualFilePath);
    }
});

export default router;