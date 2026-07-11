import express from 'express';
import { register, login, googleAuth } from '../controllers/authController.ts';
import { authSchemas, validateRequest } from '../validation/index.ts';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(rateLimit({ resource: 'auth', perUser: 5, windowSeconds: 60, burst: 8, keyExtractor: 'ip' }));

router.post('/register', validateRequest({ body: authSchemas.registerBodySchema }), register);
router.post('/login', validateRequest({ body: authSchemas.loginBodySchema }), login);
router.post('/google', validateRequest({ body: authSchemas.googleAuthBodySchema }), googleAuth);

export default router;