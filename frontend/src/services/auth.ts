import API from './api';

export interface AuthResponse {
    token: string;
    email: string;
    authProvider?: 'local' | 'google';
}

export const registerWithPassword = async (email: string, password: string): Promise<{ message: string }> => {
    const response = await API.post('/auth/register', { email, password });
    return response.data;
};

export const loginWithPassword = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await API.post('/auth/login', { email, password });
    return response.data;
};

export const authenticateWithGoogle = async (credential: string): Promise<AuthResponse> => {
    const response = await API.post('/auth/google', { credential });
    return response.data;
};
