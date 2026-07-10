import API from './client';

export interface ReaderArticle {
    title: string;
    content: string;
    textContent: string;
    length: number;
    excerpt: string;
    byline: string;
    dir: string;
    siteName: string;
    lang: string;
}

export const fetchReaderContent = async (url: string, savedArticleId?: string): Promise<ReaderArticle> => {
    let endpoint = `/reader/parse?url=${encodeURIComponent(url)}`;
    if (savedArticleId) {
        endpoint += `&savedArticleId=${encodeURIComponent(savedArticleId)}`;
    }
    const response = await API.get(endpoint);
    return response.data;
};
