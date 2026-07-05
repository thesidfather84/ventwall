/**
 * VentWall Plus — Premium access utilities
 *
 * FUTURE STRIPE INTEGRATION
 * =========================
 * When ready to implement payments:
 *
 * 1. Install Stripe SDK:
 *    pnpm --filter @workspace/ventwall add @stripe/stripe-js
 *    pnpm --filter @workspace/api-server add stripe
 *
 * 2. Add environment secrets:
 *    STRIPE_PUBLIC_KEY   — publishable key (safe for frontend)
 *    STRIPE_SECRET_KEY   — secret key (server only, never expose)
 *    STRIPE_WEBHOOK_SECRET — for verifying webhook signatures
 *    STRIPE_PRICE_ID     — the $2.99/month price ID from Stripe dashboard
 *
 * 3. DB schema additions (lib/db/src/schema):
 *    - users table: id, sessionId, isPremium, stripeCustomerId, subscriptionId
 *    - subscriptions table: userId, stripeSubscriptionId, status, currentPeriodEnd
 *
 * 4. API routes to add (artifacts/api-server/src/routes/billing.ts):
 *    POST /billing/checkout  → create Stripe Checkout session → return {url}
 *    POST /billing/portal    → create Stripe Customer Portal session
 *    POST /billing/webhook   → handle subscription.created/updated/deleted events
 *
 * 5. Frontend flow:
 *    import { loadStripe } from "@stripe/stripe-js";
 *    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
 *    const { url } = await fetch("/api/billing/checkout", { method: "POST" }).then(r => r.json());
 *    window.location.href = url; // redirect to Stripe Checkout
 *
 * 6. After payment, Stripe webhook sets user.isPremium = true in the DB.
 *    The app reads this flag from a /api/me endpoint.
 */

// ---------- Types ----------

export interface PremiumUser {
  isPremium: boolean;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodEnd?: string;
}

// ---------- Constants ----------

export const VENTWALL_PLUS_PRICE = "$2.99/month";
export const VENTWALL_PLUS_PRODUCT_NAME = "VentWall Plus";

// Premium features list (also used in upsell UI)
export const PREMIUM_FEATURE_KEYS = [
  "saved_vents",
  "echo_history",
  "private_notes",
  "longer_post_history",
  "custom_themes",
  "soundscape_packs",
] as const;

export type PremiumFeatureKey = (typeof PREMIUM_FEATURE_KEYS)[number];

// ---------- Helpers ----------

/**
 * Check if a user has premium access.
 * TODO: Replace with real API call to /api/me once auth + billing is built.
 */
export function checkPremiumAccess(_sessionId?: string): boolean {
  // PLACEHOLDER — always returns false until payment is implemented
  return false;
}
