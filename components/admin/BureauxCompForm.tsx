'use client';

import React, { useState, useTransition } from 'react';
import { adminGrantBureauxLifetime } from '@/lib/admin-bureaux-actions';

export default function BureauxCompForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const result = await adminGrantBureauxLifetime(email);
          if (!result.ok) {
            setError(
              result.error === 'emailInvalid'
                ? 'Enter a valid email.'
                : result.detail || 'Could not grant lifetime.'
            );
            return;
          }
          setMessage(
            result.bureauxNumber
              ? `Granted lifetime · Bureaux № ${result.bureauxNumber} · ${result.email}`
              : `Granted lifetime · ${result.email}`
          );
          setEmail('');
        });
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
          Email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="member@email.com"
          disabled={pending}
          className="h-11 rounded-[10px] bg-page-chip px-4 font-sans text-[15px] text-page placeholder:text-page-faint focus:outline-none"
        />
      </label>
      {error ? (
        <p className="font-sans text-[13px] text-[#C45B4A]">{error}</p>
      ) : null}
      {message ? (
        <p className="font-sans text-[13px] text-page-muted">{message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !email.trim()}
        className="self-start inline-flex items-center h-11 px-6 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold hover:opacity-90 disabled:opacity-40"
      >
        {pending ? 'Granting…' : 'Grant lifetime'}
      </button>
    </form>
  );
}
