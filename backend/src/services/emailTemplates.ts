interface EmailArticle {
    title: string;
    url: string;
    image: string;
    source: { name: string };
}

interface EmailSection {
    topic: string;
    summary: string;
    articles: EmailArticle[];
}

interface EmailBriefingData {
    date: string;
    sections: EmailSection[];
}

/**
 * Render a briefing as an inline-styled HTML email.
 * Uses only inline CSS for maximum email client compatibility
 * (Gmail, Outlook, Apple Mail, etc. all strip <style> tags).
 */
export const renderBriefingEmail = (briefing: EmailBriefingData): string => {
    const dateFormatted = formatEmailDate(briefing.date);
    const sectionsHtml = briefing.sections.map(renderSection).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Daily Briefing — ${dateFormatted}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a2e;">
        <tr>
            <td align="center" style="padding: 0 16px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); text-align: center;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #8b8fa3; text-transform: uppercase; letter-spacing: 2px;">Voice News Reader</p>
                            <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #ffffff;">Your Daily Briefing</h1>
                            <p style="margin: 0; font-size: 15px; color: #a0a4b8;">${dateFormatted}</p>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #1a1a2e; border-bottom: 1px solid #2a2a3e;">
                            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #c8cad0;">
                                Good morning! Here's what's happening across your topics today.
                            </p>
                        </td>
                    </tr>

                    <!-- Sections -->
                    ${sectionsHtml}

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px; background-color: #1a1a2e; text-align: center; border-top: 1px solid #2a2a3e;">
                            <p style="margin: 0 0 16px; font-size: 13px; color: #6b6f82;">
                                You're receiving this because you enabled daily briefing emails. 
                                To unsubscribe, go to your briefing settings in the app.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #4a4d5e;">
                                Voice News Reader &copy; ${new Date().getFullYear()}
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`.trim();
};

const renderSection = (section: EmailSection): string => {
    const articlesHtml = section.articles
        .map(renderArticle)
        .join('');

    return `
                    <tr>
                        <td style="padding: 24px 32px; background-color: #1a1a2e; border-bottom: 1px solid #2a2a3e;">
                            <!-- Topic badge -->
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                                <tr>
                                    <td style="padding: 4px 14px; background-color: #7c3aed; border-radius: 20px; font-size: 12px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
                                        ${escapeHtml(section.topic)}
                                    </td>
                                </tr>
                            </table>
                            <!-- Summary -->
                            <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #c8cad0;">
                                ${escapeHtml(section.summary)}
                            </p>
                            <!-- Articles -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                ${articlesHtml}
                            </table>
                        </td>
                    </tr>`;
};

const renderArticle = (article: EmailArticle): string => {
    const sourceName = article.source?.name || 'News';

    return `
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #22223a; border-radius: 10px; overflow: hidden;">
                                            <tr>
                                                <td style="padding: 14px 16px;">
                                                    <a href="${escapeHtml(article.url)}" style="text-decoration: none; color: #e0e2ea; font-size: 14px; font-weight: 600; line-height: 1.4; display: block;">
                                                        ${escapeHtml(article.title)}
                                                    </a>
                                                    <p style="margin: 6px 0 0; font-size: 12px; color: #6b6f82;">
                                                        ${escapeHtml(sourceName)}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>`;
};

const escapeHtml = (text: string): string => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const formatEmailDate = (isoDate: string): string => {
    const date = new Date(isoDate + 'T00:00:00Z');
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
    });
};
