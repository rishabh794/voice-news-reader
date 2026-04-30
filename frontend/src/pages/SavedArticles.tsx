import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSavedArticle, fetchSavedArticles } from '../services/api';
import Loader from '../components/Loader';
import NewsCard from '../components/NewsCard';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import SectionContainer from '../components/ui/SectionContainer';
import type { Article, SavedArticle } from '../types/news';
import { getErrorMessage } from '../validation';

const SavedArticles = () => {
    const [error, setError] = useState('');
    const [pendingByUrl, setPendingByUrl] = useState<Record<string, boolean>>({});
    const queryClient = useQueryClient();
    const savedArticlesQuery = useQuery<SavedArticle[]>({
        queryKey: ['saved-articles'],
        queryFn: fetchSavedArticles
    });
    const savedArticles = savedArticlesQuery.data ?? [];
    const queryErrorMessage = savedArticlesQuery.error
        ? getErrorMessage(savedArticlesQuery.error, 'Failed to load saved articles.')
        : '';
    const errorMessage = error || queryErrorMessage;
    const isLoading = savedArticlesQuery.isLoading;

    const deleteSavedArticleMutation = useMutation({
        mutationFn: deleteSavedArticle
    });

    const handleToggleSave = async (article: Article) => {
        const currentUrl = article.url;
        if (!currentUrl || pendingByUrl[currentUrl]) return;

        const saved = savedArticles.find((item) => item.url === currentUrl);
        if (!saved?._id) return;

        setPendingByUrl((prev) => ({ ...prev, [currentUrl]: true }));
        setError('');

        const previousSaved = savedArticles;
        queryClient.setQueryData<SavedArticle[]>(['saved-articles'], (prev = []) =>
            prev.filter((item) => item._id !== saved._id)
        );

        try {
            await deleteSavedArticleMutation.mutateAsync(saved._id);
        } catch (err: unknown) {
            queryClient.setQueryData<SavedArticle[]>(['saved-articles'], previousSaved);
            setError(getErrorMessage(err, 'Failed to remove article from saved list.'));
            console.error(err);
        } finally {
            setPendingByUrl((prev) => {
                const next = { ...prev };
                delete next[currentUrl];
                return next;
            });
        }
    };

    return (
        <SectionContainer className="space-y-6">
            <PageHeader
                title="Saved Articles"
                subtitle="Your personal reading list, synchronized across sessions."
            />

            {errorMessage && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[15px] text-danger">
                    {errorMessage}
                </div>
            )}

            {isLoading ? (
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
