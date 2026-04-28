import { useState } from 'react';
import Button from '../ui/Button';
import Divider from '../ui/Divider';
import PageHeader from '../ui/PageHeader';

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
        <div className="space-y-4">
            <PageHeader
                title="History"
                subtitle="Review past briefings and refresh topics when needed."
                action={
                    isConfirmVisible ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-wider text-subtle">Clear all?</span>
                            <Button
                                type="button"
                                onClick={handleConfirmClear}
                                disabled={!canClearAll || isClearingAll}
                                variant="danger"
                                size="sm"
                            >
                                {isClearingAll ? 'Clearing...' : 'Yes'}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setShowClearConfirm(false)}
                                disabled={isClearingAll}
                                variant="outline"
                                size="sm"
                            >
                                No
                            </Button>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            onClick={() => setShowClearConfirm(true)}
                            disabled={!canClearAll || isClearingAll}
                            variant="danger"
                            size="sm"
                        >
                            Clear All History
                        </Button>
                    )
                }
            />
            <Divider />
        </div>
    );
};

export default HistoryHeader;