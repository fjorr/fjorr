import React from 'react';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DebugDatabasePage() {
  let serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT FOUND';
  let serverKeyLength = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0;
  let serverDiagnostic = 'Testing server connection...';
  let rawFilmSample: any = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('film').select('id, name, slug').limit(1);
    
    if (error) {
      serverDiagnostic = `❌ Supabase Error: ${error.message} (Code: ${error.code})`;
    } else if (data && data.length > 0) {
      serverDiagnostic = '✅ Server Connection Successful! Data retrieved.';
      rawFilmSample = data[0];
    } else {
      serverDiagnostic = '⚠️ Connected to table, but "film" table returned 0 rows.';
    }
  } catch (err: any) {
    serverDiagnostic = `❌ Runtime Crash: ${err.message || err}`;
  }

  return (
    <div className="w-full min-h-screen bg-[#111] text-white font-mono p-12 flex flex-col gap-6 pt-24">
      <h1 className="text-2xl font-bold text-emerald-400">Fjorr Global Database Debugger</h1>
      <p className="text-xs text-white/50">This page evaluates system environment context live on Vercel edge networks.</p>
      
      <hr className="border-white/10" />

      <div className="bg-black/40 border border-white/10 p-6 rounded-lg flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-sky-400">1. Server Environment Snapshot</h2>
        <div><span className="text-white/40">URL Endpoint:</span> {serverUrl}</div>
        <div><span className="text-white/40">Key Length:</span> {serverKeyLength} characters</div>
        <div><span className="text-white/40">URL Validation:</span> {serverUrl.includes('/rest/v1') ? '❌ FAILED: Trailing rest path detected!' : '✅ PASS: Base domain looks clean.'}</div>
      </div>

      <div className="bg-black/40 border border-white/10 p-6 rounded-lg flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-purple-400">2. Active Query Execution Test</h2>
        <div><span className="text-white/40">Status:</span> {serverDiagnostic}</div>
        {rawFilmSample && (
          <pre className="bg-black/60 p-4 rounded border border-white/5 text-xs text-emerald-300 mt-2">
            {JSON.stringify(rawFilmSample, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}