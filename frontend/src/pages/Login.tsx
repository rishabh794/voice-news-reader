import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';
import { useToast } from '../hooks/useToast';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { loginWithPassword, type AuthResponse } from '../services/auth';
import { getErrorMessage } from '../validation';

const EyeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M3 3l18 18" />
        <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a19.9 19.9 0 0 1-4 4.9" />
        <path d="M6.6 6.7A20 20 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.8" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
);

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const authContext = useContext(AuthContext);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { token, email: userEmail } = await loginWithPassword(email, password);

            if (authContext) {
                authContext.login(token, userEmail);
            }

            showToast('Login successful. Session initialized.', 'success');
            navigate('/dashboard');
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err, 'Login failed');
            showToast(errorMessage, 'error');
        }
    };

    const handleGoogleAuthenticated = (authResponse: AuthResponse) => {
        if (!authContext) {
            showToast('Authentication context unavailable. Please retry.', 'error');
            return;
        }

        authContext.login(authResponse.token, authResponse.email);
        showToast('Google login successful. Session initialized.', 'success');
        navigate('/dashboard');
    };

    return (
        <div className="w-full max-w-md mx-auto mt-12 bg-[#0d0d12]/90 backdrop-blur-xl border border-gray-800/80 p-8 rounded-2xl shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)] relative overflow-hidden text-gray-100 font-sans">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>

            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-mono tracking-tight uppercase">
                    Login
                </h2>
                <p className="text-gray-400 text-sm mt-2 font-mono opacity-80">
                    Authenticate to access voice console
                </p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-cyan-500 uppercase tracking-wider pl-1">
                        Target Email
                    </label>
                    <input
                        type="email"
                        placeholder="user@network.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-[#13131a] border border-gray-700/60 rounded-xl px-4 py-3 text-gray-200 font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-cyan-500 uppercase tracking-wider pl-1">
                        Access Key
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-[#13131a] border border-gray-700/60 rounded-xl px-4 py-3 pr-12 text-gray-200 font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prevShowPassword) => !prevShowPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute inset-y-0 right-3 my-auto flex h-9 w-9 items-center justify-center text-gray-400 transition-colors hover:text-cyan-300"
                        >
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="mt-4 w-full relative group overflow-hidden bg-gray-900 border border-cyan-500/30 rounded-xl px-4 py-3 text-cyan-400 font-mono font-bold uppercase tracking-widest hover:text-white transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-[inset_0_0_20px_rgba(6,182,212,0.4)] transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        Initialize Session
                    </span>
                </button>

                <GoogleAuthButton
                    mode="signin"
                    onAuthenticated={handleGoogleAuthenticated}
                    onError={(message) => showToast(message, 'error')}
                />
            </form>

            <div className="mt-8 border-t border-gray-800/60 pt-6 text-center">
                <p className="text-gray-500 text-sm font-mono">
                    Unregistered?{' '}
                    <Link
                        to="/register"
                        className="text-indigo-400 hover:text-cyan-400 transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    >
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
