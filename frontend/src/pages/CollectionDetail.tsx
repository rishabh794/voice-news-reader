import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCollections, fetchSavedArticles, deleteSavedArticle } from '../services/api';
import Loader from '../components/Loader';
import NewsCard from '../components/NewsCard';
import EmptyState from '../components/ui/EmptyState';

import SectionContainer from '../components/ui/SectionContainer';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import type { Article, Collection, SavedArticle } from '../types/news';
import { getErrorMessage } from '../validation';
import { useToast } from '../hooks/useToast';

const CollectionDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [pendingByUrl, setPendingByUrl] = useState<Record<string, boolean>>({});
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const collectionsQuery = useQuery<Collection[]>({
        queryKey: ['collections'],
        queryFn: fetchCollections
    });
    
    const savedArticlesQuery = useQuery<SavedArticle[]>({
        queryKey: ['saved-articles', id],
        queryFn: () => fetchSavedArticles(id)
    });

    const collection = collectionsQuery.data?.find(c => c._id === id);
    const savedArticles = savedArticlesQuery.data ?? [];
    
    const isLoading = collectionsQuery.isLoading || savedArticlesQuery.isLoading;
    const errorMessage = (collectionsQuery.error || savedArticlesQuery.error) 
        ? getErrorMessage(collectionsQuery.error || savedArticlesQuery.error, 'Failed to load collection details.') 
        : '';

    const deleteSavedArticleMutation = useMutation({
        mutationFn: deleteSavedArticle
    });

    const handleToggleSave = async (article: Article) => {
        const currentUrl = article.url;
        if (!currentUrl || pendingByUrl[currentUrl]) return;

        const saved = savedArticles.find((item) => item.url === currentUrl);
        if (!saved?._id) return;

        setPendingByUrl((prev) => ({ ...prev, [currentUrl]: true }));

        try {
            await deleteSavedArticleMutation.mutateAsync(saved._id);
            queryClient.setQueryData<SavedArticle[]>(['saved-articles', id], (prev = []) =>
                prev.filter((item) => item._id !== saved._id)
            );
            showToast('Article removed from collection', 'success');
        } catch (err: unknown) {
            showToast(getErrorMessage(err, 'Failed to remove article.'), 'error');
        } finally {
            setPendingByUrl((prev) => {
                const next = { ...prev };
                delete next[currentUrl];
                return next;
            });
        }
    };

    if (isLoading) return <SectionContainer><Loader /></SectionContainer>;

    if (!collection && !isLoading) {
        return (
            <SectionContainer>
                <EmptyState title="Collection not found" description="This collection might have been deleted." muted />
                <div className="flex justify-center mt-4">
                    <Link to="/saved"><Button variant="outline">Back to Collections</Button></Link>
                </div>
            </SectionContainer>
        );
    }

    return (
        <SectionContainer className="space-y-6">
            <div>
                <Link to="/saved" className="text-muted text-sm hover:text-primary transition-colors flex items-center gap-1 mb-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Back to Collections
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/80 flex items-center justify-center text-muted-foreground">
                        <Icon name={collection?.icon || 'Folder'} size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display">{collection?.name}</h1>
                        <p className="text-muted">{savedArticles.length} {savedArticles.length === 1 ? 'article' : 'articles'}</p>
                    </div>
                </div>
            </div>

            {errorMessage && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[15px] text-danger">
                    {errorMessage}
                </div>
            )}

            {savedArticles.length === 0 ? (
                <EmptyState
                    title="This collection is empty"
                    description="Save articles here from your dashboard."
                    muted
                />
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                    {savedArticles.map((saved) => (
                        <div key={saved._id} className="relative group/wrapper">
                            <Link to={`/reader?url=${encodeURIComponent(saved.url)}&id=${saved._id}`} className="block h-full cursor-pointer">
                                <NewsCard
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
                                    onToggleSave={(e) => {
                                        // The NewsCard handles event.preventDefault and stopPropagation inside itself for onToggleSave
                                        handleToggleSave(e);
                                    }}
                                    saveDisabled={Boolean(saved.url && pendingByUrl[saved.url])}
                                />
                            </Link>
                            {saved.isRead && (
                                <div className="absolute top-4 left-4 z-10 bg-success/20 text-success text-xs font-bold uppercase px-2 py-1 rounded shadow backdrop-blur-md">Read</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </SectionContainer>
    );
};

export default CollectionDetail;
