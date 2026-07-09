import { useState } from 'react';
import Button from './ui/Button';
import TopicChip from './ui/TopicChip';

// Emojis removed for a more professional UI

interface TopicSelectorProps {
    availableTopics: readonly string[];
    selectedTopics: string[];
    onSave: (topics: string[]) => void;
    isSaving: boolean;
    maxTopics?: number;
    variant?: 'onboarding' | 'compact';
    onCancel?: () => void;
}

const TopicSelector = ({
    availableTopics,
    selectedTopics: initialSelected,
    onSave,
    isSaving,
    maxTopics = 8,
    variant = 'onboarding',
    onCancel
}: TopicSelectorProps) => {
    const [selected, setSelected] = useState<string[]>(initialSelected);

    const handleToggle = (topic: string) => {
        if (selected.includes(topic)) {
            setSelected(selected.filter((t) => t !== topic));
        } else {
            if (selected.length < maxTopics) {
                setSelected([...selected, topic]);
            }
        }
    };

    const handleSave = () => {
        onSave(selected);
    };

    const isOnboarding = variant === 'onboarding';

    return (
        <div className={`flex flex-col ${isOnboarding ? 'items-center text-center max-w-2xl mx-auto py-12' : ''}`}>
            {isOnboarding && (
                <div className="mb-8 space-y-3">
                    <h2 className="text-3xl font-display font-semibold text-text">
                        Pick topics you care about
                    </h2>
                    <p className="text-lg text-muted">
                        Select a few categories to personalize your daily news feed. You can change these later.
                    </p>
                </div>
            )}

            <div className={`flex flex-wrap ${isOnboarding ? 'justify-center gap-4 mb-10' : 'gap-3 mb-6'}`}>
                {availableTopics.map((topic) => (
                    <TopicChip
                        key={topic}
                        label={topic}
                        selected={selected.includes(topic)}
                        onToggle={() => handleToggle(topic)}
                        size={isOnboarding ? 'lg' : 'md'}
                        disabled={!selected.includes(topic) && selected.length >= maxTopics}
                    />
                ))}
            </div>

            <div className="flex items-center gap-3">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        size={isOnboarding ? 'lg' : 'md'}
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="button"
                    variant="primary"
                    size={isOnboarding ? 'lg' : 'md'}
                    onClick={handleSave}
                    disabled={isSaving || (isOnboarding && selected.length === 0)}
                    className={isOnboarding ? 'min-w-[200px]' : ''}
                >
                    {isSaving ? 'Saving...' : isOnboarding ? 'Get Started' : 'Save Topics'}
                </Button>
            </div>

            {selected.length >= maxTopics && (
                <p className="mt-4 text-sm text-warning">
                    You've reached the maximum of {maxTopics} topics.
                </p>
            )}
        </div>
    );
};

export default TopicSelector;
