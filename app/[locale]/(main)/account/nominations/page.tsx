import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import AccountRecordBoard from '@/components/AccountRecordBoard';
import AccountShell from '@/components/AccountShell';
import { requireOwnAccount } from '@/lib/account-session';
import {
  getOwnNominations,
  type NominationStatus,
} from '@/lib/nomination-actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountNominationsTitle'),
    robots: { index: false, follow: false },
  };
}

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function statusKey(status: NominationStatus) {
  switch (status) {
    case 'in_review':
      return 'statusInReview';
    case 'saved_for_later':
      return 'statusSaved';
    case 'on_slate':
      return 'statusOnSlate';
    case 'passed':
      return 'statusPassed';
    case 'in_production':
      return 'statusInProduction';
    case 'released':
      return 'statusReleased';
    default:
      return 'statusReceived';
  }
}

function pitchLabel(story: string, setting: string | null) {
  const where = setting?.trim();
  if (where) return where;
  return story.trim().replace(/\s+/g, ' ');
}

export default async function AccountNominationsPage() {
  const { user, profile } = await requireOwnAccount('/account/nominations');
  const locale = await getLocale();
  const t = await getTranslations('Account');
  const nominations = await getOwnNominations(user.id);

  return (
    <AccountShell profile={profile} centered>
      <AccountRecordBoard
        title={t('nominationsTitle')}
        lead={t('nominationsBody')}
        empty={t('nominationsEmpty')}
        emptyCta={t('nominationsEmptyCta')}
        emptyHref="/nominate"
        actionLabel={t('nominationsEmptyCta')}
        actionHref="/nominate"
        records={nominations.map((row) => ({
          id: row.id,
          title: pitchLabel(row.story_details, row.setting),
          meta: formatDate(row.created_at, locale),
          stamp: t(statusKey(row.status)),
        }))}
      />
    </AccountShell>
  );
}
