import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import type { HistoryEntry } from '../types/news';

const REFRESH_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const History = () => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedSourcesById, setExpandedSourcesById] = useState<Record<string, boolean>>({});
    const [refreshingId, setRefreshingId] = useState<string | null>(null);
    const [activeAudioEntryId, setActiveAudioEntryId] = useState<string | null>(null);
    const [isAudioPaused, setIsAudioPaused] = useState(false);
    const navigate = useNavigate();

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
                setHistory(response.data as HistoryEntry[]);
            } catch (err) {
                setError('Failed to load history.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    useEffect(() => { //a cleanup handler that runs when the component unmounts (when navigating a page , the audio stops)
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

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

            {!loading && history.length > 0 && (
                <div className="space-y-4">
                    {history.map((entry) => {
                        const sourceCount = Array.isArray(entry.articles) ? entry.articles.length : 0;
                        const isExpanded = Boolean(expandedSourcesById[entry._id]);
                        const canSpeak = typeof entry.summary === 'string' && entry.summary.trim().length > 0;
                        const isEntryRefreshing = refreshingId === entry._id;
                        const refreshLocked = isRefreshLocked(entry);
                        const isEntrySpeaking = activeAudioEntryId === entry._id;

                        return (
                            <article key={entry._id} className="border border-gray-800/80 rounded-xl bg-[#101019] overflow-hidden">
                                <div className="p-4 border-b border-gray-800/60">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-sm md:text-base font-mono text-cyan-300 tracking-wide">
                                            {entry.query}
                                        </h3>
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
                                        disabled={isEntryRefreshing || refreshLocked}
                                        className="px-3 py-2 bg-[#13131a] border border-emerald-500/30 rounded-lg text-emerald-300 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-emerald-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isEntryRefreshing ? 'Refreshing...' : refreshLocked ? getCooldownLabel(entry) : 'Get Latest News'}
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
                                                                    {(article.source?.name || article.sourceName || 'Unknown Source')}
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
