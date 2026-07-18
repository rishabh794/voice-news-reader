import type { Response } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import type { Request } from 'express';
import { User } from '../models/User.js';
import { Briefing } from '../models/Briefing.js';
import { generateUserBriefing, generateAllBriefings, getTodayDateISO } from '../services/briefingService.js';

/**
 * GET /api/briefing/latest
 * Returns the user's most recent briefing (today's or fallback to last generated).
 */
export const getLatestBriefing = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const briefing = await Briefing.findOne({
            userId: req.user.id,
            date: getTodayDateISO()
        })
        if (!briefing) {
            return res.json({ briefing: null });
        }

        res.json({ briefing });
    } catch (error) {
        console.error('Get Latest Briefing Error:', error);
        res.status(500).json({ error: 'Server error while fetching briefing' });
    }
};

/**
 * POST /api/briefing/generate
 * Manually triggers briefing generation for the authenticated user.
 */
export const generateBriefingNow = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const briefing = await generateUserBriefing(req.user.id);

        if (!briefing) {
            return res.status(400).json({ error: 'Could not generate briefing. Make sure you have topic preferences set.' });
        }

        res.json({ briefing });
    } catch (error) {
        console.error('Generate Briefing Error:', error);
        res.status(500).json({ error: 'Server error while generating briefing' });
    }
};

/**
 * GET /api/briefing/settings
 * Returns the user's current briefing preferences.
 */
export const getBriefingSettings = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const user = await User.findById(req.user.id).lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const defaults = { enabled: false, emailEnabled: false };
        res.json({ settings: user.briefingPreferences || defaults });
    } catch (error) {
        console.error('Get Briefing Settings Error:', error);
        res.status(500).json({ error: 'Server error while fetching briefing settings' });
    }
};

/**
 * PUT /api/briefing/settings
 * Updates the user's briefing preferences.
 * Body is validated by Zod middleware (updateBriefingSettingsBodySchema).
 */
export const updateBriefingSettings = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const updates: Record<string, boolean> = {};
        if (typeof req.body.enabled === 'boolean') {
            updates['briefingPreferences.enabled'] = req.body.enabled;
        }
        if (typeof req.body.emailEnabled === 'boolean') {
            updates['briefingPreferences.emailEnabled'] = req.body.emailEnabled;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        ).lean();

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const defaults = { enabled: false, emailEnabled: false };
        res.json({ settings: updatedUser.briefingPreferences || defaults });
    } catch (error) {
        console.error('Update Briefing Settings Error:', error);
        res.status(500).json({ error: 'Server error while updating briefing settings' });
    }
};

/**
 * GET /api/briefing/history
 * Returns past briefings for the authenticated user (paginated).
 */
export const getBriefingHistory = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.limit) || 10, 30);
        const skip = (page - 1) * limit;

        const [briefings, total] = await Promise.all([
            Briefing.find({ userId: req.user.id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Briefing.countDocuments({ userId: req.user.id })
        ]);

        res.json({
            briefings,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get Briefing History Error:', error);
        res.status(500).json({ error: 'Server error while fetching briefing history' });
    }
};

/**
 * POST /api/briefing/cron/trigger
 * QStash cron endpoint: triggers daily briefing generation for all active users.
 * Protected by QStash signature verification middleware.
 */
export const triggerDailyBriefings = async (req: Request, res: Response): Promise<any> => {
    try {
        const stats = await generateAllBriefings();
        res.json({
            message: 'Daily briefing generation complete.',
            ...stats
        });
    } catch (error) {
        console.error('Cron Trigger Error:', error);
        res.status(500).json({ error: 'Daily briefing generation failed.' });
    }
};

/**
 * GET /api/briefing/:id
 * Returns a specific briefing by ID if it belongs to the authenticated user.
 */
export const getBriefingById = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const briefing = await Briefing.findOne({
            _id: req.params.id,
            userId: req.user.id
        }).lean();

        if (!briefing) {
            return res.status(404).json({ error: 'Briefing not found' });
        }

        res.json({ briefing });
    } catch (error) {
        console.error('Get Briefing By ID Error:', error);
        res.status(500).json({ error: 'Server error while fetching briefing' });
    }
};
