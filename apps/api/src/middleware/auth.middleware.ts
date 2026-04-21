import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import { users, eq } from '@repo/database';
import { db } from '../shared/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email found in Google profile'));

        // Find or create user
        let userRows = await db.select().from(users).where(eq(users.email, email));
        let user = userRows[0];

        if (!user) {
          const newUserRows = await db.insert(users).values({
            email,
            name: profile.displayName || 'Google User',
            avatarUrl: profile.photos?.[0]?.value || null,
            provider: 'google',
          }).returning();
          user = newUserRows[0]!;
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token')
      ]),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const userRows = await db.select().from(users).where(eq(users.id, payload.sub));
        const user = userRows[0];
        if (user) return done(null, user);
        return done(null, false);
      } catch (err) {
        console.error('JWT Auth Error:', err);
        return done(err, false);
      }
    }
  )
);

export const generateToken = (user: any) => {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
};

export default passport;
