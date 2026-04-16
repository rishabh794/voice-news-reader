import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';

const Navbar = () => {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = () => {
        authContext?.logout();
        navigate('/login');
    };

    return (
        <nav
            className={`
                fixed top-0 left-0 right-0 z-50
                flex items-center gap-1 px-6 h-14
                transition-all duration-300
                border-b 
                ${scrolled
                    ? 'bg-[#020617]/80 backdrop-blur-xl border-cyan-400/10 shadow-[0_4px_32px_rgba(0,0,0,0.4)]'
                    : 'bg-[#020617]/50 backdrop-blur-md border-white/5'
                }
            `}
        >
            {/* Brand */}
            <Link
                to="/"
                className=" text-sm font-bold tracking-tight text-slate-100 mr-4 hover:text-cyan-400 transition-colors duration-200"
            >
                VoiceNews
            </Link>

            {/* left divider */}
            <div className="w-px h-4 bg-white/10 mr-3" />

            {/* Nav links */}
            <Link
                to="/"
                className="text-xs tracking-wide text-slate-400 hover:text-slate-100 transition-colors duration-200 px-3 py-1.5 rounded-md hover:bg-white/5"
            >
                Home
            </Link>

            {!authContext?.isAuthenticated ? (
                <>
                    <Link
                        to="/login"
                        className="text-xs tracking-wide text-slate-400 hover:text-slate-100 transition-colors duration-200 px-3 py-1.5 rounded-md hover:bg-white/5"
                    >
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="text-xs tracking-wide text-slate-100 px-4 py-1.5 rounded-md ml-1 border border-cyan-400/40 bg-cyan-400/10 hover:bg-cyan-400/20 hover:border-cyan-400/60 transition-all duration-200"
                    >
                        Register
                    </Link>
                </>
            ) : (
                <>
                    <Link
                        to="/dashboard"
                        className="text-xs tracking-wide text-slate-400 hover:text-slate-100 transition-colors duration-200 px-3 py-1.5 rounded-md hover:bg-white/5"
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/history"
                        className="text-xs tracking-wide text-slate-400 hover:text-slate-100 transition-colors duration-200 px-3 py-1.5 rounded-md hover:bg-white/5"
                    >
                        History
                    </Link>
                    <Link
                        to="/saved"
                        className="text-xs tracking-wide text-slate-400 hover:text-slate-100 transition-colors duration-200 px-3 py-1.5 rounded-md hover:bg-white/5"
                    >
                        Saved
                    </Link>

                    <div className="ml-auto flex items-center gap-4">
                        {authContext.user?.email && (
                            <span className="text-xs tracking-wide text-slate-400">
                                Welcome, <span className="text-slate-100 font-medium">{authContext.user.email}</span>
                            </span>
                        )}
                        
                        <button
                            onClick={handleLogout}
                            className="text-xs tracking-wide text-red-400 px-4 py-1.5 rounded-md border border-red-400/30 bg-red-400/8 hover:bg-red-400/15 hover:border-red-400/50 cursor-pointer transition-all duration-200"
                        >
                            Logout
                        </button>
                    </div>
                </>
            )}
        </nav>
    );
};

export default Navbar;