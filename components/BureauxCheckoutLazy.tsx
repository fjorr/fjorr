'use client';

import React from 'react';
import dynamic from 'next/dynamic';

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

/** Code-split Stripe + checkout until the join page needs them. */
export default function BureauxCheckoutLazy(props: Props) {
  return <BureauxCheckout {...props} />;
}
