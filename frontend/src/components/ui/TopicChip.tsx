import type { HTMLAttributes, ReactNode } from 'react';

interface TopicChipProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onClick'> {
    label: string;
    selected: boolean;
    onToggle: () => void;
    disabled?: boolean;
    icon?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-[15px]'
};

const TopicChip = ({
    label,
    selected,
    onToggle,
    disabled = false,
    icon,
    size = 'md',
    className = '',
    ...props
}: TopicChipProps) => {
    const classes = [
        'inline-flex items-center gap-2 rounded-full font-medium transition-all duration-200 active:scale-95',
        sizeClasses[size],
        selected
            ? 'bg-primary border-2 border-primary text-white shadow-md hover:bg-primary/90'
            : 'bg-elevated border-2 border-border text-muted hover:border-primary/50 hover:text-text',
        disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'cursor-pointer',
        className
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                onToggle();
            }}
            disabled={disabled}
            className={classes}
            {...props}
        >
            {icon && <span className="text-lg">{icon}</span>}
            <span>{label}</span>
        </button>
    );
};

export default TopicChip;
