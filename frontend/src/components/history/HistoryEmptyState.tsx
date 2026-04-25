interface HistoryEmptyStateProps {
    message: string;
    muted?: boolean;
}

const HistoryEmptyState = ({ message, muted = false }: HistoryEmptyStateProps) => {
    return (
        <div className="p-8 text-center bg-[#13131a] border border-gray-800/50 rounded-lg">
            <p className={`font-mono text-sm ${muted ? 'text-gray-500' : 'text-gray-400'}`}>
                {message}
            </p>
        </div>
    );
};

export default HistoryEmptyState;