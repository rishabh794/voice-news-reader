import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import useAudioPlayer from '../hooks/useAudioPlayer';
import { useToast } from '../hooks/useToast';
import { getErrorMessage, intentSchemas, newsSchemas, validateWithSchema } from '../validation';
import {
    HistoryEntryCard,
    HistoryEmptyState,
    HistoryErrorAlert,
    HistoryFilters,
    HistoryHeader,
    HistoryLoadingState
} from '../components/history';
import SectionContainer from '../components/ui/SectionContainer';
import { AI_HISTORY_CATEGORIES, type HistoryCategory, type HistoryEntry } from '../types/news';

const REFRESH_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const CATEGORY_FILTERS: Array<'All' | HistoryCategory> = ['All', ...AI_HISTORY_CATEGORIES, 'Uncategorized'];
const VALID_HISTORY_CATEGORIES = new Set<HistoryCategory>([...AI_HISTORY_CATEGORIES, 'Uncategorized']);
const NO_ARTICLES_MESSAGE = 'No articles found related to this topic';

const getEntryTimeValue = (entry: HistoryEntry): number => {
    const dateValue = entry.createdAt || entry.timestamp;
    if (!dateValue) return 0;

    const parsed = new Date(dateValue).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
};

const sortHistoryEntries = (entries: HistoryEntry[]): HistoryEntry[] => {
    return [...entries].sort((a, b) => getEntryTimeValue(b) - getEntryTimeValue(a));
};

const normalizeHistoryCategory = (category: HistoryEntry['category']): HistoryCategory => {
    if (!category) return 'Uncategorized';
    return VALID_HISTORY_CATEGORIES.has(category) ? category : 'Uncategorized';
};

