import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { handleStreamSearch } from '../controllers/streamController.js';

import { rateLimit } from '../middleware/rateLimiter.js';
import { globalQuota } from '../middleware/globalQuota.js';

const router = express.Router();

router.get('/search', 
    verifyToken,
    rateLimit({ resource: 'stream', perUser: 10, windowSeconds: 60, burst: 15 }),
    globalQuota('groq'),
    handleStreamSearch
);

export default router;
