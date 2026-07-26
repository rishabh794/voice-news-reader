import React, { useState, useEffect } from 'react';
import { Search, Compass, Bookmark, X, ChevronUp } from 'lucide-react';
import { useVoiceSession } from './useVoiceSession';

interface CommandSectionProps {
    icon: React.ReactNode;
    title: string;
    available: boolean;
    examples: string[];
}

const CommandSection: React.FC<CommandSectionProps> = ({ icon, title, available, examples }) => {
    if (!available) {
        return (
            <div className="flex flex-col mb-3 opacity-40">
                <div className="flex items-center gap-2 mb-1">
                    <span>{icon}</span>
                    <span className="text-xs font-semibold uppercase">{title}</span>
                </div>
                <span className="text-xs ml-6 italic">(unavailable)</span>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col mb-3">
            <div className="flex items-center gap-2 mb-1">
                <span>{icon}</span>
                <span className="text-xs font-semibold uppercase text-primary">{title}</span>
            </div>
            <div className="flex flex-col ml-6 text-xs text-text space-y-1">
                {examples.map((ex, idx) => (
                    <span key={idx}>{ex}</span>
                ))}
            </div>
        </div>
    );
};

export const VoiceCommandDrawer: React.FC = () => {
    const context = useVoiceSession();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Auto-open logic on first successful voice search
        if (context.articles.length > 0) {
            const hasOnboarded = localStorage.getItem('voice_onboarded');
            if (!hasOnboarded) {
                setIsOpen(true);
                localStorage.setItem('voice_onboarded', 'true');
                const timer = setTimeout(() => setIsOpen(false), 5000);
                return () => clearTimeout(timer);
            }
        }
    }, [context.articles.length]);

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="text-xs text-muted bg-surface/90 backdrop-blur 
                           border border-border/50 rounded-full px-3 py-1.5
                           hover:border-primary/40 transition-all mb-2 shadow-sm"
            >
                <span className="opacity-60 mr-1 inline-flex items-center"><ChevronUp className="w-3 h-3 inline" /></span> Voice Commands
            </button>
        );
    }

    return (
        <div className="bg-elevated border border-border rounded-xl p-4 shadow-xl backdrop-blur-md w-72 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-text">Voice Commands</span>
                <button onClick={() => setIsOpen(false)} className="text-muted hover:text-text"><X className="w-4 h-4" /></button>
            </div>

            <CommandSection 
                icon={<Search className="w-4 h-4" />} 
                title="Search" 
                available={true}
                examples={[
                    '"news about climate change"',
                    '"what\'s happening with OpenAI"'
                ]} 
            />
            <CommandSection 
                icon={<Compass className="w-4 h-4" />} 
                title="Browse" 
                available={context.articles.length > 0}
                examples={[
                    '"next" · "previous" · "skip"',
                    '"read the first one"'
                ]} 
            />
            <CommandSection 
                icon={<Bookmark className="w-4 h-4" />} 
                title="Actions" 
                available={context.articles.length > 0}
                examples={[
                    '"save this" · "save it"',
                    '"go back" · "go to history"'
                ]} 
            />
        </div>
    );
};
