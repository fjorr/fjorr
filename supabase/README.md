# Supabase i18n

English stays on base tables. Other locales live in `*_translation` and are filled by Edge Functions.

This repo is linked to the **fjorr** project (`ecxnhbtaqhaxxvgztxse`).

**Important:** a `supabase/` folder also exists at `/Users/thor/supabase`, so the CLI often picks that as workdir. Always pass `--workdir` when applying SQL from this repo:

```bash
supabase --experimental db query \
  --workdir /Users/thor/code/fjorr \
  --linked \
  -f supabase/migrations/….sql
```

Re-link if needed: `supabase link --workdir /Users/thor/code/fjorr --project-ref ecxnhbtaqhaxxvgztxse`

Shared locale helpers: [`functions/_shared/i18n.ts`](./functions/_shared/i18n.ts)

Locales: `es fr it de pt sv hi ko ja zh-tw`  
All translators skip `status = 'reviewed'` and accept both manual JSON and Database Webhook `{ record: { id } }` (credit roles use `record.code`).

## Deploy all translators

```bash
supabase secrets set OPENAI_API_KEY=sk-...

supabase functions deploy translate-film
supabase functions deploy translate-artifact
supabase functions deploy translate-theme
supabase functions deploy translate-tag
supabase functions deploy translate-collection
supabase functions deploy translate-credit-role
```

## Webhooks (auto on new / updated rows)

Dashboard → Database → Webhooks — one per source table:

| Table | Events | Function URL |
|---|---|---|
| `film` | INSERT, UPDATE | `.../functions/v1/translate-film` |
| `artifact` | INSERT, UPDATE | `.../functions/v1/translate-artifact` |
| `theme` | INSERT, UPDATE | `.../functions/v1/translate-theme` |
| `tag` | INSERT, UPDATE | `.../functions/v1/translate-tag` |
| `collection` | INSERT, UPDATE | `.../functions/v1/translate-collection` |
| `credit_role` | INSERT, UPDATE | `.../functions/v1/translate-credit-role` |

Use the service role (or anon + function JWT verify settings) as Authorization on the webhook.

## Manual backfill examples

```bash
# Film / artifact (longer copy)
curl -X POST "$SUPABASE_URL/functions/v1/translate-film" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"film_id":"<uuid>"}'

curl -X POST "$SUPABASE_URL/functions/v1/translate-artifact" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"artifact_id":"<uuid>"}'

# Labels (name only)
curl -X POST "$SUPABASE_URL/functions/v1/translate-theme" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"theme_id":"<uuid>"}'

curl -X POST "$SUPABASE_URL/functions/v1/translate-tag" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tag_id":"<uuid>"}'

curl -X POST "$SUPABASE_URL/functions/v1/translate-collection" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"collection_id":"<uuid>"}'

# Note: credit_role uses text code, not UUID
curl -X POST "$SUPABASE_URL/functions/v1/translate-credit-role" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"role_code":"director"}'
```

## What each table translates

| Source | Translation table | Fields |
|---|---|---|
| `film` | `film_translation` | name, teaser, description, note, last_line, last_line_attribution, alt_text, location |
| `artifact` | `artifact_translation` | name, teaser, description, label, quote, link_cta |
| `theme` | `theme_translation` | name |
| `tag` | `tag_translation` | name |
| `collection` | `collection_translation` | name |
| `credit_role` | `credit_role_translation` | name |

## Schema migrations (if needed)

- [`migrations/20260726_film_translation.sql`](./migrations/20260726_film_translation.sql) — film / theme / credit_role tables + film stale trigger  
- [`migrations/20260726_app_locale_sv_hi_ko.sql`](./migrations/20260726_app_locale_sv_hi_ko.sql) — add `sv`, `hi`, `ko` to `app_locale`

`artifact_translation`, `tag_translation`, `collection_translation` already exist on production.

## App read status

| Content | App wired |
|---|---|
| Film copy | Yes |
| Artifact copy | Yes |
| Theme names | Yes (film + home; dials filter by stable EN slug, display localized name) |
| Credit roles | Yes (`creator_map.role_code` + `credit_role_translation`) |
| Tags | Yes (film specs) |
| Collections | Yes (home mix labels) |
| Search | Locale rows + EN fallback; `search_items` / `search_suggest`; trigram; theme re-sync |
| Static UI (`messages/*`) | Yes (all locales key-parity) |
