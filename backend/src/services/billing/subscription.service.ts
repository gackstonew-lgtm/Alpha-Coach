/**
 * Subscription Lifecycle & Entitlement Service
 * Enforces subscription grace periods, active entitlements, and server-side trade gating.
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabaseAsync } from '../../db/db';
import { getPlanByCode, SUBSCRIPTION_PLANS } from '../../config/plans.config';
import { logAuditEvent } from '../../middlewares/auth.middleware';
import { StripeBillingAdapter } from './stripe.adapter';
import { MobileMoneyAdapter } from './mobileMoney.adapter';

export interface UserSubscriptionInfo {
  subscriptionId?: string;
  planCode: string;
  planName: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused' | 'none';
  billingProvider: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canTrade: boolean;
  maxInstances: number;
  maxAccounts: number;
  inGracePeriod: boolean;
}

export class SubscriptionService {
  private static stripeAdapter = new StripeBillingAdapter();
  private static mobileMoneyAdapter = new MobileMoneyAdapter();

  /**
   * Retrieves active entitlements and subscription state for a user.
   */
  public static async getUserSubscription(userId: string): Promise<UserSubscriptionInfo> {
    const db = await getDatabaseAsync();

    const sub = await db.get<any>(
      `SELECT s.*, p.code as plan_code, p.name as plan_name, p.max_instances, p.max_accounts
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC LIMIT 1`,
      [userId]
    );

    if (!sub) {
      return {
        planCode: 'starter',
        planName: 'Starter (Trial)',
        status: 'none',
        billingProvider: 'none',
        currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        canTrade: true, // Default trial access
        maxInstances: 1,
        maxAccounts: 1,
        inGracePeriod: false
      };
    }

    const now = Date.now();
    const periodEnd = new Date(sub.current_period_end).getTime();
    const gracePeriodMs = 3 * 24 * 60 * 60 * 1000; // 3-day grace period
    const inGracePeriod = periodEnd < now && now < periodEnd + gracePeriodMs;

    const isActive = ['active', 'trialing'].includes(sub.status) || inGracePeriod;

    return {
      subscriptionId: sub.id,
      planCode: sub.plan_code,
      planName: sub.plan_name,
      status: sub.status,
      billingProvider: sub.billing_provider,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      canTrade: isActive,
      maxInstances: sub.max_instances || 1,
      maxAccounts: sub.max_accounts || 1,
      inGracePeriod
    };
  }

  /**
   * Admin grants or extends a subscription manually with audit logging.
   */
  public static async grantManualSubscription(params: {
    adminUserId: string;
    targetUserId: string;
    planCode: string;
    durationDays: number;
    reason: string;
    ipAddress?: string;
  }): Promise<{ success: boolean; subscriptionId: string }> {
    const db = await getDatabaseAsync();
    const plan = getPlanByCode(params.planCode);
    if (!plan) throw new Error(`Plan [${params.planCode}] not found.`);

    // 1. Ensure plan exists in DB
    let planRow = await db.get<{ id: string }>('SELECT id FROM plans WHERE code = ?', [plan.code]);
    if (!planRow) {
      const planId = uuidv4();
      await db.run(
        `INSERT INTO plans (id, code, name, description, price_monthly_cents, price_annual_cents, currency, max_instances, max_accounts, features_json, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          planId,
          plan.code,
          plan.name,
          plan.description,
          plan.priceMonthlyCents,
          plan.priceAnnualCents,
          plan.currency,
          plan.maxInstances,
          plan.maxAccounts,
          JSON.stringify(plan.features)
        ]
      );
      planRow = { id: planId };
    }

    const subId = uuidv4();
    const expiresAt = new Date(Date.now() + params.durationDays * 24 * 60 * 60 * 1000).toISOString();

    // 2. Insert or update subscription
    await db.run(
      `INSERT INTO subscriptions (id, user_id, plan_id, status, billing_provider, current_period_start, current_period_end, created_at, updated_at)
       VALUES (?, ?, ?, 'active', 'manual', CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [subId, params.targetUserId, planRow.id, expiresAt]
    );

    // 3. Update entitlements
    await db.run(
      `INSERT INTO entitlements (id, user_id, subscription_id, max_instances, max_accounts, can_trade, features_json, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         subscription_id = excluded.subscription_id,
         max_instances = excluded.max_instances,
         max_accounts = excluded.max_accounts,
         can_trade = 1,
         features_json = excluded.features_json,
         expires_at = excluded.expires_at,
         updated_at = CURRENT_TIMESTAMP`,
      [uuidv4(), params.targetUserId, subId, plan.maxInstances, plan.maxAccounts, JSON.stringify(plan.features), expiresAt]
    );

    await logAuditEvent({
      userId: params.adminUserId,
      action: 'ADMIN_SUBSCRIPTION_GRANTED',
      entityType: 'SUBSCRIPTION',
      entityId: subId,
      ipAddress: params.ipAddress,
      details: {
        targetUserId: params.targetUserId,
        planCode: params.planCode,
        durationDays: params.durationDays,
        reason: params.reason
      }
    });

    return { success: true, subscriptionId: subId };
  }

  /**
   * Processes a verified Stripe or payment webhook event with idempotency.
   */
  public static async processWebhookEvent(params: {
    provider: 'stripe' | 'mpesa' | 'paystack';
    event: { id: string; type: string; data: Record<string, any> };
  }): Promise<{ processed: boolean; reason?: string }> {
    const db = await getDatabaseAsync();
    const eventId = params.event.id;

    // Check idempotency in audit_logs
    const existing = await db.get('SELECT id FROM audit_logs WHERE action = ? AND entity_id = ?', [
      `WEBHOOK_${params.provider.toUpperCase()}_PROCESSED`,
      eventId
    ]);

    if (existing) {
      return { processed: false, reason: 'Duplicate event already processed.' };
    }

    const { type, data } = params.event;

    if (type === 'checkout.session.completed' || type === 'charge.success') {
      const userId = data.client_reference_id || data.metadata?.userId;
      const planCode = data.metadata?.planCode || 'pro';
      const plan = getPlanByCode(planCode) || SUBSCRIPTION_PLANS[1];

      if (userId) {
        await this.grantManualSubscription({
          adminUserId: 'SYSTEM_WEBHOOK',
          targetUserId: userId,
          planCode: plan.code,
          durationDays: 30,
          reason: `Automated payment via ${params.provider} (Session: ${eventId})`
        });
      }
    } else if (type === 'customer.subscription.deleted') {
      const customerId = data.customer;
      if (customerId) {
        await db.run(
          "UPDATE subscriptions SET status = 'canceled', canceled_at = CURRENT_TIMESTAMP WHERE provider_customer_id = ?",
          [customerId]
        );
      }
    }

    // Record webhook processing for idempotency
    await logAuditEvent({
      userId: 'SYSTEM',
      action: `WEBHOOK_${params.provider.toUpperCase()}_PROCESSED`,
      entityType: 'BILLING_WEBHOOK',
      entityId: eventId,
      details: { eventType: type }
    });

    return { processed: true };
  }
}

export default SubscriptionService;
