import { useContext, useState, useEffect, type ReactNode } from 'react';
import { AuthContext } from '../context/auth-context';
import { useToast } from '../hooks/useToast';
import Sidebar from './ui/Sidebar';
import TopBar from './ui/TopBar';

interface AppShellProps {
    children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
    const authContext = useContext(AuthContext);
    const isAuthenticated = Boolean(authContext?.isAuthenticated);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { showToast } = useToast();

    // Listen for rate-limit events dispatched by the Axios interceptor
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            showToast(detail?.message || 'Too many requests. Please wait.', 'error');
        };
        window.addEventListener('api:ratelimit', handler);
        return () => window.removeEventListener('api:ratelimit', handler);
    }, [showToast]);
    return (
        <div className="min-h-screen bg-base text-text overflow-x-clip">
            {isAuthenticated && (
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            )}
            <div className={['min-h-screen', isAuthenticated ? 'lg:pl-64' : ''].join(' ')}>
                <TopBar
                    showSidebarToggle={isAuthenticated}
                    isSidebarOpen={isSidebarOpen}
                    onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
                />
                <main className={isAuthenticated ? "py-4 sm:py-8 pb-24 sm:pb-8" : "pb-24 sm:pb-0"}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppShell;
