import express from 'express';
import passport from '../middleware/auth.middleware.js';
import { billingService } from '../services/billing/billing.service.js';

const router: express.Router = express.Router();

router.get('/config', (req, res) => res.json(billingService.getBillingConfig()));

router.post('/checkout/subscription', passport.authenticate('jwt', { session: false }), async (req: any, res, next) => {
  try { res.json(await billingService.createSubscriptionCheckout(req.user.id, req.user.email, req.body.tier)); } catch (err) { next(err); }
});

router.post('/checkout/credits', passport.authenticate('jwt', { session: false }), async (req: any, res, next) => {
  try { res.json(await billingService.createCreditsCheckout(req.user.id, req.user.email, req.body.packId)); } catch (err) { next(err); }
});

router.post('/webhook', async (req, res, next) => {
  try { 
    const sig = req.headers['stripe-signature'];
    res.json(await billingService.handleStripeWebhook(req.body, sig as string)); 
  } catch (err) { next(err); }
});

export default router;
