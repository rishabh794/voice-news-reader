import { useState, useRef, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';
import { requestIntent, transcribeAudio } from '../services/api';

const VoiceAssistant = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const activeStream = useRef<MediaStream | null>(null);
    const isMountedRef = useRef(true);
    
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
                mediaRecorder.current.stop();
            }
            activeStream.current?.getTracks().forEach((track) => track.stop());
            activeStream.current = null;
        };
    }, []);

    if (!authContext?.isAuthenticated || location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    const startRecording = async () => {
        if (isRecording || isProcessing || mediaRecorder.current?.state === 'recording') return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            activeStream.current = stream;
            
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = async () => {
                if (!isMountedRef.current) return;
                setIsProcessing(true);
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                activeStream.current = null;
                
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');

                try {
                    const transcribedPayload = await transcribeAudio(formData);

                    const spokenText = transcribedPayload.text.toLowerCase().trim();
                    if (!spokenText) return;
                    if (!isMountedRef.current) return;

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

                    if (spokenText.includes('dashboard')) {
                        navigate('/dashboard');
                        return;
                    }

                    const fullPayload = await requestIntent(spokenText, 'Recognized speech was empty.');

                    if (fullPayload.action === 'search') {
                        navigate('/dashboard', { state: { agentPayload: fullPayload } });
                    }

                } catch (error) {
                    console.error("AI Pipeline failed:", error);
                } finally {
                    if (isMountedRef.current) {
                        setIsProcessing(false);
                    }
                }
            };

            mediaRecorder.current.start();
            if (isMountedRef.current) {
                setIsRecording(true);
            }
        } catch (error) {
            console.error("Microphone access denied or failed:", error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            if (isMountedRef.current) {
                setIsRecording(false);
            }
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {isProcessing && (
                <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-elevated px-3 py-2 text-xs text-muted shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                    Analyzing intent
                </div>
            )}

            <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                aria-label="Press and hold to talk"
                className={[
                    'relative flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base',
                    isRecording
                        ? 'border-primary bg-primary/10 text-primary scale-105'
                        : isProcessing
                        ? 'border-border-strong bg-elevated text-muted cursor-wait'
                        : 'border-border/70 bg-surface text-muted hover:border-border-strong hover:text-text'
                ].join(' ')}
            >
                {isProcessing ? (
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