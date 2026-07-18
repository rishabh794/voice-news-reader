import { Resend } from 'resend';
import { renderBriefingEmail } from './emailTemplates.ts';
import dotenv from 'dotenv';

dotenv.config();

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'Voice News Reader <onboarding@resend.dev>';

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
