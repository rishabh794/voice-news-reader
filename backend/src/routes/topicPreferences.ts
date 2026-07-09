import express from 'express';
import { getTopics, updateTopics } from '../controllers/topicPreferencesController.ts';
import { verifyToken } from '../middleware/authMiddleware.ts';
import { topicPreferencesSchemas, validateRequest } from '../validation/index.ts';

const router = express.Router();

router.get('/', verifyToken, getTopics);
router.put(
    '/',
    verifyToken,
    validateRequest({ body: topicPreferencesSchemas.updateTopicsBodySchema }),
    updateTopics
);

export default router;
