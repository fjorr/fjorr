import 'server-only';

import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export function getBureauxPriceId(): string {
  const id = process.env.STRIPE_BUREAUX_PRICE_ID || '';
  if (!id) {
    throw new Error('Missing STRIPE_BUREAUX_PRICE_ID');
  }
  return id;
}

