import { useContext, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';
import { isGibberish } from '../../services/isGibberish';
import Button from './Button';
import SidebarToggle from './sidebar-toggle';
import VoxLogo from './VoxLogo';

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
    const gibberishMessage = 'Could not understand that query. Please try another search.';
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
        if (isGibberish(trimmed)) {
            showToast(gibberishMessage, 'error');
            return;
        }

        const currentQuery = (new URLSearchParams(location.search).get('q') ?? '').trim().toLowerCase();
        const normalizedSearch = trimmed.toLowerCase();
        if (location.pathname === '/dashboard' && currentQuery === normalizedSearch) {
            navigate('/dashboard', { replace: true, state: { query: trimmed } });
            return;
        }

        navigate(`/dashboard?q=${encodeURIComponent(trimmed)}`);
    };


    const handleLogout = () => {
        authContext?.logout();
        showToast('Logged out.', 'success');
        navigate('/login');
    };

    const mobileNavItems = isAuthenticated
        ? []
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
            <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 lg:px-10">
                
                {/* Left: Logo */}
                <div className="flex-1 flex items-center justify-start gap-3">
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
                            'flex items-center gap-2 rounded-md font-display text-base tracking-tight text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                            isAuthenticated ? 'lg:hidden' : ''
                        ].join(' ')}
                    >
                        <VoxLogo className="w-7 h-7 text-text" />
                        <span className="font-semibold text-lg">VoxNews</span>
                    </Link>
                </div>

                {/* Center: Links or Search */}
                <div className="flex-1 flex items-center justify-center">
                    {isAuthenticated ? (
                        <form
                            onSubmit={handleSearch}
                            className="hidden md:flex items-center gap-2 rounded-full border border-border bg-base/70 px-4 py-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-sm"
                        >
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search topics"
                                className="w-64 bg-transparent text-[15px] text-text placeholder:text-subtle focus-visible:outline-none"
                            />
                            <Button type="submit" variant="ghost" size="sm" className="h-7 px-3 text-muted hover:text-primary rounded-full">
                                Search
                            </Button>
                        </form>
                    ) : (
                        <div className="hidden md:flex items-center justify-center gap-8">
                            <Link to="/#how-it-works" className="text-sm font-medium text-muted hover:text-text transition-colors">How it works</Link>
                            <Link to="/login" className="text-sm font-medium text-text hover:text-primary transition-colors">Log in</Link>
                            <Link to="/register" className="text-sm font-medium text-text hover:text-primary transition-colors">Sign up</Link>
                        </div>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex-1 flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={themeToggleLabel}
                        title={themeToggleLabel}
                        className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text shadow-sm transition-all duration-300 hover:bg-primary/5 hover:text-primary hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                        {isDark ? (
                            <svg
                                className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
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
                                className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
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
                    ) : null}
                </div>
            </div>

            {mobileNavItems.length > 0 && (
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
            )}
        </header>
    );
};

export default TopBar;
