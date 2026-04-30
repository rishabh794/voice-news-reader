import { useCallback, useEffect, useRef, useState } from 'react';

export type AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

const SPEAK_START_TIMEOUT_MS = 1200;
const SPEAK_RETRY_DELAY_MS = 180;
const SPEAK_CANCEL_SETTLE_DELAY_MS = 60;
const MAX_SPEAK_ATTEMPTS = 2;

const useAudioPlayer = () => {
    const [state, setState] = useState<AudioPlaybackState>('idle');
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const stateRef = useRef<AudioPlaybackState>('idle');
    const requestIdRef = useRef(0);
    const startTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
    const retryTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    const setPlayerState = useCallback((nextState: AudioPlaybackState) => {
        stateRef.current = nextState;
        setState(nextState);
    }, []);

    const clearPendingTimers = useCallback(() => {
        if (startTimeoutRef.current !== null) {
            window.clearTimeout(startTimeoutRef.current);
            startTimeoutRef.current = null;
        }
        if (retryTimeoutRef.current !== null) {
            window.clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
    }, []);

    const stop = useCallback(() => {
        requestIdRef.current += 1;
        clearPendingTimers();
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
        setPlayerState('idle');
    }, [clearPendingTimers, setPlayerState]);

    const startSpeakAttempt = useCallback((text: string, requestId: number, attempt: number) => {
        if (requestId !== requestIdRef.current) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            if (requestId !== requestIdRef.current) return;
            if (startTimeoutRef.current !== null) {
                window.clearTimeout(startTimeoutRef.current);
                startTimeoutRef.current = null;
            }
            setPlayerState('playing');
        };

        utterance.onresume = () => {
            if (requestId !== requestIdRef.current) return;
            setPlayerState('playing');
        };

        utterance.onpause = () => {
            if (requestId !== requestIdRef.current) return;
            setPlayerState('paused');
        };

        utterance.onend = () => {
            if (requestId !== requestIdRef.current) return;
            if (startTimeoutRef.current !== null) {
                window.clearTimeout(startTimeoutRef.current);
                startTimeoutRef.current = null;
            }
            utteranceRef.current = null;
            setPlayerState('ended');
        };

        utterance.onerror = () => {
            if (requestId !== requestIdRef.current) return;
            if (startTimeoutRef.current !== null) {
                window.clearTimeout(startTimeoutRef.current);
                startTimeoutRef.current = null;
            }
            utteranceRef.current = null;
            setPlayerState('error');
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);

        startTimeoutRef.current = window.setTimeout(() => {
            startTimeoutRef.current = null;
            if (requestId !== requestIdRef.current) return;
            if (stateRef.current !== 'loading') return;

            window.speechSynthesis.cancel();
            utteranceRef.current = null;

            if (attempt + 1 < MAX_SPEAK_ATTEMPTS) {
                retryTimeoutRef.current = window.setTimeout(() => {
                    startSpeakAttempt(text, requestId, attempt + 1);
                }, SPEAK_RETRY_DELAY_MS);
                return;
            }

            setPlayerState('error');
        }, SPEAK_START_TIMEOUT_MS);
    }, [setPlayerState]);

    const play = useCallback((text: string) => {
        const normalized = text.trim();
        if (!normalized) {
            setPlayerState('error');
            return;
        }

        const currentUtteranceText = utteranceRef.current?.text?.trim() ?? '';
        const isSameUtterance = currentUtteranceText === normalized;
        const currentState = stateRef.current;

        if (currentState === 'playing' && isSameUtterance) return;

        if (currentState === 'paused' && isSameUtterance) {
            window.speechSynthesis.resume();
            setPlayerState('playing');
            return;
        }

        const nextRequestId = requestIdRef.current + 1;
        requestIdRef.current = nextRequestId;
        clearPendingTimers();
        window.speechSynthesis.cancel();
        setPlayerState('loading');

        retryTimeoutRef.current = window.setTimeout(() => {
            startSpeakAttempt(normalized, nextRequestId, 0);
        }, SPEAK_CANCEL_SETTLE_DELAY_MS);
    }, [clearPendingTimers, setPlayerState, startSpeakAttempt]);

    const pause = useCallback(() => {
        if (stateRef.current !== 'playing') return;
        window.speechSynthesis.pause();
    }, []);

    const resume = useCallback(() => {
        if (stateRef.current !== 'paused') return;
        window.speechSynthesis.resume();
        setPlayerState('playing');
    }, [setPlayerState]);

    const togglePause = useCallback(() => {
        const currentState = stateRef.current;
        if (currentState === 'playing') {
            pause();
            return;
        }
        if (currentState === 'paused') {
            resume();
        }
    }, [pause, resume]);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        return () => {
            clearPendingTimers();
            window.speechSynthesis.cancel();
        };
    }, [clearPendingTimers]);

    return {
        state,
        isLoading: state === 'loading',
        isPlaying: state === 'playing',
        isPaused: state === 'paused',
        isEnded: state === 'ended',
        isError: state === 'error',
        play,
        pause,
        resume,
        togglePause,
        stop
    };
};

export default useAudioPlayer;
