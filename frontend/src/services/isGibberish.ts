const NAVIGATION_KEYWORDS = [
    'history',
    'saved article',
    'saved articles',
    'bookmark',
    'bookmarks',
    'dashboard'
];

const normalizeText = (input: string): string => {
    return input.toLowerCase().replace(/\s+/g, ' ').trim();
};

// The goal of this function is to take a messy, raw string of text and turn it into a pristine array of individual words (tokens) so the math engine can analyze them.
const tokenize = (input: string): string[] => {
    return input
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
};

const hasVowelLikeSound = (token: string): boolean => /[aeiouy]/i.test(token);

export const isGibberish = (input: string): boolean => {
    const normalized = normalizeText(input);
    if (!normalized) return true;

    if (NAVIGATION_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
        return false;
    }
    if (normalized.length < 3) return true;
    if (!/[a-z0-9]/.test(normalized)) return true;
    if (/(.)\1{4,}/.test(normalized)) return true;

    const tokens = tokenize(normalized);
    if (tokens.length === 0) return true;

    const letterTokens = tokens.filter((token) => /[a-z]/.test(token));
    if (letterTokens.length === 0) return false;

    if (tokens.length === 1) {
        const [singleToken] = tokens;

        if (singleToken.length >= 6 && !hasVowelLikeSound(singleToken)) return true;
        if (singleToken.length >= 5 && new Set(singleToken).size <= 2) return true;
        return false;
    }

    const longLetterTokens = letterTokens.filter((token) => token.length >= 6);
    const consonantHeavyCount = longLetterTokens.filter((token) => !hasVowelLikeSound(token)).length;
    const consonantHeavyRatio = longLetterTokens.length === 0
        ? 0
        : consonantHeavyCount / longLetterTokens.length;

    const mostlyRepeatedWord = tokens.length >= 3 && (new Set(tokens).size / tokens.length) <= 0.34;

    if (consonantHeavyRatio >= 0.75) return true;
    if (mostlyRepeatedWord && tokens[0].length > 2) return true;

    return false;
};
