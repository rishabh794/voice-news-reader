import React, { useContext, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const authContext = useContext(AuthContext);
    const token = localStorage.getItem('token');

    if (!authContext?.isAuthenticated && !token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};