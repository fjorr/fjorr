import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import AccountRecordBoard from '@/components/AccountRecordBoard';
import AccountShell from '@/components/AccountShell';
import { requireOwnAccount } from '@/lib/account-session';
import { getOwnNominations } from '@/lib/nomination-actions';
import { loadOwnSlatePrompts } from '@/lib/slate';

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

function pitchLabel(story: string, setting: string | null) {
  const where = setting?.trim();
  if (where) return where;
  return story.trim().replace(/\s+/g, ' ');
}

export default async function AccountNominationsPage() {
  const { user, profile } = await requireOwnAccount('/account/nominations');
  const locale = await getLocale();
  const t = await getTranslations('Account');
  const [nominations, prompts] = await Promise.all([
    getOwnNominations(user.id),
    loadOwnSlatePrompts(user.id),
  ]);

  const records = [
    ...prompts.map((row) => ({
      id: row.id,
      title: row.title,
      meta: formatDate(row.createdAt, locale),
      stamp: t('votingSlate', { edition: row.edition }),
      body: row.body,
      at: Date.parse(row.createdAt) || 0,
    })),
    ...nominations.map((row) => ({
      id: row.id,
      title: pitchLabel(row.story_details, row.setting),
      meta: formatDate(row.created_at, locale),
      body: row.story_details.trim(),
      at: Date.parse(row.created_at) || 0,
    })),
  ].sort((a, b) => b.at - a.at);

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
        records={records}
      />
    </AccountShell>
  );
}
