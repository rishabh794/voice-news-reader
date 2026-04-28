import { useCallback, useEffect, useRef, useState } from 'react';

export type AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

const useAudioPlayer = () => {
    const [state, setState] = useState<AudioPlaybackState>('idle');
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
        setState('idle');
    }, []);

    const play = useCallback((text: string) => {
        const normalized = text.trim();
        if (!normalized) {
            setState('error');
            return;
        }

        // Ignore duplicate play while already speaking to prevent pause state desync.
        if (state === 'playing') return;

        if (state === 'paused') {
            window.speechSynthesis.resume();
            setState('playing');
            return;
        }

        window.speechSynthesis.cancel();
        setState('loading');

        const utterance = new SpeechSynthesisUtterance(normalized);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            setState('playing');
        };

        utterance.onresume = () => {
            setState('playing');
        };

        utterance.onpause = () => {
            setState('paused');
        };

        utterance.onend = () => {
            utteranceRef.current = null;
            setState('ended');
        };

        utterance.onerror = () => {
            utteranceRef.current = null;
            setState('error');
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [state]);

    const pause = useCallback(() => {
        if (state !== 'playing') return;
        window.speechSynthesis.pause();
    }, [state]);

    const resume = useCallback(() => {
        if (state !== 'paused') return;
        window.speechSynthesis.resume();
        setState('playing');
    }, [state]);

    const togglePause = useCallback(() => {
        if (state === 'playing') {
            pause();
            return;
        }
        if (state === 'paused') {
            resume();
        }
    }, [pause, resume, state]);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

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
