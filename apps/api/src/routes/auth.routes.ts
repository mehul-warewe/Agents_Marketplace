import express from 'express';
import passport, { generateToken } from '../middleware/auth.middleware.js';
import { authService } from '../services/auth/auth.service.js';

const router: express.Router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false }), (req: any, res) => {
  const token = generateToken(req.user);
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

router.post('/send-otp', async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.generateOtp(email);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyOtp(email, code);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/me', passport.authenticate('jwt', { session: false }), (req: any, res) => {
  res.json(req.user);
});

export default router;
