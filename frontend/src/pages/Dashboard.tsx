import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchNews } from '../services/newsApi';
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

    const executeSearch = async (searchQuery: string, skipHistorySave = false, isVoiceCommand = false) => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError('');
        
        try {
            const data = await fetchNews(searchQuery);
            if (data.length === 0) {
                setError('No articles found. Try another search.');
                if (isVoiceCommand) speakText("I couldn't find any recent news on that topic.");
            } else {
                setArticles(data);
                if (isVoiceCommand) {
                    const topStory = data[0].title;
                    speakText(`Here is the latest news on ${searchQuery}. The top story is: ${topStory}`);
                }
                sessionStorage.setItem('dashboard_query', searchQuery);
                sessionStorage.setItem('dashboard_articles', JSON.stringify(data));
            }
            
            if (!skipHistorySave) {
                API.post('/history', { query: searchQuery }).catch(err => console.error("Failed to save history", err));
            }
        } catch (err: any) {  // eslint-disable-line @typescript-eslint/no-explicit-any
            setError('Failed to fetch news. Check the console.');
            if (isVoiceCommand) speakText("Sorry, I ran into a server error while fetching the news.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        executeSearch(query, false, false); 
    };

    useEffect(() => {
        const incomingQuery = location.state?.voiceQuery || location.state?.query;
        const fromHistory = location.state?.fromHistory || false;
        const isVoice = !!location.state?.voiceQuery;

        if (incomingQuery) {
            if (lastExecutedQuery.current !== incomingQuery) {
                lastExecutedQuery.current = incomingQuery;
                setQuery(incomingQuery);
                
                executeSearch(incomingQuery, fromHistory, isVoice);
                navigate(location.pathname, { replace: true, state: {} });
            }
        } else {
            if (!lastExecutedQuery.current) {
                const savedQuery = sessionStorage.getItem('dashboard_query');
                const savedArticles = sessionStorage.getItem('dashboard_articles');

                if (savedQuery && savedArticles) {
                    setQuery(savedQuery);
                    setArticles(JSON.parse(savedArticles));
                    
                    lastExecutedQuery.current = savedQuery;
                }
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