import API from './client';
import { topicPreferencesSchemas } from '../../validation';
import { validateWithSchema } from '../../validation/utils';
import type { PersonalizedFeed } from '../../types/news';

export const fetchTopicPreferences = async (): Promise<string[]> => {
    const response = await API.get('/topics');
    const data = validateWithSchema(
        topicPreferencesSchemas.getTopicsResponseSchema,
        response.data,
        'Received invalid topics payload from server.'
    );
    return data.topics;
};

export const updateTopicPreferences = async (topics: string[]): Promise<string[]> => {
    const response = await API.put('/topics', { topics });
    const data = validateWithSchema(
        topicPreferencesSchemas.updateTopicsResponseSchema,
        response.data,
        'Received invalid topics update payload from server.'
    );
    return data.topics;
};

export const fetchPersonalizedFeed = async (): Promise<PersonalizedFeed> => {
    const response = await API.get('/feed');
    return validateWithSchema(
        topicPreferencesSchemas.personalizedFeedResponseSchema,
        response.data,
        'Received invalid feed payload from server.'
    );
};
