import { createContext } from 'react';

export interface User {
    email: string;
}

interface AuthContextType {
    user: User | null;
    isInitializing: boolean;
    login: (email: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);