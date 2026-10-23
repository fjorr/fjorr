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
    promptsLeft = Math.max(0, PROMPTS_PER_CYCLE - (count ?? 0));
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
          open,
        },
      ];
    });
  } catch {
    return [];
  }
}
