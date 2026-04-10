import React, { useState } from 'react';
import { fetchNews } from '../services/newsApi';

const Dashboard = () => {
    const [query, setQuery] = useState('');
    const [articles, setArticles] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        
        try {
            const data = await fetchNews(query);
            if (data.length === 0) {
                setError('No articles found. Try another search.');
            }
            setArticles(data);
            
            
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError('Failed to fetch news. Check the console.');
            console.error("Error in Dashboard:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-5 max-w-5xl mx-auto">
            <h2>News Dashboard</h2>
            
            {/* 1. The Search Bar */}
            <form onSubmit={handleSearch} className="mb-8 flex gap-2.5">
                <input 
                    type="text" 
                    placeholder="Search for news (e.g., Technology, Space)..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="p-2.5 w-80 border border-black"
                />
                <button type="submit" disabled={loading} className="p-2.5 border border-black cursor-pointer">
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && <p className="text-red-600 font-bold">{error}</p>}

            {/* 2. The Raw Data Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                {articles.map((article, index) => (
                    <div key={index} className="border border-gray-300 p-4 flex flex-col">
                        {article.image && (
                            <img 
                                src={article.image} 
                                alt="News thumbnail" 
                                className="w-full h-36 object-cover mb-2.5" 
                            />
                        )}
                        <h3 className="text-lg mb-2.5">{article.title}</h3>
                        <p className="text-sm text-gray-600 flex-grow">{article.description}</p>
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="mt-4 text-blue-600">
                            Read Full Article
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;