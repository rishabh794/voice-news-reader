import { Groq } from 'groq-sdk';
import { AI_NEWS_CATEGORIES, isAiNewsCategory, type AiNewsCategory } from '../utils/historyCategories.js';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.1-8b-instant';
const LLM_TIMEOUT_MS = 20000;

export const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(new Error('LLM request timed out.'));
        }, timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
    }
};

const SYSTEM_PROMPT = `You are a natural language router for a news application.
Analyze the user's input and extract their intent.
Always return a valid JSON object with EXACTLY two keys: "action" and "topic".

Rules for "action":
- Use "history" if the user wants to see their past searches, old queries, or search history.
- Use "search" if the user is asking for news, articles, or information about a topic.
- Use "refine" if the user's query is a follow-up to their previous search (e.g., "what about Tesla?" after searching for "electric vehicles").
- Use "unknown" if the request is completely unrelated to searching news or viewing history.

Rules for "topic":
- If action is "search" or "refine", extract the core subject (e.g., "Elon Musk", "Tesla"). Combine the previous topic context if necessary for refinement. Ignore conversational filler.
- If action is "history" or "unknown", set topic to null.

Respond ONLY with pure JSON. Do not include markdown formatting or explanations.`;

export const classifyIntent = async (
    query: string,
    signal?: AbortSignal,
    context?: { previous_topic?: string | null; conversation_history?: any[] }
): Promise<{ action: string; topic: string | null }> => {
    let userContent = `Query: "${query}"`;
    if (context?.previous_topic) {
        userContent += `\nPrevious Topic: "${context.previous_topic}"`;
    }
    if (context?.conversation_history && context.conversation_history.length > 0) {
        userContent += `\nRecent History: ${JSON.stringify(context.conversation_history)}`;
    }

    const chatCompletion = await withTimeout(
        groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userContent },
            ],
            temperature: 0,
            max_completion_tokens: 64,
            response_format: { type: 'json_object' },
        }, { signal }),
        LLM_TIMEOUT_MS
    );

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from LLM.');

    try {
        return JSON.parse(content);
    } catch {
        throw new Error('LLM returned malformed JSON.');
    }
};

export const generateSummary = async (topic: string, llmObservation: string, signal?: AbortSignal): Promise<string> => {
    let summary = `Here are the latest articles on ${topic}.`;
    const summaryPrompt = `You are an expert news anchor. Based ONLY on the following article headlines and descriptions, write a conversational, 2-sentence summary of the current events. Do not use external knowledge.\n\n${llmObservation}`;

    try {
        const summaryCompletion = await withTimeout(
            groq.chat.completions.create({
                model: MODEL,
                messages: [{ role: 'user', content: summaryPrompt }],
                temperature: 0.3,
                max_completion_tokens: 150,
            }, { signal }),
            LLM_TIMEOUT_MS
        );
        return summaryCompletion.choices[0]?.message?.content || summary;
    } catch (error) {
        console.error('Summarization error:', error);
        return summary; // fallback
    }
};

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
- If the topic spans multiple categories, choose the most dominant one based on user intent and source emphasis.
- Never invent new categories and never return multiple categories.
- If evidence is weak, choose the closest allowed category.`;

const CATEGORY_KEYWORDS: Record<AiNewsCategory, string[]> = {
    Technology: ['ai', 'artificial intelligence', 'chip', 'software', 'app', 'startup', 'robot', 'cyber', 'cloud', 'tech'],
    Politics: ['election', 'parliament', 'senate', 'president', 'minister', 'government', 'policy', 'diplomat', 'congress'],
    Business: ['market', 'stocks', 'economy', 'company', 'revenue', 'profit', 'earnings', 'trade', 'finance', 'merger'],
    Sports: ['match', 'league', 'tournament', 'goal', 'cricket', 'football', 'basketball', 'tennis', 'olympics'],
    Entertainment: ['movie', 'music', 'celebrity', 'streaming', 'film', 'tv', 'show', 'box office', 'festival'],
    Health: ['health', 'hospital', 'vaccine', 'medical', 'disease', 'wellness', 'drug', 'cdc', 'who'],
    World: ['global', 'international', 'geopolitical', 'war', 'conflict', 'summit', 'country', 'nation'],
    Science: ['research', 'scientist', 'space', 'nasa', 'experiment', 'physics', 'biology', 'climate', 'discovery']
};

const inferCategoryFromKeywords = (topic: string, summary: string, llmObservation: string): AiNewsCategory => {
    const searchableText = `${topic} ${summary} ${llmObservation}`.toLowerCase();

    let bestCategory: AiNewsCategory = 'World';
    let highestScore = 0;

    for (const category of AI_NEWS_CATEGORIES) {
        const keywords = CATEGORY_KEYWORDS[category];
        const score = keywords.reduce((count, keyword) => (
            searchableText.includes(keyword) ? count + 1 : count
        ), 0);

        if (score > highestScore) {
            highestScore = score;
            bestCategory = category;
        }
    }

    return bestCategory;
};

export const classifyNewsCategory = async (topic: string, summary: string, llmObservation: string, signal?: AbortSignal): Promise<AiNewsCategory> => {
    const fallbackCategory = inferCategoryFromKeywords(topic, summary, llmObservation);

    try {
        const categoryPrompt = `Topic: ${topic}\nSummary: ${summary}\nSource digest: ${llmObservation.slice(0, 3500)}`;

        const completion = await withTimeout(
            groq.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: CATEGORY_SYSTEM_PROMPT },
                    { role: 'user', content: categoryPrompt }
                ],
                temperature: 0,
                max_completion_tokens: 32,
                response_format: { type: 'json_object' }
            }, { signal }),
            LLM_TIMEOUT_MS
        );

        const content = completion.choices[0]?.message?.content;
        if (!content) return fallbackCategory;

        let parsed: { category?: unknown };
        try {
            parsed = JSON.parse(content) as { category?: unknown };
        } catch {
            return fallbackCategory;
        }

        return isAiNewsCategory(parsed.category) ? parsed.category : fallbackCategory;
    } catch (error) {
        console.error('Category classification error:', error);
        return fallbackCategory;
    }
};
