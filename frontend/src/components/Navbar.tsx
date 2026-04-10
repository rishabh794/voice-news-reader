import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';

const Navbar = () => {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        authContext?.logout();
        navigate('/login');
    };

    return (
        <nav className="p-4 border-b border-gray-300 mb-5 flex gap-4 items-center">
            <Link to="/">Home</Link>

            {!authContext?.isAuthenticated ? (
                <>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                </>
            ) : (
                <>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/history">History</Link>
                    <button 
                        onClick={handleLogout} 
                        className="ml-auto px-2.5 py-1.5 cursor-pointer border border-black bg-red-200"
                    >
                        Logout
                    </button>
                </>
            )}
        </nav>
    );
};

export default Navbar;