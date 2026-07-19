# Student360

A prototype visa consultancy case management platform: a single shared system covering enquiry-to-visa-outcome, with clear departmental ownership, replacing disconnected spreadsheets.

## Stack

- Next.js (App Router) + TypeScript
- PostgreSQL via Prisma ORM
- Tailwind CSS
- Lightweight custom auth (bcrypt + signed JWT session cookie), six roles

## Local setup

```bash
npm install

# Point DATABASE_URL and AUTH_SECRET at your own values in .env

npx prisma migrate dev
npm run seed

npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

## Demo accounts

All seeded users share the password `password123`.

| Role | Email |
|---|---|
| Front Desk | frontdesk@student360.test |
| Counsellor | counsellor@student360.test |
| Applications Team | applications@student360.test |
| Visa Team | visateam@student360.test |
| Manager | manager@student360.test |
| Administrator | admin@student360.test |

A second counsellor, applications team member and visa team member (`counsellor2@`, `applications2@`, `visateam2@`) are also seeded to populate the Manager's workload view with multiple staff.

## Domain model

See `prisma/schema.prisma` for the full data model. Core design decisions:

- **Country/route confirmation** is separate from individual Study Options — a student can hold several offers from different universities in the same country under one confirmed route.
- **Visa Case creation is always a manual action** (`openVisaCase` in `src/lib/domain/visaCases.ts`), used identically whether the offer came from an internal Study Option or externally (visa-only students).
- **Visa Attempts** are append-only history under a Visa Case — a refusal never overwrites earlier attempts; reopening creates a new attempt row.
- **Work Items** carry `department` + `assignedTo` from day one, with direct assignment only (no department-head routing queue in this prototype).

Business logic lives in `src/lib/domain/*` and is shared by both the seed script and the UI's server actions, so the same rules govern demo data and live usage.

## Seed data

`prisma/seed.ts` truncates and repopulates the database, covering every success scenario in the build brief: parallel study options, offer accept/reject, country confirmation, visa refusal + reopened attempt + approval (with full history preserved), a pivot after refusal, four offers under one confirmed route with an active-offer switch, a visa-only external-offer student, two parallel visa cases on one student, and a case manager reassignment with a logged note.

Re-run `npm run seed` any time to reset to this baseline.

## Roles & visibility

Role-based route protection is enforced in `src/middleware.ts` (coarse, edge-level) and re-checked in every page/server action via `requireRole()` (authoritative). See the build brief for the intended visibility per role.
