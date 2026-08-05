import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function AuthErrorPage() {
  const t = await getTranslations('Auth');
  return (
    <div className="w-full min-h-[70vh] bg-[var(--page-bg)] text-page flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-page">
          {t('errorTitle')}
        </h1>
        <p className="font-sans text-[14px] text-page-muted leading-relaxed">
          {t('errorFallback')}
        </p>
        <Link
          href="/signin"
          className="mt-4 h-12 inline-flex items-center justify-center rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[15px] font-bold hover:opacity-90 transition-opacity"
        >
          {t('tryAgain')}
        </Link>
      </div>
    </div>
  );
}
