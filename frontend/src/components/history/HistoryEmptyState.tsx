import EmptyState from '../ui/EmptyState';

interface HistoryEmptyStateProps {
    message: string;
    muted?: boolean;
}

const HistoryEmptyState = ({ message, muted = false }: HistoryEmptyStateProps) => {
    return (
        <EmptyState
            title="No briefings"
            description={message}
            muted={muted}
        />
    );
};

export default HistoryEmptyState;