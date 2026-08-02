'use server';

import { redirect } from 'next/navigation';
import { redeemBureauxGift } from '@/lib/bureaux-gift';

export async function redeemBureauxGiftAction(token: string) {
  const result = await redeemBureauxGift(token);
  if (result.ok) {
    redirect('/bureaux?joined=1');
  }
  return result;
}
