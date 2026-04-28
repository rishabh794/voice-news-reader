import type { ButtonHTMLAttributes } from 'react';

type SidebarToggleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    open: boolean;
};

const SidebarToggle = ({ open, className = '', ...props }: SidebarToggleProps) => {
    return (
        <button
            type="button"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-pressed={open}
            className={[
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-elevated text-muted',
                'transition-colors duration-200 hover:border-border-strong hover:bg-card hover:text-text',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base',
                'active:bg-surface',
                'sm:h-9 sm:w-9',
                className
            ].join(' ')}
            {...props}
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path strokeLinecap="round" d="M4 7h16" />
                <path strokeLinecap="round" d="M4 12h16" />
                <path strokeLinecap="round" d="M4 17h10" />
            </svg>
        </button>
    );
};

export default SidebarToggle;
