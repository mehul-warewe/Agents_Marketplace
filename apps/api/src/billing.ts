import express from 'express';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { createClient, users, transactions, eq, and, sql } from '@repo/database';
import passport from './auth.js';

dotenv.config({ path: '../../.env' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

const db = createClient(process.env.POSTGRES_URL!);
const router: express.Router = express.Router();

// Tiers Configuration
const TIERS = {
  free: { name: 'Free', credits: 100, priceId: null },
  pro: { name: 'Pro', credits: 1500, priceId: process.env.STRIPE_PRICE_PRO },
  ultra: { name: 'Ultra', credits: 5000, priceId: process.env.STRIPE_PRICE_ULTRA },
};

// Credit Top-up Configuration
const CREDIT_PACKS = {
  '500_credits': { amount: 500, priceId: process.env.STRIPE_PRICE_500_CREDITS },
  '1200_credits': { amount: 1200, priceId: process.env.STRIPE_PRICE_1200_CREDITS },
  '2500_credits': { amount: 2500, priceId: process.env.STRIPE_PRICE_2500_CREDITS },
};

/**
 * GET /billing/config
 * Returns current pricing and tier details for the frontend.
 */
router.get('/config', (req, res) => {
  res.json({ tiers: TIERS, creditPacks: CREDIT_PACKS });
});

/**
 * POST /billing/checkout/subscription
 * Creates a Stripe Checkout session for a subscription tier.
 */
router.post('/checkout/subscription', passport.authenticate('jwt', { session: false }), async (req: any, res) => {
  const { tier } = req.body;
  const user = req.user;

  if (!['pro', 'ultra'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  const selectedTier = TIERS[tier as keyof typeof TIERS];
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: selectedTier.priceId!, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { type: 'subscription', tier },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /billing/checkout/credits
 * Creates a Stripe Checkout session for one-time credit purchase.
 */
router.post('/checkout/credits', passport.authenticate('jwt', { session: false }), async (req: any, res) => {
  const { packId } = req.body;
  const user = req.user;

  const pack = CREDIT_PACKS[packId as keyof typeof CREDIT_PACKS];
  if (!pack) {
    return res.status(400).json({ error: 'Invalid credit pack' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: pack.priceId!, quantity: 1 }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { type: 'credits', packId, amount: pack.amount },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /billing/webhook
 * Handles Stripe webhook events.
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const { type, tier, amount } = session.metadata || {};

    if (!userId) return res.status(400).send('No userId in metadata');

    if (type === 'subscription') {
      const tierValue = tier as 'pro' | 'ultra';
      const creditAmount = TIERS[tierValue].credits;
      
      await db.transaction(async (tx) => {
        await tx.update(users)
          .set({ 
            tier: tierValue, 
            credits: sql`${users.credits} + ${creditAmount}`,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string
          })
          .where(eq(users.id, userId));

        await tx.insert(transactions).values({
          userId,
          amount: creditAmount,
          type: 'purchase',
          description: `Subscription to ${tierValue} tier`,
          stripeSessionId: session.id,
        });
      });
    } else if (type === 'credits') {
      const creditAmount = parseInt(amount!, 10);
      
      await db.transaction(async (tx) => {
        await tx.update(users)
          .set({ credits: sql`${users.credits} + ${creditAmount}` })
          .where(eq(users.id, userId));

        await tx.insert(transactions).values({
          userId,
          amount: creditAmount,
          type: 'purchase',
          description: `Purchased ${creditAmount} credits`,
          stripeSessionId: session.id,
        });
      });
    }
  }

  res.json({ received: true });
});

export default router;
