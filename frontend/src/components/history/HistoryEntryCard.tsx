import type { HistoryCategory, HistoryEntry } from '../../types/news';

interface HistoryEntryCardProps {
    entry: HistoryEntry;
    entryCategory: HistoryCategory;
    formattedTimestamp: string;
    isExpanded: boolean;
    isEntrySpeaking: boolean;
    isAudioPaused: boolean;
    isEntryRefreshing: boolean;
    refreshLocked: boolean;
    cooldownLabel: string;
    isDeleting: boolean;
    onPlayAudio: (entryId: string, text: string) => void;
    onTogglePauseAudio: (entryId: string) => void;
    onToggleSources: (entryId: string) => void;
    onRefresh: (entry: HistoryEntry) => void;
    onDelete: (entryId: string) => void;
}

const HistoryEntryCard = ({
    entry,
    entryCategory,
    formattedTimestamp,
    isExpanded,
    isEntrySpeaking,
    isAudioPaused,
    isEntryRefreshing,
    refreshLocked,
    cooldownLabel,
    isDeleting,
    onPlayAudio,
    onTogglePauseAudio,
    onToggleSources,
    onRefresh,
    onDelete
}: HistoryEntryCardProps) => {
    const sourceCount = Array.isArray(entry.articles) ? entry.articles.length : 0;
    const canSpeak = typeof entry.summary === 'string' && entry.summary.trim().length > 0;

    return (
        <article className="border border-gray-800/80 rounded-xl bg-[#101019] overflow-hidden">
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
                        {formattedTimestamp}
                    </span>
                </div>

                <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                    {entry.summary || 'No saved summary for this briefing.'}
                </p>
            </div>

            <div className="px-4 py-3 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onPlayAudio(entry._id, canSpeak ? entry.summary : `No saved summary for ${entry.query}`)}
                    className="px-3 py-2 bg-[#13131a] border border-indigo-500/30 rounded-lg text-indigo-300 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-indigo-400/50 transition-all duration-200"
                >
                    Play Audio
                </button>

                <button
                    type="button"
                    onClick={() => onTogglePauseAudio(entry._id)}
                    disabled={!isEntrySpeaking}
                    className="px-3 py-2 bg-[#13131a] border border-amber-500/30 rounded-lg text-amber-300 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-amber-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEntrySpeaking ? (isAudioPaused ? 'Resume Audio' : 'Pause Audio') : 'Pause Audio'}
                </button>

                <button
                    type="button"
                    onClick={() => onToggleSources(entry._id)}
                    className="px-3 py-2 bg-[#13131a] border border-cyan-500/30 rounded-lg text-cyan-300 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-cyan-400/50 transition-all duration-200"
                >
                    {isExpanded ? 'Hide Sources' : `View Sources (${sourceCount})`}
                </button>

                <button
                    type="button"
                    onClick={() => onRefresh(entry)}
                    disabled={isEntryRefreshing || refreshLocked || isDeleting}
                    className="px-3 py-2 bg-[#13131a] border border-emerald-500/30 rounded-lg text-emerald-300 font-mono text-[11px] uppercase tracking-wider hover:text-white hover:border-emerald-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEntryRefreshing ? 'Refreshing...' : refreshLocked ? cooldownLabel : 'Get Latest News'}
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(entry._id)}
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
                            <div className="max-h-70 overflow-y-auto pr-1">
                                <ul className="space-y-2">
                                    {entry.articles.map((article, index) => (
                                        <li key={article.url || `${entry._id}-${index}`} className="min-h-21 border border-gray-800/70 rounded-lg bg-[#0d0d12] p-3">
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
};

export default HistoryEntryCard;