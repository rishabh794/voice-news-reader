import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { rateLimit } from '../middleware/rateLimiter.js';
import { verifyQStashSignature } from '../middleware/qstashMiddleware.js';
import { validateRequest } from '../validation/index.js';
import { updateBriefingSettingsBodySchema, briefingHistoryQuerySchema } from '../validation/schemas/briefingSchemas.js';
import {
    getLatestBriefing,
    generateBriefingNow,
    getBriefingSettings,
    updateBriefingSettings,
    getBriefingHistory,
    triggerDailyBriefings,
    getBriefingById
} from '../controllers/briefingController.js';

const router = express.Router();

// User-facing endpoints (auth required)
router.get('/latest',
    verifyToken,
    rateLimit({ resource: 'briefing:latest', perUser: 20, windowSeconds: 60 }),
    getLatestBriefing
);

router.post('/generate',
    verifyToken,
    rateLimit({ resource: 'briefing:generate', perUser: 3, windowSeconds: 300, burst: 3 }),
    generateBriefingNow
);

router.get('/settings',
    verifyToken,
    getBriefingSettings
);

router.put('/settings',
    verifyToken,
    validateRequest({ body: updateBriefingSettingsBodySchema }),
    updateBriefingSettings
);

router.get('/history',
    verifyToken,
    validateRequest({ query: briefingHistoryQuerySchema }),
    getBriefingHistory
);

router.get('/:id',
    verifyToken,
    getBriefingById
);

// QStash cron endpoint (signature-verified, no user auth)
router.post('/cron/trigger',
    verifyQStashSignature,
    triggerDailyBriefings
);

export default router;
