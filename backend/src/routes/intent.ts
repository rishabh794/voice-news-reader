import express from 'express';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/authMiddleware.ts';
import { handleIntent } from '../controllers/intentController.ts';


dotenv.config();
const router = express.Router();

router.post('/', verifyToken, handleIntent);
   

export default router;
