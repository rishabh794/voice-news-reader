import API from './client';
import { newsSchemas, validateWithSchema } from '../../validation';
import type { Collection } from '../../types/news';

export const fetchCollections = async (): Promise<Collection[]> => {
    const response = await API.get('/collections');
    return validateWithSchema(
        newsSchemas.collectionListSchema,
        response.data,
        'Received an invalid collections list from server.'
    );
};

export const createCollection = async (name: string, icon: string): Promise<Collection> => {
    const response = await API.post('/collections', { name, icon });
    return validateWithSchema(
        newsSchemas.collectionSchema,
        response.data,
        'Received an invalid collection response.'
    );
};

export const deleteCollection = async (id: string): Promise<void> => {
    await API.delete(`/collections/${id}`);
};
