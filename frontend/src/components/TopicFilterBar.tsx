import TopicChip from './ui/TopicChip';
import Button from './ui/Button';

interface TopicFilterBarProps {
    topics: string[];
    activeTopics: string[];
    onToggleTopic: (topic: string) => void;
    onEditTopics: () => void;
}

const TopicFilterBar = ({
    topics,
    activeTopics,
    onToggleTopic,
    onEditTopics
}: TopicFilterBarProps) => {
    return (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEditTopics}
                className="shrink-0 text-xs rounded-full border-dashed mr-2"
            >
                + Edit Topics
            </Button>

            {topics.map((topic) => (
                <TopicChip
                    key={topic}
                    label={topic}
                    selected={activeTopics.includes(topic)}
                    onToggle={() => onToggleTopic(topic)}
                    size="sm"
                    className="shrink-0"
                />
            ))}
        </div>
    );
};

export default TopicFilterBar;
