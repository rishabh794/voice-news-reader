import { User } from '../models/User.js';
import { Briefing } from '../models/Briefing.js';
import { searchGNews } from './tools.js';
import { feedCache } from './feedCache.js';
import { generateSummary } from './pipeline.js';
import { sendBriefingEmail } from './emailService.ts';

const ARTICLES_PER_TOPIC = 3;
const BRIEFING_CACHE_TTL_SECONDS = 10 * 60 * 60; // 10 hours (same as feed cache)
const GNEWS_DELAY_MS = 1050; // GNews free tier: 1 req/sec
const EMAIL_DELAY_MS = 200; // Resend free tier: 10 RPS — 200ms = 5 RPS (safe margin)

interface BriefingArticle {
    title: string;
    description: string;
    url: string;
    image: string;
    publishedAt: string;
    source: { name: string; url: string };
}

interface BriefingSection {
    topic: string;
    summary: string;
    articles: BriefingArticle[];
}

/**
 * Fetch articles for a single topic.
 * Checks Redis cache first (reuses the same `feed:global:{topic}` keys as feedController),
 * falls back to GNews API on cache miss.
 */
const fetchTopicArticles = async (topic: string): Promise<BriefingArticle[]> => {
    const cacheKey = `feed:global:${topic}`;

    // 1. Try cache first (same key as feedController.ts)
    const cached = await feedCache.get<BriefingArticle[]>(cacheKey);
    if (cached && cached.length > 0) {
        return cached.slice(0, ARTICLES_PER_TOPIC);
    }

    // 2. Cache miss — fetch from GNews
    try {
        const { rawArticles } = await searchGNews(topic);

        if (rawArticles && rawArticles.length > 0) {
            await feedCache.set(cacheKey, rawArticles, BRIEFING_CACHE_TTL_SECONDS);
            return rawArticles.slice(0, ARTICLES_PER_TOPIC);
        }
    } catch (error) {
        console.error(`[Briefing] Failed to fetch articles for topic "${topic}":`, error instanceof Error ? error.message : error);
    }

    return [];
};

/**
 * Pre-fetch and cache articles for all required topics across all users.
 * This is the key optimization: we only hit GNews once per unique topic,
 * not once per user. The cached data is then used by individual user briefings.
 */
const prefetchAllTopics = async (topics: string[]): Promise<void> => {
    for (const topic of topics) {
        const cacheKey = `feed:global:${topic}`;
        const cached = await feedCache.get<BriefingArticle[]>(cacheKey);

        if (cached && cached.length > 0) {
            continue; // Already cached, skip
        }

        try {
            const { rawArticles } = await searchGNews(topic);
            if (rawArticles && rawArticles.length > 0) {
                await feedCache.set(cacheKey, rawArticles, BRIEFING_CACHE_TTL_SECONDS);
            }
        } catch (error) {
            console.error(`[Briefing] Prefetch failed for topic "${topic}":`, error instanceof Error ? error.message : error);
        }

        // Respect GNews 1 req/sec rate limit
        await new Promise(resolve => setTimeout(resolve, GNEWS_DELAY_MS));
    }
};

/**
 * Build a single briefing section for a topic.
 * Fetches articles (from cache) and generates an LLM summary.
 */
const buildSection = async (topic: string): Promise<BriefingSection | null> => {
    const articles = await fetchTopicArticles(topic);

    if (articles.length === 0) {
        return null;
    }

    // Build LLM observation text (same format as pipeline.ts / tools.ts)
    const llmObservation = articles
        .map(a => `${a.title}: ${a.description}`)
        .join('\n\n');

    // Reuse the existing generateSummary from pipeline.ts
    const summary = await generateSummary(topic, llmObservation);

    return { topic, summary, articles };
};

/**
 * Compose the full narration script from sections.
 * This is the text that gets fed to TTS on the frontend.
 */
const composeBriefingScript = (sections: BriefingSection[]): string => {
    if (sections.length === 0) {
        return 'No news available for your topics today. Check back later!';
    }

    const greeting = 'Good morning! Here is your daily news briefing.';

    const sectionScripts = sections.map((section, index) => {
        const transition = index === 0
            ? `Let's start with ${section.topic}.`
            : `Moving on to ${section.topic}.`;

        return `${transition} ${section.summary}`;
    });

    const closing = 'That\'s all for today. Have a great day!';

    return [greeting, ...sectionScripts, closing].join('\n\n');
};

