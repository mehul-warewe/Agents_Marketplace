import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import passport from './middleware/auth.middleware.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { log } from './shared/logger.js';

import authRoutes from './routes/auth.routes.js';
import credentialRoutes from './routes/credentials.routes.js';
import agentRoutes from './routes/agents.routes.js';
import billingRoutes from './routes/billing.routes.js';
import templatesRoutes from './routes/templates.routes.js';

const app = express();
const port = process.env.PORT || 3001;

app.set('trust proxy', 1);
app.use(globalLimiter);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(morgan('dev'));

// Webhook must come BEFORE express.json()
app.use('/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/auth', authRoutes);
app.use('/credentials', credentialRoutes);
app.use('/agents', agentRoutes);
app.use('/billing', billingRoutes);
app.use('/templates', templatesRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use(errorMiddleware);

app.listen(port, () => {
  log.info(`API core services initialized. Listening at http://localhost:${port}`);
});
