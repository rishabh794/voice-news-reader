import express from 'express';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/authMiddleware.ts';
import { handleIntent } from '../controllers/intentController.ts';
import { intentSchemas, validateRequest } from '../validation/index.ts';


dotenv.config();
const router = express.Router();

router.post('/', verifyToken, validateRequest({ body: intentSchemas.handleIntentBodySchema }), handleIntent);
   

export default router;
