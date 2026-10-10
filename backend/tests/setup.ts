import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import IORedisMock from 'ioredis-mock';

// Set test environment variables immediately to avoid any real service calls
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_that_is_at_least_32_chars_long_for_security';
process.env.RATE_LIMIT_REDIS_URL = 'redis://localhost:6379';
process.env.RATE_LIMIT_ENABLED = 'true';
process.env.RESEND_API_KEY = 'mock_resend_api_key_test';
process.env.RESEND_FROM_EMAIL = 'Voice News Reader <noreply@test.local>';
process.env.GROQ_API_KEY = 'mock_groq_api_key_test';
process.env.GNEWS_API_KEY = 'mock_gnews_api_key_test';

// 1. Mock Redis globally so Upstash / rate limiter uses in-memory mock
vi.mock('ioredis', () => {
    return {
        default: IORedisMock,
        Redis: IORedisMock
    };
});

// 2. Mock Resend globally so NO emails are sent and NO API credits are used
vi.mock('resend', () => {
    class MockResend {
        emails = {
            send: vi.fn().mockResolvedValue({
                data: { id: 'mock-resend-email-id' },
                error: null
            })
        };
    }
    return {
        default: MockResend,
        Resend: MockResend
    };
});

// 3. Mock Groq SDK globally so NO real AI credits are used
vi.mock('groq-sdk', () => {
    class MockGroq {
        chat = {
            completions: {
                create: vi.fn().mockImplementation(async (params: any) => {
                    const userMsg = typeof params?.messages?.find((m: any) => m.role === 'user')?.content === 'string'
                        ? params.messages.find((m: any) => m.role === 'user').content
                        : '';
                    const sysMsg = typeof params?.messages?.find((m: any) => m.role === 'system')?.content === 'string'
                        ? params.messages.find((m: any) => m.role === 'system').content
                        : '';

                    let content = 'Mocked LLM response';

                    if (sysMsg.includes('natural language router') || userMsg.includes('Query:')) {
                        content = JSON.stringify({ action: 'search', topic: 'Tesla stock' });
                    } else if (sysMsg.includes('optimized query for the GNews')) {
                        content = '"Tesla" AND (stock OR price OR shares)';
                    } else if (userMsg.includes('expert news anchor') || sysMsg.includes('expert news anchor')) {
                        content = 'Tesla has crushed Q3 earnings expectations. Shares rose following the record results announced today.';
                    } else if (sysMsg.includes('dominant category')) {
                        content = JSON.stringify({ category: 'Business' });
                    } else if (userMsg.includes('2+2')) {
                        content = '4';
                    }

                    return {
                        id: 'mock-groq-completion-id',
                        choices: [{
                            message: {
                                role: 'assistant',
                                content
                            },
                            finish_reason: 'stop'
                        }]
                    };
                })
            }
        };
        audio = {
            transcriptions: {
                create: vi.fn().mockResolvedValue({ text: 'mocked audio transcription' })
            }
        };
    }
    return {
        default: MockGroq,
        Groq: MockGroq
    };
});

// 4. Mock Axios globally so external APIs like GNews never make external HTTP requests
vi.mock('axios', () => {
    return {
        default: {
            get: vi.fn().mockImplementation(async (url: string) => {
                if (typeof url === 'string' && url.includes('gnews.io')) {
                    return {
                        data: {
                            articles: [
                                {
                                    title: 'Mock Article',
                                    description: 'Mock Description',
                                    url: 'https://example.com/mock-article',
                                    image: 'https://example.com/mock.jpg',
                                    publishedAt: new Date().toISOString(),
                                    source: { name: 'Mock Source', url: 'https://example.com' }
                                }
                            ]
                        }
                    };
                }
                return { data: {} };
            }),
            post: vi.fn().mockResolvedValue({ data: {} })
        }
    };
});

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
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
