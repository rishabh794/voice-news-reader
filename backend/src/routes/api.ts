import express from 'express';
import authRoutes from './auth.ts'; 
import historyRoutes from './history.ts';
import intentRoutes from './intent.ts';
import transcribeRoutes from './transcribe.ts';
import savedArticlesRoutes from './savedArticles.ts';
import topicPreferencesRoutes from './topicPreferences.ts';
import feedRoutes from './feed.ts';
import collectionsRoutes from './collections.ts';
import readerRoutes from './reader.ts';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/history', historyRoutes);
router.use('/intent', intentRoutes);
router.use('/transcribe', transcribeRoutes);
router.use('/saved-articles', savedArticlesRoutes);
router.use('/topics', topicPreferencesRoutes);
router.use('/feed', feedRoutes);
router.use('/collections', collectionsRoutes);
router.use('/reader', readerRoutes);

export default router;