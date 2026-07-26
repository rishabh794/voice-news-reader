import express from 'express';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/authMiddleware.js';
import { handleIntent } from '../controllers/intentController.js';
import { intentSchemas, validateRequest } from '../validation/index.js';

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
