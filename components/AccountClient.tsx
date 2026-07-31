'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  deleteOwnAccount,
  saveOwnProfile,
} from '@/lib/profile-actions';
import {
  normalizeSlug,
  profileUrlPrefix,
  type ScoutProfile,
} from '@/lib/profile';

export default function AccountClient({
  email,
  profile,
}: {
  email: string;
  profile: ScoutProfile;
}) {
  const t = useTranslations('Account');
  const router = useRouter();
  const [name, setName] = useState(profile.display_name);
  const [slug, setSlug] = useState(profile.slug);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  );
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const urlPrefix = profileUrlPrefix(profile.member_number);

  const handleSlugBlur = () => {
    const next = normalizeSlug(slug);
    if (next) setSlug(next);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setError(null);
    try {
      const result = await saveOwnProfile({
        displayName: name,
        slug,
      });
      if (!result.ok) {
        setStatus('error');
        setError(result.error);
        return;
      }
      setName(result.profile.display_name);
      setSlug(result.profile.slug);
      setStatus('saved');
      router.refresh();
      window.setTimeout(() => setStatus('idle'), 2000);
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t('deleteAccountConfirm'));
    if (!confirmed) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteOwnAccount();
      if (!result.ok) {
        setDeleteError(result.error);
        setDeleting(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : t('errorGeneric'));
      setDeleting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-left">
          <span className="font-sans text-[12px] font-semibold uppercase tracking-wide text-white/35">
            {t('email')}
          </span>
          <p className="font-sans text-[15px] text-white/80 truncate">{email}</p>
        </div>

        <div className="flex flex-col gap-2 text-left">
          <span className="font-sans text-[12px] font-semibold uppercase tracking-wide text-white/35">
            {t('memberNumber')}
          </span>
          <p className="font-mono text-[15px] text-white/80">
            #{profile.member_number}
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-left">
            <span className="font-sans text-[12px] font-semibold uppercase tracking-wide text-white/35">
              {t('displayName')}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('displayNamePlaceholder')}
              maxLength={80}
              autoComplete="nickname"
              className="h-12 rounded-[10px] bg-white/5 px-4 font-sans text-[15px] text-white placeholder:text-white/35 focus:bg-white/10 focus:outline-none transition-colors"
            />
          </label>

          <label className="flex flex-col gap-2 text-left">
            <span className="font-sans text-[12px] font-semibold uppercase tracking-wide text-white/35">
              {t('scoutSlug')}
            </span>
            <div className="flex items-center h-12 rounded-[10px] bg-white/5 focus-within:bg-white/10 transition-colors overflow-hidden">
              <span className="pl-4 font-mono text-[13px] text-white/35 shrink-0 select-none">
                {urlPrefix}
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                onBlur={handleSlugBlur}
                placeholder={t('scoutSlugPlaceholder')}
                maxLength={32}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                className="min-w-0 flex-1 h-full bg-transparent pr-4 font-mono text-[15px] text-white placeholder:text-white/35 focus:outline-none"
              />
            </div>
            <span className="font-sans text-[12px] text-white/35 leading-snug">
              {t('scoutSlugHint')}
            </span>
          </label>

          {error && (
            <p className="font-sans text-[13px] text-red-400/90 text-left">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'saving'}
            className="h-12 rounded-full bg-white text-black font-sans text-[15px] font-bold hover:bg-white/90 disabled:opacity-40 transition-all active:scale-[0.98]"
          >
            {status === 'saving'
              ? t('saving')
              : status === 'saved'
                ? t('saved')
                : t('save')}
          </button>
        </form>
      </div>

      <div className="pt-6 border-t border-white/5 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="self-start font-sans text-[13px] font-semibold text-white/30 hover:text-red-300/80 disabled:opacity-40 transition-colors"
        >
          {deleting ? t('deleteAccountDeleting') : t('deleteAccount')}
        </button>
        <p className="font-sans text-[12px] text-white/25 leading-snug max-w-sm">
          {t('deleteAccountHint')}
        </p>
        {deleteError ? (
          <p className="font-sans text-[13px] text-red-400/90 text-left">
            {deleteError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
