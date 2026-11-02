import { Router, Request, Response } from 'express';
import { requireUserAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { SubscriptionService } from '../services/billing/subscription.service';
import { StripeBillingAdapter } from '../services/billing/stripe.adapter';
import { MobileMoneyAdapter } from '../services/billing/mobileMoney.adapter';
import { SUBSCRIPTION_PLANS, getPlanByCode } from '../config/plans.config';

const router = Router();
const stripeAdapter = new StripeBillingAdapter();
const mobileMoneyAdapter = new MobileMoneyAdapter();

// Get Public Plans Catalog (Read from config, never hardcoded)
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: SUBSCRIPTION_PLANS
  });
});

// Get User Current Subscription & Entitlements
router.get('/subscription', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const sub = await SubscriptionService.getUserSubscription(req.user!.userId);
    res.json({ success: true, subscription: sub });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Initiate Checkout Session (Behind "public_subscriptions" feature flag!)
router.post('/checkout', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Hard Rule 4: Feature flag "public_subscriptions" defaults OFF.
    // Billing, signup for non-admin users and marketing claims stay disabled until turned on after legal review.
    const isPublicSubscriptionsEnabled = process.env.PUBLIC_SUBSCRIPTIONS === 'true';
    const isAdmin = (req.user?.role || '').toUpperCase() === 'ADMIN';

    if (!isPublicSubscriptionsEnabled && !isAdmin) {
      res.status(403).json({
        success: false,
        error: {
          code: 'PUBLIC_BILLING_DISABLED',
          message:
            'Public subscriptions and paid billing are currently disabled pending legal review. Only administrators may test billing workflows.'
        }
      });
      return;
    }

    const { planCode, interval = 'month', provider = 'stripe', returnUrl } = req.body;
    const plan = getPlanByCode(planCode);
    if (!plan) {
      res.status(400).json({ success: false, error: `Invalid planCode: ${planCode}` });
      return;
    }

    const adapter = provider === 'mpesa' ? mobileMoneyAdapter : stripeAdapter;
    const session = await adapter.createCheckoutSession({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      planCode: plan.code,
      interval: interval === 'year' ? 'year' : 'month',
      successUrl: returnUrl || 'https://arcadefx.live/bot?billing=success',
      cancelUrl: returnUrl || 'https://arcadefx.live/bot?billing=cancel'
    });

    res.json({ success: true, ...session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Customer Billing Portal
router.post('/portal', requireUserAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { returnUrl } = req.body;
    const session = await stripeAdapter.createPortalSession({
      userId: req.user!.userId,
      customerId: 'cus_test_' + req.user!.userId,
      returnUrl: returnUrl || 'https://arcadefx.live/settings'
    });
    res.json({ success: true, ...session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Stripe Signed Webhook
router.post('/webhook/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  const verification = stripeAdapter.verifyWebhookSignature(req.body, signature, webhookSecret);
  if (!verification.isValid || !verification.event) {
    res.status(400).json({ error: verification.error || 'Invalid webhook signature.' });
    return;
  }

  const result = await SubscriptionService.processWebhookEvent({
    provider: 'stripe',
    event: verification.event
  });

  res.json({ received: true, ...result });
});

// Mobile Money Webhook
router.post('/webhook/mobile-money', async (req: Request, res: Response) => {
  const signature = (req.headers['x-webhook-signature'] as string) || '';
  const verification = mobileMoneyAdapter.verifyWebhookSignature(req.body, signature, '');

  if (!verification.isValid || !verification.event) {
    res.status(400).json({ error: verification.error || 'Invalid signature.' });
    return;
  }

  const result = await SubscriptionService.processWebhookEvent({
    provider: 'mpesa',
    event: verification.event
  });

  res.json({ received: true, ...result });
});

export default router;
