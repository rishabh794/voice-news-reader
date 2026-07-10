import type { Response } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';

export const getTopics = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const user = await User.findById(req.user.id).lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ topics: user.topicPreferences || [] });
    } catch (error) {
        console.error('Get Topics Error:', error);
        res.status(500).json({ error: 'Server error while fetching topics' });
    }
};

export const updateTopics = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { topics } = req.body;
        // Deduplicate topics just in case
        const uniqueTopics = [...new Set(topics)];

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { topicPreferences: uniqueTopics },
            { returnDocument: 'after', runValidators: true }
        ).lean();

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ topics: updatedUser.topicPreferences || [] });
    } catch (error) {
        console.error('Update Topics Error:', error);
        res.status(500).json({ error: 'Server error while updating topics' });
    }
};
