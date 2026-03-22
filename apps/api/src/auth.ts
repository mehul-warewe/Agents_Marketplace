import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import { createClient, users, eq } from '@repo/database';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const db = createClient(process.env.POSTGRES_URL!);
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
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        console.log('JWT Auth Attempt - Payload:', payload);
        const userRows = await db.select().from(users).where(eq(users.id, payload.sub));
        const user = userRows[0];
        console.log('JWT Auth Success - User found:', user ? user.email : 'No user');
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
