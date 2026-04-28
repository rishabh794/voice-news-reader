import type { HTMLAttributes } from 'react';

type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const variantClasses: Record<BadgeVariant, string> = {
    neutral: 'bg-elevated text-muted border border-border/70',
    primary: 'bg-primary/15 text-primary border border-primary/30',
    success: 'bg-success/15 text-success border border-success/30',
    warning: 'bg-warning/15 text-warning border border-warning/30',
    danger: 'bg-danger/15 text-danger border border-danger/30'
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

const Badge = ({ variant = 'neutral', className = '', ...props }: BadgeProps) => {
    const classes = [
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider',
        variantClasses[variant],
        className
    ]
        .filter(Boolean)
        .join(' ');

    return <span className={classes} {...props} />;
};

export default Badge;
