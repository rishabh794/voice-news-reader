import mongoose from 'mongoose';

const savedArticleSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        url: { type: String, required: true, trim: true },
        image: { type: String, default: '', trim: true },
        publishedAt: { type: Date },
        sourceName: { type: String, default: '', trim: true },
        savedAt: { type: Date, default: Date.now }
    },
    {
        versionKey: false
    }
);

savedArticleSchema.index({ userId: 1, url: 1 }, { unique: true });

export const SavedArticle = mongoose.model('SavedArticle', savedArticleSchema);
