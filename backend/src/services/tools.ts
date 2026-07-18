import axios from 'axios';

export async function searchGNews(query: string, signal?: AbortSignal) {
    const apiKey = process.env.GNEWS_API_KEY;
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&apikey=${apiKey}&max=9`;
    const response = await axios.get(url, { timeout: 12000, ...(signal ? { signal } : {}) });

    const articles = response.data?.articles;
    if (!Array.isArray(articles)) {
        throw new Error(`GNews returned unexpected response format for query: "${query}"`);
    }

    const llmText = articles.map((a: { title: string, description: string }) => `${a.title}: ${a.description}`).join('\n\n');

    return {
        rawArticles: articles,
        llmObservation: llmText || "No articles found."
    };
}