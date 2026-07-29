'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { createBureauxMember } from '@/lib/admin-actions';

const DISCIPLINES = [
  'archivists',
  'cinematographers',
  'composers',
  'directors',
  'editors',
  'sound designers',
  'writers',
  'other',
] as const;

const SOURCES = [
  { value: 'manual', label: 'Manual' },
  { value: 'scout', label: 'Scout' },
  { value: 'plus', label: 'Plus' },
  { value: 'referral', label: 'Referral' },
] as const;

const STATUSES = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'member', label: 'Member' },
  { value: 'paused', label: 'Paused' },
] as const;

export default function BureauxMemberCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState<string>(DISCIPLINES[0]);
  const [email, setEmail] = useState('');
  const [reelUrl, setReelUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<(typeof SOURCES)[number]['value']>('manual');
  const [status, setStatus] = useState<(typeof STATUSES)[number]['value']>('prospect');
  const [error, setError] = useState<string | null>(null);

  const resetFields = () => {
    setName('');
    setDiscipline(DISCIPLINES[0]);
    setEmail('');
    setReelUrl('');
    setNotes('');
    setSource('manual');
    setStatus('prospect');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createBureauxMember({
        name,
        discipline,
        email: email || undefined,
        reelUrl: reelUrl || undefined,
        notes: notes || undefined,
        source,
        status,
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
        Add person
      </button>
    );
  }

  const field =
    'w-full rounded-[10px] bg-white/5 px-4 py-3 font-sans text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 transition-colors';
  const select =
    'w-full h-11 rounded-[10px] bg-white/5 px-3 font-sans text-[14px] text-white focus:outline-none focus:bg-white/10 transition-colors border-0';

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Add person
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
          Name
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className={field}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
            Discipline
          </label>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className={select}
          >
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
            Status
          </label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as (typeof STATUSES)[number]['value'])
            }
            className={select}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="optional"
          className={field}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Reel / site
        </label>
        <input
          type="url"
          value={reelUrl}
          onChange={(e) => setReelUrl(e.target.value)}
          placeholder="https://"
          className={`${field} font-mono text-[13px]`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Source
        </label>
        <select
          value={source}
          onChange={(e) =>
            setSource(e.target.value as (typeof SOURCES)[number]['value'])
          }
          className={select}
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="How they arrived, what they’re strong at…"
          className={`${field} resize-y min-h-[72px]`}
        />
      </div>

      {error ? (
        <p className="font-sans text-[13px] font-semibold text-red-400">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start h-11 px-5 rounded-full bg-white text-[#1F1F1F] font-sans text-[13px] font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {pending ? 'Saving…' : 'Add to roster'}
      </button>
      </form>
    </div>
  );
}
