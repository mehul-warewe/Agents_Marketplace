import nodemailer from 'nodemailer';
import { log } from '../../shared/logger.js';

export const sendEmail = async (to: string, subject: string, body: string) => {
  const { SMTP_USER, SMTP_PASS, FROM_EMAIL } = process.env;

  if (!SMTP_USER || !SMTP_PASS || SMTP_USER === 'your_gmail_address@gmail.com') {
    log.warn('SMTP credentials not configured. Skipping email send.');
    log.info(`\n--- FALLBACK OTP EMAIL ---`);
    log.info(`To: ${to}\nSubject: ${subject}\nBody: ${body}\n--------------------------\n`);
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
    log.info(`Email sent successfully to ${to}`);
  } catch (err: any) {
    log.warn('⚠️ Nodemailer failed to send email. Check your SMTP credentials.');
    log.error('Nodemailer Error:', err.message);
    log.info(`\n--- FALLBACK OTP EMAIL ---`);
    log.info(`To: ${to}\nSubject: ${subject}\nBody: ${body}\n--------------------------\n`);
  }
};

export const getOtpEmailHtml = (code: string) => `
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
      <div style="width: 40px; height: 1px; background: #eee; margin: 0 auto 32px;"></div>
      <p style="color: #999999; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
        No action required if this request was not manually triggered.
      </p>
      <p style="color: #000000; font-size: 10px; margin-top: 12px; font-weight: 900; opacity: 0.2; letter-spacing: 2px;">
        © ${new Date().getFullYear()} WAREWE_PROTOCOL_UNIT // ROOT_CORE
      </p>
    </div>
  </div>
`;