const History = () => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedSourcesById, setExpandedSourcesById] = useState<Record<string, boolean>>({});
    const [expandedSummaryById, setExpandedSummaryById] = useState<Record<string, boolean>>({});
    const [refreshingId, setRefreshingId] = useState<string | null>(null);
    const [activeAudioEntryId, setActiveAudioEntryId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<'All' | HistoryCategory>('All');
    const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
    const [isClearingAll, setIsClearingAll] = useState(false);
    const isMountedRef = useRef(true);
    const navigate = useNavigate();
    const { showToast } = useToast();
    const historyAudio = useAudioPlayer();
    const {
        play: playHistoryAudio,
        togglePause: toggleHistoryAudioPause,
        stop: stopHistoryAudio,
        isLoading: isHistoryAudioLoading,
        isPlaying: isHistoryAudioPlaying,
        isPaused: isHistoryAudioPaused,
        isEnded: isHistoryAudioEnded,
        isError: isHistoryAudioError
    } = historyAudio;

    const getEntryDate = useCallback((entry: HistoryEntry): Date | null => {
        const dateValue = entry.createdAt || entry.timestamp;
        if (!dateValue) return null;

        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) return null;

        return parsed;
    }, []);

    const isRefreshLocked = useCallback((entry: HistoryEntry): boolean => {
        const entryDate = getEntryDate(entry);
        if (!entryDate) return false;

        return (Date.now() - entryDate.getTime()) < REFRESH_COOLDOWN_MS;
    }, [getEntryDate]);

    const getCooldownLabel = useCallback((entry: HistoryEntry): string => {
        const entryDate = getEntryDate(entry);
        if (!entryDate) return 'Get Latest News';

        const unlockAt = entryDate.getTime() + REFRESH_COOLDOWN_MS;
        const remainingMs = unlockAt - Date.now();
        if (remainingMs <= 0) return 'Get Latest News';

        const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours <= 0) return `Refresh in ${minutes}m`;
        return `Refresh in ${hours}h ${minutes}m`;
    }, [getEntryDate]);

    const playAudio = useCallback((entryId: string, text: string) => {
        const isCurrentEntry = activeAudioEntryId === entryId;
        if (isCurrentEntry && isHistoryAudioPlaying) return;
        setActiveAudioEntryId(entryId);
        playHistoryAudio(text);
    }, [activeAudioEntryId, isHistoryAudioPlaying, playHistoryAudio]);

    const togglePauseAudio = useCallback((entryId: string) => {
        if (activeAudioEntryId !== entryId) return;
        toggleHistoryAudioPause();
    }, [activeAudioEntryId, toggleHistoryAudioPause]);

    useEffect(() => {
        isMountedRef.current = true;
        const fetchHistory = async () => {
            try {
                const response = await API.get('/history');
                const entries = validateWithSchema(
                    newsSchemas.historyEntryListSchema,
                    response.data,
                    'Received an invalid history payload from server.'
                );
                if (!isMountedRef.current) return;
                setHistory(sortHistoryEntries(entries));
            } catch (err: unknown) {
                if (!isMountedRef.current) return;
                setError(getErrorMessage(err, 'Failed to load history.'));
                console.error(err);
            } finally {
                if (!isMountedRef.current) return;
                setLoading(false);
            }
        };

        fetchHistory();
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (isHistoryAudioEnded || isHistoryAudioError) {
            setActiveAudioEntryId(null);
        }
    }, [isHistoryAudioEnded, isHistoryAudioError]);

    useEffect(() => {
        return () => {
            stopHistoryAudio();
        };
    }, [stopHistoryAudio]);

    const filteredHistory = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return history.filter((entry) => {
            const entryCategory = normalizeHistoryCategory(entry.category);
            if (activeCategory !== 'All' && entryCategory !== activeCategory) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            const articleText = Array.isArray(entry.articles)
                ? entry.articles.map((article) => (
                    `${article.title || ''} ${article.source?.name || article.sourceName || ''}`
                )).join(' ')
                : '';

            const searchableText = `${entry.query} ${entry.summary} ${entryCategory} ${articleText}`.toLowerCase();
            return searchableText.includes(normalizedSearch);
        });
    }, [activeCategory, history, searchTerm]);

    const toggleSources = (entryId: string) => {
        setExpandedSourcesById((prev) => ({
            ...prev,
            [entryId]: !prev[entryId]
        }));
    };

    const toggleSummary = (entryId: string) => {
        setExpandedSummaryById((prev) => ({
            ...prev,
            [entryId]: !prev[entryId]
        }));
    };

    const handleRefresh = async (entry: HistoryEntry) => {
        if (refreshingId === entry._id) return;
        if (isRefreshLocked(entry)) return;

        setError('');
        setRefreshingId(entry._id);

        try {
            const validatedRequest = validateWithSchema(
                intentSchemas.intentRequestSchema,
                { query: entry.query },
                'History query is empty.'
            );
            const response = await API.post('/intent', validatedRequest);
            const payload = validateWithSchema(
                intentSchemas.intentResponseSchema,
                response.data,
                'Received an invalid intent payload from server.'
            );

            if (payload.action === 'search') {
                const payloadArticles = payload.articles;
                if (payloadArticles.length === 0) {
                    const noArticlesMessage = typeof payload.message === 'string' && payload.message.trim()
                        ? payload.message.trim()
                        : NO_ARTICLES_MESSAGE;
                    setError(noArticlesMessage);
                    return;
                }
                navigate('/dashboard', { state: { agentPayload: payload } });
                return;
            }

            setError('Could not fetch latest news for that topic.');
        } catch (err: unknown) {
            if (!isMountedRef.current) return;
            setError(getErrorMessage(err, 'Failed to refresh briefing.'));
            console.error(err);
        } finally {
            if (!isMountedRef.current) return;
            setRefreshingId(null);
        }
    };

    const handleDelete = async (entryId: string) => {
        if (deletingIds[entryId]) return;

        const removedEntry = history.find((entry) => entry._id === entryId);
        if (!removedEntry) return;

        setError('');
        setHistory((prev) => prev.filter((entry) => entry._id !== entryId));
        setExpandedSourcesById((prev) => {
            if (!(entryId in prev)) return prev;
            const next = { ...prev };
            delete next[entryId];
            return next;
        });
        setExpandedSummaryById((prev) => {
            if (!(entryId in prev)) return prev;
            const next = { ...prev };
            delete next[entryId];
            return next;
        });

        if (activeAudioEntryId === entryId) {
            stopHistoryAudio();
            setActiveAudioEntryId(null);
        }

        setDeletingIds((prev) => ({
            ...prev,
            [entryId]: true
        }));

        try {
            await API.delete(`/history/${entryId}`);
            showToast('History entry deleted.', 'success');
        } catch (err) {
            if (!isMountedRef.current) return;
            setHistory((prev) => {
                if (prev.some((entry) => entry._id === removedEntry._id)) return prev;
                return sortHistoryEntries([...prev, removedEntry]);
            });
            setError('Failed to delete history entry. Please retry.');
            console.error(err);
        } finally {
            if (!isMountedRef.current) return;
            setDeletingIds((prev) => {
                const next = { ...prev };
                delete next[entryId];
                return next;
            });
        }
    };

    const handleClearAll = async () => {
        if (isClearingAll || history.length === 0) return;

        const previousHistory = [...history];

        setError('');
        setHistory([]);
        setExpandedSourcesById({});
        setExpandedSummaryById({});
        setDeletingIds({});

        if (activeAudioEntryId) {
            stopHistoryAudio();
            setActiveAudioEntryId(null);
        }

        setIsClearingAll(true);

        try {
            await API.delete('/history');
            showToast('All history entries cleared.', 'success');
        } catch (err: unknown) {
            if (!isMountedRef.current) return;
            setHistory(sortHistoryEntries(previousHistory));
            setError(getErrorMessage(err, 'Failed to clear history. Please retry.'));
            console.error(err);
        } finally {
            if (!isMountedRef.current) return;
            setIsClearingAll(false);
        }
    };

    const formatTimestamp = (entry: HistoryEntry) => {
        const parsed = getEntryDate(entry);
        if (!parsed) return 'Unknown time';

        return parsed.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <SectionContainer className="space-y-6">
            <HistoryHeader
                canClearAll={!loading && history.length > 0}
                isClearingAll={isClearingAll}
                onClearAll={handleClearAll}
            />

            {!loading && history.length > 0 && (
                <HistoryFilters
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    activeCategory={activeCategory}
                    categories={CATEGORY_FILTERS}
                    onCategoryChange={setActiveCategory}
                />
            )}

            {loading && (
                <HistoryLoadingState />
            )}

            {error && (
                <HistoryErrorAlert message={error} />
            )}

            {!loading && history.length === 0 && !error && (
                <HistoryEmptyState
                    muted
                    message="No saved briefings yet. Run a search to build your archive."
                />
            )}

            {!loading && history.length > 0 && filteredHistory.length === 0 && (
                <HistoryEmptyState message="No briefings match your current search or category filter." />
            )}

            {!loading && filteredHistory.length > 0 && (
                <div className="space-y-4">
                    {filteredHistory.map((entry) => {
                        const isExpanded = Boolean(expandedSourcesById[entry._id]);
                        const isSummaryExpanded = Boolean(expandedSummaryById[entry._id]);
                        const isEntryRefreshing = refreshingId === entry._id;
                        const refreshLocked = isRefreshLocked(entry);
                        const isEntrySpeaking = activeAudioEntryId === entry._id;
                        const isDeleting = Boolean(deletingIds[entry._id]);
                        const entryCategory = normalizeHistoryCategory(entry.category);

                        return (
                            <HistoryEntryCard
                                key={entry._id}
                                entry={entry}
                                entryCategory={entryCategory}
                                formattedTimestamp={formatTimestamp(entry)}
                                isExpanded={isExpanded}
                                isSummaryExpanded={isSummaryExpanded}
                                isEntrySpeaking={isEntrySpeaking}
                                isAudioPaused={isEntrySpeaking && isHistoryAudioPaused}
                                isAudioLoading={isHistoryAudioLoading && activeAudioEntryId === entry._id}
                                isEntryRefreshing={isEntryRefreshing}
                                refreshLocked={refreshLocked}
                                cooldownLabel={getCooldownLabel(entry)}
                                isDeleting={isDeleting}
                                onPlayAudio={playAudio}
                                onTogglePauseAudio={togglePauseAudio}
                                onToggleSources={toggleSources}
                                onToggleSummary={toggleSummary}
                                onRefresh={handleRefresh}
                                onDelete={handleDelete}
                            />
                        );
                    })}
                </div>
            )}
        </SectionContainer>
    );
};

export default History;
