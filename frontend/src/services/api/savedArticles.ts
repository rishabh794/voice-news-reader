import API from './client';
import { newsSchemas, validateWithSchema } from '../../validation';
import type { Article, SavedArticle } from '../../types/news';

export const fetchSavedArticles = async (collectionId?: string): Promise<SavedArticle[]> => {
    const url = collectionId ? `/saved-articles?collectionId=${collectionId}` : '/saved-articles';
    const response = await API.get(url);
    return validateWithSchema(
        newsSchemas.savedArticleListSchema,
        response.data,
        'Received an invalid saved article list from server.'
    );
};

export const saveArticle = async (article: Article, collectionId?: string): Promise<SavedArticle> => {
    const response = await API.post('/saved-articles', {
        title: article.title,
        description: article.description || '',
        url: article.url?.trim() || '',
        image: article.image || '',
        publishedAt: article.publishedAt,
        sourceName: article.source?.name || article.sourceName || '',
        collectionId
    });

    return validateWithSchema(
        newsSchemas.savedArticleSchema,
        response.data,
        'Received an invalid saved article response.'
    );
};

export const updateSavedArticle = async (
    savedId: string, 
    data: { collectionId?: string; isRead?: boolean }
): Promise<SavedArticle> => {
    const response = await API.put(`/saved-articles/${savedId}`, data);
    
    return validateWithSchema(
        newsSchemas.savedArticleSchema,
        response.data,
        'Received an invalid updated article response.'
    );
};

export const deleteSavedArticle = async (savedId: string): Promise<void> => {
    await API.delete(`/saved-articles/${savedId}`);
};
