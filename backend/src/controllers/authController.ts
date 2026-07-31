import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { verifyGoogleIdToken } from '../services/googleAuthService.js';
import { sendVerificationEmail } from '../services/emailService.js';

import crypto from 'crypto';

const createAccessToken = (userId: string): string =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: '15m' });

const createRefreshToken = (): string => {
    return crypto.randomBytes(40).toString('hex');
};

const isGoogleOnlyAccount = (user: any): boolean => {
    const hasLocalProvider = Boolean(user.providers?.local);
    const hasPassword = Boolean(user.password);

    return !hasPassword && !hasLocalProvider;
};

const isDuplicateKeyError = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000;

// REGISTER CONTROLLER
export const register = async (req: Request, res: Response): Promise<any> => {
    try {
        const rawEmail = req.body?.email;
        const rawPassword = req.body?.password;
        const email = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : '';
        const password = typeof rawPassword === 'string' ? rawPassword : '';

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            if (isGoogleOnlyAccount(existingUser)) {
                return res.status(400).json({ error: 'Account exists with Google sign-in. Continue with Google.' });
            }
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const newUser = new User({
            email,
            password: hashedPassword,
            isEmailVerified: false,
            verificationToken,
            verificationTokenExpiresAt,
            providers: {
                local: true,
                google: false
            }
        });
        await newUser.save();

        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // We still return 201, but the user will need to use "Resend Verification" later
        }

        res.status(201).json({ message: 'User created successfully. Please check your email to verify your account.' });
    } catch (error) {
        console.error('Registration Error:', error);
        if (isDuplicateKeyError(error)) {
            return res.status(409).json({ error: 'User already exists' });
        }
        res.status(500).json({ error: 'Server error during registration' });
    }
};

// LOGIN CONTROLLER
export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const rawEmail = req.body?.email;
        const rawPassword = req.body?.password;
        const email = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : '';
        const password = typeof rawPassword === 'string' ? rawPassword : '';

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (isGoogleOnlyAccount(user)) {
            return res.status(400).json({ error: 'This account uses Google sign-in. Continue with Google.' });
        }

        if (!user.password) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({ error: 'Please verify your email address to log in.', requiresVerification: true });
        }

        const accessToken = createAccessToken(String(user._id));
        const refreshToken = createRefreshToken();
        
        user.refreshTokens.push(refreshToken);
        await user.save();

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
        });

        res.json({ email: user.email, authProvider: 'local' });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// GOOGLE SIGN IN / SIGN UP CONTROLLER
export const googleAuth = async (req: Request, res: Response): Promise<any> => {
    try {
        const rawCredential = req.body?.credential;
        const credential = typeof rawCredential === 'string' ? rawCredential : '';

        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        const verifiedUser = await verifyGoogleIdToken(credential);
        let user = await User.findOne({ email: verifiedUser.email });

        if (!user) {
            user = new User({
                email: verifiedUser.email,
                googleId: verifiedUser.googleId,
                isEmailVerified: true, // Google verifies emails
                providers: {
                    local: false,
                    google: true
                }
            });
        } else {
            if (user.googleId && user.googleId !== verifiedUser.googleId) {
                return res.status(409).json({ error: 'Google account mismatch for this email address' });
            }

            user.googleId = verifiedUser.googleId;
            user.providers = {
                local: Boolean(user.providers?.local || user.password),
                google: true
            };
        }

        await user.save();

        const accessToken = createAccessToken(String(user._id));
        const refreshToken = createRefreshToken();
        
        user.refreshTokens.push(refreshToken);
        await user.save();

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
        });

        return res.json({ email: user.email, authProvider: 'google' });
    } catch (error) {
        console.error('Google Auth Error:', error);

        if (isDuplicateKeyError(error)) {
            return res.status(409).json({ error: 'Account already exists. Please continue with Google sign-in.' });
        }

        if (error instanceof Error && error.message.includes('not configured')) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(401).json({ error: 'Google authentication failed' });
    }
};

// GET CURRENT USER CONTROLLER
export const me = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ email: user.email });
    } catch (error) {
        console.error('Me Error:', error);
        res.status(500).json({ error: 'Server error fetching user' });
    }
};

// REFRESH CONTROLLER
export const refresh = async (req: Request, res: Response): Promise<any> => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: 'No refresh token provided' });
        }

        const user = await User.findOne({ refreshTokens: refreshToken });
        if (!user) {
            // Possible token reuse / stolen token scenario
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Rotate token
        const newAccessToken = createAccessToken(String(user._id));
        const newRefreshToken = createRefreshToken();

        user.refreshTokens = user.refreshTokens.filter(rt => rt !== refreshToken);
        user.refreshTokens.push(newRefreshToken);
        await user.save();

        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
        });

        res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
        console.error('Refresh Error:', error);
        res.status(500).json({ error: 'Server error during refresh' });
    }
};

// LOGOUT CONTROLLER
export const logout = async (req: Request, res: Response): Promise<any> => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            await User.updateOne(
                { refreshTokens: refreshToken },
                { $pull: { refreshTokens: refreshToken } }
            );
        }
    } catch (error) {
        console.error('Logout error removing refresh token:', error);
    }

    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
    });
    res.json({ message: 'Logged out successfully' });
};

// VERIFY EMAIL CONTROLLER
export const verifyEmail = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token } = req.body;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiresAt: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        // Mark user as verified
        user.isEmailVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpiresAt = null;

        const accessToken = createAccessToken(String(user._id));
        const refreshToken = createRefreshToken();
        
        user.refreshTokens.push(refreshToken);
        await user.save();

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
        });

        res.json({ message: 'Email verified successfully', email: user.email, authProvider: 'local' });
    } catch (error) {
        console.error('Verify Email Error:', error);
        res.status(500).json({ error: 'Server error during email verification' });
    }
};

// RESEND VERIFICATION EMAIL CONTROLLER
export const resendVerificationEmail = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email: rawEmail } = req.body;
        const email = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : '';

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Return success even if user doesn't exist for security (prevent email enumeration)
            return res.json({ message: 'If an account exists, a verification email has been sent.' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ error: 'Email is already verified.' });
        }

        if (isGoogleOnlyAccount(user)) {
            return res.status(400).json({ error: 'Google accounts are automatically verified.' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        user.verificationToken = verificationToken;
        user.verificationTokenExpiresAt = verificationTokenExpiresAt;
        await user.save();

        await sendVerificationEmail(email, verificationToken);

        res.json({ message: 'If an account exists, a verification email has been sent.' });
    } catch (error) {
        console.error('Resend Verification Email Error:', error);
        res.status(500).json({ error: 'Server error while resending verification email' });
    }
};
