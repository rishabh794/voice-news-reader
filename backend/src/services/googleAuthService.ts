import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client();

export interface VerifiedGoogleUser {
    googleId: string;
    email: string;
}

const parseConfiguredGoogleClientIds = (): string[] => {
    const rawClientIds = [
        process.env.GOOGLE_CLIENT_IDS,
        process.env.GOOGLE_CLIENT_ID,
        process.env.VITE_GOOGLE_CLIENT_ID
    ]
        .filter((value): value is string => Boolean(value))
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    return [...new Set(rawClientIds)];
};

export const verifyGoogleIdToken = async (credential: string): Promise<VerifiedGoogleUser> => {
    const audience = parseConfiguredGoogleClientIds();
    if (audience.length === 0) {
        throw new Error('Google OAuth client id is not configured on the backend.');
    }

    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) {
        throw new Error('Google credential does not contain a verified email.');
    }

    return {
        googleId: payload.sub,
        email: payload.email.toLowerCase()
    };
};
