import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import API from '../services/api';

import SearchBar from '../components/SearchBar';
import NewsCard from '../components/NewsCard';
import Loader from '../components/Loader';
import type { Article, SavedArticle } from '../types/news';
import { getErrorMessage, intentSchemas, newsSchemas, validateWithSchema } from '../validation';

type SearchIntentPayload = z.infer<typeof intentSchemas.searchIntentResponseSchema>;

interface DashboardLocationState {
    agentPayload?: SearchIntentPayload;
    query?: string;
}

const NO_ARTICLES_MESSAGE = 'No articles found related to this topic';

const dashboardLocationStateSchema = z.object({
    agentPayload: intentSchemas.searchIntentResponseSchema.optional(),
    query: z.string().optional()
});

const Dashboard = () => {
    const [query, setQuery] = useState('');
    const [summary, setSummary] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    const [isSummaryAudioPlaying, setIsSummaryAudioPlaying] = useState(false);
    const [isSummaryAudioPaused, setIsSummaryAudioPaused] = useState(false);
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [savedArticleIdsByUrl, setSavedArticleIdsByUrl] = useState<Record<string, string>>({});
    const [saveLoadingUrl, setSaveLoadingUrl] = useState<string | null>(null);

    const lastHandledPayload = useRef<string | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    const playSummaryAudio = useCallback((text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => {
            setIsSummaryAudioPlaying(false);
            setIsSummaryAudioPaused(false);
        };

        utterance.onerror = () => {
            setIsSummaryAudioPlaying(false);
            setIsSummaryAudioPaused(false);
        };

        setIsSummaryAudioPlaying(true);
        setIsSummaryAudioPaused(false);
        window.speechSynthesis.speak(utterance);
    }, []);

    const speakNoArticlesMessage = useCallback((message: string) => {
        window.speechSynthesis.cancel();
        setIsSummaryAudioPlaying(false);
        setIsSummaryAudioPaused(false);

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
    }, []);

    const toggleSummaryAudioPause = useCallback(() => {
        if (!isSummaryAudioPlaying) return;

        if (isSummaryAudioPaused) {
            window.speechSynthesis.resume();
            setIsSummaryAudioPaused(false);
            return;
        }

        window.speechSynthesis.pause();
        setIsSummaryAudioPaused(true);
    }, [isSummaryAudioPlaying, isSummaryAudioPaused]);

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

            const savedArticle = validateWithSchema(
                newsSchemas.savedArticleSchema,
                response.data,
                'Received an invalid saved article response.'
            );
            if (savedArticle?._id && savedArticle.url) {
                setSavedArticleIdsByUrl((prev) => ({
                    ...prev,
                    [savedArticle.url]: savedArticle._id
                }));
            }
        } catch (err: unknown) {
            setSaveError(getErrorMessage(err, 'Failed to update saved articles. Please retry.'));
            console.error(err);
        } finally {
            setSaveLoadingUrl(null);
        }
    };

    const executeIntelligentSearch = useCallback(async (searchQuery: string) => {
        setLoading(true);
        setError('');

        try {
            const { query: trimmedQuery } = validateWithSchema(
                intentSchemas.intentRequestSchema,
                { query: searchQuery },
                'Please enter a search query.'
            );

            const response = await API.post('/intent', { query: trimmedQuery });
            const data = validateWithSchema(
                intentSchemas.intentResponseSchema,
                response.data,
                'Received an invalid intent response from server.'
            );

            if (data.action === 'search') {
                const topic = data.topic;
                const generatedSummary = data.summary;
                const noArticlesMessage = data.message?.trim()
                    ? data.message.trim()
                    : NO_ARTICLES_MESSAGE;

                if (data.articles.length === 0) {
                    speakNoArticlesMessage(noArticlesMessage);
                    setArticles([]);
                    setQuery(topic);
                    setSummary('');
                    setShowSummary(false);
                    setError(noArticlesMessage);
                    sessionStorage.setItem('dashboard_query', topic);
                    sessionStorage.setItem('dashboard_articles', JSON.stringify([]));
                    sessionStorage.setItem('dashboard_summary', '');
                    return;
                }

                setArticles(data.articles);
                setQuery(topic);
                setSummary(generatedSummary);
                setShowSummary(Boolean(generatedSummary));

                sessionStorage.setItem('dashboard_query', topic);
                sessionStorage.setItem('dashboard_articles', JSON.stringify(data.articles));
                sessionStorage.setItem('dashboard_summary', generatedSummary);

                if (generatedSummary) playSummaryAudio(generatedSummary);
            } else {
                speakNoArticlesMessage(NO_ARTICLES_MESSAGE);
                setError(NO_ARTICLES_MESSAGE);
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to fetch news. Check the console.'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [playSummaryAudio, speakNoArticlesMessage]);

    const handleManualSearch = (e: FormEvent) => {
        e.preventDefault();
        executeIntelligentSearch(query);
    };

    useEffect(() => {
        const fetchSavedArticles = async () => {
            try {
                const response = await API.get('/saved-articles');
                const savedArticles = validateWithSchema(
                    newsSchemas.savedArticleListSchema,
                    response.data,
                    'Received an invalid saved article list from server.'
                );
                setSavedArticleIdsByUrl(buildSavedMap(savedArticles));
            } catch (err: unknown) {
                console.error('Failed to load saved article list', err);
            }
        };

        fetchSavedArticles();
    }, []);

    useEffect(() => {
        const parsedState = dashboardLocationStateSchema.safeParse(location.state);
        const state = parsedState.success ? (parsedState.data as DashboardLocationState) : null;
        const agentPayload = state?.agentPayload;
        const historyQuery = state?.query;

        // SCENARIO 1: Came from Voice Command / History Refresh (Pre-fetched data)
        if (agentPayload?.topic) {
            const payloadSummary = agentPayload.summary || '';
            const payloadArticles = Array.isArray(agentPayload.articles) ? agentPayload.articles : [];
            const payloadMessage = typeof agentPayload.message === 'string' && agentPayload.message.trim()
                ? agentPayload.message.trim()
                : NO_ARTICLES_MESSAGE;
            const payloadSignature = `${agentPayload.topic}::${payloadSummary}::${payloadArticles.map((article) => article.url).join('|')}`;

            if (lastHandledPayload.current === payloadSignature) return;
            lastHandledPayload.current = payloadSignature;

            if (payloadArticles.length === 0) {
                speakNoArticlesMessage(payloadMessage);
                setQuery(agentPayload.topic);
                setSummary('');
                setShowSummary(false);
                setArticles([]);
                setError(payloadMessage);

                sessionStorage.setItem('dashboard_query', agentPayload.topic);
                sessionStorage.setItem('dashboard_articles', JSON.stringify([]));
                sessionStorage.setItem('dashboard_summary', '');

                navigate(location.pathname, { replace: true, state: {} });
                return;
            }

            setError('');
            setQuery(agentPayload.topic);
            setSummary(payloadSummary);
            setShowSummary(Boolean(payloadSummary));
            setArticles(payloadArticles);

            sessionStorage.setItem('dashboard_query', agentPayload.topic);
            sessionStorage.setItem('dashboard_articles', JSON.stringify(payloadArticles));
            sessionStorage.setItem('dashboard_summary', payloadSummary);

            if (payloadSummary) playSummaryAudio(payloadSummary);

            navigate(location.pathname, { replace: true, state: {} });
        }
        // SCENARIO 2: Backward-compatible fallback (history sends only query)
        else if (historyQuery) {
            const historySignature = `history:${historyQuery}`;
            if (lastHandledPayload.current === historySignature) return;
            lastHandledPayload.current = historySignature;

            setQuery(historyQuery);
            executeIntelligentSearch(historyQuery);
            navigate(location.pathname, { replace: true, state: {} });
        }
        // SCENARIO 3: Normal Page Load (Restore from Session)
        else if (!lastHandledPayload.current) {
            const savedQuery = sessionStorage.getItem('dashboard_query');
            const savedArticles = sessionStorage.getItem('dashboard_articles');
            const savedSummary = sessionStorage.getItem('dashboard_summary') || '';

            if (savedQuery && savedArticles) {
                try {
                    setQuery(savedQuery);
                    const parsedCachedArticles = validateWithSchema(
                        newsSchemas.articleListSchema,
                        JSON.parse(savedArticles),
                        'Stored dashboard articles are invalid.'
                    );
                    setArticles(parsedCachedArticles);
                    setSummary(savedSummary);
                    setShowSummary(Boolean(savedSummary));
                    lastHandledPayload.current = `cache:${savedQuery}`;
                } catch (parseError) {
                    console.error('Failed to parse dashboard cache', parseError);
                }
            }
        }
    }, [location.state, navigate, location.pathname, executeIntelligentSearch, playSummaryAudio, speakNoArticlesMessage]);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    return (
        <div className="pt-20 px-5 pb-5 max-w-[1200px] mx-auto">
            <SearchBar
                query={query}
                setQuery={setQuery}
                onSearch={handleManualSearch}
                loading={loading}
                hasSummary={Boolean(summary)}
                onSummaryClick={() => setShowSummary((prev) => !prev)}
            />

            {summary && showSummary && (
                <div className="max-w-2xl mx-auto mb-6 rounded-xl border border-indigo-500/30 bg-[#0d0d12]/90 p-4">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 mb-2">Latest Summary</p>
                    <p className="text-sm text-gray-200 leading-relaxed">{summary}</p>
                    <button
                        type="button"
                        onClick={() => playSummaryAudio(summary)}
                        className="mt-4 px-3 py-2 bg-[#13131a] border border-indigo-500/30 rounded-lg text-indigo-300 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-indigo-400/50 transition-all duration-200"
                    >
                        Play Audio
                    </button>
                    <button
                        type="button"
                        onClick={toggleSummaryAudioPause}
                        disabled={!isSummaryAudioPlaying}
                        className="mt-2 ml-2 px-3 py-2 bg-[#13131a] border border-amber-500/30 rounded-lg text-amber-300 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-amber-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSummaryAudioPlaying ? (isSummaryAudioPaused ? 'Resume Audio' : 'Pause Audio') : 'Pause Audio'}
                    </button>
                </div>
            )}

            {error && <p className="text-red-500 font-bold mb-5 text-center">{error}</p>}
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
