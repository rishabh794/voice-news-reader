import express from 'express';
import { clearHistory, deleteHistory, getHistory } from '../controllers/historyController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { historySchemas, validateRequest } from '../validation/index.js';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(rateLimit({ resource: 'history', perUser: 30, windowSeconds: 60, burst: 40 }));

router.get('/', verifyToken, getHistory);
router.delete('/', verifyToken, clearHistory);
router.delete(
	'/:historyId',
	verifyToken,
	validateRequest({ params: historySchemas.deleteHistoryParamsSchema }),
	deleteHistory
);

export default router;
