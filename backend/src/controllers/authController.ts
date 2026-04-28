import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { verifyGoogleIdToken } from '../services/googleAuthService.js';

const createAuthToken = (userId: string): string =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: '14d' });

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

        const newUser = new User({
            email,
            password: hashedPassword,
            providers: {
                local: true,
                google: false
            }
        });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
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

        const token = createAuthToken(String(user._id));

        res.json({ token, email: user.email, authProvider: 'local' });
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

        const token = createAuthToken(String(user._id));
        return res.json({ token, email: user.email, authProvider: 'google' });
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