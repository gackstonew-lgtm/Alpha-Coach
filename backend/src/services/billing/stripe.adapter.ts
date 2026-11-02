/**
 * Stripe Billing Provider Adapter
 * Implemented using Node crypto for HMAC-SHA256 webhook verification.
 * Zero external dependencies.
 */

import crypto from 'crypto';
import { IBillingProviderAdapter, CheckoutSessionParams, CheckoutSessionResult, CustomerPortalParams, WebhookVerificationResult } from './billing.interface';
import { getPlanByCode } from '../../config/plans.config';

export class StripeBillingAdapter implements IBillingProviderAdapter {
  public providerName: 'stripe' = 'stripe';
  private apiKey: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.STRIPE_SECRET_KEY || '';
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  public async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    const plan = getPlanByCode(params.planCode);
    if (!plan) {
      throw new Error(`Plan [${params.planCode}] not found in catalog.`);
    }

    const priceCents = params.interval === 'year' ? plan.priceAnnualCents : plan.priceMonthlyCents;
    const sessionId = `cs_test_${crypto.randomBytes(16).toString('hex')}`;
    const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}?userId=${encodeURIComponent(params.userId)}`;

    return {
      sessionId,
      checkoutUrl,
      provider: 'stripe'
    };
  }

  public async createPortalSession(params: CustomerPortalParams): Promise<{ portalUrl: string }> {
    const portalUrl = `https://billing.stripe.com/p/session/test_${crypto.randomBytes(16).toString('hex')}?return=${encodeURIComponent(params.returnUrl)}`;
    return { portalUrl };
  }

  /**
   * Verifies standard Stripe webhook signature (t=...,v1=...) using HMAC-SHA256.
   */
  public verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string, webhookSecret: string): WebhookVerificationResult {
    const secret = webhookSecret || this.webhookSecret;
    if (!secret || !signatureHeader) {
      return { isValid: false, error: 'Missing webhook secret or stripe-signature header.' };
    }

    try {
      const parts = signatureHeader.split(',').reduce((acc: Record<string, string>, item) => {
        const [k, v] = item.trim().split('=');
        if (k && v) acc[k] = v;
        return acc;
      }, {});

      const timestamp = parts['t'];
      const signature = parts['v1'];

      if (!timestamp || !signature) {
        return { isValid: false, error: 'Malformed stripe-signature header.' };
      }

      // Check timestamp freshness (5 minutes tolerance)
      const diffSec = Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10));
      if (diffSec > 300) {
        return { isValid: false, error: 'Stripe webhook signature timestamp expired.' };
      }

      const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
      const payloadToSign = `${timestamp}.${bodyStr}`;
      const expectedSignature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return { isValid: false, error: 'Stripe webhook signature verification mismatch.' };
      }

      const parsedEvent = JSON.parse(bodyStr);
      return {
        isValid: true,
        event: {
          id: parsedEvent.id,
          type: parsedEvent.type,
          data: parsedEvent.data?.object || {}
        }
      };
    } catch (err: any) {
      return { isValid: false, error: `Webhook parse error: ${err.message}` };
    }
  }

  public async handleWebhookEvent(event: { id: string; type: string; data: Record<string, any> }): Promise<{ success: boolean; action: string }> {
    return {
      success: true,
      action: `PROCESSED_${event.type.toUpperCase()}`
    };
  }
}

export default StripeBillingAdapter;
