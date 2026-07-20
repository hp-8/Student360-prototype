# Design — Student360

A locked design system for this app. Read this before touching visual code.

## Direction

Clean, professional, modern SaaS dashboard — modeled directly on a reference
screenshot the user supplied (a project-management tool: left sidebar nav,
white cards on a light gray canvas, soft shadows, rounded corners, pill status
badges with a colored dot, segmented/linear progress bars, one clean sans
typeface throughout). No serif, no monospace accents, no "ledger/stamp"
motifs — those belonged to an earlier direction and have been fully replaced.

## Layout

- Persistent left sidebar (`src/components/Sidebar.tsx`): wordmark, role-based
  nav with `lucide-react` line icons, user profile + role switcher + logout
  pinned at the bottom. Replaces the old top app-bar entirely.
- Content area: light gray page background, `max-w-6xl` centered column,
  scrolls independently of the sidebar (fixed viewport shell).
- Detail panels (Student / Study Option / Visa Case) still render as
  slide-over panels via intercepting routes.

## Typography

Single family: **Inter** (`next/font/google`, `src/app/fonts.ts`), weights
400–700, exposed as `--font-sans`. Headings are the same family at 600
weight, not a separate display face.

## Color tokens (`src/app/globals.css`)

- `--paper` — light gray page background · `--card` / `--paper-2` — white
  card surface · `--paper-line` — hairline border.
- `--ink` / `--ink-soft` / `--ink-faint` — neutral gray text scale.
- `--navy` / `--navy-deep` — primary accent (vivid indigo-blue): primary
  buttons, links, active states.
- `--brass` / `--brass-soft` / `--brass-ink` — secondary warm accent (orange).
- `--oxblood` — danger/red accent.
- `--status-{slate,green,red,amber,blue,purple}-{bg,fg}` — the six semantic
  status pairs used by `Badge`, retinted to saturated, modern pill colors.
- `--shadow-card` / `--shadow-card-hover` — the soft shadow every `Card` uses.

## Component voice

- **Card**: white surface, `rounded-2xl`, soft shadow, hairline border. No
  nested cards.
- **Badge**: pill (`rounded-full`), soft tinted background, a small colored
  dot before the label. Not a stamp, not monospace, not uppercase.
- **Button**: `rounded-lg`, solid navy primary / bordered white secondary /
  solid red danger.
- **Avatar** (`ui.tsx`): circular initials badge, used for staff/assignee
  representation.
- **Table**: plain sans column heads (gray, medium weight, normal case, no
  mono), hairline row dividers, subtle hover — set globally in `globals.css`
  so per-page table markup doesn't need repeating.
- **SegmentedBar** / **ProgressMeter** (`src/components/`): the two chart
  primitives for dashboard cards — a single proportional multi-color bar
  with a legend (e.g. students-by-stage), and a labeled linear fill meter
  with a percentage (e.g. approval rate). Never fabricate a trend/delta
  figure (no invented "+12% vs last month") — only render numbers computed
  from real data, with a plain caption instead of a fake comparison when
  there's no historical baseline to compare against.

## Motion

Minimal: card-hover shadow transition, tab underline transition, modal
slide-in. `prefers-reduced-motion: reduce` collapses all of it.

## What every page must share

The token set above, the Card/Badge/Button/Avatar voice, and the sidebar
shell. Dashboard-style pages (Pipeline, Workload) use SegmentedBar/
ProgressMeter for aggregate visuals; list/detail pages stay table- or
panel-based.
