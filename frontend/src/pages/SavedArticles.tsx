import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCollections, fetchSavedArticles } from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import SectionContainer from '../components/ui/SectionContainer';
import type { Collection, SavedArticle } from '../types/news';
import { getErrorMessage } from '../validation';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import CreateCollectionModal from '../components/CreateCollectionModal';

const SavedArticles = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const collectionsQuery = useQuery<Collection[]>({
        queryKey: ['collections'],
        queryFn: fetchCollections
    });
    
    // We fetch all saved articles just to show the count per collection.
    // In a massive app, we'd have the backend return the count in the collection response.
    const savedArticlesQuery = useQuery<SavedArticle[]>({
        queryKey: ['saved-articles'],
        queryFn: () => fetchSavedArticles()
    });

    const collections = collectionsQuery.data ?? [];
    const savedArticles = savedArticlesQuery.data ?? [];
    
    const isLoading = collectionsQuery.isLoading || savedArticlesQuery.isLoading;
    const errorMessage = collectionsQuery.error ? getErrorMessage(collectionsQuery.error, 'Failed to load collections.') : '';

    return (
        <SectionContainer className="space-y-6">
            <PageHeader
                title="Your Collections"
                subtitle="Organize your reading list and saved articles."
                action={
                    <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        New Collection
                    </Button>
                }
            />

            {errorMessage && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[15px] text-danger">
                    {errorMessage}
                </div>
            )}

            {isLoading ? (
                <Loader />
            ) : collections.length === 0 ? (
                <EmptyState
                    title="No collections found"
                    description="Save a headline from the dashboard to start building your collections."
                    muted
                />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {collections.map((col) => {
                        const articleCount = savedArticles.filter(a => a.collectionId === col._id).length;
                        return (
                            <Link key={col._id} to={`/collections/${col._id}`}>
                                <Card className="p-6 h-full flex flex-col items-center justify-center gap-3 text-center transition-transform hover:scale-105 hover:border-primary/50 group cursor-pointer relative overflow-hidden">
                                    <div className="w-16 h-16 rounded-2xl bg-secondary/80 flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                                        <Icon name={col.icon} size={32} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-text group-hover:text-primary transition-colors">{col.name}</h3>
                                        <p className="text-sm text-muted">{articleCount} {articleCount === 1 ? 'article' : 'articles'}</p>
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-primary">
                                        <Icon name="ArrowRight" size={18} />
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}

            <CreateCollectionModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
            />
        </SectionContainer>
    );
};

export default SavedArticles;
