import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-primary/85',
    secondary: 'bg-elevated text-text border border-border/70 hover:border-border-strong hover:bg-card/70',
    outline: 'bg-transparent text-text border border-border/70 hover:border-border-strong hover:bg-surface/60',
    ghost: 'bg-transparent text-muted hover:text-text hover:bg-surface/60',
    danger: 'bg-danger/10 text-danger border border-danger/35 hover:bg-danger/18 hover:text-danger dark:hover:text-red-300 hover:border-danger/60'
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-[15px]',
    lg: 'h-11 px-5 text-[15px]'
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

const Button = ({
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}: ButtonProps) => {
    const classes = [
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none',
        sizeClasses[size],
        variantClasses[variant],
        className
    ]
        .filter(Boolean)
        .join(' ');

    return <button className={classes} {...props} />;
};

export default Button;
