import express from 'express';
import { getTopics, updateTopics } from '../controllers/topicPreferencesController.ts';
import { verifyToken } from '../middleware/authMiddleware.ts';
import { topicPreferencesSchemas, validateRequest } from '../validation/index.ts';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(rateLimit({ resource: 'topics', perUser: 10, windowSeconds: 60, burst: 15 }));

router.get('/', verifyToken, getTopics);
router.put(
    '/',
    verifyToken,
    validateRequest({ body: topicPreferencesSchemas.updateTopicsBodySchema }),
    updateTopics
);

export default router;
