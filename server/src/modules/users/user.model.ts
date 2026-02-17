import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type OAuthProvider = 'local' | 'google' | 'github';

export interface IUser extends Document {
    displayName: string;
    email: string;
    password?: string;
    role: 'reader' | 'author' | 'admin';
    oAuthProvider: OAuthProvider;
    oAuthId?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        displayName: {
            type: String,
            required: [true, 'Display name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
            // Not required for OAuth users
        },
        role: {
            type: String,
            enum: ['reader', 'author', 'admin'],
            default: 'reader',
        },
        oAuthProvider: {
            type: String,
            enum: ['local', 'google', 'github'],
            default: 'local',
        },
        oAuthId: {
            type: String,
            sparse: true, // Allows null/undefined for local users
        },
        avatarUrl: {
            type: String,
        },
        bannerUrl: {
            type: String,
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);

// Indexes
userSchema.index({ role: 1, createdAt: -1 }); // Fast admin filtering
