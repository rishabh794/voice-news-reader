import express from 'express';
import authRoutes from './auth.ts'; 
import historyRoutes from './history.ts';
import intentRoutes from './intent.ts';
import transcribeRoutes from './transcribe.ts';
import savedArticlesRoutes from './savedArticles.ts';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/history', historyRoutes);
router.use('/intent', intentRoutes);
router.use('/transcribe', transcribeRoutes);
router.use('/saved-articles', savedArticlesRoutes);


export default router;