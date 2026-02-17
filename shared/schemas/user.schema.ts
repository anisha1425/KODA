import { z } from 'zod';

// ============ USER SCHEMAS ============

export const userRoleSchema = z.enum(['reader', 'author', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const oAuthProviderSchema = z.enum(['local', 'google', 'github']);
export type OAuthProvider = z.infer<typeof oAuthProviderSchema>;

export const userSchema = z.object({
    _id: z.string(),
    email: z.string().email(),
    displayName: z.string().min(2).max(50),
    avatarUrl: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    role: userRoleSchema.default('reader'),
    oAuthProvider: oAuthProviderSchema.default('local'),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const createUserSchema = userSchema.omit({
    _id: true,
    createdAt: true,
    updatedAt: true,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

// ============ AUTH SCHEMAS ============

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    displayName: z.string().min(2).max(50),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const authResponseSchema = z.object({
    token: z.string(),
    user: userSchema.omit({ createdAt: true, updatedAt: true }),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
