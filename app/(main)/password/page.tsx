// app/password/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(false);

    const res = await fetch('/api/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      // router.refresh forces the middleware to instantly evaluate the newly added cookie token
      router.refresh();
      router.push('/');
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center px-6 text-white font-sans selection:bg-white selection:text-black">
      <div className="w-full max-w-sm flex flex-col text-center">
        
        <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-[#f5f5f7] mb-2 font-sans">
          FJORR
        </h1>
        <p className="text-xs text-white/40 font-mono mb-8 uppercase tracking-wider">
          Protected Development Runway
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ENTER ACCESS PHRASE"
            className={`w-full h-11 bg-[#121212] border ${
              error ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-white/20'
            } rounded-lg px-4 text-sm text-center font-mono text-white placeholder-white/20 transition-all outline-none`}
            autoFocus
            disabled={loading}
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-white hover:bg-white/90 text-black text-sm font-bold rounded-lg transition-all active:scale-[0.99] duration-150 flex items-center justify-center"
          >
            {loading ? 'VERIFYING...' : 'UNLOCK ENGINE'}
          </button>
        </form>

        {error && (
          <p className="text-xs text-red-500 font-medium font-mono mt-3 uppercase tracking-tight animate-pulse">
            Access Key Invalid.
          </p>
        )}
      </div>
    </div>
  );
}