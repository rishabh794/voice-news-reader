import type { Response } from 'express';
import mongoose from 'mongoose';
import { History } from '../models/History.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { normalizeHistoryCategory } from '../utils/historyCategories.js';

// GET USER'S SEARCH HISTORY
export const getHistory = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const userId = req.user.id;

        const history = await History.find({ userId }).sort({ createdAt: -1, timestamp: -1 }).lean();
        const normalizedHistory = history.map((entry) => ({
            ...entry,
            category: normalizeHistoryCategory(entry.category)
        }));

        res.json(normalizedHistory);
    } catch (error) {
        console.error('Get History Error:', error);
        res.status(500).json({ error: 'Server error while fetching history' });
    }
};

export const deleteHistory = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const rawHistoryId = req.params.historyId;
        const historyId = Array.isArray(rawHistoryId) ? rawHistoryId[0] : rawHistoryId;
        if (typeof historyId !== 'string' || !mongoose.Types.ObjectId.isValid(historyId)) {
            return res.status(400).json({ error: 'Invalid history id' });
        }

        const deletedHistory = await History.findOneAndDelete({
            _id: historyId,
            userId: req.user.id
        });

        if (!deletedHistory) {
            return res.status(404).json({ error: 'History entry not found' });
        }

        return res.json({ message: 'History entry deleted successfully', id: historyId });
    } catch (error) {
        console.error('Delete History Error:', error);
        return res.status(500).json({ error: 'Server error while deleting history entry' });
    }
};
