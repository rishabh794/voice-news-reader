import express from 'express';
import { addSavedArticle, getSavedArticles, deleteSavedArticle, updateSavedArticle } from '../controllers/savedArticleController.ts';
import { verifyToken } from '../middleware/authMiddleware.ts';
import { savedArticleSchemas, validateRequest } from '../validation/index.ts';

const router = express.Router();

router.post(
	'/',
	verifyToken,
	validateRequest({ body: savedArticleSchemas.addSavedArticleBodySchema }),
	addSavedArticle
);
router.get('/', verifyToken, getSavedArticles);
router.put(
	'/:id',
	verifyToken,
	validateRequest({ 
		params: savedArticleSchemas.deleteSavedArticleParamsSchema,
		body: savedArticleSchemas.updateSavedArticleBodySchema 
	}),
	updateSavedArticle
);
router.delete(
	'/:id',
	verifyToken,
	validateRequest({ params: savedArticleSchemas.deleteSavedArticleParamsSchema }),
	deleteSavedArticle
);

export default router;
