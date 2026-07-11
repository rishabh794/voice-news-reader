import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getCollections, createCollection, deleteCollection } from '../controllers/collectionController.js';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(verifyToken);
router.use(rateLimit({ resource: 'collections', perUser: 20, windowSeconds: 60, burst: 25 }));

router.get('/', getCollections);
router.post('/', createCollection);
router.delete('/:id', deleteCollection);

export default router;
