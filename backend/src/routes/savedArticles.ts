import express from 'express';
import { addSavedArticle, getSavedArticles, deleteSavedArticle, updateSavedArticle } from '../controllers/savedArticleController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { savedArticleSchemas, validateRequest } from '../validation/index.js';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(rateLimit({ resource: 'saved-articles', perUser: 30, windowSeconds: 60, burst: 40 }));

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
