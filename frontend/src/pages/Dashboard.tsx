import { useState, useEffect, useRef, useCallback, useMemo, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { deleteSavedArticle, fetchSavedArticles, saveArticle } from '../services/api';
import useAudioPlayer from '../hooks/useAudioPlayer';
import { useToast } from '../hooks/useToast';
import { isGibberish } from '../services/isGibberish';
import { useTopicPreferences } from '../hooks/useTopicPreferences';
import { usePersonalizedFeed } from '../hooks/usePersonalizedFeed';
import { useSSESearch } from '../hooks/useSSESearch';
import { useVoiceSession } from '../features/voice-session/useVoiceSession';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import SectionContainer from '../components/ui/SectionContainer';
import Loader from '../components/Loader';
import TopicSelector from '../components/TopicSelector';
import TopicFilterBar from '../components/TopicFilterBar';
import FeedArticleGrid from '../components/FeedArticleGrid';
import SaveToCollectionModal from '../components/SaveToCollectionModal';
import PipelineProgress from '../components/PipelineProgress';

import type { Article, SavedArticle } from '../types/news';
import { AI_HISTORY_CATEGORIES } from '../types/news';
import { getErrorMessage, intentSchemas, newsSchemas, validateWithSchema } from '../validation';

type SearchIntentPayload = z.infer<typeof intentSchemas.searchIntentResponseSchema>;

interface DashboardLocationState {
    agentPayload?: SearchIntentPayload;
    query?: string;
}

const NO_ARTICLES_MESSAGE = 'No articles found related to this topic';
const GIBBERISH_QUERY_MESSAGE = 'Could not understand that query. Please try another search.';

const dashboardLocationStateSchema = z.object({
    agentPayload: intentSchemas.searchIntentResponseSchema.optional(),
    query: z.string().optional()
});

const EMPTY_SAVED_ARTICLES: SavedArticle[] = [];

const Dashboard = () => {
    // Search State
    const { topic, summary, articles, currentArticleIndex, setSessionState } = useVoiceSession();
    
    // We map the global 'topic' to the local 'query' concept
    const query = topic || '';
    
    const setQuery = useCallback((q: string) => setSessionState({ topic: q }), [setSessionState]);
    const setSummary = useCallback((s: string) => setSessionState({ summary: s }), [setSessionState]);
    const setArticles = useCallback((a: Article[]) => setSessionState({ articles: a, currentArticleIndex: null }), [setSessionState]);

    const [showSummary, setShowSummary] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Saved Articles State
    const [saveError, setSaveError] = useState('');
    const [pendingSaveByUrl, setPendingSaveByUrl] = useState<Record<string, boolean>>({});
    const [articleToSave, setArticleToSave] = useState<Article | null>(null);

    // Feed State
    const [isEditingTopics, setIsEditingTopics] = useState(false);
    const [activeFeedFilters, setActiveFeedFilters] = useState<string[]>([]);

    const lastHandledPayload = useRef<string | null>(null);
    const lastHandledRouteQuery = useRef<string | null>(null);
    const isMountedRef = useRef(true);
    const location = useLocation();
    const navigate = useNavigate();
    const summaryAudio = useAudioPlayer();
    const { showToast } = useToast();
    const {
        play: playAudio,
        togglePause: toggleAudioPause,
        stop: stopAudio,
        isLoading: isSummaryAudioLoading,
        isPlaying: isSummaryAudioPlaying,
        isPaused: isSummaryAudioPaused
    } = summaryAudio;

    const sse = useSSESearch({
        onIntent: (intent) => {
            // Only wipe the screen if we are actually starting a new search
            if (intent.action === 'search' || intent.action === 'refine') {
                setQuery(intent.topic || '');
                setSummary('');
                setShowSummary(false);
                setArticles([]);
                setError('');
            }
        },
        onArticles: (fetchedArticles) => {
            setArticles(fetchedArticles);
            if (fetchedArticles.length === 0) {
                setError(NO_ARTICLES_MESSAGE);
                speakNoArticlesMessage(NO_ARTICLES_MESSAGE);
            }
        },
        onSummary: (summaryText) => {
            setSummary(summaryText);
            setShowSummary(true);
            playSummaryAudio(summaryText);
        },
        onError: (errMsg) => {
            setError(errMsg);
            setLoading(false);
            stopAudio();
        },
        onComplete: (data) => {
            if (data) {
                const finalQuery = data.intent?.topic || query;
                sessionStorage.setItem('dashboard_query', finalQuery);
                sessionStorage.setItem('dashboard_articles', JSON.stringify(data.articles));
                sessionStorage.setItem('dashboard_summary', data.summary);
            }
            setLoading(false);
        }
    });

    // Derived mode state
    const isSearchActive = Boolean(query.trim()) || articles.length > 0 || sse.isStreaming;

    // Topic & Feed Hooks
    const { topics, hasTopics, isLoading: isTopicsLoading, updateTopics, isUpdating: isTopicsUpdating } = useTopicPreferences();
    const { feedArticles, isLoading: isFeedLoading } = usePersonalizedFeed(!isSearchActive && hasTopics);

    // Initialize feed filters with saved topics
    useEffect(() => {
        if (topics.length > 0 && activeFeedFilters.length === 0) {
            setActiveFeedFilters(topics);
        }
    }, [topics, activeFeedFilters.length]);

    const playSummaryAudio = useCallback((text: string) => {
        playAudio(text);
    }, [playAudio]);

    const speakNoArticlesMessage = useCallback((message: string) => {
        playAudio(message);
    }, [playAudio]);

    const toggleSummaryAudioPause = useCallback(() => {
        toggleAudioPause();
    }, [toggleAudioPause]);

    const clearSearch = () => {
        sse.abort();
        sse.reset();
        setQuery('');
        setSummary('');
        setShowSummary(false);
        setArticles([]);
        setError('');
        stopAudio();
        navigate('/dashboard', { replace: true });

        sessionStorage.removeItem('dashboard_query');
        sessionStorage.removeItem('dashboard_articles');
        sessionStorage.removeItem('dashboard_summary');
    };

    const restoreDashboardFromSession = useCallback((expectedQuery?: string): boolean => {
        const savedQuery = sessionStorage.getItem('dashboard_query');
        const savedArticles = sessionStorage.getItem('dashboard_articles');
        const savedSummary = sessionStorage.getItem('dashboard_summary') || '';

        if (!savedQuery || !savedArticles) return false;
        if (expectedQuery && savedQuery.trim().toLowerCase() !== expectedQuery.trim().toLowerCase()) {
            return false;
        }

        try {
            const parsedCachedArticles = validateWithSchema(
                newsSchemas.articleListSchema,
                JSON.parse(savedArticles),
                'Stored dashboard articles are invalid.'
            );
            setQuery(savedQuery);
            setSessionState({ articles: parsedCachedArticles });
            setSummary(savedSummary);
            setShowSummary(Boolean(savedSummary));
            setError('');
            return true;
        } catch (parseError) {
            console.error('Failed to parse dashboard cache', parseError);
            return false;
        }
    }, []);

    const buildSavedMap = (savedArticles: SavedArticle[]) => {
        return savedArticles.reduce<Record<string, string>>((acc, savedArticle) => {
            if (savedArticle.url && savedArticle._id) {
                acc[savedArticle.url] = savedArticle._id;
            }
            return acc;
        }, {});
    };

    const queryClient = useQueryClient();
    const savedArticlesQuery = useQuery<SavedArticle[]>({
        queryKey: ['saved-articles'],
        queryFn: () => fetchSavedArticles()
    });
    const savedArticles = savedArticlesQuery.data ?? EMPTY_SAVED_ARTICLES;
    const savedArticleIdsByUrl = useMemo(() => buildSavedMap(savedArticles), [savedArticles]);

    const saveArticleMutation = useMutation({
        mutationFn: ({ article, collectionId }: { article: Article; collectionId?: string }) => 
            saveArticle(article, collectionId),
        onSuccess: (savedArticle) => {
            queryClient.setQueryData<SavedArticle[]>(['saved-articles'], (prev = []) => {
                if (prev.some((item) => item._id === savedArticle._id)) {
                    return prev;
                }
                return [...prev, savedArticle];
            });
            showToast('Article saved to collection', 'success');
        },
        onError: (err) => {
            setSaveError(getErrorMessage(err, 'Failed to save article. Please retry.'));
        }
    });

    const deleteSavedArticleMutation = useMutation({
        mutationFn: deleteSavedArticle,
        onSuccess: (_, savedId) => {
            queryClient.setQueryData<SavedArticle[]>(['saved-articles'], (prev = []) =>
                prev.filter((item) => item._id !== savedId)
            );
        }
    });

    const handleToggleSave = useCallback(async (article: Article) => {
        const articleUrl = article.url?.trim();
        if (!articleUrl || pendingSaveByUrl[articleUrl]) return;

        setSaveError('');
        const existingSavedId = savedArticleIdsByUrl[articleUrl];

        if (existingSavedId) {
            setPendingSaveByUrl((prev) => ({ ...prev, [articleUrl]: true }));
            try {
                await deleteSavedArticleMutation.mutateAsync(existingSavedId);
                showToast('Article removed from saved', 'success');
            } catch (err: unknown) {
                setSaveError(getErrorMessage(err, 'Failed to update saved articles. Please retry.'));
                console.error(err);
            } finally {
                if (isMountedRef.current) {
                    setPendingSaveByUrl((prev) => {
                        const next = { ...prev };
                        delete next[articleUrl];
                        return next;
                    });
                }
            }
            return;
        }

        // Open modal to select collection
        setArticleToSave(article);
    }, [pendingSaveByUrl, savedArticleIdsByUrl, deleteSavedArticleMutation, showToast]);

    const { startSearch } = sse;
    const executeIntelligentSearch = useCallback(async (searchQuery: string) => {
        const normalizedSearchQuery = searchQuery.trim();

        if (isGibberish(normalizedSearchQuery)) {
            stopAudio();
            setLoading(false);
            setError(GIBBERISH_QUERY_MESSAGE);
            showToast(GIBBERISH_QUERY_MESSAGE, 'error');
            return;
        }

        if (isMountedRef.current) {
            stopAudio();
            setLoading(true);
            setError('');
        }

        startSearch(normalizedSearchQuery, { previous_topic: topic });
    }, [startSearch, showToast, stopAudio, topic]);

    const handleManualSearch = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) {
            clearSearch();
            return;
        }
        if (isGibberish(trimmed)) {
            setError(GIBBERISH_QUERY_MESSAGE);
            showToast(GIBBERISH_QUERY_MESSAGE, 'error');
            return;
        }
        const currentRouteQuery = (new URLSearchParams(location.search).get('q') ?? '').trim().toLowerCase();
        if (currentRouteQuery === trimmed.toLowerCase()) {
            executeIntelligentSearch(trimmed);
            return;
        }
        navigate(`/dashboard?q=${encodeURIComponent(trimmed)}`, { replace: true });
    };

    useEffect(() => {
        const routeQuery = (new URLSearchParams(location.search).get('q') ?? '').trim();
        const normalizedRouteQuery = routeQuery.toLowerCase();
        
        if (lastHandledRouteQuery.current === normalizedRouteQuery) return;
        lastHandledRouteQuery.current = normalizedRouteQuery;

        if (!routeQuery) {
            restoreDashboardFromSession();
            return;
        }

        const savedQuery = sessionStorage.getItem('dashboard_query') || '';
        if (savedQuery.trim().toLowerCase() === normalizedRouteQuery) {
            if (restoreDashboardFromSession(routeQuery)) {
                lastHandledPayload.current = `cache:${routeQuery}`;
                return;
            }
        }

        setQuery(routeQuery);
        executeIntelligentSearch(routeQuery);
    }, [location.search, executeIntelligentSearch, restoreDashboardFromSession]);

    useEffect(() => {
        const parsedState = dashboardLocationStateSchema.safeParse(location.state);
        const state = parsedState.success ? (parsedState.data as DashboardLocationState) : null;
        const agentPayload = state?.agentPayload;
        const historyQuery = state?.query;
        const routeQuery = (new URLSearchParams(location.search).get('q') ?? '').trim();

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
        else if (historyQuery) {
            const historySignature = `history:${historyQuery}`;
            if (lastHandledPayload.current === historySignature) return;
            lastHandledPayload.current = historySignature;

            setQuery(historyQuery);
            executeIntelligentSearch(historyQuery);
            navigate(location.pathname, { replace: true, state: {} });
        }
        else if (!lastHandledPayload.current && !routeQuery) {
            if (restoreDashboardFromSession()) {
                const savedQuery = sessionStorage.getItem('dashboard_query');
                if (savedQuery) {
                    lastHandledPayload.current = `cache:${savedQuery}`;
                }
            }
        }
    }, [location.state, location.search, navigate, location.pathname, executeIntelligentSearch, playSummaryAudio, speakNoArticlesMessage, restoreDashboardFromSession]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            stopAudio();
        };
    }, [stopAudio]);

    const filteredFeedArticles = useMemo(() => {
        if (!feedArticles.length || activeFeedFilters.length === 0) return feedArticles;
        return feedArticles.filter(article => article.topic && activeFeedFilters.includes(article.topic));
    }, [feedArticles, activeFeedFilters]);

    const handleSaveTopics = async (newTopics: string[]) => {
        try {
            await updateTopics(newTopics);
            setIsEditingTopics(false);
            setActiveFeedFilters(newTopics);
        } catch (err) {
            showToast('Failed to save topics', 'error');
        }
    };

    const handleToggleFilter = (topic: string) => {
        setActiveFeedFilters((prev) =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    return (
        <SectionContainer className="space-y-6">
            <PageHeader
                title="Dashboard"
                subtitle={isSearchActive ? "Search the latest briefings and listen to the summarized results." : "Your personalized daily news feed."}
                action={isSearchActive && (
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={clearSearch}
                        className="flex items-center gap-2 text-primary hover:text-primary hover:bg-primary/10 px-3 py-2"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        <span className="font-medium">Back to Feed</span>
                    </Button>
                )}
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

            {/* ERROR MESSAGES */}
            {error && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[15px] text-danger flex justify-between items-center">
                    <span>{error}</span>
                    {isSearchActive && (
                        <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
                            Clear Search
                        </Button>
                    )}
                </div>
            )}
            {saveError && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-[15px] text-warning">
                    {saveError}
                </div>
            )}

            {/* SSE PIPELINE PROGRESS */}
            {sse.isStreaming && (
                <PipelineProgress 
                    stage={sse.stage} 
                    intentTopic={sse.intent?.topic || null} 
                    optimizedQuery={sse.optimizedQuery}
                    articleCount={sse.articles.length} 
                    category={sse.category} 
                />
            )}

            {/* SUMMARY CARD (Only in search mode) */}
            {isSearchActive && !loading && summary && showSummary && (
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

            {/* MAIN CONTENT AREA */}
            {isSearchActive ? (
                // SEARCH MODE
                loading ? (
                    <Loader />
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-text">Search Results</h3>
                            <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
                                Back to Feed
                            </Button>
                        </div>
                        <FeedArticleGrid
                            articles={articles}
                            savedArticleIdsByUrl={savedArticleIdsByUrl}
                            onToggleSave={handleToggleSave}
                            pendingSaveByUrl={pendingSaveByUrl}
                            currentArticleIndex={currentArticleIndex}
                        />
                    </div>
                )
            ) : (
                // FEED MODE
                isTopicsLoading ? (
                    <Loader />
                ) : !hasTopics ? (
                    // ONBOARDING MODE
                    <Card className="p-8" variant="elevated">
                        <TopicSelector
                            availableTopics={AI_HISTORY_CATEGORIES}
                            selectedTopics={[]}
                            onSave={handleSaveTopics}
                            isSaving={isTopicsUpdating}
                            variant="onboarding"
                        />
                    </Card>
                ) : isEditingTopics ? (
                    // EDIT TOPICS MODE
                    <Card className="p-6" variant="elevated">
                        <h3 className="text-xl font-semibold mb-6">Edit your topics</h3>
                        <TopicSelector
                            availableTopics={AI_HISTORY_CATEGORIES}
                            selectedTopics={topics}
                            onSave={handleSaveTopics}
                            isSaving={isTopicsUpdating}
                            variant="compact"
                            onCancel={() => setIsEditingTopics(false)}
                        />
                    </Card>
                ) : (
                    // PERSONALIZED FEED
                    <div className="space-y-6">
                        <TopicFilterBar
                            topics={topics}
                            activeTopics={activeFeedFilters}
                            onToggleTopic={handleToggleFilter}
                            onEditTopics={() => setIsEditingTopics(true)}
                        />

                        {isFeedLoading ? (
                            <Loader />
                        ) : filteredFeedArticles.length > 0 ? (
                            <FeedArticleGrid
                                articles={filteredFeedArticles}
                                savedArticleIdsByUrl={savedArticleIdsByUrl}
                                onToggleSave={handleToggleSave}
                                pendingSaveByUrl={pendingSaveByUrl}
                            />
                        ) : (
                            <div className="text-center py-12 text-muted">
                                <p>No articles found for your selected topics right now.</p>
                                <p className="text-sm mt-2">Check back later or try different topics.</p>
                            </div>
                        )}
                    </div>
                )
            )}

            <SaveToCollectionModal
                isOpen={!!articleToSave}
                onClose={() => setArticleToSave(null)}
                onSelectCollection={(collectionId) => {
                    if (articleToSave) {
                        setPendingSaveByUrl((prev) => ({ ...prev, [articleToSave.url]: true }));
                        saveArticleMutation.mutate({ article: articleToSave, collectionId }, {
                            onSettled: () => {
                                setPendingSaveByUrl((prev) => {
                                    const next = { ...prev };
                                    delete next[articleToSave.url];
                                    return next;
                                });
                            }
                        });
                    }
                    setArticleToSave(null);
                }}
            />
        </SectionContainer>
    );
};

export default Dashboard;
