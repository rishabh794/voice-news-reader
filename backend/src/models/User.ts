import mongoose from 'mongoose';
import { AI_NEWS_CATEGORIES } from '../utils/historyCategories.js';

const authProvidersSchema = new mongoose.Schema(
    {
        local: { type: Boolean, default: false },
        google: { type: Boolean, default: false }
    },
    { _id: false }
);

const briefingPreferencesSchema = new mongoose.Schema(
    {
        enabled: { type: Boolean, default: false },
        emailEnabled: { type: Boolean, default: false }
    },
    { _id: false }
);

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: false },
    googleId: { type: String, unique: true, sparse: true }, // sparse - in case if its null for 2 users
    providers: { type: authProvidersSchema, default: () => ({ local: false, google: false }) },
    topicPreferences: {
        type: [String],
        enum: AI_NEWS_CATEGORIES,
        default: [],
        validate: {
            validator: (v: string[]) => v.length <= 8,
            message: 'Maximum 8 topics allowed'
        }
    },
    briefingPreferences: {
        type: briefingPreferencesSchema,
        default: () => ({ enabled: false, emailEnabled: false })
    }
});

export const User = mongoose.model('User', userSchema);
