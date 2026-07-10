import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getCollections, createCollection, deleteCollection } from '../controllers/collectionController.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getCollections);
router.post('/', createCollection);
router.delete('/:id', deleteCollection);

export default router;
