import type { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    eyebrow?: string;
    action?: ReactNode;
    className?: string;
}

const PageHeader = ({ title, subtitle, eyebrow, action, className = '' }: PageHeaderProps) => {
    return (
        <div className={[
            'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
            className
        ].filter(Boolean).join(' ')}>
            <div className="space-y-2">
                {eyebrow && (
                    <div className="text-xs font-mono uppercase tracking-wider text-subtle">
                        {eyebrow}
                    </div>
                )}
                <h1 className="text-[28px] font-display tracking-tight text-text">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-[15px] text-muted max-w-2xl">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
    );
};

export default PageHeader;
