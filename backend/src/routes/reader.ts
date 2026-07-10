import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { parseArticle } from '../controllers/readerController.js';

const router = express.Router();

router.use(verifyToken);

router.get('/parse', parseArticle);

export default router;
