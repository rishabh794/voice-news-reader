import API from './api';
import { authSchemas, validateWithSchema } from '../validation';

export interface AuthResponse {
    token: string;
    email: string;
    authProvider?: 'local' | 'google';
}

export const registerWithPassword = async (email: string, password: string): Promise<{ message: string }> => {
    const payload = validateWithSchema(
        authSchemas.authCredentialsSchema,
        { email, password },
        'Email and password are required.'
    );

    const response = await API.post('/auth/register', payload);
    return validateWithSchema(
        authSchemas.registerResponseSchema,
        response.data,
        'Invalid registration response from server.'
    );
};

export const loginWithPassword = async (email: string, password: string): Promise<AuthResponse> => {
    const payload = validateWithSchema(
        authSchemas.authCredentialsSchema,
        { email, password },
        'Email and password are required.'
    );

    const response = await API.post('/auth/login', payload);
    return validateWithSchema(
        authSchemas.authResponseSchema,
        response.data,
        'Invalid login response from server.'
    );
};

export const authenticateWithGoogle = async (credential: string): Promise<AuthResponse> => {
    const payload = validateWithSchema(
        authSchemas.googleCredentialSchema,
        { credential },
        'Google credential is required.'
    );

    const response = await API.post('/auth/google', payload);
    return validateWithSchema(
        authSchemas.authResponseSchema,
        response.data,
        'Invalid Google login response from server.'
    );
};
