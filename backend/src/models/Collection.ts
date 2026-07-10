import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true, trim: true },
        icon: { type: String, default: 'Folder', trim: true },
        isDefault: { type: Boolean, default: false }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

collectionSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Collection = mongoose.model('Collection', collectionSchema);
