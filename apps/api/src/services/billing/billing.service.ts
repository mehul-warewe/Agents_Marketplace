import Stripe from 'stripe';
import { users, transactions, eq, sql } from '@repo/database';
import { db } from '../../shared/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any });

export const TIERS = {
  free: { name: 'Free', credits: 100, priceId: null },
  pro: { name: 'Pro', credits: 1500, priceId: process.env.STRIPE_PRICE_PRO },
  ultra: { name: 'Ultra', credits: 5000, priceId: process.env.STRIPE_PRICE_ULTRA },
};

export const CREDIT_PACKS = {
  '500_credits': { amount: 500, priceId: process.env.STRIPE_PRICE_500_CREDITS },
  '1200_credits': { amount: 1200, priceId: process.env.STRIPE_PRICE_1200_CREDITS },
  '2500_credits': { amount: 2500, priceId: process.env.STRIPE_PRICE_2500_CREDITS },
};

export const billingService = {
  getBillingConfig() {
    return { tiers: TIERS, creditPacks: CREDIT_PACKS };
  },

  async createSubscriptionCheckout(userId: string, email: string, tier: string) {
    if (!['pro', 'ultra'].includes(tier)) throw new Error('Invalid tier');
    const selectedTier = TIERS[tier as keyof typeof TIERS];
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: selectedTier.priceId!, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      customer_email: email,
      client_reference_id: userId,
      metadata: { type: 'subscription', tier },
    });
    return { sessionId: session.id, url: session.url };
  },

  async createCreditsCheckout(userId: string, email: string, packId: string) {
    const pack = CREDIT_PACKS[packId as keyof typeof CREDIT_PACKS];
    if (!pack) throw new Error('Invalid credit pack');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: pack.priceId!, quantity: 1 }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      customer_email: email,
      client_reference_id: userId,
      metadata: { type: 'credits', packId, amount: pack.amount },
    });
    return { sessionId: session.id, url: session.url };
  },

  async handleStripeWebhook(body: any, sig: string) {
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const { type, tier, amount } = session.metadata || {};
      if (!userId) throw new Error('No userId in metadata');

      if (type === 'subscription') {
        const tierValue = tier as 'pro' | 'ultra';
        const creditAmount = TIERS[tierValue].credits;
        await db.transaction(async (tx) => {
          await tx.update(users).set({ 
            tier: tierValue, credits: sql`${users.credits} + ${creditAmount}`,
            stripeSubscriptionId: session.subscription as string, stripeCustomerId: session.customer as string
          }).where(eq(users.id, userId));
          await tx.insert(transactions).values({ userId, amount: creditAmount, type: 'purchase', description: `Subscription to ${tierValue} tier`, stripeSessionId: session.id });
        });
      } else if (type === 'credits') {
        const creditAmount = parseInt(amount!, 10);
        await db.transaction(async (tx) => {
          await tx.update(users).set({ credits: sql`${users.credits} + ${creditAmount}` }).where(eq(users.id, userId));
          await tx.insert(transactions).values({ userId, amount: creditAmount, type: 'purchase', description: `Purchased ${creditAmount} credits`, stripeSessionId: session.id });
        });
      }
    }
    return { received: true };
  },

  async deductCredits(userId: string, amount: number, description: string) {
    return await db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId));
      if (!user || user.credits < amount) {
        return { success: false, error: 'Insufficient credits' };
      }

      await tx.update(users).set({ credits: sql`${users.credits} - ${amount}` }).where(eq(users.id, userId));
      await tx.insert(transactions).values({ userId, amount: -amount, type: 'usage', description });
      return { success: true };
    });
  }
};
