import express from 'express';
import {  deleteHistory, getHistory } from '../controllers/historyController.ts';
import { verifyToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.get('/', verifyToken, getHistory);
router.delete('/:historyId', verifyToken, deleteHistory);

export default router;
