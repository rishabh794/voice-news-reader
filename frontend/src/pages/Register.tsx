import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await API.post('/auth/register', { email, password });
            alert('Registration successful! Please log in.');
            navigate('/login');
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-12 bg-[#0d0d12]/90 backdrop-blur-xl border border-gray-800/80 p-8 rounded-2xl shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)] relative overflow-hidden text-gray-100 font-sans">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
            
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-mono tracking-tight uppercase">
                    Register
                </h2>
                <p className="text-gray-400 text-sm mt-2 font-mono opacity-80">
                    Create a new voice profile
                </p>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-950/30 border border-red-500/50 rounded-lg text-red-400 text-sm font-mono flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                    <p>{error}</p>
                </div>
            )}
            
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
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
                        New Access Key
                    </label>
                    <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        className="w-full bg-[#13131a] border border-gray-700/60 rounded-xl px-4 py-3 text-gray-200 font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300"
                    />
                </div>

                <button 
                    type="submit"
                    className="mt-4 w-full relative group overflow-hidden bg-gray-900 border border-cyan-500/30 rounded-xl px-4 py-3 text-cyan-400 font-mono font-bold uppercase tracking-widest hover:text-white transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-[inset_0_0_20px_rgba(6,182,212,0.4)] transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        Create Account
                    </span>
                </button>
            </form>

            <div className="mt-8 border-t border-gray-800/60 pt-6 text-center">
                <p className="text-gray-500 text-sm font-mono">
                    Already registered?{' '}
                    <Link 
                        to="/login" 
                        className="text-indigo-400 hover:text-cyan-400 transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    >
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;