import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';

import SearchBar from '../components/SearchBar';
import NewsCard from '../components/NewsCard';
import Loader from '../components/Loader';
import type { Article, SavedArticle } from '../types/news';

const Dashboard = () => {
    const [query, setQuery] = useState('');
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [savedArticleIdsByUrl, setSavedArticleIdsByUrl] = useState<Record<string, string>>({});
    const [saveLoadingUrl, setSaveLoadingUrl] = useState<string | null>(null);

    const lastExecutedQuery = useRef<string | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    const speakText = useCallback((text: string) => {
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; 
        utterance.rate = 1.0; 
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }, []);

    const buildSavedMap = (savedArticles: SavedArticle[]) => {
        return savedArticles.reduce<Record<string, string>>((acc, savedArticle) => {
            if (savedArticle.url && savedArticle._id) {
                acc[savedArticle.url] = savedArticle._id;
            }
            return acc;
        }, {});
    };

    const handleToggleSave = async (article: Article) => {
        const articleUrl = article.url?.trim();
        if (!articleUrl || saveLoadingUrl === articleUrl) return;

        setSaveError('');
        setSaveLoadingUrl(articleUrl);

        try {
            const existingSavedId = savedArticleIdsByUrl[articleUrl];

            if (existingSavedId) {
                await API.delete(`/saved-articles/${existingSavedId}`);
                setSavedArticleIdsByUrl((prev) => {
                    const next = { ...prev };
                    delete next[articleUrl];
                    return next;
                });
                return;
            }

            const response = await API.post('/saved-articles', {
                title: article.title,
                description: article.description || '',
                url: articleUrl,
                image: article.image || '',
                publishedAt: article.publishedAt,
                sourceName: article.source?.name || article.sourceName || ''
            });

            const savedArticle = response.data as SavedArticle;
            if (savedArticle?._id && savedArticle.url) {
                setSavedArticleIdsByUrl((prev) => ({
                    ...prev,
                    [savedArticle.url]: savedArticle._id
                }));
            }
        } catch (err) {
            setSaveError('Failed to update saved articles. Please retry.');
            console.error(err);
        } finally {
            setSaveLoadingUrl(null);
        }
    };

    const executeIntelligentSearch = useCallback(async (searchQuery: string, skipHistorySave = false) => {
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
    }, [speakText]);

    const handleManualSearch = (e: FormEvent) => {
        e.preventDefault();
        executeIntelligentSearch(query, false); 
    };

    useEffect(() => {
        const fetchSavedArticles = async () => {
            try {
                const response = await API.get('/saved-articles');
                setSavedArticleIdsByUrl(buildSavedMap(response.data as SavedArticle[]));
            } catch (err) {
                console.error('Failed to load saved article list', err);
            }
        };

        fetchSavedArticles();
    }, []);

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
                setArticles(JSON.parse(savedArticles) as Article[]);
                lastExecutedQuery.current = savedQuery;
            }
        }
    }, [location.state, navigate, location.pathname, executeIntelligentSearch, speakText]);

    return (
        <div className="pt-20 px-5 pb-5 max-w-[1200px] mx-auto">
            <SearchBar 
                query={query} 
                setQuery={setQuery} 
                onSearch={handleManualSearch} 
                loading={loading} 
            />

            {error && <p className="text-red-500 font-bold mb-5">{error}</p>}
            {saveError && <p className="text-orange-400 font-bold mb-5">{saveError}</p>}

            {loading ? (
                <Loader />
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                    {articles.map((article, index) => (
                        <NewsCard
                            key={article.url || index}
                            article={article}
                            isSaved={Boolean(savedArticleIdsByUrl[article.url])}
                            onToggleSave={handleToggleSave}
                            saveDisabled={saveLoadingUrl === article.url}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;