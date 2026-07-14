import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSavedArticles, saveArticle, deleteSavedArticle } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import type { Briefing, Article, SavedArticle } from '../../types/news';
import BriefingPlayer from './BriefingPlayer';
import FeedArticleGrid from '../FeedArticleGrid';
import SaveToCollectionModal from '../SaveToCollectionModal';
import Badge from '../ui/Badge';
import { getErrorMessage } from '../../validation';

interface BriefingDashboardLayoutProps {
    briefing: Briefing;
    audioPlayer: ReturnType<typeof import('../../hooks/useAudioPlayer').default>;
}

const EMPTY_SAVED_ARTICLES: SavedArticle[] = [];

const BriefingDashboardLayout = ({ briefing, audioPlayer }: BriefingDashboardLayoutProps) => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    // --- Saving Logic ---
    const [saveError, setSaveError] = useState('');
    const [pendingSaveByUrl, setPendingSaveByUrl] = useState<Record<string, boolean>>({});
    const [articleToSave, setArticleToSave] = useState<Article | null>(null);

    const savedArticlesQuery = useQuery<SavedArticle[]>({
        queryKey: ['saved-articles'],
        queryFn: () => fetchSavedArticles()
    });
    
    const savedArticles = savedArticlesQuery.data ?? EMPTY_SAVED_ARTICLES;
    
    const savedArticleIdsByUrl = useMemo(() => {
        return savedArticles.reduce<Record<string, string>>((acc, savedArticle) => {
            if (savedArticle.url && savedArticle._id) {
                acc[savedArticle.url] = savedArticle._id;
            }
            return acc;
        }, {});
    }, [savedArticles]);

    const saveArticleMutation = useMutation({
        mutationFn: ({ article, collectionId }: { article: Article; collectionId?: string }) => 
            saveArticle(article, collectionId),
        onSuccess: (savedArticle) => {
            queryClient.setQueryData<SavedArticle[]>(['saved-articles'], (prev = []) => {
                if (prev.some((item) => item._id === savedArticle._id)) return prev;
                return [...prev, savedArticle];
            });
            showToast('Article saved to collection', 'success');
        },
        onError: (err) => {
            setSaveError(getErrorMessage(err, 'Failed to save article. Please retry.'));
            showToast('Failed to save article', 'error');
        }
    });

    const deleteSavedArticleMutation = useMutation({
        mutationFn: deleteSavedArticle,
        onSuccess: (_, savedId) => {
            queryClient.setQueryData<SavedArticle[]>(['saved-articles'], (prev = []) =>
                prev.filter((item) => item._id !== savedId)
            );
        }
    });

    const handleToggleSave = useCallback(async (article: Article) => {
        const articleUrl = article.url?.trim();
        if (!articleUrl || pendingSaveByUrl[articleUrl]) return;

        setSaveError('');
        const existingSavedId = savedArticleIdsByUrl[articleUrl];

        if (existingSavedId) {
            setPendingSaveByUrl((prev) => ({ ...prev, [articleUrl]: true }));
            try {
                await deleteSavedArticleMutation.mutateAsync(existingSavedId);
                showToast('Article removed from saved', 'success');
            } catch (err: unknown) {
                setSaveError(getErrorMessage(err, 'Failed to update saved articles. Please retry.'));
            } finally {
                setPendingSaveByUrl((prev) => {
                    const next = { ...prev };
                    delete next[articleUrl];
                    return next;
                });
            }
            return;
        }

        setArticleToSave(article);
    }, [pendingSaveByUrl, savedArticleIdsByUrl, deleteSavedArticleMutation, showToast]);

    return (
        <div className="space-y-12 pb-12">
            <BriefingPlayer
                script={briefing.script}
                isPlaying={audioPlayer.isPlaying}
                isPaused={audioPlayer.isPaused}
                isLoading={audioPlayer.isLoading}
                isError={audioPlayer.isError}
                onPlay={() => audioPlayer.play(briefing.script)}
                onPause={audioPlayer.pause}
                onStop={audioPlayer.stop}
            />

            {saveError && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-[15px] text-warning">
                    {saveError}
                </div>
            )}

            <div className="space-y-12">
                {briefing.sections.map((section, index) => (
                    <div key={index} className="space-y-6">
                        <div className="border-b border-border/50 pb-4">
                            <Badge variant="primary" className="mb-3">{section.topic}</Badge>
                            <p className="text-text/90 leading-relaxed text-[15px] max-w-4xl">
                                {section.summary}
                            </p>
                        </div>
                        
                        <FeedArticleGrid
                            articles={section.articles as Article[]}
                            savedArticleIdsByUrl={savedArticleIdsByUrl}
                            onToggleSave={handleToggleSave}
                            pendingSaveByUrl={pendingSaveByUrl}
                        />
                    </div>
                ))}
            </div>

            <SaveToCollectionModal
                isOpen={!!articleToSave}
                onClose={() => setArticleToSave(null)}
                onSelectCollection={(collectionId) => {
                    if (articleToSave) {
                        setPendingSaveByUrl((prev) => ({ ...prev, [articleToSave.url]: true }));
                        saveArticleMutation.mutate({ article: articleToSave, collectionId }, {
                            onSettled: () => {
                                setPendingSaveByUrl((prev) => {
                                    const next = { ...prev };
                                    delete next[articleToSave.url];
                                    return next;
                                });
                            }
                        });
                    }
                    setArticleToSave(null);
                }}
            />
        </div>
    );
};

export default BriefingDashboardLayout;
