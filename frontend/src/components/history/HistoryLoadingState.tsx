const HistoryLoadingState = () => {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface p-4">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <p className="text-[15px] text-muted font-mono">Retrieving historical briefings...</p>
        </div>
    );
};

export default HistoryLoadingState;