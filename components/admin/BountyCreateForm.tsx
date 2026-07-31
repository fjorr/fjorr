'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { createBounty } from '@/lib/admin-actions';
import type { BountyKind } from '@/lib/nomination-actions';

const field =
  'w-full rounded-[10px] bg-page-chip px-4 py-3 font-sans text-[14px] text-page placeholder:text-page-faint focus:outline-none focus:bg-page-chip-active transition-colors';

export default function BountyCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [brief, setBrief] = useState('');
  const [amount, setAmount] = useState('500');
  const [kind, setKind] = useState<BountyKind>('true');
  const [posterImageUrl, setPosterImageUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetFields = () => {
    setTitle('');
    setSlug('');
    setBrief('');
    setAmount('500');
    setKind('true');
    setPosterImageUrl('');
    setFeatured(false);
    setSortOrder('');
    setDeadline('');
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
        kind,
        posterImageUrl: posterImageUrl || undefined,
        featured,
        sortOrder: sortOrder === '' ? null : Number(sortOrder),
        deadline: deadline || null,
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
        className="self-start h-10 px-4 rounded-full border border-page-faint bg-transparent font-sans text-[13px] font-semibold text-page-muted hover:text-page hover:border-page-muted transition-colors"
      >
        Add bounty
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
          Add bounty
        </h2>
        <button
          type="button"
          onClick={() => {
            resetFields();
            setOpen(false);
          }}
          className="font-sans text-[13px] text-page-faint hover:text-page-muted transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
            Title
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="First Flight"
            className={field}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
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
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
            Brief
          </label>
          <textarea
            required
            rows={3}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="1–2 sentence hunting description."
            className={`${field} resize-none`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
            Kind
          </label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as BountyKind)}
            className={field}
          >
            <option value="true" className="bg-page">
              True
            </option>
            <option value="fiction" className="bg-page">
              Fiction
            </option>
            <option value="both" className="bg-page">
              Both
            </option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
            Poster image URL
          </label>
          <input
            type="url"
            value={posterImageUrl}
            onChange={(e) => setPosterImageUrl(e.target.value)}
            placeholder="https://media.fjorr.com/assets/…"
            className={`${field} font-mono text-[12px]`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
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
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
              Sort order
            </label>
            <input
              type="number"
              step={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="optional"
              className={field}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={field}
            />
          </div>
          <label className="flex items-center gap-2 h-12 px-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded border-page-faint bg-page-chip"
            />
            <span className="font-sans text-[13px] font-semibold text-page-muted">
              Featured
            </span>
          </label>
        </div>

        {error ? (
          <p className="font-sans text-[13px] text-red-400/90">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="self-start h-11 px-6 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold hover:opacity-90 disabled:opacity-40 transition-all active:scale-[0.98]"
        >
          {pending ? 'Creating…' : 'Create bounty'}
        </button>
      </form>
    </div>
  );
}
