import express from 'express';
import { getPersonalizedFeed } from '../controllers/feedController.ts';
import { verifyToken } from '../middleware/authMiddleware.ts';
import { rateLimit } from '../middleware/rateLimiter.js';
import { globalQuota } from '../middleware/globalQuota.js';

const router = express.Router();

router.get('/', 
    verifyToken, 
    rateLimit({ resource: 'feed', perUser: 6, windowSeconds: 60, burst: 10 }),
    globalQuota('gnews'),
    getPersonalizedFeed
);

export default router;
