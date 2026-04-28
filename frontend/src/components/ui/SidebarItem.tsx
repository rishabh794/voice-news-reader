import { Link } from 'react-router-dom';

interface SidebarItemProps {
    to: string;
    label: string;
    active?: boolean;
    className?: string;
    onClick?: () => void;
}

const SidebarItem = ({ to, label, active = false, className = '', onClick }: SidebarItemProps) => {
    const classes = [
        'flex items-center gap-2 rounded-lg border-l-2 px-3 py-2 text-[15px] transition-colors duration-150 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        active
            ? 'border-primary bg-elevated text-text font-semibold'
            : 'border-transparent text-muted hover:text-text hover:bg-surface/70 font-medium',
        className
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <Link to={to} className={classes} onClick={onClick}>
            {label}
        </Link>
    );
};

export default SidebarItem;
