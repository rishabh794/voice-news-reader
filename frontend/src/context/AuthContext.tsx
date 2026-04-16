import { useState, type ReactNode } from 'react';
import { AuthContext } from './auth-context';
import type { User } from './auth-context';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // LAZY INITIALIZATION: Check localStorage immediately on first load
   const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(() => {
        const storedEmail = localStorage.getItem('email');
        return storedEmail ? { email: storedEmail } : null;
    });

    const login = (newToken: string, email: string) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('email', email);
        setToken(newToken);
        setUser({ email });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout, 
            isAuthenticated: !!token 
        }}>
            {children}
        </AuthContext.Provider>
    );
};