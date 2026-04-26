import mongoose from 'mongoose';

const authProvidersSchema = new mongoose.Schema(
    {
        local: { type: Boolean, default: false },
        google: { type: Boolean, default: false }
    },
    { _id: false }
);

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: false },
    googleId: { type: String, unique: true, sparse: true },
    providers: { type: authProvidersSchema, default: () => ({ local: false, google: false }) }
});

export const User = mongoose.model('User', userSchema);