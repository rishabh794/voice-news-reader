import React, { useState, useEffect , useRef} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchNews } from '../services/newsApi';
import API from '../services/api';

const Dashboard = () => {
    const [query, setQuery] = useState('');
    const [articles, setArticles] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const location = useLocation();
    const navigate = useNavigate();
    const lastExecutedQuery = useRef<string | null>(null);

    const executeSearch = async (searchQuery: string, skipHistorySave = false) => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError('');
        
        try {
            const data = await fetchNews(searchQuery);
            if (data.length === 0) setError('No articles found. Try another search.');
            setArticles(data);
            
            if (!skipHistorySave) {
                API.post('/history', { query: searchQuery }).catch(err => console.error("Failed to save history", err));
            }
        } catch (err : any) {  // eslint-disable-line @typescript-eslint/no-explicit-any
            setError('Failed to fetch news. Check the console.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        executeSearch(query, false); 
    };

   useEffect(() => {
        if (!location.state || (!location.state.voiceQuery && !location.state.query)) {
            lastExecutedQuery.current = null;
            return;
        }

        const incomingQuery = location.state.voiceQuery || location.state.query;
        const fromHistory = location.state.fromHistory || false;

        if (incomingQuery && lastExecutedQuery.current !== incomingQuery) {
            
            lastExecutedQuery.current = incomingQuery;

            setQuery(incomingQuery);
            executeSearch(incomingQuery, fromHistory);
            
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    return (
        <div className="p-5 max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold mb-5">News Dashboard</h2>
            
            <form onSubmit={handleManualSearch} className="mb-8 flex gap-2.5">
                <input 
                    type="text" 
                    placeholder="Search for news..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="p-2.5 w-[300px] border border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="p-2.5 border border-black cursor-pointer hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && <p className="text-red-500 font-bold mb-5">{error}</p>}

            {/* 🚨 THE NEW LOADING OVERLAY 🚨 */}
            {loading ? (
                <div className="flex flex-col justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                    <h3 className="text-xl font-bold text-blue-600 animate-pulse">Fetching the latest articles...</h3>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                    {articles.map((article, index) => (
                        <div key={index} className="border border-gray-300 p-4 flex flex-col bg-white hover:shadow-lg transition-shadow">
                            {article.image && (
                                <img 
                                    src={article.image} 
                                    alt="News thumbnail" 
                                    className="w-full h-[150px] object-cover mb-2.5 rounded" 
                                />
                            )}
                            <h3 className="text-lg m-0 mb-2.5 font-semibold leading-tight">{article.title}</h3>
                            <p className="text-sm text-gray-600 grow mb-4 line-clamp-3">{article.description}</p>
                            <a 
                                href={article.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="mt-auto text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                            >
                                Read Full Article
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;