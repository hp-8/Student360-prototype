# Design — Student360

A locked design system for this app. Every future page or component redesign
reads this file before emitting code. Do not regenerate per page — extend or
amend this file when the system needs to grow.

## Genre

Editorial, adapted for an internal tool. Student360 has no marketing pages —
every screen is an authenticated app page used all day by staff, so the
Hallmark macrostructure/nav/footer catalog (built for landing pages) does not
apply. There is one page-type family: **App pages**.

## Concept — "Dossier"

A visa-consultancy caseworker's dossier: warm ivory paper, deep ink-navy,
a single brass accent, oxblood reserved for refusals/urgent items. Reference
numbers and counts render in monospace, like a ledger. Tables read as ruled
ledger sheets (hairlines, no cell borders, no zebra striping). Status badges
are small rectangular stamps, not pills — uppercase, tracked, monospace.

## App pages — macrostructure family

No hero, no marketing sections. Every screen follows the same shape:
- Fixed app shell (`AppHeader` stays put; only the content region scrolls).
- `PageHeader` (title + one-line description) at the top of each page.
- Content organized into `Card` sections, or `Tabs` when a single entity
  (Student / Study Option / Visa Case) has more than ~3 logical groupings.
- Tables are ledger-style: hairline row dividers, monospace uppercase column
  heads, no card-in-card, no borders-on-every-cell.
- Detail panels (Student, Study Option, Visa Case) render as slide-over
  panels via intercepting routes, with a full-page fallback at the same URL.

Enrichment: **none**. Function carries every page; no decorative imagery,
no hero art, no illustration.

## Theme — "Dossier" (custom OKLCH palette)

```css
--paper:       oklch(96% 0.014 80);   /* page background, warm ivory */
--paper-2:     oklch(99% 0.006 85);   /* card surface */
--paper-line:  oklch(87% 0.02 75);    /* hairline rule */
--ink:         oklch(24% 0.045 262);  /* primary text, deep ink-navy */
--ink-soft:    oklch(46% 0.03 258);   /* secondary text */
--navy:        oklch(30% 0.07 260);   /* primary action */
--navy-deep:   oklch(20% 0.06 262);   /* primary action, hover */
--brass:       oklch(56% 0.12 75);    /* the one warm accent */
--brass-soft:  oklch(80% 0.07 80);
--oxblood:     oklch(38% 0.13 25);    /* refused / urgent / danger */
--oxblood-soft: oklch(90% 0.045 30);
--focus-ring:  oklch(62% 0.16 75);
```

Six semantic status slots (slate/green/red/amber/blue/purple, unchanged API
in `Badge`) are retinted to sit inside this palette rather than a generic
rainbow — see `globals.css` `--status-*` tokens.

## Typography

- Display: **Fraunces**, weight 500/600, roman only (no italic headers).
- Body: **IBM Plex Sans**, weight 400/500/600.
- Outlier (monospace): **JetBrains Mono** — used only for: table column
  heads, KPI/stat figures, visa attempt numbers ("Attempt 2"), and status
  badge text. This is a functional register (aligns numbers, reads as a
  ledger), not decoration — it does not appear in prose or button labels.

Loaded via `next/font/google` in `src/app/fonts.ts`, exposed as
`--font-display` / `--font-body` / `--font-mono` on `<html>`.

## Spacing

Existing Tailwind default scale, used consistently (`gap-3` / `gap-4` /
`gap-5` / `gap-6`, `p-4` / `p-5`). No new spacing tokens introduced — the
redesign is a token/voice change, not a layout-density change (a separate
pass already reduced page-level scrolling).

## Motion

- Easing: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`, `--dur-short: 160ms`,
  `--dur-med: 240ms`.
- Reveal pattern: none — app pages don't scroll-reveal. Only stateful
  transitions (modal slide-in, tab switch, row hover) animate.
- `prefers-reduced-motion: reduce` collapses all transitions/animations to
  near-zero duration.

## Microinteractions stance

- Silent success on form submits (revalidated data is the confirmation; no
  toasts).
- `:focus-visible` always shows an instant brass ring — never animated in.
- Table rows get a quiet background transition on hover only.

## Component voice

- **Card**: `--paper-2` surface, hairline `--paper-line` border, no shadow
  beyond a 1px ambient shadow. No nested cards.
- **Badge**: small rectangular "stamp" — `rounded-[3px]`, monospace
  uppercase text, tracked out, thin border in the status colour, tinted
  background. Not a pill.
- **Button**: primary = solid navy; secondary = paper surface + hairline
  border; danger = oxblood. Rounded corners match Card (`rounded-md`), never
  pill-shaped.
- **Table**: hairline row dividers only, monospace uppercase column heads in
  brass-ink, no zebra striping, no per-cell borders.
- **Tabs**: sticky underline tabs, brass-ink active state.

## What every page must share

- The palette and status-colour retinting above.
- The Fraunces/IBM Plex Sans/JetBrains Mono pairing and the outlier's scope
  (numbers/labels only, never prose).
- The Card / Badge / Button / Table voice in this file.
- The fixed app-shell shell (header pinned, content scrolls).

## What pages may differ on

- Card layout (grid vs. stacked vs. tabs) per the page's own information
  density needs.
- Whether a page uses `Tabs` at all (only entities with several logical
  groupings do).

## Exports

### tokens.css

See `src/app/globals.css` `:root` block — that file is the live token
source for this project; a separate `tokens.css` was not split out since
there is only one theme and one consumer (this app).
