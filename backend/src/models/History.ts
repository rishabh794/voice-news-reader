import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    query: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export const History = mongoose.model('History', historySchema);