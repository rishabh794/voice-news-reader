import type { Response } from 'express';
import { Collection } from '../models/Collection.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export const getCollections = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const userId = req.user.id;
        
        let collections = await Collection.find({ userId }).sort({ createdAt: 1 });
        
        if (collections.length === 0) {
            // Create default collection if none exist
            const defaultCollection = await Collection.create({
                userId,
                name: 'All Saved',
                icon: 'LibraryBig',
                isDefault: true
            });
            collections = [defaultCollection];
        }
        
        return res.json(collections);
    } catch (error) {
        console.error('Get Collections Error:', error);
        return res.status(500).json({ error: 'Server error while fetching collections' });
    }
};

export const createCollection = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const userId = req.user.id;
        const { name, icon } = req.body;
        
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'Collection name is required' });
        }
        
        const existing = await Collection.findOne({ userId, name: name.trim() });
        if (existing) {
            return res.status(400).json({ error: 'A collection with this name already exists' });
        }
        
        const collection = await Collection.create({
            userId,
            name: name.trim(),
            icon: icon || 'Folder',
            isDefault: false
        });
        
        return res.status(201).json(collection);
    } catch (error) {
        console.error('Create Collection Error:', error);
        return res.status(500).json({ error: 'Server error while creating collection' });
    }
};

export const deleteCollection = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const userId = req.user.id;
        const { id } = req.params;
        
        const collection = await Collection.findOne({ _id: id, userId });
        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        
        if (collection.isDefault) {
            return res.status(400).json({ error: 'Cannot delete the default collection' });
        }
        
        await Collection.deleteOne({ _id: id });
        // Let's move them to the default collection.
        const defaultCollection = await Collection.findOne({ userId, isDefault: true });
        if (defaultCollection) {
            const { SavedArticle } = await import('../models/SavedArticle.js');
            await SavedArticle.updateMany(
                { userId, collectionId: id as string },
                { $set: { collectionId: defaultCollection._id } }
            );
        }
        
        return res.json({ message: 'Collection deleted' });
    } catch (error) {
        console.error('Delete Collection Error:', error);
        return res.status(500).json({ error: 'Server error while deleting collection' });
    }
};
