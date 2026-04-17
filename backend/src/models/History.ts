import mongoose from 'mongoose';

const articleSourceSchema = new mongoose.Schema(
    {
        name: { type: String, default: '' },
        url: { type: String, default: '' }
    },
    { _id: false }
);

const historyArticleSchema = new mongoose.Schema(
    {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        content: { type: String, default: '' },
        url: { type: String, default: '' },
        image: { type: String, default: '' },
        publishedAt: { type: String, default: '' },
        source: { type: articleSourceSchema, default: () => ({}) }
    },
    { _id: false }
);

const historySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        query: { type: String, required: true, trim: true },
        summary: { type: String, default: '' },
        articles: { type: [historyArticleSchema], default: [] },
        timestamp: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

export const History = mongoose.model('History', historySchema);
