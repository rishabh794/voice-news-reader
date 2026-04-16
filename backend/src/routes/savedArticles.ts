import express from 'express';
import { addSavedArticle, getSavedArticles, deleteSavedArticle } from '../controllers/savedArticleController.ts';
import { verifyToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.post('/', verifyToken, addSavedArticle);
router.get('/', verifyToken, getSavedArticles);
router.delete('/:id', verifyToken, deleteSavedArticle);

export default router;
