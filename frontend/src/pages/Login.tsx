import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/auth-context';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await API.post('/auth/login', { email, password });
            
            // Extract token and email from the Node response
            const { token, email: userEmail } = response.data;

            if (authContext) {
                authContext.login(token, userEmail);
            }

            navigate('/dashboard');
            
        } catch (err: any) {  // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="max-w-sm mx-auto mt-12">
            <h2>Login</h2>
            {error && <p className="text-red-600">{error}</p>}
            
            <form onSubmit={handleLogin} className="flex flex-col gap-2.5">
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <button type="submit">Log In</button>
            </form>
            <p>Need an account? <Link to="/register">Register here</Link></p>
        </div>
    );
};

export default Login;