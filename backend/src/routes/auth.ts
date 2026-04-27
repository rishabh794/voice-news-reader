import express from 'express';
import { register, login, googleAuth } from '../controllers/authController.ts';
import { authSchemas, validateRequest } from '../validation/index.ts';

const router = express.Router();

router.post('/register', validateRequest({ body: authSchemas.registerBodySchema }), register);
router.post('/login', validateRequest({ body: authSchemas.loginBodySchema }), login);
router.post('/google', validateRequest({ body: authSchemas.googleAuthBodySchema }), googleAuth);

export default router;