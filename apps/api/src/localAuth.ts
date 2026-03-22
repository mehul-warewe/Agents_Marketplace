import express, { Router, Request, Response } from 'express';
import { createClient, users, otps, eq, and, gt } from '@repo/database';
import { generateToken } from './auth.js';
import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config({ path: '../../.env' });

const router: Router = express.Router();
const db = createClient(process.env.POSTGRES_URL!);
// Helper to send email via Nodemailer
const sendEmail = async (to: string, subject: string, body: string) => {
  const { SMTP_USER, SMTP_PASS, FROM_EMAIL } = process.env;

  if (!SMTP_USER || !SMTP_PASS || SMTP_USER === 'your_gmail_address@gmail.com') {
    console.warn('SMTP credentials not configured. Skipping email send.');
    console.log(`\n--- FALLBACK OTP EMAIL ---`);
    console.log(`To: ${to}\nSubject: ${subject}\nBody: ${body}\n--------------------------\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: FROM_EMAIL || SMTP_USER,
      to,
      subject,
      html: body,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (err: any) {
    console.warn('⚠️ Nodemailer failed to send email. Check your SMTP credentials.');
    console.error('Nodemailer Error:', err.message);
    // Fallback: log the email to the console so the developer can see the OTP
    console.log(`\n--- FALLBACK OTP EMAIL ---`);
    console.log(`To: ${to}\nSubject: ${subject}\nBody: ${body}\n--------------------------\n`);
  }
};

// POST /auth/send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(otps).values({
      email,
      code,
      expiresAt,
    });

    const emailHtml = `
      <div style="font-family: 'Inter', 'Helvetica', 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 40px; border: 1px solid #e5e5e5; box-shadow: 0 20px 40px rgba(0,0,0,0.05); color: #000000;">
        <div style="text-align: center; padding: 20px 0;">
          <div style="display: inline-block; padding: 12px 24px; border: 2px solid #000000; border-radius: 12px; margin-bottom: 24px;">
            <span style="font-size: 14px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; font-style: italic;">warewe</span>
          </div>
          <h1 style="font-size: 32px; font-weight: 900; margin: 0; letter-spacing: -1px; text-transform: uppercase; font-style: italic;">Access_Terminal</h1>
          <p style="color: #666666; font-size: 14px; margin-top: 12px; text-transform: uppercase; font-weight: 700; opacity: 0.6; letter-spacing: 1px;">Initialise secure session authorisation</p>
        </div>
        
        <div style="background-color: #f5f5f5; border-radius: 32px; padding: 48px; text-align: center; margin: 32px 0; border: 1px solid #eeeeee;">
          <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #666666; font-weight: 900; margin-bottom: 20px; opacity: 0.5;">DECRYPTION_KEY</span>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 56px; font-weight: 900; color: #000000; letter-spacing: 16px; margin-left: 16px;">${code}</div>
        </div>
        
        <div style="text-align: center; padding-top: 20px;">
          <p style="color: #666666; font-size: 13px; line-height: 1.6; margin-bottom: 32px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
            This key will securely expire in <span style="color: #000; font-weight: 900;">10 minutes</span>.<br/>
            Transmit this code only to the authorised warewe terminal.
          </p>
          <div style="width: 40px; hieght: 1px; background: #eee; margin: 0 auto 32px;"></div>
          <p style="color: #999999; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
            No action required if this request was not manually triggered.
          </p>
          <p style="color: #000000; font-size: 10px; margin-top: 12px; font-weight: 900; opacity: 0.2; letter-spacing: 2px;">
            © ${new Date().getFullYear()} WAREWE_PROTOCOL_UNIT // ROOT_CORE
          </p>
        </div>
      </div>
    `;

    await sendEmail(
      email,
      'Your Secure Access Code',
      emailHtml
    );

    return res.json({ message: 'OTP sent successfully.' });
  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required.' });
  }

  try {
    // Check OTP
    const otpRows = await db.select().from(otps).where(
      and(
        eq(otps.email, email),
        eq(otps.code, code),
        gt(otps.expiresAt, new Date())
      )
    );

    if (otpRows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired code.' });
    }

    // Find or create user
    let userRows = await db.select().from(users).where(eq(users.email, email));
    let user = userRows[0];

    if (!user) {
      const newUsers = await db.insert(users).values({
        email,
        name: email.split('@')[0],
        provider: 'local',
      }).returning();
      user = newUsers[0]!;
    }

    // Delete used OTP
    // await db.delete(otps).where(eq(otps.email, email));

    const token = generateToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: 'Verification failed.' });
  }
});

export default router;

