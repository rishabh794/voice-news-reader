import express from 'express';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/authMiddleware.ts';
import { handleIntent } from '../controllers/intentController.ts';
import { intentSchemas, validateRequest } from '../validation/index.ts';

import { rateLimit } from '../middleware/rateLimiter.js';
import { globalQuota } from '../middleware/globalQuota.js';

dotenv.config();
const router = express.Router();

router.post('/', 
    verifyToken, 
    rateLimit({ resource: 'intent', perUser: 10, windowSeconds: 60, burst: 15 }),
    globalQuota('groq'),
    validateRequest({ body: intentSchemas.handleIntentBodySchema }), 
    handleIntent
);
   

export default router;
