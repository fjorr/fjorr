# Launch-deferred features

Moved out of the live App Router for the house launch. Restore by moving trees back under `app/[locale]/`.

## Contents
- `(admin)/` — Control desk
- `(main)/nominate` — public nominate form
- `(main)/plus` — Plus landing redirect
- `(main)/bounties` — bounties wall + briefs
- `(main)/account-plus` — member Plus notes (was `/account/plus`)
- `(main)/principles` — Principles of a Myth (voice shows in the work at launch)
- `(main)/contact` — dedicated contact page (contact lives on About / Partner via ContactPill)
- `components/BureauxGiftSeat.tsx`
- `components/CabinetOfferForm.tsx`
- `components/CabinetOffersLedger.tsx`

Redirects for public URLs live in `next.config.ts`:
- `/contact` → `/about`
- `/principles` → `/about`
