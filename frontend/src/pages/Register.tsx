import { useContext, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { registerWithPassword, type AuthResponse } from '../services/api';
import { getErrorMessage } from '../validation';
import VoxLogo from '../components/ui/VoxLogo';
import '../pages/Home.css';

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

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const authContext = useContext(AuthContext);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await registerWithPassword(email, password);
            setIsSuccess(true);
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err, 'Registration failed');
            showToast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleAuthenticated = (authResponse: AuthResponse) => {
        if (!authContext) {
            showToast('Authentication context unavailable. Please retry.', 'error');
            return;
        }

        authContext.login(authResponse.email);
        showToast('Google account ready. Session initialized.', 'success');
        navigate('/dashboard');
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="auth-gradient-panel flex flex-col justify-center min-h-[40vh] lg:min-h-0">
                <div className="auth-gradient-bg" />
                <div className="auth-gradient-orb auth-gradient-orb-1" />
                <div className="auth-panel-content p-4 sm:p-8 w-full">
                    <div className="mb-10 inline-flex items-center gap-3">
                        <VoxLogo className="w-10 h-10 text-primary" />
                        <span className="font-display font-bold text-2xl tracking-tight text-white dark:text-white">VoxNews</span>
                    </div>

                    <h1 className="auth-panel-heading font-display">
                        Start your <br />morning right.
                    </h1>
                    <p className="auth-panel-sub">
                        Create your account and start tracking the topics that matter. Voice search, daily briefings, and a clean reader — all in one place.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-center px-6 py-12 flex-1">
                <Card className="w-full max-w-md p-6 sm:p-8" variant="card">
                    {isSuccess ? (
                        <div className="text-center space-y-6 py-8">
                            <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-display text-text">Check your email</h2>
                                <p className="text-[15px] text-muted">
                                    We've sent a verification link to <span className="font-semibold text-text">{email}</span>. Please click the link to activate your account.
                                </p>
                            </div>
                            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/login')}>
                                Return to login
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 space-y-2">
                                <h2 className="text-2xl font-display text-text">Create your account</h2>
                                <p className="text-[15px] text-muted">Set up your credentials to start tracking topics.</p>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-5">
                                <Input
                                    type="email"
                                    label="Email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />

                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-wider text-subtle">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="********"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full rounded-lg border border-border/70 bg-surface px-3 py-2 pr-10 text-[15px] text-text placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-colors duration-150"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prevShowPassword) => !prevShowPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute inset-y-0 right-2 flex h-9 w-9 items-center justify-center text-subtle hover:text-text transition-colors duration-150"
                                        >
                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating account...' : 'Create account'}
                                </Button>

                                <GoogleAuthButton
                                    mode="signup"
                                    onAuthenticated={handleGoogleAuthenticated}
                                    onError={(message) => showToast(message, 'error')}
                                />
                            </form>

                            <div className="mt-6 text-[15px] text-subtle">
                                Already have an account?{' '}
                                <Link to="/login" className="text-primary hover:text-text transition-colors duration-150">
                                    Sign in
                                </Link>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Register;
