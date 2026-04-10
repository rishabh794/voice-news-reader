import axios from 'axios';

// Create a base instance
const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// The Interceptor: Automatically attach the JWT to every request
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default API;