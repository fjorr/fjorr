'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { loadStripe } from '@stripe/stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

const BureauxCheckout = dynamic(() => import('@/components/BureauxCheckout'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full max-w-sm h-14 rounded-full bg-page-chip animate-pulse"
      aria-hidden
    />
  ),
});

type Props = {
  signedIn: boolean;
  accountEmail: string | null;
  price: string;
  nextPath?: string;
};

/** Code-split Stripe + checkout; warm the chunk + Stripe.js on idle. */
export default function BureauxCheckoutLazy(props: Props) {
  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const warm = () => {
      void import('@/components/BureauxCheckout');
      if (publishableKey) void loadStripe(publishableKey);
    };

    const ric = (
      window as Window & {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout: number }
        ) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback;

    if (typeof ric === 'function') {
      idleId = ric(warm, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(warm, 800);
    }

    return () => {
      if (idleId != null) {
        (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback?.(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, []);

  return <BureauxCheckout {...props} />;
}
