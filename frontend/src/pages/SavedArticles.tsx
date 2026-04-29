import { useEffect, useRef, useState } from 'react';
import API from '../services/api';
import Loader from '../components/Loader';
import NewsCard from '../components/NewsCard';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import SectionContainer from '../components/ui/SectionContainer';
import type { Article, SavedArticle } from '../types/news';
import { getErrorMessage, newsSchemas, validateWithSchema } from '../validation';

const SavedArticles = () => {
    const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pendingByUrl, setPendingByUrl] = useState<Record<string, boolean>>({});
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        const fetchSavedArticles = async () => {
            try {
                const response = await API.get('/saved-articles');
                const parsedSavedArticles = validateWithSchema(
                    newsSchemas.savedArticleListSchema,
                    response.data,
                    'Received an invalid saved article list from server.'
                );
                if (!isMountedRef.current) return;
                setSavedArticles(parsedSavedArticles);
            } catch (err: unknown) {
                if (!isMountedRef.current) return;
                setError(getErrorMessage(err, 'Failed to load saved articles.'));
                console.error(err);
            } finally {
                if (isMountedRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchSavedArticles();
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const handleToggleSave = async (article: Article) => {
        const currentUrl = article.url;
        if (!currentUrl || pendingByUrl[currentUrl]) return;

        const saved = savedArticles.find((item) => item.url === currentUrl);
        if (!saved?._id) return;

        setPendingByUrl((prev) => ({ ...prev, [currentUrl]: true }));
        setError('');

        try {
            await API.delete(`/saved-articles/${saved._id}`);
            setSavedArticles((prev) => prev.filter((item) => item._id !== saved._id));
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to remove article from saved list.'));
            console.error(err);
        } finally {
            if (isMountedRef.current) {
                setPendingByUrl((prev) => {
                    const next = { ...prev };
                    delete next[currentUrl];
                    return next;
                });
            }
        }
    };

    return (
        <SectionContainer className="space-y-6">
            <PageHeader
                title="Saved Articles"
                subtitle="Your personal reading list, synchronized across sessions."
            />

            {error && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[15px] text-danger">
                    {error}
                </div>
            )}

            {loading ? (
                <Loader />
            ) : savedArticles.length === 0 ? (
                <EmptyState
                    title="No saved articles"
                    description="Save a headline from the dashboard to build your list."
                    muted
                />
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                    {savedArticles.map((saved) => (
                        <NewsCard
                            key={saved._id}
                            article={{
                                _id: saved._id,
                                title: saved.title,
                                description: saved.description,
                                url: saved.url,
                                image: saved.image,
                                publishedAt: saved.publishedAt,
                                sourceName: saved.sourceName
                            }}
                            isSaved
                            onToggleSave={handleToggleSave}
                            saveDisabled={Boolean(saved.url && pendingByUrl[saved.url])}
                        />
                    ))}
                </div>
            )}
        </SectionContainer>
    );
};

export default SavedArticles;
