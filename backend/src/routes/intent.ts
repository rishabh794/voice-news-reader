import express from 'express';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/authMiddleware.ts';
import { searchGNews } from '../services/tools.ts'; 
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
            max_completion_tokens: 64, 
            response_format: { type: 'json_object' },
        });

        const content = chatCompletion.choices[0]?.message?.content;
        if (!content) return res.status(500).json({ error: 'Empty response from LLM.' });

        let aiResponse: { action: string; topic: string | null };
        try {
            aiResponse = JSON.parse(content);
        } catch {
            return res.status(500).json({ error: 'LLM returned malformed JSON.' });
        }

        // The Agentic Synthesis Step (If action is search)
        if (aiResponse.action === 'search' && aiResponse.topic) {
            console.log(`\n🤖 AGENT TRIGGERED: Fetching articles for "${aiResponse.topic}"...`);
            
            // Execute the Tool
            const { rawArticles, llmObservation } = await searchGNews(aiResponse.topic);

            let summary = `Here are the latest articles on ${aiResponse.topic}.`;

            if (rawArticles.length > 0) {
                // Feed the articles back to Llama 3 for a custom synthesis
                const summaryPrompt = `You are an expert news anchor. Based ONLY on the following article headlines and descriptions, write a conversational, 2-sentence summary of the current events. Do not use external knowledge.\n\n${llmObservation}`;

                const summaryCompletion = await groq.chat.completions.create({
                    model: MODEL,
                    messages: [{ role: 'user', content: summaryPrompt }],
                    temperature: 0.3,
                    max_completion_tokens: 150,
                });
                
                summary = summaryCompletion.choices[0]?.message?.content || summary;
            }

            return res.json({
                action: 'search',
                topic: aiResponse.topic,
                summary: summary,    // Sent to TTS
                articles: rawArticles // Sent to the UI Grid
            });
        }

        return res.json(aiResponse);

    } catch (error: unknown) {
        console.error('Groq API error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(502).json({ error: 'Failed to reach LLM.', detail: message });
    }
});

export default router;