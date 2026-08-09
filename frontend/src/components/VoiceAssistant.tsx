import { useState, useRef, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';
import { useToast } from '../hooks/useToast';
import { transcribeAudio, saveArticle } from '../services/api';
import { isGibberish } from '../services/isGibberish';
import { useMicVAD, utils as vadUtils } from '@ricky0123/vad-react';
import { useVoiceSession } from '../features/voice-session/useVoiceSession';
import { VoiceCommandDrawer } from '../features/voice-session/VoiceCommandDrawer';
import { useQueryClient } from '@tanstack/react-query';

const ordinalMap: Record<string, number> = {
    'first': 0, '1st': 0,
    'second': 1, '2nd': 1,
    'third': 2, '3rd': 2,
    'fourth': 3, '4th': 3,
    'fifth': 4, '5th': 4,
    'sixth': 5, '6th': 5,
    'seventh': 6, '7th': 6,
    'eighth': 7, '8th': 7,
    'ninth': 8, '9th': 8,
};

const VoiceAssistant = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
    // Setting for VAD vs Classic
    const [useVad, setUseVad] = useState(true);

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const activeStream = useRef<MediaStream | null>(null);
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    const authContext = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    
    const session = useVoiceSession();

    // Check mic permission on mount and listen for changes
    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const checkPermission = async () => {
            try {
                if (navigator.permissions && navigator.permissions.query) {
                    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                    if (isMountedRef.current) setMicPermission(status.state as 'granted' | 'denied' | 'prompt');
                    
                    const onChange = () => {
                        if (isMountedRef.current) setMicPermission(status.state as 'granted' | 'denied' | 'prompt');
                    };
                    status.addEventListener('change', onChange);
                    cleanup = () => status.removeEventListener('change', onChange);
                }
            } catch {
                // Permissions API not supported (e.g. some Safari versions) — we'll handle it at request time
            }
        };

        checkPermission();
        return () => cleanup?.();
    }, []);

    useEffect(() => {
        const loadSetting = () => {
            const setting = localStorage.getItem('voice_use_vad');
            setUseVad(setting !== 'false');
        };

        // Initial load
        loadSetting();

        // Listen for setting changes
        window.addEventListener('voice_settings_changed', loadSetting);

        isMountedRef.current = true;
        return () => {
            window.removeEventListener('voice_settings_changed', loadSetting);
            isMountedRef.current = false;
            cleanupAudio();
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const cleanupAudio = () => {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            mediaRecorder.current.stop();
        }
        activeStream.current?.getTracks().forEach((track) => track.stop());
        activeStream.current = null;
    };

    // Barge-in function
    const cancelInFlight = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        window.speechSynthesis.cancel();
    };

    /**
     * Request microphone permission explicitly.
     * Returns true if granted, false if denied/failed.
     * On denial, shows a descriptive toast guiding the user.
     */
    const requestMicPermission = async (): Promise<boolean> => {
        // If we already know it's denied, skip the getUserMedia call and show guidance immediately
        if (micPermission === 'denied') {
            showToast(
                'Microphone access is blocked. Please tap the lock/site-settings icon in your browser\'s address bar, enable Microphone, then reload the page.',
                'error'
            );
            return false;
        }

        try {
            // This triggers the browser's native permission prompt if state is 'prompt'
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Permission granted — stop the test stream immediately
            stream.getTracks().forEach(track => track.stop());
            setMicPermission('granted');
            return true;
        } catch (err: any) {
            setMicPermission('denied');

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                showToast(
                    'Microphone permission was denied. To enable it, tap the lock/site-settings icon in your browser\'s address bar, allow Microphone, and reload.',
                    'error'
                );
            } else if (err.name === 'NotFoundError') {
                showToast(
                    'No microphone found. Please connect a microphone and try again.',
                    'error'
                );
            } else {
                showToast(
                    'Could not access microphone. Please check your browser and device settings.',
                    'error'
                );
            }
            return false;
        }
    };

    const processAudio = async (audioBlob: Blob) => {
        setIsProcessing(true);
        cancelInFlight();
        
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
            const transcribedPayload = await transcribeAudio(formData, signal);
            if (!isMountedRef.current) return;

            const spokenText = transcribedPayload.text.toLowerCase().trim();

            if (isGibberish(spokenText)) {
                showToast('Could not understand that voice query. Please try again.', 'error');
                return;
            }

            // LEVEL 1: CLIENT-SIDE KEYWORD ROUTING
            if (spokenText.includes('history')) {
                navigate('/history');
                return;
            }

            if (
                spokenText.includes('saved article') ||
                spokenText.includes('saved articles') ||
                spokenText.includes('bookmarks') ||
                spokenText.includes('bookmark list')
            ) {
                navigate('/saved');
                return;
            }

            if (spokenText.includes('dashboard') || spokenText.includes('go back') || spokenText.includes('results')) {
                // If we're on the reader page, just go back to the dashboard with existing session
                if (location.pathname.startsWith('/reader')) {
                    navigate('/dashboard', { replace: true });
                } else {
                    navigate('/dashboard');
                }
                return;
            }

            // Contextual Actions (only if we have articles)
            if (session.articles.length > 0) {
                const currentIndex = session.currentArticleIndex ?? 0;
                
                // Save (moved before Next to prevent "save next" triggering Next)
                if (spokenText.includes('save this') || spokenText.includes('save it') || spokenText.includes('save')) {
                    const article = session.articles[currentIndex];
                    if (article) {
                        try {
                            const saved = await saveArticle(article);
                            queryClient.setQueryData(['saved-articles'], (prev: any = []) => {
                                if (prev.some((a: any) => a._id === saved._id)) return prev;
                                return [...prev, saved];
                            });
                            showToast('Article saved.', 'success');
                        } catch (e) {
                            showToast('Failed to save article.', 'error');
                        }
                    }
                    return;
                }

                // Next / Previous / Skip
                if (spokenText.match(/\b(next|skip)\b/)) {
                    if (currentIndex < session.articles.length - 1) {
                        const nextIdx = currentIndex + 1;
                        session.setSessionState({ currentArticleIndex: nextIdx });
                        navigate(`/reader?url=${encodeURIComponent(session.articles[nextIdx].url)}`);
                    } else {
                        showToast('That was the last article. Say "go back" to see all results.', 'info');
                    }
                    return;
                }

                if (spokenText.match(/\b(previous|back to last)\b/)) {
                    if (currentIndex > 0) {
                        const prevIdx = currentIndex - 1;
                        session.setSessionState({ currentArticleIndex: prevIdx });
                        navigate(`/reader?url=${encodeURIComponent(session.articles[prevIdx].url)}`);
                    } else {
                        showToast('You are already at the first article.', 'info');
                    }
                    return;
                }

                // Ordinal parsing
                let matchedIndex = -1;
                for (const [word, idx] of Object.entries(ordinalMap)) {
                    if (spokenText.includes(`read the ${word}`) || spokenText.includes(`${word} one`)) {
                        matchedIndex = idx;
                        break;
                    }
                }
                if (spokenText.includes('last one') || spokenText.includes('read the last')) {
                    matchedIndex = session.articles.length - 1;
                }

                if (matchedIndex !== -1) {
                    if (matchedIndex < session.articles.length) {
                        session.setSessionState({ currentArticleIndex: matchedIndex });
                        navigate(`/reader?url=${encodeURIComponent(session.articles[matchedIndex].url)}`);
                    } else {
                        showToast(`I only found ${session.articles.length} articles.`, 'error');
                    }
                    return;
                }



                // Read this / Open it
                if (spokenText.match(/\b(read this|open it|read it)\b/)) {
                    const article = session.articles[currentIndex];
                    if (article) {
                        navigate(`/reader?url=${encodeURIComponent(article.url)}`);
                    }
                    return;
                }
            }

            // If not caught by Level 1, send to pipeline via Dashboard URL (Dashboard handles SSE and context)
            navigate(`/dashboard?q=${encodeURIComponent(spokenText)}`);

        } catch (error: any) {
            if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
                console.error("AI Pipeline failed:", error);
            }
        } finally {
            if (isMountedRef.current) {
                setIsProcessing(false);
            }
        }
    };

    // VAD Setup
    const vad = useMicVAD({
        startOnLoad: false,
        onSpeechEnd: (audio) => {
            const wavBuffer = vadUtils.encodeWAV(audio);
            const blob = new Blob([wavBuffer], { type: 'audio/wav' });
            processAudio(blob);
            vad.pause();
        },
        positiveSpeechThreshold: 0.8,
        negativeSpeechThreshold: 0.3,
        baseAssetPath: '/',
        onnxWASMBasePath: '/',
    });

    const handleMicTapVAD = async () => {
        console.log('Mic tapped!', { listening: vad.listening, loading: vad.loading, errored: vad.errored, vadInstance: !!vad });
        if (vad.errored) {
            console.error('VAD is in an errored state:', vad.errored);
            const errMsg = typeof vad.errored === 'string' ? vad.errored : (vad.errored as any).message || String(vad.errored);
            showToast(`VAD Error: ${errMsg}`, 'error');
            return;
        }
        
        if (vad.listening) {
            cancelInFlight();
            console.log('Pausing VAD...');
            await vad.pause();
        } else {
            // Check permission before starting VAD
            const hasPermission = await requestMicPermission();
            if (!hasPermission) return;

            cancelInFlight();
            console.log('Starting VAD...');
            try {
                await vad.toggle();
            } catch (err) {
                console.error('Failed to start microphone or toggle VAD:', err);
                showToast('Failed to start microphone. Please check permissions.', 'error');
            }
        }
    };

    // Classic Fallback
    const [isRecordingClassic, setIsRecordingClassic] = useState(false);
    
    const startRecordingClassic = async () => {
        // Check permission before starting classic recording
        const hasPermission = await requestMicPermission();
        if (!hasPermission) return;

        cancelInFlight();
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            activeStream.current = stream;
            
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                cleanupAudio();
                processAudio(audioBlob);
            };

            mediaRecorder.current.start();
            if (isMountedRef.current) {
                setIsRecordingClassic(true);
            }
        } catch (error: any) {
            console.error("Microphone access denied or failed:", error);
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                setMicPermission('denied');
                showToast(
                    'Microphone permission was denied. To enable it, tap the lock/site-settings icon in your browser\'s address bar, allow Microphone, and reload.',
                    'error'
                );
            } else {
                showToast('Could not access microphone. Please check your device settings.', 'error');
            }
        }
    };

    const stopRecordingClassic = () => {
        if (mediaRecorder.current && isRecordingClassic) {
            mediaRecorder.current.stop();
            if (isMountedRef.current) {
                setIsRecordingClassic(false);
            }
        }
    };

    if (!authContext?.isAuthenticated || location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    const isCurrentlyRecording = useVad ? vad.listening : isRecordingClassic;
    const isVadLoading = useVad && vad.loading;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            <VoiceCommandDrawer />
            
            {isProcessing && (
                <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-elevated px-3 py-2 text-xs text-muted shadow-[0_8px_20px_rgba(0,0,0,0.2)] animate-fade-in">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                    Analyzing intent
                </div>
            )}
            
            {(vad.userSpeaking) && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-xs text-primary shadow-lg animate-fade-in">
                    <span className="h-2 w-2 rounded-full bg-primary animate-ping"></span>
                    Listening...
                </div>
            )}

            <button
                onMouseDown={!useVad ? startRecordingClassic : undefined}
                onMouseUp={!useVad ? stopRecordingClassic : undefined}
                onMouseLeave={!useVad ? stopRecordingClassic : undefined}
                onTouchStart={!useVad ? startRecordingClassic : undefined}
                onTouchEnd={!useVad ? stopRecordingClassic : undefined}
                onClick={useVad ? handleMicTapVAD : undefined}
                disabled={isVadLoading}
                aria-label={useVad ? "Tap to talk" : "Press and hold to talk"}
                className={[
                    'relative flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base',
                    isCurrentlyRecording
                        ? 'border-primary bg-primary/10 text-primary scale-105'
                        : isProcessing || isVadLoading
                        ? 'border-border-strong bg-elevated text-muted cursor-wait'
                        : 'border-border/70 bg-surface text-muted hover:border-border-strong hover:text-text shadow-sm'
                ].join(' ')}
            >
                {isProcessing || isVadLoading ? (
                    <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-80" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" />
                    </svg>
                ) : (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3z" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default VoiceAssistant;
