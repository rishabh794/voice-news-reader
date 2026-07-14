import API from './client';
import { briefingSchemas } from '../../validation';
import { validateWithSchema } from '../../validation/utils';
import type { Briefing, BriefingPreferences } from '../../types/news';

export const fetchLatestBriefing = async (): Promise<Briefing | null> => {
    const response = await API.get('/briefing/latest');
    const data = validateWithSchema(
        briefingSchemas.getBriefingResponseSchema,
        response.data,
        'Received invalid briefing payload from server.'
    );
    return data.briefing;
};

export const generateBriefing = async (): Promise<Briefing> => {
    const response = await API.post('/briefing/generate');
    const data = validateWithSchema(
        briefingSchemas.generateBriefingResponseSchema,
        response.data,
        'Received invalid briefing generation payload from server.'
    );
    return data.briefing;
};

export const fetchBriefingSettings = async (): Promise<BriefingPreferences> => {
    const response = await API.get('/briefing/settings');
    const data = validateWithSchema(
        briefingSchemas.getBriefingSettingsResponseSchema,
        response.data,
        'Received invalid briefing settings payload from server.'
    );
    return data.settings;
};

export const updateBriefingSettings = async (settings: Partial<BriefingPreferences>): Promise<BriefingPreferences> => {
    const response = await API.put('/briefing/settings', settings);
    const data = validateWithSchema(
        briefingSchemas.updateBriefingSettingsResponseSchema,
        response.data,
        'Received invalid briefing settings update payload from server.'
    );
    return data.settings;
};

export interface FetchBriefingHistoryResponse {
    briefings: Briefing[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const fetchBriefingHistory = async (page = 1, limit = 10): Promise<FetchBriefingHistoryResponse> => {
    const response = await API.get('/briefing/history', { params: { page, limit } });
    return validateWithSchema(
        briefingSchemas.getBriefingHistoryResponseSchema,
        response.data,
        'Received invalid briefing history payload from server.'
    );
};

export const fetchBriefingById = async (id: string): Promise<Briefing | null> => {
    const response = await API.get(`/briefing/${id}`);
    const data = validateWithSchema(
        briefingSchemas.getBriefingResponseSchema,
        response.data,
        'Received invalid briefing payload from server.'
    );
    return data.briefing;
};