/**
 * Get today's date as an ISO string (YYYY-MM-DD) in UTC.
 */
export const getTodayDateISO = (): string => {
    return new Date().toISOString().slice(0, 10);
};

/**
 * Generate a briefing for a single user.
 * Idempotent: if a briefing already exists for today, it is updated (upserted).
 */
export const generateUserBriefing = async (userId: string): Promise<typeof Briefing.prototype | null> => {
    const user = await User.findById(userId).lean();
    if (!user) {
        console.error(`[Briefing] User not found: ${userId}`);
        return null;
    }

    const topics = user.topicPreferences || [];
    if (topics.length === 0) {
        console.warn(`[Briefing] User ${userId} has no topic preferences, skipping.`);
        return null;
    }

    const date = getTodayDateISO();

    // Build sections for each topic (articles should already be cached from prefetch)
    await prefetchAllTopics(topics);
    const sectionPromises = topics.map(topic => buildSection(topic));
    const sectionResults = await Promise.allSettled(sectionPromises);

    const sections: BriefingSection[] = sectionResults
        .filter((r): r is PromiseFulfilledResult<BriefingSection | null> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter((s): s is BriefingSection => s !== null);

    if (sections.length === 0) {
        console.warn(`[Briefing] No sections generated for user ${userId} on ${date}.`);
        return null;
    }

    const script = composeBriefingScript(sections);

    // Upsert: create or update the briefing for today
    const briefing = await Briefing.findOneAndUpdate(
        { userId, date },
        {
            topics,
            script,
            sections,
            // Don't overwrite emailSentAt if it already exists (preserve delivery status)
            $setOnInsert: { emailSentAt: null }
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    return briefing;
};

/**
 * Generate briefings for ALL users with briefing enabled.
 * Called by the QStash cron trigger.
 *
 * Flow:
 * 1. Find all users with briefingPreferences.enabled = true
 * 2. Collect all unique topics across those users
 * 3. Prefetch articles for all unique topics (cache them)
 * 4. Generate individual briefings per user (reads from cache)
 * 5. Send emails for users with emailEnabled = true
 */
export const generateAllBriefings = async (): Promise<{ generated: number; emailed: number; errors: number }> => {
    const stats = { generated: 0, emailed: 0, errors: 0 };
    const date = getTodayDateISO();

    console.log(`[Briefing] Starting daily briefing generation for ${date}`);

    // 1. Find all users with briefing enabled who have topic preferences
    const users = await User.find({
        'briefingPreferences.enabled': true,
        'topicPreferences.0': { $exists: true } // at least one topic
    }).lean();

    if (users.length === 0) {
        console.log('[Briefing] No users with briefing enabled. Done.');
        return stats;
    }

    console.log(`[Briefing] Found ${users.length} users with briefing enabled.`);

    // 2. Collect all unique topics
    const allTopics = new Set<string>();
    for (const user of users) {
        for (const topic of user.topicPreferences || []) {
            allTopics.add(topic);
        }
    }

    console.log(`[Briefing] ${allTopics.size} unique topics to prefetch: ${[...allTopics].join(', ')}`);

    // 3. Prefetch all topics into cache (single GNews call per topic)
    await prefetchAllTopics([...allTopics]);

    // 4. Generate individual briefings
    for (const user of users) {
        try {
            const briefing = await generateUserBriefing(String(user._id));

            if (briefing) {
                stats.generated++;

                // 5. Send email if enabled and not already sent today
                if (user.briefingPreferences?.emailEnabled && !briefing.emailSentAt) {
                    try {
                        await sendBriefingEmail(user.email, briefing);
                        await Briefing.updateOne(
                            { _id: briefing._id },
                            { emailSentAt: new Date() }
                        );
                        stats.emailed++;
                    } catch (emailError) {
                        console.error(`[Briefing] Email failed for user ${user._id}:`, emailError instanceof Error ? emailError.message : emailError);
                        stats.errors++;
                    }

                    // Respect Resend rate limit: 10 RPS max, we send at 5 RPS
                    await new Promise(resolve => setTimeout(resolve, EMAIL_DELAY_MS));
                }
            }
        } catch (error) {
            console.error(`[Briefing] Generation failed for user ${user._id}:`, error instanceof Error ? error.message : error);
            stats.errors++;
        }
    }

    console.log(`[Briefing] Done. Generated: ${stats.generated}, Emailed: ${stats.emailed}, Errors: ${stats.errors}`);
    return stats;
};
