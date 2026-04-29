import { useContext, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';
import Button from './Button';
import SidebarToggle from './sidebar-toggle';

interface TopBarProps {
    showSidebarToggle?: boolean;
    isSidebarOpen?: boolean;
    onSidebarToggle?: () => void;
}

const TopBar = ({
    showSidebarToggle = false,
    isSidebarOpen = false,
    onSidebarToggle
}: TopBarProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const authContext = useContext(AuthContext);
    const isAuthenticated = Boolean(authContext?.isAuthenticated);
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const themeToggleLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

    useEffect(() => {
        const currentQuery = new URLSearchParams(location.search).get('q') ?? '';
        setSearchTerm(currentQuery);
    }, [location.search]);

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        const trimmed = searchTerm.trim();
        if (!trimmed) return;
        navigate(`/dashboard?q=${encodeURIComponent(trimmed)}`);
    };

    const handleLogout = () => {
        authContext?.logout();
        showToast('Logged out.', 'success');
        navigate('/login');
    };

    const mobileNavItems = isAuthenticated
        ? [
            { label: 'Home', to: '/' },
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'History', to: '/history' },
            { label: 'Saved', to: '/saved' }
        ]
        : [
            { label: 'Home', to: '/' },
            { label: 'Login', to: '/login' },
            { label: 'Register', to: '/register' }
        ];

    const isMobileItemActive = (to: string) => {
        if (to.includes('#')) {
            const [path, hash] = to.split('#');
            return location.pathname === path && location.hash === `#${hash}`;
        }
        return location.pathname === to;
    };

    return (
        <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-6 lg:px-10">
                <div className="flex items-center gap-3">
                    {showSidebarToggle && (
                        <SidebarToggle
                            open={isSidebarOpen}
                            onClick={onSidebarToggle}
                            className="lg:hidden"
                        />
                    )}
                    <Link
                        to="/"
                        className={[
                            'rounded-md font-display text-base tracking-tight text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                            isAuthenticated ? 'lg:hidden' : ''
                        ].join(' ')}
                    >
                        VoiceNews
                    </Link>
                    {isAuthenticated && (
                        <form
                            onSubmit={handleSearch}
                            className="hidden md:flex items-center gap-2 rounded-lg border border-border/70 bg-base/70 px-3 py-2"
                        >
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search topics"
                                className="w-56 bg-transparent text-[15px] text-text placeholder:text-subtle focus-visible:outline-none"
                            />
                            <Button type="submit" variant="outline" size="sm">
                                Search
                            </Button>
                        </form>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={themeToggleLabel}
                        title={themeToggleLabel}
                        className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface/80 text-muted transition-colors duration-150 hover:bg-elevated hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                        {isDark ? (
                            <svg
                                className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2" />
                                <path d="M12 20v2" />
                                <path d="M4.93 4.93l1.41 1.41" />
                                <path d="M17.66 17.66l1.41 1.41" />
                                <path d="M2 12h2" />
                                <path d="M20 12h2" />
                                <path d="M4.93 19.07l1.41-1.41" />
                                <path d="M17.66 6.34l1.41-1.41" />
                            </svg>
                        ) : (
                            <svg
                                className="h-4 w-4 transition-transform duration-150 group-hover:-rotate-12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M21 12.8A9 9 0 0 1 11.2 3a7 7 0 1 0 9.8 9.8z" />
                            </svg>
                        )}
                    </button>
                    {isAuthenticated ? (
                        <>
                            <div className="hidden md:flex flex-col text-right">
                                <span className="text-xs text-subtle">Signed in as</span>
                                <span className="text-sm text-text">
                                    {authContext?.user?.email ?? 'Account'}
                                </span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="border border-danger/30 text-danger hover:border-danger/60 hover:bg-danger/15 hover:text-danger dark:hover:text-red-300"
                            >
                                Logout
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="rounded-md px-1 py-1 text-[15px] text-muted hover:text-text transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-lg border border-border/70 bg-elevated px-3 py-1.5 text-[15px] text-text transition-colors duration-150 hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <nav className="mx-auto flex max-w-[1400px] items-center gap-2 px-6 pb-3 text-[15px] lg:hidden">
                {mobileNavItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.to}
                        className={[
                            'rounded-md px-2.5 py-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                            isMobileItemActive(item.to)
                                ? 'bg-elevated text-text'
                                : 'text-muted hover:text-text hover:bg-surface/70'
                        ].join(' ')}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
        </header>
    );
};

export default TopBar;
