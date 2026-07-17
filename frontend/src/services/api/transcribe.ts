import API from './client';
import { transcribeSchemas, validateWithSchema } from '../../validation';

export const transcribeAudio = async (formData: FormData, signal?: AbortSignal): Promise<{ text: string }> => {
    const response = await API.post('/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal
    });

    return validateWithSchema(
        transcribeSchemas.transcribeResponseSchema,
        response.data,
        'Received an invalid transcription payload from server.'
    );
};
