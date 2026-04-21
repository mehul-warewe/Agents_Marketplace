import { users, otps, eq, and, gt } from '@repo/database';
import { db } from '../../shared/db.js';
import { generateToken } from '../../middleware/auth.middleware.js';
import { sendEmail, getOtpEmailHtml } from './email.service.js';

export const authService = {
  async generateOtp(email: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(otps).values({
      email,
      code,
      expiresAt,
    });

    await sendEmail(
      email,
      'Your Secure Access Code',
      getOtpEmailHtml(code)
    );

    return { success: true };
  },

  async verifyOtp(email: string, code: string) {
    // Check OTP
    const otpRows = await db.select().from(otps).where(
      and(
        eq(otps.email, email),
        eq(otps.code, code),
        gt(otps.expiresAt, new Date())
      )
    );

    if (otpRows.length === 0) {
      throw new Error('Invalid or expired code.');
    }

    // Find or create user
    let userRows = await db.select().from(users).where(eq(users.email, email));
    let user = userRows[0];

    if (!user) {
      const newUsers = await db.insert(users).values({
        email,
        name: email.split('@')[0] || 'User',
        provider: 'local',
      }).returning();
      user = newUsers[0]!;
    }

    // Optional: Delete used OTP
    // await db.delete(otps).where(eq(otps.email, email));

    const token = generateToken(user);
    return { 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        avatarUrl: user.avatarUrl 
      } 
    };
  }
};
