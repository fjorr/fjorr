'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { createBounty } from '@/lib/admin-actions';

export default function BountyCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [brief, setBrief] = useState('');
  const [amount, setAmount] = useState('500');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetFields = () => {
    setTitle('');
    setSlug('');
    setBrief('');
    setAmount('500');
    setHeroImageUrl('');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
      resetFields();
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start h-10 px-4 rounded-full border border-white/15 bg-transparent font-sans text-[13px] font-semibold text-white/70 hover:text-white hover:border-white/30 transition-colors"
      >
        Add bounty
      </button>
    );
  }

  const field =
    'w-full rounded-[10px] bg-white/5 px-4 py-3 font-sans text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 transition-colors';

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Add bounty
        </h2>
        <button
          type="button"
          onClick={() => {
            resetFields();
            setOpen(false);
          }}
          className="font-sans text-[13px] text-white/40 hover:text-white/70 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        {error ? (
          <p className="font-sans text-[13px] text-red-400/90">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="self-start h-11 px-6 rounded-full bg-white text-black font-sans text-[14px] font-bold hover:bg-white/90 disabled:opacity-40 transition-all active:scale-[0.98]"
        >
          {pending ? 'Creating…' : 'Create bounty'}
        </button>
      </form>
    </div>
  );
}
