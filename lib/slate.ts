import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isOwnBureauxActive } from '@/lib/bureaux';
import type { SlateStory } from '@/lib/slate-text';

export type { SlateStory };

export type SlateBoardData = {
  open: boolean;
  endsAt: string | null;
  stories: SlateStory[];
  canVote: boolean;
  selectedId: string | null;
  promptsLeft: number;
  edition: number;
};

const PROMPTS_PER_CYCLE = 2;

/** This account nominates without the two-per-cycle cap. */
const UNLIMITED_PROMPT_EMAIL = 'thor@fjorr.com';

export function unlimitedPrompts(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === UNLIMITED_PROMPT_EMAIL;
}

function mapStory(row: Record<string, unknown>): SlateStory {
  const source = row.source === 'member' ? 'member' : 'internal';
  const memberNumber =
    typeof row.member_number === 'number' ? row.member_number : null;
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    logline: String(row.logline ?? ''),
    treatment: String(row.treatment ?? ''),
    imageUrl: typeof row.image_url === 'string' ? row.image_url : null,
    source,
    memberNumber: source === 'member' ? memberNumber : null,
  };
}

/** Open cycle, its cards, and this member's private vote. No counts. */
export const loadSlate = cache(async (): Promise<SlateBoardData> => {
  const empty: SlateBoardData = {
    open: false,
    endsAt: null,
    stories: [],
    canVote: false,
    selectedId: null,
    promptsLeft: 0,
    edition: 1,
  };

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: cycle, error: cycleError } = await supabase
    .from('slate_cycle')
    .select('id, starts_at, ends_at')
    .eq('status', 'open')
    .lte('starts_at', now)
    .gt('ends_at', now)
    .maybeSingle();

  if (cycleError || !cycle) return empty;

  const cycleId = String(cycle.id);
  const { data: storyRows, error: storyError } = await supabase
    .from('slate_story')
    .select(
      'id, title, logline, treatment, image_url, source, member_number, sort_order'
    )
    .eq('cycle_id', cycleId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  const stories = (storyError ? [] : (storyRows ?? [])).map((row) =>
    mapStory(row as Record<string, unknown>)
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canVote = false;
  let selectedId: string | null = null;
  let promptsLeft = PROMPTS_PER_CYCLE;

  if (user) {
    canVote = await isOwnBureauxActive(user.id);
    const [{ data: vote }, { count }] = await Promise.all([
      supabase
        .from('slate_vote')
        .select('story_id')
        .eq('cycle_id', cycleId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('slate_prompt')
        .select('id', { count: 'exact', head: true })
        .eq('cycle_id', cycleId)
        .eq('user_id', user.id),
    ]);
    if (vote?.story_id) selectedId = String(vote.story_id);
    promptsLeft = unlimitedPrompts(user.email)
      ? 1
      : Math.max(0, PROMPTS_PER_CYCLE - (count ?? 0));
  }

  return {
    open: true,
    endsAt: typeof cycle.ends_at === 'string' ? cycle.ends_at : null,
    stories,
    canVote,
    selectedId,
    promptsLeft,
    edition: await editionNumber(
      typeof cycle.starts_at === 'string' ? cycle.starts_at : now
    ),
  };
});

export type SlateEditionSummary = {
  edition: string;
  endsAt: string | null;
  open: boolean;
  storyCount: number;
  titles: string[];
};

type CycleRecord = {
  id: string;
  edition: number;
  endsAt: string | null;
  open: boolean;
  storyCount: number;
  titles: string[];
};

function cycleIsOpen(status: string, startsAt: string, endsAt: string, now: number) {
  const starts = Date.parse(startsAt);
  const ends = Date.parse(endsAt);
  return status === 'open' && Number.isFinite(starts) && starts <= now && Number.isFinite(ends) && ends > now;
}

/** Every slate, oldest first. Edition 01 is the first cycle. */
async function loadCycles(): Promise<CycleRecord[]> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from('slate_cycle')
    .select('id, starts_at, ends_at, status, slate_story(title, sort_order)')
    .order('starts_at', { ascending: true });
  if (error || !data) return [];
  const now = Date.now();
  return data.map((row, index) => {
    const stories = (Array.isArray(row.slate_story) ? row.slate_story : [])
      .map((story) => {
        const record = story as { title?: unknown; sort_order?: unknown };
        return {
          title: typeof record.title === 'string' ? record.title.trim() : '',
          sort: Number(record.sort_order) || 0,
        };
      })
      .filter((story) => story.title)
      .sort((a, b) => a.sort - b.sort);
    const startsAt = typeof row.starts_at === 'string' ? row.starts_at : '';
    const endsAt = typeof row.ends_at === 'string' ? row.ends_at : null;
    return {
      id: String(row.id),
      edition: index + 1,
      endsAt,
      open: endsAt ? cycleIsOpen(String(row.status ?? ''), startsAt, endsAt, now) : false,
      storyCount: stories.length,
      titles: stories.slice(0, 4).map((story) => story.title),
    };
  });
}

export async function loadSlateIndex(): Promise<SlateEditionSummary[]> {
  try {
    const cycles = await loadCycles();
    return cycles.map((cycle) => ({
      edition: String(cycle.edition).padStart(2, '0'),
      endsAt: cycle.endsAt,
      open: cycle.open,
      storyCount: cycle.storyCount,
      titles: cycle.titles,
    }));
  } catch {
    return [];
  }
}

/** One edition, including a closed slate. Null when that edition does not exist. */
export async function loadSlateEdition(edition: number): Promise<SlateBoardData | null> {
  if (!Number.isInteger(edition) || edition < 1) return null;
  try {
    const cycles = await loadCycles();
    const cycle = cycles[edition - 1];
    if (!cycle) return null;

    const admin = createServiceClient();
    const { data: storyRows, error: storyError } = await admin
      .from('slate_story')
      .select('id, title, logline, treatment, image_url, source, member_number, sort_order')
      .eq('cycle_id', cycle.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    const stories = (storyError ? [] : (storyRows ?? [])).map((row) =>
      mapStory(row as Record<string, unknown>)
    );

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let canVote = false;
    let selectedId: string | null = null;
    if (user) {
      if (cycle.open) canVote = await isOwnBureauxActive(user.id);
      const { data: vote } = await supabase
        .from('slate_vote')
        .select('story_id')
        .eq('cycle_id', cycle.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (vote?.story_id) selectedId = String(vote.story_id);
    }

    return {
      open: cycle.open,
      endsAt: cycle.endsAt,
      stories,
      canVote,
      selectedId,
      promptsLeft: 0,
      edition,
    };
  } catch {
    return null;
  }
}

export function formatSlateDate(locale: string, iso: string) {
  const date = new Date(iso);
  const month = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
    .format(date)
    .replace(/\./g, '');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${month} ${day}`;
}

export function formatSlateMonth(_locale: string, iso: string) {
  const date = new Date(iso);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${month}/${year}`;
}

export function slateMonthStamp(label: string, locale: string, endsAt: string) {
  if (!endsAt) return label;
  return `${label} · ${formatSlateMonth(locale, endsAt)}`;
}

/** 1-based place of this cycle among every slate, oldest first. */
async function editionNumber(startsAt: string): Promise<number> {
  try {
    const admin = createServiceClient();
    const { count, error } = await admin
      .from('slate_cycle')
      .select('id', { count: 'exact', head: true })
      .lte('starts_at', startsAt);
    if (error || !count || count < 1) return 1;
    return count;
  } catch {
    return 1;
  }
}

export type OwnSlateVote = {
  storyId: string;
  title: string;
  votedAt: string;
  edition: string;
  endsAt: string;
  open: boolean;
};

/** This member's votes, newest first. Story titles stay private to them. */
export async function loadOwnSlateVotes(userId: string): Promise<OwnSlateVote[]> {
  try {
    const admin = createServiceClient();
    const [{ data: votes, error }, { data: cycles, error: cycleError }] =
      await Promise.all([
        admin
          .from('slate_vote')
          .select(
            'cycle_id, story_id, updated_at, created_at, story:slate_story(title), cycle:slate_cycle(status, starts_at, ends_at)'
          )
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
        admin
          .from('slate_cycle')
          .select('id, starts_at')
          .order('starts_at', { ascending: true }),
      ]);
    if (error || cycleError || !votes) return [];

    const editionByCycle = new Map<string, number>();
    for (const [index, cycle] of (cycles ?? []).entries()) {
      editionByCycle.set(String(cycle.id), index + 1);
    }

    const now = Date.now();
    return votes.flatMap((row) => {
      const story = Array.isArray(row.story) ? row.story[0] : row.story;
      const cycle = Array.isArray(row.cycle) ? row.cycle[0] : row.cycle;
      const title = typeof story?.title === 'string' ? story.title.trim() : '';
      if (!title) return [];
      const endsAt =
        typeof cycle?.ends_at === 'string' ? Date.parse(cycle.ends_at) : NaN;
      const startsAt =
        typeof cycle?.starts_at === 'string' ? Date.parse(cycle.starts_at) : NaN;
      const open =
        cycle?.status === 'open' &&
        Number.isFinite(startsAt) &&
        startsAt <= now &&
        Number.isFinite(endsAt) &&
        endsAt > now;
      const edition = editionByCycle.get(String(row.cycle_id)) ?? 1;
      const votedAt =
        typeof row.updated_at === 'string'
          ? row.updated_at
          : typeof row.created_at === 'string'
            ? row.created_at
            : '';
      return [
        {
          storyId: String(row.story_id),
          title,
          votedAt,
          edition: String(edition).padStart(2, '0'),
          endsAt: typeof cycle?.ends_at === 'string' ? cycle.ends_at : '',
          open,
        },
      ];
    });
  } catch {
    return [];
  }
}

export type OwnSlatePrompt = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  edition: string;
  endsAt: string;
};

/** This member's slate ideas, newest first. */
export async function loadOwnSlatePrompts(userId: string): Promise<OwnSlatePrompt[]> {
  try {
    const admin = createServiceClient();
    const [{ data: prompts, error }, { data: cycles, error: cycleError }] =
      await Promise.all([
        admin
          .from('slate_prompt')
          .select('id, title, body, created_at, cycle_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        admin
          .from('slate_cycle')
          .select('id, starts_at, ends_at')
          .order('starts_at', { ascending: true }),
      ]);
    if (error || cycleError || !prompts) return [];

    const editionByCycle = new Map<string, number>();
    const endsByCycle = new Map<string, string>();
    for (const [index, cycle] of (cycles ?? []).entries()) {
      const id = String(cycle.id);
      editionByCycle.set(id, index + 1);
      if (typeof cycle.ends_at === 'string') endsByCycle.set(id, cycle.ends_at);
    }

    return prompts.flatMap((row) => {
      const body = typeof row.body === 'string' ? row.body.trim() : '';
      const title = typeof row.title === 'string' ? row.title.trim() : '';
      if (!body && !title) return [];
      const edition = editionByCycle.get(String(row.cycle_id)) ?? 1;
      return [
        {
          id: String(row.id),
          title: title || body,
          body,
          createdAt: typeof row.created_at === 'string' ? row.created_at : '',
          edition: String(edition).padStart(2, '0'),
          endsAt: endsByCycle.get(String(row.cycle_id)) ?? '',
        },
      ];
    });
  } catch {
    return [];
  }
}
