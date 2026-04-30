import API from './client';
import { newsSchemas, validateWithSchema } from '../../validation';
import type { HistoryEntry } from '../../types/news';

export const fetchHistoryEntries = async (): Promise<HistoryEntry[]> => {
    const response = await API.get('/history');
    return validateWithSchema(
        newsSchemas.historyEntryListSchema,
        response.data,
        'Received an invalid history payload from server.'
    );
};

export const deleteHistoryEntry = async (entryId: string): Promise<void> => {
    await API.delete(`/history/${entryId}`);
};

export const clearHistoryEntries = async (): Promise<void> => {
    await API.delete('/history');
};
