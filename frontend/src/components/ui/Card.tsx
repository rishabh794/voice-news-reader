import type { HTMLAttributes } from 'react';

type CardVariant = 'surface' | 'card' | 'elevated';

const variantClasses: Record<CardVariant, string> = {
    surface: 'bg-surface',
    card: 'bg-card',
    elevated: 'bg-elevated'
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
}

const Card = ({ variant = 'card', className = '', ...props }: CardProps) => {
    const classes = [
        'rounded-xl border border-border/70',
        variantClasses[variant],
        className
    ]
        .filter(Boolean)
        .join(' ');

    return <div className={classes} {...props} />;
};

export default Card;
