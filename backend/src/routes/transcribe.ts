import express, { type Request, type Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import Groq from 'groq-sdk';
import { verifyToken } from '../middleware/authMiddleware.ts';

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const upload = multer({ dest: 'uploads/' });

const safeUnlink = (path: string) => {
    try {
        if (fs.existsSync(path)) fs.unlinkSync(path);
    } catch {}
};

router.post('/', verifyToken, upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
    let actualFilePath = '';

    try {
        if (!req.file) {
            res.status(400).json({ error: 'No audio file provided' });
            return;
        }

        actualFilePath = `${req.file.path}.webm`;
        fs.renameSync(req.file.path, actualFilePath);

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(actualFilePath),
            model: 'whisper-large-v3-turbo', 
            response_format: 'json',
            language: 'en',
        });

        res.json({ text: transcription.text });

    } catch (error) {
        console.error('Whisper Error:', error);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    } finally {
        safeUnlink(actualFilePath);
    }
});

export default router;