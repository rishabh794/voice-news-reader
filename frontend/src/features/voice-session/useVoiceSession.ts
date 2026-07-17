import { useContext } from 'react';
import { VoiceSessionContext, type VoiceSessionContextValue } from './VoiceSessionContext';

export const useVoiceSession = (): VoiceSessionContextValue => {
    const context = useContext(VoiceSessionContext);
    if (context === undefined) {
        throw new Error('useVoiceSession must be used within a VoiceSessionProvider');
    }
    return context;
};
