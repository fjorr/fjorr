import { Link } from '@/i18n/navigation';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

async function ErrorBody({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations('Auth'),
  ]);
  return (
    <p className="font-sans text-[14px] text-white/50 leading-relaxed">
      {params?.error || t('errorFallback')}
    </p>
  );
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = await getTranslations('Auth');
  return (
    <div className="w-full min-h-[70vh] bg-[#1F1F1F] flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-white">
          {t('errorTitle')}
        </h1>
        <Suspense>
          <ErrorBody searchParams={searchParams} />
        </Suspense>
        <Link
          href="/signin"
          className="mt-4 h-12 inline-flex items-center justify-center rounded-full bg-white text-black font-sans text-[15px] font-bold hover:bg-white/90 transition-colors"
        >
          {t('tryAgain')}
        </Link>
      </div>
    </div>
  );
}
