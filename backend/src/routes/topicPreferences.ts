import express from 'express';
import { getTopics, updateTopics } from '../controllers/topicPreferencesController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { topicPreferencesSchemas, validateRequest } from '../validation/index.js';
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
