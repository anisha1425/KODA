import mongoose, { Schema, Document } from 'mongoose';

export interface IGenre extends Document {
    slug: string;
    name: string;
    icon: string;
    description?: string;
    color: [string, string];
    bookCount: number;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const genreSchema = new Schema<IGenre>(
    {
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        icon: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            maxlength: [300, 'Description cannot exceed 300 characters'],
        },
        color: {
            type: [String],
            validate: {
                validator: (v: string[]) => v.length === 2,
                message: 'Color must have exactly 2 values (gradient)',
            },
            required: true,
        },
        bookCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

genreSchema.index({ isActive: 1, sortOrder: 1 });

export const Genre = mongoose.model<IGenre>('Genre', genreSchema);
