import type { Response } from 'express';
import { History } from '../models/History.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

// SAVE A NEW SEARCH
export const addHistory = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { query } = req.body;
         if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const userId = req.user.id; 

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const newHistory = new History({ userId, query });
        await newHistory.save();

        res.status(201).json(newHistory);
    } catch (error) {
        console.error('Add History Error:', error);
        res.status(500).json({ error: 'Server error while saving history' });
    }
};

// GET USER'S SEARCH HISTORY
export const getHistory = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const userId = req.user.id;

        // Fetch history for this user, sorted by newest first
        const history = await History.find({ userId }).sort({ timestamp: -1 });
        
        res.json(history);
    } catch (error) {
        console.error('Get History Error:', error);
        res.status(500).json({ error: 'Server error while fetching history' });
    }
};