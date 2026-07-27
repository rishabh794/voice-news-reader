import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    withCredentials: true
});

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            window.dispatchEvent(new CustomEvent('api:unauthorized'));
        }
        if (error.response?.status === 429) {
            const retryAfter = error.response.headers?.['retry-after'] || 10;
            const message = error.response.data?.error || `Too many requests. Please wait ${retryAfter}s.`;
            
            // Dispatch a custom event that the UI can listen to, instead of directly manipulating DOM
            window.dispatchEvent(new CustomEvent('api:ratelimit', { 
                detail: { message, retryAfter }
            }));
            
            console.warn(`Rate limit hit: ${message}`);
        }
        return Promise.reject(error);
    }
);

export default API;
