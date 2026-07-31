'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { updateBounty, type AdminBounty } from '@/lib/admin-actions';
import type { BountyKind } from '@/lib/nomination-actions';

const field =
  'w-full rounded-[10px] bg-white/5 px-4 py-3 font-sans text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 transition-colors';

function deadlineToInput(iso: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export default function BountyEditForm({ bounty }: { bounty: AdminBounty }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(bounty.title);
  const [slug, setSlug] = useState(bounty.slug);
  const [brief, setBrief] = useState(bounty.brief);
  const [amount, setAmount] = useState(String(Math.round(bounty.reward_amount / 100)));
  const [kind, setKind] = useState<BountyKind>(bounty.kind);
  const [posterImageUrl, setPosterImageUrl] = useState(bounty.poster_image_url || '');
  const [featured, setFeatured] = useState(bounty.featured);
  const [sortOrder, setSortOrder] = useState(
    bounty.sort_order == null ? '' : String(bounty.sort_order)
  );
  const [deadline, setDeadline] = useState(deadlineToInput(bounty.deadline));
  const [error, setError] = useState<string | null>(null);

  const syncFromBounty = () => {
    setTitle(bounty.title);
    setSlug(bounty.slug);
    setBrief(bounty.brief);
    setAmount(String(Math.round(bounty.reward_amount / 100)));
    setKind(bounty.kind);
    setPosterImageUrl(bounty.poster_image_url || '');
    setFeatured(bounty.featured);
    setSortOrder(bounty.sort_order == null ? '' : String(bounty.sort_order));
    setDeadline(deadlineToInput(bounty.deadline));
    setError(null);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          syncFromBounty();
          setOpen(true);
        }}
        className="self-start h-9 px-3 rounded-[8px] bg-white/10 text-white font-sans text-[12px] font-semibold hover:bg-white/15 transition-colors"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg rounded-[12px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Edit bounty
        </h3>
        <button
          type="button"
          onClick={() => {
            syncFromBounty();
            setOpen(false);
          }}
          className="font-sans text-[13px] text-white/40 hover:text-white/70 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await updateBounty({
              id: bounty.id,
              title,
              slug,
              brief,
              amountDollars: Number(amount),
              kind,
              posterImageUrl,
              featured,
              sortOrder: sortOrder === '' ? null : Number(sortOrder),
              deadline: deadline || null,
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setOpen(false);
            router.refresh();
          });
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
            Title
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={field}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
            Slug
          </label>
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={`${field} font-mono text-[13px]`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
            Brief
          </label>
          <textarea
            required
            rows={4}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            className={`${field} resize-none`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
            Kind
          </label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as BountyKind)}
            className={field}
          >
            <option value="true" className="bg-[#1F1F1F]">
              True
            </option>
            <option value="fiction" className="bg-[#1F1F1F]">
              Fiction
            </option>
            <option value="both" className="bg-[#1F1F1F]">
              Both
            </option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
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
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
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
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
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
              className="rounded border-white/20 bg-white/5"
            />
            <span className="font-sans text-[13px] font-semibold text-white/70">
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
          className="self-start h-11 px-6 rounded-full bg-white text-black font-sans text-[14px] font-bold hover:bg-white/90 disabled:opacity-40 transition-all active:scale-[0.98]"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
