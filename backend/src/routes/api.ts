import express from 'express';
import authRoutes from './auth.ts'; 
import historyRoutes from './history.ts';
import intentRoutes from './intent.ts';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/history', historyRoutes);
router.use('/intent', intentRoutes);


export default router;