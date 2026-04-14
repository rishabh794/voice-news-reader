import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';

import SearchBar from '../components/SearchBar';
import NewsCard from '../components/NewsCard';
import Loader from '../components/Loader';

const Dashboard = () => {
    const [query, setQuery] = useState('');
    const [articles, setArticles] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const lastExecutedQuery = useRef<string | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    const speakText = (text: string) => {
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; 
        utterance.rate = 1.0; 
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    const executeIntelligentSearch = async (searchQuery: string, skipHistorySave = false) => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await API.post('/intent', { query: searchQuery });
            const data = response.data;

            if (data.action === 'search' && data.articles) {
                setArticles(data.articles);
                setQuery(data.topic);
                
                sessionStorage.setItem('dashboard_query', data.topic);
                sessionStorage.setItem('dashboard_articles', JSON.stringify(data.articles));
                
                speakText(data.summary); 

                if (!skipHistorySave) {
                    API.post('/history', { query: data.topic }).catch(err => console.error("History save failed", err));
                }
            } else {
                 setError('No articles found for that topic.');
            }
        } catch (err) {
            setError('Failed to fetch news. Check the console.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        executeIntelligentSearch(query, false); 
    };

    useEffect(() => {
        const agentPayload = location.state?.agentPayload;
        const historyQuery = location.state?.query; 
        const fromHistory = location.state?.fromHistory || false;

        // SCENARIO 1: Came from Voice Command (Pre-fetched data)
        if (agentPayload) {
            if (lastExecutedQuery.current !== agentPayload.topic) {
                lastExecutedQuery.current = agentPayload.topic;
                
                setQuery(agentPayload.topic);
                setArticles(agentPayload.articles || []);
                
                sessionStorage.setItem('dashboard_query', agentPayload.topic);
                sessionStorage.setItem('dashboard_articles', JSON.stringify(agentPayload.articles || []));

                if (agentPayload.summary) speakText(agentPayload.summary);

                API.post('/history', { query: agentPayload.topic }).catch(console.error);

                navigate(location.pathname, { replace: true, state: {} });
            }
        } 
        // SCENARIO 2: Came from History Page click (Needs to fetch)
        else if (historyQuery) {
            if (lastExecutedQuery.current !== historyQuery) {
                lastExecutedQuery.current = historyQuery;
                setQuery(historyQuery);
                
                // Fetch the news, but tell it to SKIP saving to history
                executeIntelligentSearch(historyQuery, fromHistory);
                
                navigate(location.pathname, { replace: true, state: {} });
            }
        } 
        // SCENARIO 3: Normal Page Load (Restore from Session)
        else if (!lastExecutedQuery.current) {
            const savedQuery = sessionStorage.getItem('dashboard_query');
            const savedArticles = sessionStorage.getItem('dashboard_articles');

            if (savedQuery && savedArticles) {
                setQuery(savedQuery);
                setArticles(JSON.parse(savedArticles));
                lastExecutedQuery.current = savedQuery;
            }
        }
    }, [location.state, navigate, location.pathname]);

    return (
        <div className="pt-20 px-5 pb-5 max-w-[1200px] mx-auto">
            <SearchBar 
                query={query} 
                setQuery={setQuery} 
                onSearch={handleManualSearch} 
                loading={loading} 
            />

            {error && <p className="text-red-500 font-bold mb-5">{error}</p>}

            {loading ? (
                <Loader />
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                    {articles.map((article, index) => (
                        <NewsCard key={index} article={article} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;