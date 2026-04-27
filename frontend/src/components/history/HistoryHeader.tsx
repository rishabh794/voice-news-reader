import { useState } from 'react';

type HistoryHeaderProps = {
    canClearAll: boolean;
    isClearingAll: boolean;
    onClearAll: () => void;
};

const HistoryHeader = ({ canClearAll, isClearingAll, onClearAll }: HistoryHeaderProps) => {
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const isConfirmVisible = showClearConfirm && canClearAll;

    const handleConfirmClear = () => {
        setShowClearConfirm(false);
        onClearAll();
    };

    return (
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-800/60">
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-cyan-600 rounded-sm"></div>
                <h2 className="text-xl font-medium text-gray-100 font-mono uppercase tracking-wide">
                    Briefing_Archive
                </h2>
            </div>

            {isConfirmVisible ? (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-gray-400">Clear all?</span>
                    <button
                        type="button"
                        onClick={handleConfirmClear}
                        disabled={!canClearAll || isClearingAll}
                        className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wide border border-red-500/70 text-red-300 rounded-md transition-colors hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isClearingAll ? 'Clearing...' : 'Yes'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        disabled={isClearingAll}
                        className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wide border border-gray-600 text-gray-300 rounded-md transition-colors hover:bg-gray-700/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        No
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={!canClearAll || isClearingAll}
                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide border border-red-500/60 text-red-300 rounded-md transition-colors hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Clear All History
                </button>
            )}
        </div>
    );
};

export default HistoryHeader;