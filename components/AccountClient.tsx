'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function AccountClient({
  email,
  initialName,
}: {
  email: string;
  initialName: string;
}) {
  const t = useTranslations('Account');
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: name.trim() },
      });
      if (updateError) throw updateError;
      setStatus('saved');
      router.refresh();
      window.setTimeout(() => setStatus('idle'), 2000);
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-white">
          {t('accountTitle')}
        </h1>
        <p className="font-sans text-[15px] text-white/55 leading-relaxed">
          {t('accountBody')}
        </p>
      </div>

      <div className="flex flex-col gap-2 text-left">
        <span className="font-sans text-[12px] font-semibold uppercase tracking-wide text-white/35">
          {t('email')}
        </span>
        <p className="font-sans text-[15px] text-white/80 truncate">{email}</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
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
            className="h-12 rounded-[10px] bg-white/5 px-4 font-sans text-[15px] text-white placeholder:text-white/35 focus:bg-white/10 focus:outline-none transition-colors"
          />
        </label>

        {error && (
          <p className="font-sans text-[13px] text-red-400/90 text-left">{error}</p>
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

      <button
        type="button"
        onClick={handleSignOut}
        className="self-center font-sans text-[13px] font-semibold text-white/40 hover:text-white/70 transition-colors"
      >
        {t('signOut')}
      </button>
    </div>
  );
}
