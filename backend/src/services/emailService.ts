import { Resend } from 'resend';
import { renderBriefingEmail } from './emailTemplates.js';
import dotenv from 'dotenv';

dotenv.config();

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'Voice News Reader <noreply@voxnews.site>';

interface BriefingEmailData {
    date: string;
    script: string;
    sections: Array<{
        topic: string;
        summary: string;
        articles: Array<{
            title: string;
            url: string;
            image: string;
            source: { name: string };
        }>;
    }>;
}

/**
 * Send a briefing email to a user via Resend.
 * Throws on failure so the caller can handle retries.
 */
export const sendBriefingEmail = async (to: string, briefing: BriefingEmailData): Promise<void> => {
    if (!resend) {
        console.warn('[Email] Resend not configured (RESEND_API_KEY missing). Skipping email.');
        return;
    }

    const html = renderBriefingEmail(briefing);

    const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to,
        subject: `Your Daily Briefing — ${formatDate(briefing.date)}`,
        html
    });

    if (error) {
        throw new Error(`Resend API error: ${error.message}`);
    }
};

/**
 * Format an ISO date string into a readable format.
 * '2026-07-14' → 'July 14, 2026'
 */
const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate + 'T00:00:00Z');
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
    });
};

/**
 * Send an email verification link to a user.
 */
export const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
    if (!resend) {
        console.warn('[Email] Resend not configured. Skipping verification email. (Token: ' + token + ')');
        return;
    }

    const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://voice-news-reader.vercel.app' : 'http://localhost:5173');
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify your email address</h2>
            <p>Welcome to Voice News Reader! Please click the button below to verify your email address and activate your account.</p>
            <div style="margin: 30px 0;">
                <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
            </div>
            <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
            <p style="color: #999; font-size: 12px; margin-top: 40px;">This link expires in 24 hours.</p>
        </div>
    `;

    const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to,
        subject: 'Verify your email address - Voice News Reader',
        html
    });

    if (error) {
        throw new Error(`Resend API error: ${error.message}`);
    }
};
