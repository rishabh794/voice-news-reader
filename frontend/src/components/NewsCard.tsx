import type { Article } from '../types/news';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Card from './ui/Card';

interface NewsCardProps {
    article: Article;
    isSaved?: boolean;
    onToggleSave?: (article: Article) => void;
    saveDisabled?: boolean;
}

const NewsCard = ({ article, isSaved = false, onToggleSave, saveDisabled = false }: NewsCardProps) => {
    return (
        <Card className="group relative flex h-full flex-col overflow-hidden transition-colors duration-150 hover:border-border-strong">
            {onToggleSave && (
                <Button
                    type="button"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onToggleSave(article);
                    }}
                    disabled={saveDisabled}
                    variant="outline"
                    size="sm"
                    className={[
                        'absolute right-4 top-4 z-10 rounded-full px-3 text-[11px] font-mono uppercase tracking-wider',
                        isSaved
                            ? 'border-primary/50 text-primary bg-primary/12 hover:border-primary/70 hover:bg-primary/20'
                            : 'bg-base/70 text-muted hover:text-text hover:border-border-strong'
                    ].join(' ')}
                >
                    {saveDisabled ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
                </Button>
            )}

            {article.image && (
                <div className="relative">
                    <img
                        src={article.image}
                        alt="News thumbnail"
                        className="h-[170px] w-full object-cover opacity-80 transition-opacity duration-150 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-transparent"></div>
                </div>
            )}

            <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="space-y-2">
                    <h3 className="text-lg font-display text-text leading-snug">
                        {article.title}
                    </h3>
                    <p className="text-[15px] text-muted leading-relaxed line-clamp-3">
                        {article.description}
                    </p>
                </div>

                {(article.source?.name || article.sourceName) && (
                    <Badge variant="neutral" className="w-fit normal-case">
                        {article.source?.name || article.sourceName}
                    </Badge>
                )}

                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center text-xs font-mono uppercase tracking-wider text-primary transition-colors duration-150 hover:text-text"
                >
                    Read article
                </a>
            </div>
        </Card>
    );
};

export default NewsCard;