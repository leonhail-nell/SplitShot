# SplitShot (monorepo)

AI receipt splitter — **Next.js web** + **Expo mobile** in one workspace.

## Structure

```
apps/web          Next.js API + web UI (@splitshot/web)
apps/mobile       Expo app (@splitshot/mobile, SDK 54 / App Store Expo Go)
packages/shared   Shared types, totals, formatMoney (@splitshot/shared)
docs/             Store prep checklist
```

## Requirements

- Node.js 22+
- Anthropic API key (receipt parsing via Claude)
- PostgreSQL (`DATABASE_URL`) — Neon on Vercel
- Vercel Blob (`BLOB_READ_WRITE_TOKEN`) for receipt photos on Vercel
- Optional: Stripe keys, Expo account for EAS

## Setup

```bash
nvm use              # required — Node 22+ (system Node 20 breaks Prisma 7)
node -v              # should print v22.x
npm install          # installs all workspaces + builds shared + prisma generate
cp apps/web/.env.example apps/web/.env
# edit AUTH_SECRET, ANTHROPIC_API_KEY, etc.
```

If `npm install` dumps a huge `@prisma/dev` / `ERR_REQUIRE_ESM` error, your shell is still on Node 20 — run `nvm use` (or `nvm install 22 && nvm use 22`) and retry.

## Run

```bash
npm run dev          # web → http://localhost:3000
npm run dev:mobile   # Expo Metro
```

Web app cwd is `apps/web` (Prisma DB `apps/web/dev.db` by default).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js web |
| `npm run dev:mobile` | Expo start |
| `npm run build` | Build shared + web |
| `npm run db:migrate` | Prisma migrate (web) |

## Mobile store prep

See [docs/STORE_CHECKLIST.md](docs/STORE_CHECKLIST.md) and `apps/mobile/eas.json`. No live store submission is automated.

## Former location

The Expo app previously lived at `../splitshot-mobile`. Use `apps/mobile` inside this repo instead.
