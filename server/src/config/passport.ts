import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../modules/users/user.model';
import { env } from './env';

// Serialize user for the session (we're using JWT so this might be minimal or unused if we handle tokens manually)
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
        done(null, user);
    });
});

// Google Strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        proxy: true
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists by OAuth ID
                let user = await User.findOne({ oAuthId: profile.id, oAuthProvider: 'google' });
                if (user) {
                    return done(null, user);
                }

                // Check if user exists by email (link accounts or warn)
                // For now, if email matches, we'll link it (risky if email not verified, but standard for easy onboarding)
                // Google emails are generally verified.
                const email = profile.emails?.[0]?.value;
                if (email) {
                    user = await User.findOne({ email });
                    if (user) {
                        // Update to link Google
                        user.oAuthProvider = 'google';
                        user.oAuthId = profile.id;
                        if (!user.avatarUrl && profile.photos?.[0]?.value) {
                            user.avatarUrl = profile.photos[0].value;
                        }
                        await user.save();
                        return done(null, user);
                    }
                }

                // Create new user
                user = await User.create({
                    displayName: profile.displayName || email?.split('@')[0] || 'User',
                    email: email,
                    oAuthProvider: 'google',
                    oAuthId: profile.id,
                    avatarUrl: profile.photos?.[0]?.value,
                    role: 'reader' // Default role
                });
                done(null, user);
            } catch (error) {
                done(error as Error, undefined);
            }
        }
    ));
}

// GitHub Strategy
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: '/api/auth/github/callback',
        proxy: true,
        scope: ['user:email']
    },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
            try {
                let user = await User.findOne({ oAuthId: profile.id, oAuthProvider: 'github' });
                if (user) {
                    return done(null, user);
                }

                const email = profile.emails?.[0]?.value; // GitHub might fetch private emails if scope is set
                // If email isn't in profile, we might need to fetch it explicitly, but let's assume public/primary for now.

                if (email) {
                    user = await User.findOne({ email });
                    if (user) {
                        user.oAuthProvider = 'github';
                        user.oAuthId = profile.id;
                        if (!user.avatarUrl && profile.photos?.[0]?.value) {
                            user.avatarUrl = profile.photos[0].value;
                        }
                        await user.save();
                        return done(null, user);
                    }
                }

                user = await User.create({
                    displayName: profile.displayName || profile.username || 'User',
                    email: email || `${profile.username}@github.placeholder.com`, // Fallback for no public email
                    oAuthProvider: 'github',
                    oAuthId: profile.id,
                    avatarUrl: profile.photos?.[0]?.value,
                    role: 'reader'
                });
                done(null, user);

            } catch (error) {
                done(error as Error, undefined);
            }
        }
    ));
}
