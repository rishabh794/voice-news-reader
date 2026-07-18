import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight } from 'lucide-react';
import { useBriefingHistory } from '../../hooks/useBriefing';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';

const BriefingHistoryItem = ({ briefing }: { briefing: any }) => {
    const navigate = useNavigate();

    const dateObj = new Date(briefing.date + 'T00:00:00Z');
    const displayDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric'
    });

    return (
        <Card className="overflow-hidden">
            <div 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-card-hover transition-colors"
                onClick={() => navigate(`/briefing/${briefing._id}`)}
            >
                <div>
                    <h4 className="font-medium text-text mb-1">{displayDate}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {briefing.topics.map((topic: string) => (
                            <Badge key={topic} variant="neutral">{topic}</Badge>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted whitespace-nowrap">
                    <span>{briefing.sections.length} section{briefing.sections.length !== 1 ? 's' : ''}</span>
                    <ChevronRight className="w-5 h-5" />
                </div>
            </div>
        </Card>
    );
};

const BriefingHistoryList = () => {
    // Basic implementation for now, requesting page 1, 10 items
    const { data, isLoading, isError } = useBriefingHistory(1, 10);

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <EmptyState
                title="Failed to load history"
                description="There was a problem fetching your previous briefings. Please try again later."
                muted
            />
        );
    }

    if (!data?.briefings || data.briefings.length === 0) {
        return (
            <EmptyState
                title="No history yet"
                description="Your past daily briefings will appear here once they are generated."
                muted
            />
        );
    }

    return (
        <div className="space-y-4">
            {data.briefings.map((briefing: any) => (
                <BriefingHistoryItem key={briefing._id} briefing={briefing} />
            ))}
        </div>
    );
};

export default BriefingHistoryList;
