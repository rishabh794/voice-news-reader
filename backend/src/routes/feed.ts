import express from 'express';
import { getPersonalizedFeed } from '../controllers/feedController.ts';
import { verifyToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.get('/', verifyToken, getPersonalizedFeed);

export default router;
