import { useReducer, useCallback, useRef } from 'react';
import type { Article } from '../types/news';

export type PipelineStage = 'idle' | 'connecting' | 'intent' | 'query_optimized' | 'articles' | 'summary' | 'category' | 'complete' | 'error';

interface SSESearchState {
    stage: PipelineStage;
    intent: { action: string; topic: string } | null;
    articles: Article[];
    summary: string;
    category: string;
    error: string;
    isStreaming: boolean;
    optimizedQuery: string;
}

const initialState: SSESearchState = {
    stage: 'idle',
    intent: null,
    articles: [],
    summary: '',
    category: '',
    error: '',
    isStreaming: false,
    optimizedQuery: ''
};

type Action =
    | { type: 'START' }
    | { type: 'EVENT_INTENT'; payload: { action: string; topic: string } }
    | { type: 'EVENT_QUERY_OPTIMIZED'; payload: { original: string; optimized: string } }
    | { type: 'EVENT_ARTICLES'; payload: { articles: Article[] } }
    | { type: 'EVENT_SUMMARY'; payload: { text: string } }
    | { type: 'EVENT_CATEGORY'; payload: { category: string } }
    | { type: 'EVENT_COMPLETE' }
    | { type: 'EVENT_ERROR'; payload: { message: string } }
    | { type: 'RESET' };

function reducer(state: SSESearchState, action: Action): SSESearchState {
    switch (action.type) {
        case 'START':
            return { ...initialState, stage: 'connecting', isStreaming: true };
        case 'EVENT_INTENT':
            return { ...state, stage: 'intent', intent: action.payload };
        case 'EVENT_QUERY_OPTIMIZED':
            return { ...state, stage: 'query_optimized', optimizedQuery: action.payload.optimized };
        case 'EVENT_ARTICLES':
            return { ...state, stage: 'articles', articles: action.payload.articles };
        case 'EVENT_SUMMARY':
            return { ...state, stage: 'summary', summary: action.payload.text };
        case 'EVENT_CATEGORY':
            return { ...state, stage: 'category', category: action.payload.category };
        case 'EVENT_COMPLETE':
            return { ...state, stage: 'complete', isStreaming: false };
        case 'EVENT_ERROR':
            return { ...state, stage: 'error', error: action.payload.message, isStreaming: false };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

export interface SSESearchCallbacks {
    onIntent?: (intent: { action: string; topic: string }) => void;
    onQueryOptimized?: (data: { original: string; optimized: string }) => void;
    onArticles?: (articles: Article[]) => void;
    onSummary?: (summary: string) => void;
    onError?: (error: string) => void;
    onComplete?: (data: { intent: { action: string; topic: string } | null; articles: Article[]; summary: string }) => void;
}

export const useSSESearch = (callbacks?: SSESearchCallbacks) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const abortControllerRef = useRef<AbortController | null>(null);
    const callbacksRef = useRef(callbacks);

    // Keep callbacks fresh
    callbacksRef.current = callbacks;

    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        dispatch({ type: 'EVENT_COMPLETE' });
        callbacksRef.current?.onComplete?.({ intent: null, articles: [], summary: '' });
    }, []);

    const startSearch = useCallback(async (query: string, context?: { previous_topic?: string | null }) => {
        let localIntent: { action: string; topic: string } | null = null;
        let localArticles: Article[] = [];
        let localSummary = '';
        let completeFired = false;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        dispatch({ type: 'START' });

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        let url = `${baseUrl}/stream/search?query=${encodeURIComponent(query)}`;
        if (context) {
            url += `&context=${encodeURIComponent(JSON.stringify(context))}`;
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                signal
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    window.dispatchEvent(new CustomEvent('api:unauthorized'));
                    return;
                }
                if (response.status === 429) {
                    dispatch({ type: 'EVENT_ERROR', payload: { message: 'Too many requests. Please try again later.' } });
                    return;
                }
                const err = await response.json().catch(() => ({ error: 'Network error' }));
                dispatch({ type: 'EVENT_ERROR', payload: { message: err.error || `HTTP ${response.status}` } });
                return;
            }

            const body = response.body;
            if (!body) {
                dispatch({ type: 'EVENT_ERROR', payload: { message: 'Empty response stream' } });
                return;
            }

            const reader = body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                
                // Keep the last partial chunk in the buffer
                buffer = lines.pop() || '';

                for (const chunk of lines) {
                    const lines = chunk.split('\n');
                    let eventName = '';
                    let eventData = '';

                    for (const line of lines) {
                        if (line.startsWith('event: ')) {
                            eventName = line.substring(7).trim();
                        } else if (line.startsWith('data: ')) {
                            eventData = line.substring(6).trim();
                        }
                    }

                    if (!eventName && chunk.startsWith(': ping')) {
                        continue; // ignore heartbeat
                    }

                    if (eventName && eventData) {
                        try {
                            const data = JSON.parse(eventData);
                            switch (eventName) {
                                case 'intent':
                                    localIntent = data;
                                    dispatch({ type: 'EVENT_INTENT', payload: data });
                                    callbacksRef.current?.onIntent?.(data);
                                    break;
                                case 'query_optimized':
                                    dispatch({ type: 'EVENT_QUERY_OPTIMIZED', payload: data });
                                    callbacksRef.current?.onQueryOptimized?.(data);
                                    break;
                                case 'articles':
                                    localArticles = data.articles;
                                    dispatch({ type: 'EVENT_ARTICLES', payload: data });
                                    callbacksRef.current?.onArticles?.(data.articles);
                                    break;
                                case 'summary':
                                    localSummary = data.text;
                                    dispatch({ type: 'EVENT_SUMMARY', payload: data });
                                    callbacksRef.current?.onSummary?.(data.text);
                                    break;
                                case 'category':
                                    dispatch({ type: 'EVENT_CATEGORY', payload: data });
                                    break;
                                case 'complete':
                                    completeFired = true;
                                    dispatch({ type: 'EVENT_COMPLETE' });
                                    callbacksRef.current?.onComplete?.({ intent: localIntent, articles: localArticles, summary: localSummary });
                                    break;
                                case 'error':
                                    dispatch({ type: 'EVENT_ERROR', payload: data });
                                    callbacksRef.current?.onError?.(data.message);
                                    break;
                            }
                        } catch (e) {
                            console.error('Failed to parse SSE data', eventData, e);
                        }
                    }
                }
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Fetch aborted');
            } else {
                dispatch({ type: 'EVENT_ERROR', payload: { message: err.message || 'Stream connection failed' } });
            }
        } finally {
            if (abortControllerRef.current?.signal === signal) {
                abortControllerRef.current = null;
                // Only dispatch if we haven't already fired complete
                if (!completeFired) {
                    dispatch({ type: 'EVENT_COMPLETE' });
                }
            }
        }
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    return { ...state, startSearch, abort, reset };
};
