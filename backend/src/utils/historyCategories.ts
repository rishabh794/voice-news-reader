export const AI_NEWS_CATEGORIES = [
    'Technology',
    'Politics',
    'Business',
    'Sports',
    'Entertainment',
    'Health',
    'World',
    'Science'
] as const;

export const LEGACY_UNCATEGORIZED = 'Uncategorized' as const;

export type AiNewsCategory = (typeof AI_NEWS_CATEGORIES)[number];
export type HistoryCategory = AiNewsCategory | typeof LEGACY_UNCATEGORIZED;

const HISTORY_CATEGORY_SET = new Set<string>([
    ...AI_NEWS_CATEGORIES,
    LEGACY_UNCATEGORIZED
]);

export const isAiNewsCategory = (value: unknown): value is AiNewsCategory => {
    if (typeof value !== 'string') return false;
    return (AI_NEWS_CATEGORIES as readonly string[]).includes(value);
};

export const normalizeHistoryCategory = (value: unknown): HistoryCategory => {
    if (typeof value !== 'string') return LEGACY_UNCATEGORIZED;
    return HISTORY_CATEGORY_SET.has(value) ? (value as HistoryCategory) : LEGACY_UNCATEGORIZED;
};
