export interface NewsSource {
    name?: string;
}

export const AI_HISTORY_CATEGORIES = [
    'Technology',
    'Politics',
    'Business',
    'Sports',
    'Entertainment',
    'Health',
    'World',
    'Science'
] as const;

export type AiHistoryCategory = (typeof AI_HISTORY_CATEGORIES)[number];
export type HistoryCategory = AiHistoryCategory | 'Uncategorized';
export type TopicCategory = (typeof AI_HISTORY_CATEGORIES)[number];

export interface Article {
    _id?: string;
    title: string;
    description?: string;
    url: string;
    image?: string;
    publishedAt?: string;
    source?: NewsSource;
    sourceName?: string;
    topic?: string;
}

export interface Collection {
    _id: string;
    userId: string;
    name: string;
    icon: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SavedArticle {
    _id: string;
    userId: string;
    title: string;
    description: string;
    url: string;
    image: string;
    publishedAt?: string;
    sourceName: string;
    savedAt: string;
    collectionId: string;
    isRead: boolean;
}

export interface HistoryEntry {
    _id: string;
    userId: string;
    query: string;
    summary: string;
    category?: HistoryCategory;
    articles: Article[];
    timestamp?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PersonalizedFeed {
    articles: Article[];
    hasTopics: boolean;
    topics: TopicCategory[];
}
