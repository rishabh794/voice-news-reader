import API from './client';
import { transcribeSchemas, validateWithSchema } from '../../validation';

export const transcribeAudio = async (formData: FormData): Promise<{ text: string }> => {
    const response = await API.post('/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

    return validateWithSchema(
        transcribeSchemas.transcribeResponseSchema,
        response.data,
        'Received an invalid transcription payload from server.'
    );
};
