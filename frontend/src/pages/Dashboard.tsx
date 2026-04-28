import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import API from '../services/api';
import useAudioPlayer from '../hooks/useAudioPlayer';

import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import SectionContainer from '../components/ui/SectionContainer';
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
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [savedArticleIdsByUrl, setSavedArticleIdsByUrl] = useState<Record<string, string>>({});
    const [pendingSaveByUrl, setPendingSaveByUrl] = useState<Record<string, boolean>>({});

    const lastHandledPayload = useRef<string | null>(null);
    const lastHandledRouteQuery = useRef<string | null>(null);
    const latestSearchRequestId = useRef(0);
    const isMountedRef = useRef(true);
    const location = useLocation();
    const navigate = useNavigate();
    const summaryAudio = useAudioPlayer();
    const {
        play: playAudio,
        togglePause: toggleAudioPause,
        stop: stopAudio,
        isLoading: isSummaryAudioLoading,
        isPlaying: isSummaryAudioPlaying,
        isPaused: isSummaryAudioPaused
    } = summaryAudio;

    const playSummaryAudio = useCallback((text: string) => {
        playAudio(text);
    }, [playAudio]);

    const speakNoArticlesMessage = useCallback((message: string) => {
        playAudio(message);
    }, [playAudio]);

    const toggleSummaryAudioPause = useCallback(() => {
        toggleAudioPause();
    }, [toggleAudioPause]);

    const buildSavedMap = (savedArticles: SavedArticle[]) => {
        return savedArticles.reduce<Record<string, string>>((acc, savedArticle) => {
            if (savedArticle.url && savedArticle._id) {
                acc[savedArticle.url] = savedArticle._id;
            }
            return acc;
        }, {});
    };

    const handleToggleSave = useCallback(async (article: Article) => {
        const articleUrl = article.url?.trim();
        if (!articleUrl || pendingSaveByUrl[articleUrl]) return;

        setSaveError('');
        setPendingSaveByUrl((prev) => ({ ...prev, [articleUrl]: true }));

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
            if (!isMountedRef.current) return;
            setPendingSaveByUrl((prev) => {
                const next = { ...prev };
                delete next[articleUrl];
                return next;
            });
        }
    }, [pendingSaveByUrl, savedArticleIdsByUrl]);

    const executeIntelligentSearch = useCallback(async (searchQuery: string) => {
        const requestId = ++latestSearchRequestId.current;
        if (isMountedRef.current) {
            setLoading(true);
            setError('');
        }

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
                    if (!isMountedRef.current || requestId !== latestSearchRequestId.current) return;
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

                if (!isMountedRef.current || requestId !== latestSearchRequestId.current) return;
                setArticles(data.articles);
                setQuery(topic);
                setSummary(generatedSummary);
                setShowSummary(Boolean(generatedSummary));

                sessionStorage.setItem('dashboard_query', topic);
                sessionStorage.setItem('dashboard_articles', JSON.stringify(data.articles));
                sessionStorage.setItem('dashboard_summary', generatedSummary);

                if (generatedSummary) playSummaryAudio(generatedSummary);
            } else {
                if (!isMountedRef.current || requestId !== latestSearchRequestId.current) return;
                speakNoArticlesMessage(NO_ARTICLES_MESSAGE);
                setError(NO_ARTICLES_MESSAGE);
            }
        } catch (err: unknown) {
            if (!isMountedRef.current || requestId !== latestSearchRequestId.current) return;
            setError(getErrorMessage(err, 'Failed to fetch news. Check the console.'));
            console.error(err);
        } finally {
            if (!isMountedRef.current || requestId !== latestSearchRequestId.current) return;
            setLoading(false);
        }
    }, [playSummaryAudio, speakNoArticlesMessage]);

    const handleManualSearch = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        const currentRouteQuery = (new URLSearchParams(location.search).get('q') ?? '').trim().toLowerCase();
        if (currentRouteQuery === trimmed.toLowerCase()) {
            executeIntelligentSearch(trimmed);
            return;
        }
        navigate(`/dashboard?q=${encodeURIComponent(trimmed)}`, { replace: true });
    };

    useEffect(() => {
        isMountedRef.current = true;
        const fetchSavedArticles = async () => {
            try {
                const response = await API.get('/saved-articles');
                const savedArticles = validateWithSchema(
                    newsSchemas.savedArticleListSchema,
                    response.data,
                    'Received an invalid saved article list from server.'
                );
                if (!isMountedRef.current) return;
                setSavedArticleIdsByUrl(buildSavedMap(savedArticles));
            } catch (err: unknown) {
                console.error('Failed to load saved article list', err);
            }
        };

        fetchSavedArticles();
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const routeQuery = (new URLSearchParams(location.search).get('q') ?? '').trim();
        if (!routeQuery) {
            lastHandledRouteQuery.current = null;
            return;
        }

        const normalizedRouteQuery = routeQuery.toLowerCase();
        if (lastHandledRouteQuery.current === normalizedRouteQuery) return;

        lastHandledRouteQuery.current = normalizedRouteQuery;
        setQuery(routeQuery);
        executeIntelligentSearch(routeQuery);
    }, [location.search, executeIntelligentSearch]);

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
            isMountedRef.current = false;
            stopAudio();
        };
    }, [stopAudio]);

    return (
        <SectionContainer className="space-y-6">
            <PageHeader
                title="Dashboard"
                subtitle="Search the latest briefings and listen to the summarized results."
            />

            <div id="search">
                <SearchBar
                    query={query}
                    setQuery={setQuery}
                    onSearch={handleManualSearch}
                    loading={loading}
                    hasSummary={Boolean(summary)}
                    onSummaryClick={() => setShowSummary((prev) => !prev)}
                />
            </div>

            {summary && showSummary && (
                <Card className="p-6" variant="elevated">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Badge variant="primary">Latest Summary</Badge>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => playSummaryAudio(summary)}
                                disabled={isSummaryAudioLoading}
                            >
                                {isSummaryAudioLoading ? 'Loading...' : 'Play Audio'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={toggleSummaryAudioPause}
                                disabled={!isSummaryAudioPlaying && !isSummaryAudioPaused}
                            >
                                {isSummaryAudioPaused ? 'Resume Audio' : 'Pause Audio'}
                            </Button>
                        </div>
                    </div>
                    <p className="mt-4 text-[15px] text-text leading-relaxed max-w-prose">
                        {summary}
                    </p>
                </Card>
            )}

            {error && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[15px] text-danger">
                    {error}
                </div>
            )}
            {saveError && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-[15px] text-warning">
                    {saveError}
                </div>
            )}

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
                            saveDisabled={Boolean(article.url && pendingSaveByUrl[article.url])}
                        />
                    ))}
                </div>
            )}
        </SectionContainer>
    );
};

export default Dashboard;
