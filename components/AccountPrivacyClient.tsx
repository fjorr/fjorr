'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import AccountToggle from '@/components/AccountToggle';
import { saveOwnPrivacy } from '@/lib/profile-actions';
import type { ScoutProfile } from '@/lib/profile';

export default function AccountPrivacyClient({
  profile,
}: {
  profile: ScoutProfile;
}) {
  const t = useTranslations('Account');
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(profile.is_public);
  const [voyageLineageEnabled, setVoyageLineageEnabled] = useState(
    profile.voyage_lineage_enabled !== false
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  );
  const [error, setError] = useState<string | null>(null);

  const persist = async (next: {
    isPublic: boolean;
    voyageLineageEnabled: boolean;
  }) => {
    setStatus('saving');
    setError(null);
    try {
      const result = await saveOwnPrivacy(next);
      if (!result.ok) {
        setStatus('error');
        setError(result.error);
        return;
      }
      setIsPublic(result.profile.is_public);
      setVoyageLineageEnabled(result.profile.voyage_lineage_enabled !== false);
      setStatus('saved');
      router.refresh();
      window.setTimeout(() => setStatus('idle'), 1600);
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    }
  };

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <AccountToggle
          checked={isPublic}
          onChange={(next) => {
            setIsPublic(next);
            void persist({
              isPublic: next,
              voyageLineageEnabled,
            });
          }}
          label={t('publicProfile')}
          hint={t('publicProfileHint')}
        />

        <AccountToggle
          checked={voyageLineageEnabled}
          onChange={(next) => {
            setVoyageLineageEnabled(next);
            void persist({
              isPublic,
              voyageLineageEnabled: next,
            });
          }}
          label={t('voyageTrail')}
          hint={t('voyageTrailHint')}
        />
      </div>

      {error ? (
        <p className="font-sans text-[13px] text-red-400/90 text-left">{error}</p>
      ) : null}

      {status === 'saving' || status === 'saved' ? (
        <p className="font-sans text-[12px] text-page-faint text-left">
          {status === 'saving' ? t('saving') : t('saved')}
        </p>
      ) : null}
    </div>
  );
}
