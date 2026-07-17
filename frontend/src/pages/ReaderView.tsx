import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchReaderContent, updateSavedArticle } from '../services/api';
import Loader from '../components/Loader';
import Button from '../components/ui/Button';
import SectionContainer from '../components/ui/SectionContainer';
import useAudioPlayer from '../hooks/useAudioPlayer';
import DOMPurify from 'dompurify';
import { useVoiceSession } from '../features/voice-session/useVoiceSession';

const ReaderView = () => {
    const [searchParams] = useSearchParams();
    const url = searchParams.get('url');
    const id = searchParams.get('id');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { play, stop, togglePause, isPlaying, isPaused, isLoading: audioLoading } = useAudioPlayer();

    const readerQuery = useQuery({
        queryKey: ['reader', url, id],
        queryFn: () => fetchReaderContent(url!, id || undefined),
        enabled: !!url
    });

    const markAsReadMutation = useMutation({
        mutationFn: () => updateSavedArticle(id!, { isRead: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-articles'] });
        }
    });

    const hasMarkedReadRef = useRef(false);

    useEffect(() => {
        if (id && readerQuery.data && !hasMarkedReadRef.current) {
            hasMarkedReadRef.current = true;
            // Auto mark as read when successfully opened in reader
            markAsReadMutation.mutate();
        }
    }, [id, readerQuery.data]);

    useEffect(() => {
        return () => stop();
    }, [stop]);

    const { updateReaderState } = useVoiceSession();

    useEffect(() => {
        if (readerQuery.isSuccess && readerQuery.data) {
            updateReaderState('success');
        } else if (readerQuery.isError) {
            updateReaderState('failed');
        }
        return () => updateReaderState('idle');
    }, [readerQuery.isSuccess, readerQuery.isError, readerQuery.data, updateReaderState]);

    const article = readerQuery.data;

    if (!url) {
        return <SectionContainer><p className="text-danger">No URL provided.</p></SectionContainer>;
    }

    if (readerQuery.isLoading) {
        return (
            <SectionContainer className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader message="Fetching clean article..." submessage="" />
            </SectionContainer>
        );
    }

    if (readerQuery.isError || !article) {
        return (
            <SectionContainer className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
                <p className="text-danger text-lg mb-2">Could not parse this article.</p>
                <p className="text-muted">Some websites block automated parsing.</p>
                <Button onClick={() => window.open(url, '_blank')} variant="outline">Open Original URL</Button>
                <Button onClick={() => navigate(-1)} variant="ghost">Go Back</Button>
            </SectionContainer>
        );
    }

    return (
        <SectionContainer className="max-w-3xl mx-auto space-y-8 py-8 relative">
            <div className="mb-4">
                <Button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 text-primary hover:text-primary hover:bg-primary/10 px-3 py-2 -ml-3"
                    variant="ghost"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    <span className="font-medium">Back to previous page</span>
                </Button>
            </div>

            <header className="space-y-4 text-center">
                <p className="text-primary font-mono uppercase tracking-widest text-sm">{article.siteName || new URL(url).hostname}</p>
                <h1 className="text-3xl md:text-5xl font-display leading-tight text-foreground">{article.title}</h1>
                {(article.byline || article.length) && (
                    <div className="flex items-center justify-center gap-4 text-muted text-sm">
                        {article.byline && <span>By {article.byline}</span>}
                        {article.byline && article.length && <span>&bull;</span>}
                        {article.length && <span>{Math.ceil(article.length / 1250)} min read</span>}
                    </div>
                )}
            </header>

            {/* Floating Action Button for TTS */}
            <div className="fixed bottom-[110px] right-8 z-50">
                <Button 
                    onClick={() => {
                        if (isPlaying || isPaused) {
                            togglePause();
                        } else {
                            // Read title and text content
                            play(`${article.title}. ${article.textContent}`);
                        }
                    }}
                    variant={isPlaying ? 'primary' : 'secondary'}
                    className="h-16 w-16 rounded-full shadow-2xl flex items-center justify-center p-0"
                >
                    {audioLoading ? (
                        <Loader simple />
                    ) : isPlaying ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    ) : isPaused ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    )}
                </Button>
            </div>

            <article 
                className="prose prose-invert prose-lg max-w-none text-text leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
            />
        </SectionContainer>
    );
};

export default ReaderView;
