import express from 'express';
import authRoutes from './auth.js'; 
import historyRoutes from './history.js';
import intentRoutes from './intent.js';
import transcribeRoutes from './transcribe.js';
import savedArticlesRoutes from './savedArticles.js';
import topicPreferencesRoutes from './topicPreferences.js';
import feedRoutes from './feed.js';
import collectionsRoutes from './collections.js';
import readerRoutes from './reader.js';
import streamRoutes from './stream.js';
import briefingRoutes from './briefing.js';

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
router.use('/stream', streamRoutes);
router.use('/briefing', briefingRoutes);

export default router;
