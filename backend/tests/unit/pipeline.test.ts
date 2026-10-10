import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout } from '../../src/services/pipeline.js';

describe('pipeline — withTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should resolve if the promise finishes before the timeout', async () => {
        const promise = Promise.resolve('success');
        const result = await withTimeout(promise, 5000);
        expect(result).toBe('success');
    });

    it('should reject with timeout error if the promise takes too long', async () => {
        const slowPromise = new Promise<string>((resolve) => {
            setTimeout(() => resolve('too late'), 10000);
        });

        const race = withTimeout(slowPromise, 1000);

        // Advance time past the timeout
        vi.advanceTimersByTime(1500);

        await expect(race).rejects.toThrow('LLM request timed out.');
    });

    it('should propagate the underlying promise rejection', async () => {
        const failingPromise = Promise.reject(new Error('upstream error'));

        await expect(withTimeout(failingPromise, 5000)).rejects.toThrow('upstream error');
    });

    it('should clean up the timeout handle after resolution', async () => {
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

        const promise = Promise.resolve('done');
        await withTimeout(promise, 5000);

        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();
    });
});
