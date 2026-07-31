import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        env: {
            REDIS_URL: 'redis://localhost:6379',
            JWT_SECRET: 'test_secret_key_that_is_at_least_32_chars_long_for_security',
            NODE_ENV: 'test'
        }
    },
});
