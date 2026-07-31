import express from 'express';
import { register, login, googleAuth, me, logout, refresh } from '../controllers/authController.js';
import { authSchemas, validateRequest } from '../validation/index.js';
import { rateLimit } from '../middleware/rateLimiter.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(rateLimit({ resource: 'auth', perUser: 5, windowSeconds: 60, burst: 8, keyExtractor: 'ip' }));

router.post('/register', validateRequest({ body: authSchemas.registerBodySchema }), register);
router.post('/login', validateRequest({ body: authSchemas.loginBodySchema }), login);
router.post('/google', validateRequest({ body: authSchemas.googleAuthBodySchema }), googleAuth);
router.post('/refresh', refresh);
router.get('/me', verifyToken, me);
router.post('/logout', logout);

export default router;
