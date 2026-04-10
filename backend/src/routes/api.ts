import express from 'express';
import authRoutes from './auth.ts'; 
import historyRoutes from './history.ts';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/history', historyRoutes);


export default router;