import { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmailToken } from '../services/api';
import { AuthContext } from '../context/auth-context';
import { useToast } from '../hooks/useToast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import VoxLogo from '../components/ui/VoxLogo';
import { getErrorMessage } from '../validation';
import '../pages/Home.css';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    
    const authContext = useContext(AuthContext);
    const { showToast } = useToast();
    const navigate = useNavigate();
    
    // Use ref to prevent strict mode double-firing the API call
    const hasAttemptedRef = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('No verification token provided in the URL.');
            return;
        }

        if (hasAttemptedRef.current) return;
        hasAttemptedRef.current = true;

        const verify = async () => {
            try {
                const response = await verifyEmailToken(token);
                setStatus('success');
                
                if (authContext) {
                    authContext.login(response.email);
                }
                
                showToast('Email verified successfully! You are now logged in.', 'success');
                
                // Small delay so user sees the success state before redirecting
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } catch (err) {
                setStatus('error');
                setErrorMessage(getErrorMessage(err, 'Failed to verify email. The link may have expired.'));
            }
        };

        verify();
    }, [token, authContext, navigate, showToast]);

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
                        Verifying your <br />account.
                    </h1>
                </div>
            </div>

            <div className="flex items-center justify-center px-6 py-12 flex-1">
                <Card className="w-full max-w-md p-6 sm:p-8 text-center" variant="card">
                    {status === 'loading' && (
                        <div className="space-y-6 py-8">
                            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-display text-text">Verifying...</h2>
                                <p className="text-[15px] text-muted">Please wait while we verify your email address.</p>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-6 py-8">
                            <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-display text-text">Email Verified!</h2>
                                <p className="text-[15px] text-muted">Your account is now active. Redirecting to dashboard...</p>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-6 py-4">
                            <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-display text-text">Verification Failed</h2>
                                <p className="text-[15px] text-red-400">{errorMessage}</p>
                            </div>
                            <Button className="w-full mt-4" onClick={() => navigate('/login')}>
                                Go to Login
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default VerifyEmail;
