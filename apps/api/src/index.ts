import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import passport, { generateToken } from './auth.js';
import agentRouter from './agents.js';
import localAuthRouter from './localAuth.js';
import credentialsRouter from './credentials.js';
import billingRouter from './billing.js';
import templatesRouter from './templates.js';
import { rateLimit } from 'express-rate-limit';

const app = express();
const port = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased for polling
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(limiter);
app.use(cors());
app.use(morgan('dev'));


// Special handling for Stripe Webhooks - must come BEFORE express.json()
app.use('/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(passport.initialize());


// Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req: any, res) => {
    const token = generateToken(req.user);
    // Redirect to frontend with token in URL (simple for MVP)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/callback?token=${token}`);
  }
);

app.get('/auth/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json(req.user);
});

app.use('/auth', localAuthRouter);
app.use('/agents', agentRouter);
app.use('/credentials', credentialsRouter);
app.use('/billing', billingRouter);
app.use('/templates', templatesRouter);



app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(port, () => {

  console.log(`API service listening at http://localhost:${port}`);
});
