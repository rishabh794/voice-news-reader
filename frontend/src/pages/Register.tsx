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

    const authContext = useContext(AuthContext);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await registerWithPassword(email, password);
            showToast('Registration successful! Please log in.', 'success');
            navigate('/login');
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

        authContext.login(authResponse.token, authResponse.email);
        showToast('Google account ready. Session initialized.', 'success');
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative hidden lg:flex flex-col justify-between bg-surface px-12 py-12">
                <div className="text-sm font-mono uppercase tracking-wider text-subtle">VoiceNews</div>
                <div className="space-y-6 max-w-md">
                    <h1 className="text-4xl font-display text-text">
                        Build a focused daily briefing in minutes.
                    </h1>
                    <p className="text-[15px] text-muted">
                        Create your account and start tracking the signals that matter to your sector.
                    </p>
                    <div className="space-y-2 text-[15px] text-muted">
                        <p>Fast topic search and summarized briefs.</p>
                        <p>Voice playback for hands-free review.</p>
                        <p>Clean archival history you can revisit anytime.</p>
                    </div>
                </div>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-warning/10 blur-3xl"></div>
                </div>
            </div>

            <div className="flex items-center justify-center px-6 py-12">
                <Card className="w-full max-w-md p-8" variant="card">
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
                </Card>
            </div>
        </div>
    );
};

export default Register;
