import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import Divider from './Divider';
import SidebarItem from './SidebarItem';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
    const location = useLocation();
    const authContext = useContext(AuthContext);
    const isAuthenticated = Boolean(authContext?.isAuthenticated);

    const authItems = [
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'History', to: '/history' },
        { label: 'Saved', to: '/saved' }
    ];

    const items = isAuthenticated ? authItems : [];

    const isItemActive = (to: string) => {
        if (to.includes('#')) {
            const [path, hash] = to.split('#');
            return location.pathname === path && location.hash === `#${hash}`;
        }
        return location.pathname === to;
    };

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    className="fixed inset-0 z-30 bg-base/60 lg:hidden"
                    onClick={onClose}
                />
            )}
            <aside
                className={[
                    'fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-border/80 bg-surface transition-transform duration-200',
                    'lg:flex lg:translate-x-0',
                    isOpen ? 'flex translate-x-0' : 'flex -translate-x-full lg:translate-x-0'
                ].join(' ')}
            >
            <div className="flex h-16 items-center border-b border-border/70 px-6">
                <Link to="/" className="font-display text-lg tracking-tight text-text">
                    VoiceNews
                </Link>
            </div>
            <div className="flex-1 px-4 py-6 space-y-2">
                {items.map((item) => (
                    <SidebarItem
                        key={item.label}
                        to={item.to}
                        label={item.label}
                        active={isItemActive(item.to)}
                        onClick={onClose}
                    />
                ))}
                <Divider className="my-4" />
                <div className="text-xs text-subtle font-mono uppercase tracking-wider">
                    Voice-first market intelligence
                </div>
            </div>
            </aside>
        </>
    );
};

export default Sidebar;
