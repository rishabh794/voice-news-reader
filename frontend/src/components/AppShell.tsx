import { useContext, useState, type ReactNode } from 'react';
import { AuthContext } from '../context/auth-context';
import Sidebar from './ui/Sidebar';
import TopBar from './ui/TopBar';

interface AppShellProps {
    children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
    const authContext = useContext(AuthContext);
    const isAuthenticated = Boolean(authContext?.isAuthenticated);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-base text-text">
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
                <main className="py-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppShell;
