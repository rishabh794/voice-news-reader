import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../hooks/useToast';
import { AI_HISTORY_CATEGORIES, type HistoryCategory, type HistoryEntry } from '../types/news';

const REFRESH_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const CATEGORY_FILTERS: Array<'All' | HistoryCategory> = ['All', ...AI_HISTORY_CATEGORIES, 'Uncategorized'];
const VALID_HISTORY_CATEGORIES = new Set<HistoryCategory>([...AI_HISTORY_CATEGORIES, 'Uncategorized']);

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
    const [refreshingId, setRefreshingId] = useState<string | null>(null);
    const [activeAudioEntryId, setActiveAudioEntryId] = useState<string | null>(null);
    const [isAudioPaused, setIsAudioPaused] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<'All' | HistoryCategory>('All');
    const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
    const navigate = useNavigate();
    const { showToast } = useToast();

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
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => {
            setActiveAudioEntryId((currentId) => (currentId === entryId ? null : currentId));
            setIsAudioPaused(false);
        };

        utterance.onerror = () => {
            setActiveAudioEntryId((currentId) => (currentId === entryId ? null : currentId));
            setIsAudioPaused(false);
        };

        setActiveAudioEntryId(entryId);
        setIsAudioPaused(false);
        window.speechSynthesis.speak(utterance);
    }, []);

    const togglePauseAudio = useCallback((entryId: string) => {
        if (activeAudioEntryId !== entryId) return;

        if (isAudioPaused) {
            window.speechSynthesis.resume();
            setIsAudioPaused(false);
            return;
        }

        window.speechSynthesis.pause();
        setIsAudioPaused(true);
    }, [activeAudioEntryId, isAudioPaused]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await API.get('/history');
                const entries = response.data as HistoryEntry[];
                setHistory(sortHistoryEntries(entries));
            } catch (err) {
                setError('Failed to load history.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

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

    const handleRefresh = async (entry: HistoryEntry) => {
        if (refreshingId === entry._id) return;
        if (isRefreshLocked(entry)) return;

        setError('');
        setRefreshingId(entry._id);

        try {
            const response = await API.post('/intent', { query: entry.query });
            const payload = response.data;

            if (payload.action === 'search' && payload.topic) {
                navigate('/dashboard', { state: { agentPayload: payload } });
                return;
            }

            setError('Could not fetch latest news for that topic.');
        } catch (err) {
            setError('Failed to refresh briefing.');
            console.error(err);
        } finally {
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

        if (activeAudioEntryId === entryId) {
            window.speechSynthesis.cancel();
            setActiveAudioEntryId(null);
            setIsAudioPaused(false);
        }

        setDeletingIds((prev) => ({
            ...prev,
            [entryId]: true
        }));

        try {
            await API.delete(`/history/${entryId}`);
            showToast('History entry deleted.', 'success');
        } catch (err) {
            setHistory((prev) => {
                if (prev.some((entry) => entry._id === removedEntry._id)) return prev;
                return sortHistoryEntries([...prev, removedEntry]);
            });
            setError('Failed to delete history entry. Please retry.');
            console.error(err);
        } finally {
            setDeletingIds((prev) => {
                const next = { ...prev };
                delete next[entryId];
                return next;
            });
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
        <div className="w-full max-w-5xl mx-auto mt-8 p-6 pt-10 bg-[#0d0d12] border border-gray-800/80 rounded-xl font-sans text-gray-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800/60">
                <div className="w-1.5 h-6 bg-cyan-600 rounded-sm"></div>
                <h2 className="text-xl font-medium text-gray-100 font-mono uppercase tracking-wide">
                    Briefing_Archive
                </h2>
            </div>

            {!loading && history.length > 0 && (
                <div className="mb-6 space-y-3">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search topics, summaries, or sources..."
                        className="w-full px-4 py-3 bg-[#11111a] border border-gray-700/80 rounded-lg text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/60"
                    />

                    <div className="flex flex-wrap gap-2">
                        {CATEGORY_FILTERS.map((category) => {
                            const isActive = activeCategory === category;
                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setActiveCategory(category)}
                                    className={`px-3 py-1.5 rounded-full border text-[11px] font-mono uppercase tracking-wider transition-all duration-200 ${
                                        isActive
                                            ? 'bg-cyan-600/20 border-cyan-400/70 text-cyan-200'
                                            : 'bg-[#13131a] border-gray-700/80 text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                    }`}
                                >
                                    {category}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex items-center gap-3 p-4 bg-[#13131a] border border-gray-800/50 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse"></span>
                    <p className="text-gray-400 font-mono text-sm">Retrieving historical briefings...</p>
                </div>
            )}

            {error && (
                <div className="p-4 mb-4 bg-red-950/20 border border-red-900/50 rounded-lg text-red-400 text-sm font-mono flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <p>{error}</p>
                </div>
            )}

            {!loading && history.length === 0 && !error && (
                <div className="p-8 text-center bg-[#13131a] border border-gray-800/50 rounded-lg">
                    <p className="text-gray-500 font-mono text-sm">No saved briefings yet. Run a search to build your archive.</p>
                </div>
            )}

            {!loading && history.length > 0 && filteredHistory.length === 0 && (
                <div className="p-8 text-center bg-[#13131a] border border-gray-800/50 rounded-lg">
                    <p className="text-gray-400 font-mono text-sm">No briefings match your current search or category filter.</p>
                </div>
            )}

            {!loading && filteredHistory.length > 0 && (
                <div className="space-y-4">
                    {filteredHistory.map((entry) => {
                        const sourceCount = Array.isArray(entry.articles) ? entry.articles.length : 0;
                        const isExpanded = Boolean(expandedSourcesById[entry._id]);
                        const canSpeak = typeof entry.summary === 'string' && entry.summary.trim().length > 0;
                        const isEntryRefreshing = refreshingId === entry._id;
                        const refreshLocked = isRefreshLocked(entry);
                        const isEntrySpeaking = activeAudioEntryId === entry._id;
                        const isDeleting = Boolean(deletingIds[entry._id]);
                        const entryCategory = normalizeHistoryCategory(entry.category);

                        return (
                            <article key={entry._id} className="border border-gray-800/80 rounded-xl bg-[#101019] overflow-hidden">
                                <div className="p-4 border-b border-gray-800/60">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm md:text-base font-mono text-cyan-300 tracking-wide">
                                                {entry.query}
                                            </h3>
                                            <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-cyan-500/40 text-cyan-200 bg-cyan-500/10 rounded-full">
                                                {entryCategory}
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono text-gray-500">
                                            {formatTimestamp(entry)}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                                        {entry.summary || 'No saved summary for this briefing.'}
                                    </p>
                                </div>

                                <div className="px-4 py-3 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => playAudio(entry._id, canSpeak ? entry.summary : `No saved summary for ${entry.query}`)}
                                        className="px-3 py-2 bg-[#13131a] border border-indigo-500/30 rounded-lg text-indigo-300 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-indigo-400/50 transition-all duration-200"
                                    >
                                        Play Audio
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => togglePauseAudio(entry._id)}
                                        disabled={!isEntrySpeaking}
                                        className="px-3 py-2 bg-[#13131a] border border-amber-500/30 rounded-lg text-amber-300 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-amber-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isEntrySpeaking ? (isAudioPaused ? 'Resume Audio' : 'Pause Audio') : 'Pause Audio'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => toggleSources(entry._id)}
                                        className="px-3 py-2 bg-[#13131a] border border-cyan-500/30 rounded-lg text-cyan-300 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-cyan-400/50 transition-all duration-200"
                                    >
                                        {isExpanded ? 'Hide Sources' : `View Sources (${sourceCount})`}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleRefresh(entry)}
                                        disabled={isEntryRefreshing || refreshLocked || isDeleting}
                                        className="px-3 py-2 bg-[#13131a] border border-emerald-500/30 rounded-lg text-emerald-300 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-emerald-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isEntryRefreshing ? 'Refreshing...' : refreshLocked ? getCooldownLabel(entry) : 'Get Latest News'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(entry._id)}
                                        disabled={isDeleting}
                                        className="inline-flex items-center gap-1 px-3 py-2 bg-[#13131a] border border-red-500/30 rounded-lg text-red-300 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-red-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                            className="w-3.5 h-3.5"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                        </svg>
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-4">
                                        {sourceCount === 0 ? (
                                            <div className="text-xs font-mono text-gray-500 border border-gray-800/70 rounded-lg bg-[#0d0d12] p-3">
                                                No sources saved for this briefing.
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mb-2 text-[10px] font-mono uppercase tracking-wider text-gray-500">
                                                    Showing 3 at a time. Scroll for more sources.
                                                </div>
                                                <div className="max-h-[280px] overflow-y-auto pr-1">
                                                    <ul className="space-y-2">
                                                        {entry.articles.map((article, index) => (
                                                            <li key={article.url || `${entry._id}-${index}`} className="min-h-[84px] border border-gray-800/70 rounded-lg bg-[#0d0d12] p-3">
                                                                <a
                                                                    href={article.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-cyan-300 hover:text-cyan-200 transition-colors"
                                                                >
                                                                    {article.title || 'Untitled Source'}
                                                                </a>
                                                                <p className="mt-1 text-[11px] font-mono text-gray-500 uppercase tracking-wider">
                                                                    {article.source?.name || article.sourceName || 'Unknown Source'}
                                                                </p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default History;
