import express from 'express';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/authMiddleware.ts';

dotenv.config();

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `You are a natural language router for a news application.
Analyze the user's input and extract their intent.
Always return a valid JSON object with EXACTLY two keys: "action" and "topic".

Rules for "action":
- Use "history" if the user wants to see their past searches, old queries, or search history.
- Use "search" if the user is asking for news, articles, or information about a topic.
- Use "unknown" if the request is completely unrelated to searching news or viewing history.

Rules for "topic":
- If action is "search", extract the core subject (e.g., "Elon Musk", "quantum computing"). Ignore conversational filler.
- If action is "history" or "unknown", set topic to null.

Examples:
User: "Hey, can you find me the latest on electric cars?" -> {"action": "search", "topic": "electric cars"}
User: "Take me to my past searches" -> {"action": "history", "topic": null}
User: "What is the weather today?" -> {"action": "unknown", "topic": null}

Respond ONLY with pure JSON. Do not include markdown formatting or explanations.`;

router.post('/', verifyToken,  async (req, res) => {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({ error: 'Query is required and must be a non-empty string.' });
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: query.trim() },
            ],
            temperature: 0,
            max_completion_tokens: 64, // JSON response is tiny — cap tokens to save cost & latency
            response_format: { type: 'json_object' },
        });

        const content = chatCompletion.choices[0]?.message?.content;
        if (!content) {
            return res.status(500).json({ error: 'Empty response from LLM.' });
        }

        let aiResponse: { action: string; topic: string | null };
        try {
            aiResponse = JSON.parse(content);
        } catch {
            console.error('JSON parse error. Raw content:', content);
            return res.status(500).json({ error: 'LLM returned malformed JSON.' });
        }

        if (!aiResponse.action || !['search', 'history', 'unknown'].includes(aiResponse.action)) {
            return res.status(500).json({ error: 'LLM returned unexpected action value.' });
        }

        return res.json(aiResponse);

    } catch (error: unknown) {
        console.error('Groq API error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(502).json({ error: 'Failed to reach LLM.', detail: message });
    }
});

export default router;