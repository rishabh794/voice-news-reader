import type { Article } from '../types/news';
import NewsCard from './NewsCard';

interface FeedArticleGridProps {
    articles: Article[];
    savedArticleIdsByUrl: Record<string, string>;
    onToggleSave: (article: Article) => void;
    pendingSaveByUrl: Record<string, boolean>;
}

const FeedArticleGrid = ({
    articles,
    savedArticleIdsByUrl,
    onToggleSave,
    pendingSaveByUrl
}: FeedArticleGridProps) => {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {articles.map((article, index) => (
                <NewsCard
                    key={article.url || index}
                    article={article}
                    isSaved={Boolean(savedArticleIdsByUrl[article.url])}
                    onToggleSave={onToggleSave}
                    saveDisabled={Boolean(article.url && pendingSaveByUrl[article.url])}
                />
            ))}
        </div>
    );
};

export default FeedArticleGrid;
