import { describe, it, expect } from 'vitest';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'qwen/qwen3.8-27b';

describe('Groq Pipeline Integration (qwen/qwen3.8-27b)', () => {
    it('should return a non-empty chat response', async () => {
        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: 'You are a helpful assistant. Always respond with a short answer.' },
                { role: 'user', content: 'What is 2+2? Answer with just the number.' },
            ],
            temperature: 0,
            max_completion_tokens: 32,
        });
        const content = completion.choices[0]?.message?.content?.trim();
        console.log(`\n[chat] Response: "${content}"`);
        expect(content).toBeTruthy();
    }, 30000);

    it('should classify a search intent (classifyIntent)', async () => {
        const SYSTEM_PROMPT = `You are a natural language router for a news application.
Analyze the user's input and extract their intent.
Always return a valid JSON object with EXACTLY two keys: "action" and "topic".

Rules for "action":
- Use "read" if the user wants to read, listen to, or open the current/selected article.
- Use "next" if the user wants to skip to the next article or move forward.
- Use "save" if the user wants to save or bookmark the current article.
- Use "history" if the user wants to see their past searches or search history.
- Use "search" if the user is asking for news, articles, or information about a topic.
- Use "refine" if the user's query is a follow-up on the SAME topic.
- Use "unknown" if the request is completely unrelated.

Rules for "topic":
- If action is "search", extract the core subject. Ignore conversational filler.
- If action is "refine", return the combined new search query.
- If action is "read", "next", "save", "history", or "unknown", set topic to null.

Respond ONLY with pure JSON. Do not include markdown formatting or explanations.`;

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: 'Query: "what is happening with Tesla stock"' },
            ],
            temperature: 0,
            max_completion_tokens: 64,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content?.trim();
        console.log(`\n[classifyIntent] Response: ${content}`);
        expect(content).toBeTruthy();

        const parsed = JSON.parse(content!);
        expect(parsed.action).toBe('search');
        expect(parsed.topic).toBeTruthy();
        expect(typeof parsed.topic).toBe('string');
    }, 30000);

    it('should rewrite a topic for GNews (rewriteForGNews)', async () => {
        const REWRITE_SYSTEM_PROMPT = `You convert a news search topic into an optimized query for the GNews search API.

GNews supports: AND (default between words), OR, NOT, "exact phrase"
Max query length: 200 characters.

Rules:
1. Extract the CORE ENTITY and wrap in "quotes" for phrase match
2. Add related synonyms/terms with OR for broader recall
3. Remove filler words
4. Keep it SHORT — 2-5 key terms
5. Any OR group combined with AND must be wrapped in parentheses
6. Return ONLY the query string, nothing else`;

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: REWRITE_SYSTEM_PROMPT },
                { role: 'user', content: 'Topic: "Tesla stock price"' },
            ],
            temperature: 0,
            max_completion_tokens: 64,
        });

        const content = completion.choices[0]?.message?.content?.trim();
        console.log(`\n[rewriteForGNews] Response: "${content}"`);
        expect(content).toBeTruthy();
        expect(content!.length).toBeGreaterThan(0);
        expect(content!.length).toBeLessThanOrEqual(200);
    }, 30000);

    it('should generate a news summary (generateSummary)', async () => {
        const llmObservation = `1. "Tesla Q3 earnings beat expectations" - Tesla reported record revenue...
2. "Tesla stock surges 8% after earnings" - Shares jumped in after-hours trading...
3. "Elon Musk announces new Tesla factory" - A new Gigafactory is planned...`;

        const summaryPrompt = `You are an expert news anchor. Based ONLY on the following article headlines and descriptions, write a conversational, 2-sentence summary of the current events. Do not use external knowledge.\n\n${llmObservation}`;

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: summaryPrompt }],
            temperature: 0.3,
            max_completion_tokens: 150,
        });

        const content = completion.choices[0]?.message?.content?.trim();
        console.log(`\n[generateSummary] Response: "${content}"`);
        expect(content).toBeTruthy();
        expect(content!.length).toBeGreaterThan(20);
    }, 30000);

    it('should classify a news category (classifyNewsCategory)', async () => {
        const CATEGORY_SYSTEM_PROMPT = `You classify a news briefing into one dominant category.
Return ONLY a valid JSON object with EXACTLY one key: "category".

Allowed categories:
- Technology
- Politics
- Business
- Sports
- Entertainment
- Health
- World
- Science

Rules:
- Choose exactly one category from the allowed list.
- Never invent new categories and never return multiple categories.`;

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: CATEGORY_SYSTEM_PROMPT },
                { role: 'user', content: 'Topic: Tesla stock\nSummary: Tesla reported record earnings...\nSource digest: Tesla Q3 earnings, stock price surge' },
            ],
            temperature: 0,
            max_completion_tokens: 32,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content?.trim();
        console.log(`\n[classifyNewsCategory] Response: ${content}`);
        expect(content).toBeTruthy();

        const parsed = JSON.parse(content!);
        expect(parsed).toHaveProperty('category');
        expect(['Technology', 'Politics', 'Business', 'Sports', 'Entertainment', 'Health', 'World', 'Science']).toContain(parsed.category);
    }, 30000);
});
