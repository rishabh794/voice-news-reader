import type { ReactNode } from 'react';
import Card from './Card';

interface EmptyStateProps {
    title?: string;
    description: string;
    action?: ReactNode;
    muted?: boolean;
    className?: string;
}

const EmptyState = ({
    title = 'Nothing here yet',
    description,
    action,
    muted = false,
    className = ''
}: EmptyStateProps) => {
    return (
        <Card className={['p-8 text-center', className].filter(Boolean).join(' ')} variant="surface">
            <div className="space-y-3">
                <h3 className="text-lg font-display text-text">
                    {title}
                </h3>
                <p className={muted ? 'text-[15px] text-subtle' : 'text-[15px] text-muted'}>
                    {description}
                </p>
                {action && <div className="flex justify-center">{action}</div>}
            </div>
        </Card>
    );
};

export default EmptyState;
