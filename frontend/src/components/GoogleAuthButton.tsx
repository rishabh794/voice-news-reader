import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { authenticateWithGoogle, type AuthResponse } from '../services/api';
import { getErrorMessage } from '../validation';

type GoogleAuthMode = 'signin' | 'signup';

interface GoogleAuthButtonProps {
    mode: GoogleAuthMode;
    onAuthenticated: (authResponse: AuthResponse) => void;
    onError: (message: string) => void;
}

const buttonTextByMode = {
    signin: 'signin_with',
    signup: 'signup_with'
} as const;

const GoogleAuthButton = ({ mode, onAuthenticated, onError }: GoogleAuthButtonProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    if (!googleClientId) {
        return null;
    }

    const handleGoogleSuccess = async (response: CredentialResponse) => {
        if (!response.credential) {
            onError('Google authentication did not return a valid credential.');
            return;
        }

        setIsSubmitting(true);
        try {
            const authResponse = await authenticateWithGoogle(response.credential);
            onAuthenticated(authResponse);
        } catch (error: unknown) {
            const errorMessage = getErrorMessage(error, 'Google authentication failed');
            onError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-6 space-y-4">
            <div className="relative flex items-center">
                <div className="h-px flex-1 bg-border/70"></div>
                <span className="px-3 text-xs uppercase tracking-wider text-subtle font-mono">or continue with</span>
                <div className="h-px flex-1 bg-border/70"></div>
            </div>

            <div className={`flex justify-center ${isSubmitting ? 'pointer-events-none opacity-70' : ''}`}>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => onError('Google sign-in popup was closed or failed.')}
                    text={buttonTextByMode[mode]}
                    shape="pill"
                    size="large"
                    width="300"
                    theme="outline"
                    logo_alignment="left"
                />
            </div>

            {isSubmitting && (
                <p className="text-center text-xs text-subtle">Verifying Google account...</p>
            )}
        </div>
    );
};

export default GoogleAuthButton;
