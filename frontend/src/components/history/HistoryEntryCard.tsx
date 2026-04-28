import type { HistoryCategory, HistoryEntry } from '../../types/news';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface HistoryEntryCardProps {
    entry: HistoryEntry;
    entryCategory: HistoryCategory;
    formattedTimestamp: string;
    isExpanded: boolean;
    isSummaryExpanded: boolean;
    isEntrySpeaking: boolean;
    isAudioPaused: boolean;
    isAudioLoading: boolean;
    isEntryRefreshing: boolean;
    refreshLocked: boolean;
    cooldownLabel: string;
    isDeleting: boolean;
    onPlayAudio: (entryId: string, text: string) => void;
    onTogglePauseAudio: (entryId: string) => void;
    onToggleSources: (entryId: string) => void;
    onToggleSummary: (entryId: string) => void;
    onRefresh: (entry: HistoryEntry) => void;
    onDelete: (entryId: string) => void;
}

const HistoryEntryCard = ({
    entry,
    entryCategory,
    formattedTimestamp,
    isExpanded,
    isSummaryExpanded,
    isEntrySpeaking,
    isAudioPaused,
    isAudioLoading,
    isEntryRefreshing,
    refreshLocked,
    cooldownLabel,
    isDeleting,
    onPlayAudio,
    onTogglePauseAudio,
    onToggleSources,
    onToggleSummary,
    onRefresh,
    onDelete
}: HistoryEntryCardProps) => {
    const sourceCount = Array.isArray(entry.articles) ? entry.articles.length : 0;
    const canSpeak = typeof entry.summary === 'string' && entry.summary.trim().length > 0;

    return (
        <Card className="overflow-hidden">
            <div className="border-b border-border/70 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-display text-text">
                                {entry.query}
                            </h3>
                            <Badge variant="primary">{entryCategory}</Badge>
                        </div>
                        {isSummaryExpanded && (
                            <p className="text-[15px] text-muted leading-relaxed max-w-prose">
                                {entry.summary || 'No saved summary for this briefing.'}
                            </p>
                        )}
                    </div>
                    <span className="text-xs font-mono text-subtle">
                        {formattedTimestamp}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 px-5 py-4">
                <Button
                    type="button"
                    onClick={() => onPlayAudio(entry._id, canSpeak ? entry.summary : `No saved summary for ${entry.query}`)}
                    variant="outline"
                    size="sm"
                    disabled={isAudioLoading}
                >
                    {isAudioLoading ? 'Loading...' : 'Play Audio'}
                </Button>

                <Button
                    type="button"
                    onClick={() => onTogglePauseAudio(entry._id)}
                    disabled={!isEntrySpeaking || isAudioLoading}
                    variant="ghost"
                    size="sm"
                >
                    {isEntrySpeaking ? (isAudioPaused ? 'Resume Audio' : 'Pause Audio') : 'Pause Audio'}
                </Button>

                <Button
                    type="button"
                    onClick={() => onToggleSummary(entry._id)}
                    variant="outline"
                    size="sm"
                >
                    {isSummaryExpanded ? 'Hide Summary' : 'View Summary'}
                </Button>

                <Button
                    type="button"
                    onClick={() => onToggleSources(entry._id)}
                    variant="outline"
                    size="sm"
                >
                    {isExpanded ? 'Hide Sources' : `View Sources (${sourceCount})`}
                </Button>

                <Button
                    type="button"
                    onClick={() => onRefresh(entry)}
                    disabled={isEntryRefreshing || refreshLocked || isDeleting}
                    variant="secondary"
                    size="sm"
                >
                    {isEntryRefreshing ? 'Refreshing...' : refreshLocked ? cooldownLabel : 'Get Latest News'}
                </Button>

                <Button
                    type="button"
                    onClick={() => onDelete(entry._id)}
                    disabled={isDeleting}
                    variant="danger"
                    size="sm"
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
            </div>

            {isExpanded && (
                <div className="px-5 pb-5">
                    {sourceCount === 0 ? (
                        <Card className="p-3 text-xs text-subtle font-mono" variant="surface">
                            No sources saved for this briefing.
                        </Card>
                    ) : (
                        <>
                            <div className="mb-3 text-[11px] font-mono uppercase tracking-wider text-subtle">
                                Showing 3 at a time. Scroll for more sources.
                            </div>
                            <div className="max-h-72 overflow-y-auto pr-1">
                                <ul className="space-y-2">
                                    {entry.articles.map((article, index) => (
                                        <li
                                            key={article.url || `${entry._id}-${index}`}
                                            className="rounded-lg border border-border/70 bg-surface p-3"
                                        >
                                            <a
                                                href={article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-text hover:text-primary transition-colors duration-150"
                                            >
                                                {article.title || 'Untitled Source'}
                                            </a>
                                            <p className="mt-1 text-[11px] font-mono uppercase tracking-wider text-subtle">
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
        </Card>
    );
};

export default HistoryEntryCard;