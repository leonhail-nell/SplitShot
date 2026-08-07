# SplitShot (monorepo)

AI receipt splitter — **Next.js web** + **Expo mobile** in one workspace.

## Structure

```
apps/web          Next.js API + web UI (@splitshot/web)
apps/mobile       Expo app (@splitshot/mobile)
packages/shared   Shared types, totals, formatMoney (@splitshot/shared)
docs/             Store prep checklist
```

## Requirements

- Node.js 22+
- OpenAI API key (receipt parsing)
- Optional: Stripe keys, Expo account for EAS

## Setup

```bash
nvm use
npm install          # installs all workspaces + builds shared + prisma generate
cp apps/web/.env.example apps/web/.env
# edit AUTH_SECRET, OPENAI_API_KEY, etc.
```

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
