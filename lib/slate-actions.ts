'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { defaultLocale, locales } from '@/i18n/config';
import { allowRate, clientIp } from '@/lib/abuse-guard';
import { createClient } from '@/lib/supabase/server';
import { unlimitedPrompts } from '@/lib/slate';
import { normalizePrompt, normalizeTitle } from '@/lib/slate-text';

const HOUR = 60 * 60 * 1000;

export type SlateActionCode =
  | 'signedOut'
  | 'notMember'
  | 'closed'
  | 'invalid'
  | 'limit'
  | 'rate'
  | 'error';

export type SlateActionResult =
  | { ok: true; storyId?: string; remaining?: number }
  | { ok: false; code: SlateActionCode };

function revalidateSlate() {
  revalidatePath('/slate');
  revalidatePath('/nominate');
  revalidatePath('/account/voting');
  revalidatePath('/account/nominations');
  for (const locale of locales) {
    if (locale === defaultLocale) continue;
    revalidatePath(`/${locale}/slate`);
    revalidatePath(`/${locale}/nominate`);
    revalidatePath(`/${locale}/account/voting`);
    revalidatePath(`/${locale}/account/nominations`);
  }
}

async function rateKey(name: string): Promise<string | null> {
  const headerList = await headers();
  const ip = clientIp((key) => headerList.get(key));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const who = user?.id ?? ip;
  if (name === 'prompt' && unlimitedPrompts(user?.email)) return who;
  if (!allowRate(`slate:${name}:${who}`, name === 'vote' ? 30 : 8, HOUR)) {
    return null;
  }
  return who;
}

function mapRpc(data: unknown): SlateActionResult {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return { ok: false, code: 'error' };
    }
  }
  if (!data || typeof data !== 'object') return { ok: false, code: 'error' };
  const row = data as { ok?: boolean; code?: string; storyId?: string; remaining?: number };
  if (row.ok) {
    return {
      ok: true,
      storyId: typeof row.storyId === 'string' ? row.storyId : undefined,
      remaining: typeof row.remaining === 'number' ? row.remaining : undefined,
    };
  }
  const code = row.code;
  if (
    code === 'signedOut' ||
    code === 'notMember' ||
    code === 'closed' ||
    code === 'invalid' ||
    code === 'limit'
  ) {
    return { ok: false, code };
  }
  return { ok: false, code: 'error' };
}

export async function castSlateVote(storyId: string): Promise<SlateActionResult> {
  if (!storyId || storyId.length > 80) return { ok: false, code: 'invalid' };
  if (!(await rateKey('vote'))) return { ok: false, code: 'rate' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('slate_cast_vote', {
    p_story_id: storyId,
  });
  if (error) {
    console.error('slate vote:', error.message);
    return { ok: false, code: 'error' };
  }
  const result = mapRpc(data);
  if (result.ok) revalidateSlate();
  return result;
}

export async function submitSlatePrompt(
  rawTitle: string,
  rawBody: string
): Promise<SlateActionResult> {
  const title = normalizeTitle(rawTitle);
  const body = normalizePrompt(rawBody);
  if (!title || !body) return { ok: false, code: 'invalid' };
  if (!(await rateKey('prompt'))) return { ok: false, code: 'rate' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('slate_submit_prompt', {
    p_title: title,
    p_body: body,
  });
  if (error) {
    console.error('slate prompt:', error.message);
    return { ok: false, code: 'error' };
  }
  const result = mapRpc(data);
  if (result.ok) revalidateSlate();
  return result;
}
