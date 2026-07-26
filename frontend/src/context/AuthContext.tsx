import { useState, useEffect, type ReactNode } from 'react';
import { AuthContext } from './auth-context';
import type { User } from './auth-context';
import { fetchCurrentUser, logoutFromServer } from '../services/api';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        let mounted = true;
        const initAuth = async () => {
            try {
                const { email } = await fetchCurrentUser();
                if (mounted) {
                    setUser({ email });
                }
            } catch (err) {
                if (mounted) {
                    setUser(null);
                }
            } finally {
                if (mounted) {
                    setIsInitializing(false);
                }
            }
        };

        initAuth();

        return () => {
            mounted = false;
        };
    }, []);

    const login = (email: string) => {
        setUser({ email });
    };

    const logout = async () => {
        try {
            await logoutFromServer();
        } catch (err) {
            console.error('Logout error', err);
        } finally {
            setUser(null);
            sessionStorage.clear();
        }
    };

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            sessionStorage.clear();
        };

        window.addEventListener('api:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('api:unauthorized', handleUnauthorized);
    }, []);

    return (
        <AuthContext.Provider value={{ 
            user, 
            isInitializing,
            login, 
            logout, 
            isAuthenticated: !!user 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
