'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { createBounty } from '@/lib/admin-actions';

export default function BountyCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [brief, setBrief] = useState('');
  const [amount, setAmount] = useState('500');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    startTransition(async () => {
      const result = await createBounty({
        title,
        slug: slug || undefined,
        brief,
        amountDollars: Number(amount),
        heroImageUrl: heroImageUrl || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTitle('');
      setSlug('');
      setBrief('');
      setAmount('500');
      setHeroImageUrl('');
      setOk(true);
      router.refresh();
      window.setTimeout(() => setOk(false), 2000);
    });
  };

  const field =
    'w-full rounded-[10px] bg-white/5 px-4 py-3 font-sans text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Title
        </label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Civil War"
          className={field}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Slug
        </label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto from title"
          className={`${field} font-mono text-[13px]`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Brief
        </label>
        <textarea
          required
          rows={3}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="What great looks like. What you’ve ruled out."
          className={`${field} resize-none`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Hero image URL
        </label>
        <input
          type="url"
          value={heroImageUrl}
          onChange={(e) => setHeroImageUrl(e.target.value)}
          placeholder="https://media.fjorr.com/assets/…"
          className={`${field} font-mono text-[12px]`}
        />
      </div>

      <div className="flex flex-col gap-1.5 max-w-[10rem]">
        <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Amount (USD)
        </label>
        <input
          required
          type="number"
          min={0}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={field}
        />
      </div>

      {error && (
        <p className="font-sans text-[13px] text-red-400/90">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start h-11 px-6 rounded-full bg-white text-black font-sans text-[14px] font-bold hover:bg-white/90 disabled:opacity-40 transition-all active:scale-[0.98]"
      >
        {pending ? 'Creating…' : ok ? 'Created' : 'Create bounty'}
      </button>
    </form>
  );
}
