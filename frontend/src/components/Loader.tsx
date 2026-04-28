const Loader = () => {
    return (
        <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-6 h-12 w-12">
                <div className="absolute inset-0 rounded-full border border-border/70"></div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
            </div>

            <div className="space-y-1 text-center">
                <p className="text-[15px] font-mono uppercase tracking-wider text-muted">
                    Fetching the latest articles
                </p>
                <p className="text-xs text-subtle">
                    Preparing your briefing
                </p>
            </div>
        </div>
    );
};

export default Loader;