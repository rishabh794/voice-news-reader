import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import IORedisMock from 'ioredis-mock';

// Mock the redis instance globally so Upstash uses our in-memory mock
vi.mock('ioredis', () => {
    return {
        default: IORedisMock,
        Redis: IORedisMock
    };
});

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_key_that_is_at_least_32_chars_long_for_security';
    process.env.RATE_LIMIT_REDIS_URL = 'redis://localhost:6379';
    process.env.RATE_LIMIT_ENABLED = 'true';
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    // Clear all collections after each test to ensure test isolation
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection?.deleteMany({});
    }
});
