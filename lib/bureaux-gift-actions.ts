'use server';

import { startBureauxGiftCheckout as startCheckout } from '@/lib/bureaux-gift';

/** Client-callable wrapper for gift Checkout. */
export async function startBureauxGiftCheckout(toEmail: string) {
  return startCheckout(toEmail);
}
