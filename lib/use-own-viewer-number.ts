'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FILM_RECORDED_EVENT } from '@/lib/record-view';

/**
 * Signed-in Viewer # for a film, if this member has a Film Log entry.
 * Updates live when a view is recorded in this tab.
 */
export function useOwnViewerNumber(filmId: string | null | undefined) {
  const [viewerNumber, setViewerNumber] = useState<number | null>(null);

  useEffect(() => {
    if (!filmId) {
      setViewerNumber(null);
      return;
    }

    let mounted = true;
    const supabase = createClient();

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        setViewerNumber(null);
        return;
      }

      const { data } = await supabase
        .from('film_view_record')
        .select('viewer_number')
        .eq('user_id', user.id)
        .eq('film_id', filmId)
        .maybeSingle();

      if (!mounted) return;
      const n = Number(data?.viewer_number);
      setViewerNumber(Number.isFinite(n) && n >= 1 ? n : null);
    };

    void load();

    const onRecorded = (event: Event) => {
      const detail = (event as CustomEvent<{ filmId?: string; viewerNumber?: number }>)
        .detail;
      if (!detail || detail.filmId !== filmId) return;
      const n = Number(detail.viewerNumber);
      if (Number.isFinite(n) && n >= 1) setViewerNumber(n);
      else void load();
    };

    window.addEventListener(FILM_RECORDED_EVENT, onRecorded);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      mounted = false;
      window.removeEventListener(FILM_RECORDED_EVENT, onRecorded);
      subscription.unsubscribe();
    };
  }, [filmId]);

  return viewerNumber;
}
