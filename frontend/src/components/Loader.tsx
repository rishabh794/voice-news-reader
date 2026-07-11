interface LoaderProps {
    simple?: boolean;
    message?: string;
    submessage?: string;
}

const Loader = ({ simple, message = 'Fetching the latest articles', submessage = 'Preparing your briefing' }: LoaderProps = {}) => {
    if (simple) {
        return (
            <div className="relative h-6 w-6">
                <div className="absolute inset-0 rounded-full border-2 border-current/20"></div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-6 h-12 w-12">
                <div className="absolute inset-0 rounded-full border border-border/70"></div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
            </div>

            {(message || submessage) && (
                <div className="space-y-1 text-center">
                    {message && (
                        <p className="text-[15px] font-mono uppercase tracking-wider text-muted">
                            {message}
                        </p>
                    )}
                    {submessage && (
                        <p className="text-xs text-subtle">
                            {submessage}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Loader;