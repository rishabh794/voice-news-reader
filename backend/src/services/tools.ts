import axios from 'axios';

export async function searchGNews(query: string) {
    try {
        const apiKey = process.env.GNEWS_API_KEY;
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&apikey=${apiKey}&max=9`;
        const response = await axios.get(url);

        const articles = response.data.articles;

        // Strip out the images and URLs so the LLM only reads the text (saves tokens!)
        const llmText = articles.map((a: any) => `${a.title}: ${a.description}`).join('\n\n');

        return {
            rawArticles: articles,
            llmObservation: llmText || "No articles found."
        };
    } catch (error) {
        console.error("GNews Error", error);
        return {
            rawArticles: [],
            llmObservation: "Observation: The search failed or returned no results."
        };
    }
}