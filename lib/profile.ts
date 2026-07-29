/**
 * Member profile helpers — identity substrate.
 * Public path: /account/{member_number}/{slug}
 */

export type ScoutProfile = {
  id: string;
  member_number: number;
  display_name: string;
  slug: string;
  bio: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

const RESERVED_SLUGS = new Set([
  'account',
  'accounts',
  'admin',
  'api',
  'auth',
  'fjorr',
  'film',
  'artifact',
  'bounties',
  'bounty',
  'nominate',
  'partner',
  'privacy',
  'terms',
  'scout',
  'scouts',
  'signin',
  'sign-in',
  'signup',
  'sign-up',
  'www',
  'support',
  'help',
  'roster',
  'passport',
  'u',
  'member',
  'members',
  'profile',
  'profiles',
]);

/** Normalize a slug candidate. Returns null if invalid. */
export function normalizeSlug(raw: string): string | null {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  if (slug.length < 3) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  if (RESERVED_SLUGS.has(slug)) return null;
  return slug;
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/** Canonical public profile path. */
export function profilePath(memberNumber: number, slug: string): string {
  return `/account/${memberNumber}/${slug}`;
}

/** Visible prefix before the editable slug (includes member number). */
export function profileUrlPrefix(memberNumber: number): string {
  return `fjorr.com/account/${memberNumber}/`;
}
