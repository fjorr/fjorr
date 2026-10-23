import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import AccountRecordBoard from '@/components/AccountRecordBoard';
import AccountShell from '@/components/AccountShell';
import { requireOwnAccount } from '@/lib/account-session';
import { loadOwnSlateVotes } from '@/lib/slate';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountVotingTitle'),
    robots: { index: false, follow: false },
  };
}

function formatDate(iso: string, locale: string) {
  if (!iso) return '';
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

export default async function AccountVotingPage() {
  const { user, profile } = await requireOwnAccount('/account/voting');
  const locale = await getLocale();
  const t = await getTranslations('Account');
  const votes = await loadOwnSlateVotes(user.id);

  return (
    <AccountShell profile={profile} centered>
      <AccountRecordBoard
        title={t('votingTitle')}
        lead={t('votingLead')}
        empty={t('votingEmpty')}
        emptyCta={t('votingEmptyCta')}
        emptyHref="/slate"
        records={votes.map((vote) => ({
          id: `${vote.edition}-${vote.storyId}`,
          title: vote.title,
          meta: formatDate(vote.votedAt, locale),
          stamp: t('votingSlate', { edition: vote.edition }),
          href: vote.open ? '/slate' : undefined,
        }))}
      />
    </AccountShell>
  );
}
