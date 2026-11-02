/**
 * Mobile Money Provider Adapter (M-Pesa Daraja / Paystack / Flutterwave)
 * Implements IBillingProviderAdapter for emerging market localized collections.
 */

import crypto from 'crypto';
import { IBillingProviderAdapter, CheckoutSessionParams, CheckoutSessionResult, CustomerPortalParams, WebhookVerificationResult } from './billing.interface';
import { getPlanByCode } from '../../config/plans.config';

export class MobileMoneyAdapter implements IBillingProviderAdapter {
  public providerName: 'mpesa' | 'paystack' = 'mpesa';
  private webhookSecret: string;

  constructor(provider: 'mpesa' | 'paystack' = 'mpesa') {
    this.providerName = provider;
    this.webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'mpesa-daraja-webhook-secret';
  }

  public async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    const plan = getPlanByCode(params.planCode);
    if (!plan) throw new Error(`Plan [${params.planCode}] not found.`);

    const checkoutRef = `mm_${this.providerName}_${crypto.randomBytes(8).toString('hex')}`;
    const checkoutUrl = `https://pay.${this.providerName}.com/checkout/${checkoutRef}?user=${params.userId}`;

    return {
      sessionId: checkoutRef,
      checkoutUrl,
      provider: this.providerName
    };
  }

  public async createPortalSession(params: CustomerPortalParams): Promise<{ portalUrl: string }> {
    return {
      portalUrl: params.returnUrl
    };
  }

  public verifyWebhookSignature(rawBody: string | Buffer, signature: string, webhookSecret: string): WebhookVerificationResult {
    const secret = webhookSecret || this.webhookSecret;
    try {
      const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
      const expected = crypto.createHmac('sha512', secret).update(bodyStr).digest('hex');

      const isValid = signature.toLowerCase() === expected.toLowerCase();
      const parsed = JSON.parse(bodyStr);

      return {
        isValid,
        event: {
          id: parsed.id || `evt_${Date.now()}`,
          type: parsed.event || 'charge.success',
          data: parsed.data || parsed
        }
      };
    } catch (err: any) {
      return { isValid: false, error: err.message };
    }
  }

  public async handleWebhookEvent(event: { id: string; type: string; data: Record<string, any> }): Promise<{ success: boolean; action: string }> {
    return {
      success: true,
      action: `PROCESSED_MOBILE_MONEY_${event.type}`
    };
  }
}

export default MobileMoneyAdapter;
