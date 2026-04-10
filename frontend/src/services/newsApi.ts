import axios from 'axios';

const API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const BASE_URL = 'https://gnews.io/api/v4';

export const fetchNews = async (query: string) => {
    if (!API_KEY) {
        console.error("News API Key is missing in .env!");
        return [];
    }

    try {
        const response = await axios.get(`${BASE_URL}/search`, {
            params: {
                q: query,
                lang: 'en',
                max: 9, 
                apikey: API_KEY
            }
        });
        
        return response.data.articles;
    } catch (error) {
        console.error("Error fetching news:", error);
        return [];
    }
};