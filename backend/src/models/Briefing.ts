import mongoose from 'mongoose';
import { AI_NEWS_CATEGORIES } from '../utils/historyCategories.js';

const briefingArticleSourceSchema = new mongoose.Schema(
    {
        name: { type: String, default: '' },
        url: { type: String, default: '' }
    },
    { _id: false }
);

const briefingArticleSchema = new mongoose.Schema(
    {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        url: { type: String, default: '' },
        image: { type: String, default: '' },
        publishedAt: { type: String, default: '' },
        source: { type: briefingArticleSourceSchema, default: () => ({}) }
    },
    { _id: false }
);

const briefingSectionSchema = new mongoose.Schema(
    {
        topic: {
            type: String,
            enum: AI_NEWS_CATEGORIES,
            required: true
        },
        summary: { type: String, default: '' },
        articles: { type: [briefingArticleSchema], default: [] }
    },
    { _id: false }
);

const briefingSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: String, required: true }, // ISO date string, e.g. '2026-07-14'
        topics: {
            type: [String],
            enum: AI_NEWS_CATEGORIES,
            default: []
        },
        script: { type: String, default: '' }, // full narration text for TTS
        sections: { type: [briefingSectionSchema], default: [] },
        emailSentAt: { type: Date, default: null }
    },
    { timestamps: true }
);

// One briefing per user per day — makes generation idempotent
briefingSchema.index({ userId: 1, date: 1 }, { unique: true });

// Fast lookup for latest briefing per user
briefingSchema.index({ userId: 1, createdAt: -1 });

export const Briefing = mongoose.model('Briefing', briefingSchema);
