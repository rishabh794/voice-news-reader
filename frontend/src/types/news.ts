export interface NewsSource {
    name?: string;
}

export interface Article {
    _id?: string;
    title: string;
    description?: string;
    url: string;
    image?: string;
    publishedAt?: string;
    source?: NewsSource;
    sourceName?: string;
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
}
