import express from 'express';
import { clearHistory, deleteHistory, getHistory } from '../controllers/historyController.ts';
import { verifyToken } from '../middleware/authMiddleware.ts';
import { historySchemas, validateRequest } from '../validation/index.ts';

const router = express.Router();

router.get('/', verifyToken, getHistory);
router.delete('/', verifyToken, clearHistory);
router.delete(
	'/:historyId',
	verifyToken,
	validateRequest({ params: historySchemas.deleteHistoryParamsSchema }),
	deleteHistory
);

export default router;
