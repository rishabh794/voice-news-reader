import type { z } from 'zod';
import API from './client';
import { intentSchemas, validateWithSchema } from '../../validation';

export type SearchIntentPayload = z.infer<typeof intentSchemas.searchIntentResponseSchema>;
export type IntentResponse = z.infer<typeof intentSchemas.intentResponseSchema>;

export const requestIntent = async (
    query: string,
    fallbackMessage = 'Please enter a search query.'
): Promise<IntentResponse> => {
    const payload = validateWithSchema(
        intentSchemas.intentRequestSchema,
        { query },
        fallbackMessage
    );

    const response = await API.post('/intent', payload);
    return validateWithSchema(
        intentSchemas.intentResponseSchema,
        response.data,
        'Received an invalid intent response from server.'
    );
};
