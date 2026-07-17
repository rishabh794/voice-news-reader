import React, { createContext, useState, type ReactNode, useCallback } from 'react';
import type { Article } from '../../types/news';

export type ReaderState = 'idle' | 'success' | 'failed';

export interface ConversationTurn {
    userSaid: string;
    resolvedAction: string;
    resolvedTopic: string | null;
}

export interface VoiceSessionState {
    topic: string | null;
    articles: Article[];
    currentArticleIndex: number | null;
    conversationHistory: ConversationTurn[];
    summary: string;
    isSpeaking: boolean;
    readerState: ReaderState;
}

export interface VoiceSessionContextValue extends VoiceSessionState {
    setSessionState: (state: Partial<VoiceSessionState>) => void;
    clearSession: () => void;
    updateReaderState: (state: ReaderState) => void;
    addConversationTurn: (turn: ConversationTurn) => void;
}

const initialState: VoiceSessionState = {
    topic: null,
    articles: [],
    currentArticleIndex: null,
    conversationHistory: [],
    summary: '',
    isSpeaking: false,
    readerState: 'idle'
};

export const VoiceSessionContext = createContext<VoiceSessionContextValue | undefined>(undefined);

export const VoiceSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<VoiceSessionState>(initialState);

    const setSessionState = useCallback((newState: Partial<VoiceSessionState>) => {
        setState(prev => ({ ...prev, ...newState }));
    }, []);

    const clearSession = useCallback(() => {
        setState(initialState);
    }, []);

    const updateReaderState = useCallback((readerState: ReaderState) => {
        setState(prev => ({ ...prev, readerState }));
    }, []);

    const addConversationTurn = useCallback((turn: ConversationTurn) => {
        setState(prev => {
            const newHistory = [...prev.conversationHistory, turn];
            // Keep only the last 2 turns to avoid unbounded growth
            if (newHistory.length > 2) {
                newHistory.shift();
            }
            return { ...prev, conversationHistory: newHistory };
        });
    }, []);

    return (
        <VoiceSessionContext.Provider value={{ ...state, setSessionState, clearSession, updateReaderState, addConversationTurn }}>
            {children}
        </VoiceSessionContext.Provider>
    );
};
