import express from 'express';
import authRoutes from './auth.ts'; 

const router = express.Router();

router.use('/auth', authRoutes);


export default router;