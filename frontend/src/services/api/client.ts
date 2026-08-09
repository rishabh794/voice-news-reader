import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    }
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        const isAuthError = error.response?.status === 401;
        const isTokenExpired = error.response?.data?.code === 'TOKEN_EXPIRED';
        const isTokenMissing = error.response?.data?.error === 'Access denied. No token provided.';
        const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');

        if (isAuthError && (isTokenExpired || isTokenMissing) && !originalRequest._retry && !isRefreshEndpoint) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return API(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(
                    `${API.defaults.baseURL}/auth/refresh`,
                    {},
                    { 
                        withCredentials: true,
                        headers: { 'X-Requested-With': 'XMLHttpRequest' }
                    }
                );
                
                processQueue(null);
                return API(originalRequest);
            } catch (err) {
                processQueue(err);
                window.dispatchEvent(new CustomEvent('api:unauthorized'));
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

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
