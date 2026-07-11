import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { parseArticle } from '../controllers/readerController.js';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(verifyToken);

router.get('/parse', 
    rateLimit({ resource: 'reader', perUser: 15, windowSeconds: 60, burst: 20 }),
    parseArticle
);

export default router;
