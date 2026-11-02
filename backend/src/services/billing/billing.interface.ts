/**
 * Canonical Billing Provider Adapter Interface
 * Enables interchangeable payment gateways: Stripe, M-Pesa Daraja, Paystack, Flutterwave.
 */

export interface CheckoutSessionParams {
  userId: string;
  userEmail: string;
  planCode: string;
  interval: 'month' | 'year';
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  provider: string;
}

export interface CustomerPortalParams {
  userId: string;
  customerId: string;
  returnUrl: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  event?: {
    id: string;
    type: string;
    data: Record<string, any>;
  };
  error?: string;
}

export interface IBillingProviderAdapter {
  providerName: 'stripe' | 'mpesa' | 'paystack' | 'manual';
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult>;
  createPortalSession(params: CustomerPortalParams): Promise<{ portalUrl: string }>;
  verifyWebhookSignature(rawBody: string | Buffer, signature: string, webhookSecret: string): WebhookVerificationResult;
  handleWebhookEvent(event: { id: string; type: string; data: Record<string, any> }): Promise<{ success: boolean; action: string }>;
}
