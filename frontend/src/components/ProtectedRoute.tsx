import { useContext, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const authContext = useContext(AuthContext);

    if (authContext?.isInitializing) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!authContext?.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};