# Fjorr

A Next.js site for **Fjorr** — short films about the world's greatest stories, plus a browsable archive of related cultural artifacts. Content lives in Supabase; video streams through Mux; static assets (posters, animations) are hosted on `media.fjorr.com`.

Production: [fjorr.com](https://fjorr.com)

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve production build
```

### Environment variables

Set these in `.env.local` (or in Vercel):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Used by most app code (server + client queries) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Used by middleware session refresh (`lib/supabase/proxy.ts`). Set this to the same value as the anon key if you only have one key. |
| `SITE_PASSWORD` | Only used when `SITE_GATE_ENABLED=true` (staging preview gate) |
| `SITE_GATE_ENABLED` | Set to `true` on staging/preview to re-enable `/password` gate. Leave unset/false in production. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional. Used by the newsletter signup server action for writes to `intel_list`. Falls back to anon key if missing. |

**Debug tip:** visit `/debug-db` to confirm the server can reach Supabase and read from the `film` table.

---

## How the site is organized

### Route groups

Next.js route groups (folders in parentheses) control layout, not URLs:

```
app/
├── layout.tsx              # Root: fonts, global metadata, dark theme
├── (gate)/password/        # Site password gate (no navbar/footer)
├── (main)/                 # Standard pages — shared Navbar + Footer
│   ├── page.tsx            # Homepage
│   ├── film/[slug]/        # Individual film detail
│   ├── search/             # Search films + artifacts
│   ├── nominate/           # Story nomination form
│   ├── about, contact, partner, privacy, terms
│   └── auth/               # Supabase auth pages (starter-kit leftover)
└── (exhibition)/artifact/[slug]/   # Artifact detail — custom themed layout
```

**`(main)/layout.tsx`** wraps most pages with `Navbar` and `Footer`. Artifact pages in `(exhibition)` render their own chrome because each artifact can have a custom background color and light/dark text.

### Request flow

```
Browser request
    ↓
middleware.ts (root)          ← site password cookie check
    ↓
lib/supabase/proxy.ts         ← refreshes Supabase auth session (if env vars set)
    ↓
Page (Server or Client Component)
    ↓
Supabase query → render
```

**Site password gate:** Disabled in production by default. Set `SITE_GATE_ENABLED=true` (and optionally `SITE_PASSWORD`) on staging/preview if you want the `/password` cookie gate. Middleware no longer forces anonymous visitors through Supabase login.

**Note:** There is also an `app/middleware.ts` file — Next.js only runs the root `middleware.ts`. The one inside `app/` is unused.

---

## Data model (Supabase)

All content is in Supabase Postgres. There is no local schema file in this repo — the tables below are inferred from query usage.

### Core content

| Table | What it holds |
|---|---|
| `film` | Short films. Key fields: `slug`, `name`, `teaser`, `mux_playback_id`, `release_date`, hero images (`hero_wide`, `hero_clsx`, `hero_tall`), OG image (`blok_ogrf`), poster (`blok_tall`), `runtime`, `location`, `last_line`, `story_date` |
| `artifact` | Cultural artifacts linked to films. Key fields: `slug`, `name`, `description`, `quote`, `primary_color`, `is_dark_bg`, hero images, `link` / `link_cta` |
| `search` | Denormalized view/table for search — combines films and artifacts with `item_type`, `search_content`, ratings, themes, etc. |

### Relationships

| Table | Purpose |
|---|---|
| `collection` + `collection_map` | Curated film groupings. Homepage "Featured" rail reads `collection.slug = 'featured'`. |
| `film_artifact` | Links films ↔ artifacts (with `sort_order`) |
| `creator_map` + `creator` | Film/artifact credits |
| `tag_map` + `tag` | Film tags/themes |
| `language_subtitle` + `language` | Subtitle tracks (VTT URLs per language) |
| `transcript` | Transcript/subtitle content on film detail pages |
| `rating`, `theme`, `sponsor` | Lookup tables joined from `film` |

### User submissions

| Table | Purpose |
|---|---|
| `nominations` | Story nominations from `/nominate` |
| `intel_list` | Newsletter signups (via `components/intel.ts` server action) |

---

## Page-by-page mental model

### Homepage (`app/(main)/page.tsx`)

Stacked sections, each fetching its own data:

1. **HeroHome** — static banner
2. **FeatureRailLoader** — featured films carousel (from `collection` → `collection_map`)
3. **FilmRailLoader** × 2 — "Latest" (released) and "Coming Soon" (future `release_date`)
4. **ArtifactRailLoader** — recent artifacts
5. **PromoSplit** — partner + nominate CTAs

### Film detail (`/film/[slug]`)

Server component fetches the film plus related data in parallel (artifacts, recommendations, transcripts, tags, creators). Passes everything to **FilmPageContentWrapper** (client), which renders:

- **FilmHero** — poster, title, play button
- **CinemaTheater** — fullscreen video player overlay
- **ArtifactRail** — related artifacts
- **FilmRail** — "More films" recommendations
- **FilmSpecs** — metadata, credits, themes

Films with a future `release_date` are treated as "Coming Soon."

### Artifact detail (`/artifact/[slug]`)

Lives outside the main layout. Fetches theme tokens (`primary_color`, `is_dark_bg`) first for instant theming, then loads full content inside a `Suspense` boundary with a skeleton fallback. Layout is a split view: hero image left, **ArtifactSidebar** right.

### Search (`/search`)

Client-side. Queries the `search` table with `ilike` on `name`, `teaser`, and `search_content`, then ranks results client-side. Shows latest releases when idle, empty-state when no matches.

---

## Component pattern: Loader → Presentation

Most homepage rails follow the same pattern:

```
*RailLoader.tsx   (Server Component — queries Supabase)
       ↓
*Rail.tsx         (Client Component — carousel UI, GSAP animations)
```

**FeatureRailLoader** is the exception — it's a client component that fetches on mount (needed because it also manages the video theater state).

Shared UI utilities:

- **SkeletonLoader** / **ServerSafeSkeleton** — dot-matrix loading placeholders
- **CinemaTheater** — the video player (dynamically imported, `ssr: false`)

---

## Video playback (CinemaTheater)

Films stream via **Mux**. The player reads `film.mux_playback_id` and builds a URL like:

```
https://stream.mux.com/{playback_id}.m3u8   (or /high.mp4 fallback)
```

Behavior:

1. Plays a Fjorr studio logo bumper first (`media.fjorr.com/assets/studio-logo/...`)
2. Then streams the film
3. Custom subtitle rendering — fetches VTT files from `language_subtitle` and parses cues in JS (not native `<track>`)
4. Dispatches `fjorr_hide_main_navbar` / `fjorr_show_main_navbar` events so the Navbar hides during playback

Theater can be opened from the homepage feature rail or from a film detail page.

---

## Supabase clients (there are two)

This project started from the Supabase starter kit and grew organically. Two client setups coexist:

| Location | Key env var | Used by |
|---|---|---|
| `utils/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Film/artifact pages, rail loaders, sitemap, debug page |
| `lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Starter-kit auth components |
| `lib/supabase/proxy.ts` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Middleware session refresh |

Client-side code (`FeatureRailLoader`, `SearchClient`, `NominateClient`) creates browser clients directly with `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

If middleware auth redirects become a problem, check `lib/supabase/proxy.ts` — it redirects unauthenticated users to `/auth/login` on all routes except `/` and `/auth/*`. This only runs when `PUBLISHABLE_KEY` is set (`hasEnvVars` in `lib/utils.ts`).

---

## Static assets & media

- **Posters, hero images, OG images** — stored as URLs in Supabase (likely Cloudflare R2 or similar at `media.fjorr.com`)
- **Video** — Mux (`mux_playback_id` on each film)
- **Local public files** — `public/icons/` (player controls), `public/fjorr_scout.mp4`, favicon

Image field naming convention:
- `blok_tall` — tall poster (rails, cards)
- `blok_ogrf` — Open Graph / social preview
- `hero_wide`, `hero_clsx`, `hero_tall` — hero section variants

---

## Forms & server actions

| Feature | Mechanism | Destination |
|---|---|---|
| Newsletter signup | Server action in `components/intel.ts` | `intel_list` table |
| Story nomination | Client form in `NominateClient.tsx` | `nominations` table |
| Site password | `POST /api/gate/route.ts` | Sets `site-auth` cookie |

---

## Styling

- **Tailwind CSS** with custom design tokens in `app/globals.css` (`dark-01`, `light-01`, etc.)
- **Fonts:** Inter + JetBrains Mono (Google Fonts), Futura via Adobe Typekit (`xyf8acw.css`)
- **UI primitives:** shadcn/ui components in `components/ui/`
- **Animations:** GSAP in rail components, CSS transitions elsewhere

---

## Auth pages (starter-kit leftover)

The `app/(main)/auth/` directory contains login, sign-up, password reset, and a protected demo page from the original Supabase starter. These are not central to the public site experience but remain wired up if you want user accounts later.

---

## Deployment

Hosted on **Vercel**. The sitemap (`app/sitemap.js`) and web manifest (`app/manifest.js`) are generated at build time. SEO metadata is set per-page via Next.js `metadata` exports, with JSON-LD structured data on film and artifact pages.

---

## Useful paths when you're lost

| I want to… | Start here |
|---|---|
| Change the homepage layout | `app/(main)/page.tsx` |
| Edit the featured carousel | `components/FeatureRailLoader.tsx` + `FeatureRail.tsx` |
| Fix video playback | `components/CinemaTheater.tsx` |
| Change film page layout | `components/FilmPageContentWrapper.tsx` |
| Change artifact page layout | `app/(exhibition)/artifact/[slug]/page.tsx` |
| Update site password | `SITE_PASSWORD` env var or `app/api/gate/route.ts` |
| Debug Supabase connection | `/debug-db` |
| Change global nav/footer | `components/Navbar.tsx`, `components/Footer.tsx` |
| Update SEO defaults | `app/layout.tsx` |
