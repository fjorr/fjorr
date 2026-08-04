import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getGiftByToken,
  prepareGiftRecipient,
} from '@/lib/bureaux-gift';
import BureauxGiftRedeem from '@/components/BureauxGiftRedeem';

export const metadata: Metadata = {
  title: 'Gift seat',
  robots: { index: false, follow: false },
};

export default async function BureauxGiftRedeemPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations('Bureaux');
  const gift = await getGiftByToken(token);

  if (!gift) {
    return (
      <div className="w-full min-h-screen bg-page text-page pb-24">
        <div className="w-full max-w-md mx-auto px-5 pt-16 flex flex-col gap-4">
          <h1 className="font-futura text-3xl tracking-tighter">{t('giftRedeemMissing')}</h1>
          <Link href="/bureaux" className="font-sans text-[14px] font-semibold underline">
            {t('giftRedeemBack')}
          </Link>
        </div>
      </div>
    );
  }

  if (gift.status === 'expired' || (gift.expires_at && new Date(gift.expires_at) < new Date())) {
    return (
      <div className="w-full min-h-screen bg-page text-page pb-24">
        <div className="w-full max-w-md mx-auto px-5 pt-16 flex flex-col gap-4">
          <h1 className="font-futura text-3xl tracking-tighter">{t('giftRedeemExpired')}</h1>
          <Link href="/bureaux" className="font-sans text-[14px] font-semibold underline">
            {t('giftRedeemBack')}
          </Link>
        </div>
      </div>
    );
  }

  if (gift.status === 'redeemed') {
    return (
      <div className="w-full min-h-screen bg-page text-page pb-24">
        <div className="w-full max-w-md mx-auto px-5 pt-16 flex flex-col gap-4">
          <h1 className="font-futura text-3xl tracking-tighter">{t('giftRedeemDone')}</h1>
          <Link href="/bureaux" className="font-sans text-[14px] font-semibold underline">
            {t('giftRedeemBack')}
          </Link>
        </div>
      </div>
    );
  }

  if (gift.status !== 'open') {
    return (
      <div className="w-full min-h-screen bg-page text-page pb-24">
        <div className="w-full max-w-md mx-auto px-5 pt-16 flex flex-col gap-4">
          <h1 className="font-futura text-3xl tracking-tighter">{t('giftRedeemPending')}</h1>
          <p className="font-sans text-[14px] text-page-muted">{t('giftRedeemPendingBody')}</p>
        </div>
      </div>
    );
  }

  await prepareGiftRecipient(token);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedInAs = user?.email?.toLowerCase() || null;
  const matches = signedInAs === gift.to_email.toLowerCase();

  return (
    <div className="w-full min-h-screen bg-page text-page pb-24">
      <div className="w-full max-w-md mx-auto px-5 pt-16 flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-page-faint">
            {t('giftRedeemEyebrow')}
          </p>
          <h1 className="font-futura text-3xl sm:text-4xl tracking-tighter leading-[0.95]">
            {t('giftRedeemTitle')}
          </h1>
          <p className="font-sans text-[16px] text-page-muted leading-relaxed">
            {t('giftRedeemLead', { email: gift.to_email })}
          </p>
        </header>

        {!user || !matches ? (
          <div className="flex flex-col gap-3">
            <p className="font-sans text-[14px] text-page-muted">
              {t('giftRedeemSignInBody')}
            </p>
            <Link
              href={`/signin?next=${encodeURIComponent(`/bureaux/gift/${token}`)}`}
              className="self-start inline-flex h-12 items-center px-7 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold"
            >
              {t('giftRedeemSignIn')}
            </Link>
          </div>
        ) : (
          <BureauxGiftRedeem token={token} />
        )}
      </div>
    </div>
  );
}
