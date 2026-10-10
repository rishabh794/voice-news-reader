import { describe, it, expect } from 'vitest';
import {
    AI_NEWS_CATEGORIES,
    LEGACY_UNCATEGORIZED,
    isAiNewsCategory,
    normalizeHistoryCategory,
} from '../../src/utils/historyCategories.js';

describe('historyCategories — isAiNewsCategory', () => {
    it.each([...AI_NEWS_CATEGORIES])('should return true for valid category "%s"', (category) => {
        expect(isAiNewsCategory(category)).toBe(true);
    });

    it('should return false for Uncategorized (legacy value)', () => {
        expect(isAiNewsCategory('Uncategorized')).toBe(false);
    });

    it('should return false for non-string values', () => {
        expect(isAiNewsCategory(undefined)).toBe(false);
        expect(isAiNewsCategory(null)).toBe(false);
        expect(isAiNewsCategory(123)).toBe(false);
        expect(isAiNewsCategory({})).toBe(false);
    });

    it('should return false for unknown string values', () => {
        expect(isAiNewsCategory('Gaming')).toBe(false);
        expect(isAiNewsCategory('')).toBe(false);
        expect(isAiNewsCategory('technology')).toBe(false); // case-sensitive
    });
});

describe('historyCategories — normalizeHistoryCategory', () => {
    it.each([...AI_NEWS_CATEGORIES])('should pass through valid category "%s"', (category) => {
        expect(normalizeHistoryCategory(category)).toBe(category);
    });

    it('should pass through Uncategorized as-is', () => {
        expect(normalizeHistoryCategory('Uncategorized')).toBe('Uncategorized');
    });

    it('should normalize unknown strings to Uncategorized', () => {
        expect(normalizeHistoryCategory('InvalidCategory')).toBe(LEGACY_UNCATEGORIZED);
        expect(normalizeHistoryCategory('')).toBe(LEGACY_UNCATEGORIZED);
    });

    it('should normalize non-string values to Uncategorized', () => {
        expect(normalizeHistoryCategory(undefined)).toBe(LEGACY_UNCATEGORIZED);
        expect(normalizeHistoryCategory(null)).toBe(LEGACY_UNCATEGORIZED);
        expect(normalizeHistoryCategory(42)).toBe(LEGACY_UNCATEGORIZED);
    });
});

describe('historyCategories — AI_NEWS_CATEGORIES constant', () => {
    it('should contain exactly 8 categories', () => {
        expect(AI_NEWS_CATEGORIES).toHaveLength(8);
    });

    it('should be a readonly tuple (frozen in effect)', () => {
        const expected = [
            'Technology', 'Politics', 'Business', 'Sports',
            'Entertainment', 'Health', 'World', 'Science',
        ];
        expect([...AI_NEWS_CATEGORIES]).toEqual(expected);
    });
});
