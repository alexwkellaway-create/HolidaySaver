# HolidaySaver 🏖️

> Save together, holiday together. A fun group holiday fund tracker for friends.

Create a pot, invite your friends via a unique link, log contributions, celebrate milestones — and watch your dream holiday get funded one £ at a time.

---

## Features

- 🎯 **Party management** — create a holiday pot with name, destination, target amount & date
- 🔗 **Unique invite links** — `/join/{token}` — joins users directly into that specific party
- 💰 **Contribution tracking** — log amounts with optional notes, edit/delete your own
- 📊 **Progress bars** — overall and per-person, with motivational copy
- 🎉 **Milestone confetti** — fires at 25%, 50%, 75%, 100%
- ⏳ **Countdown timer** — live seconds countdown to the holiday
- 🏆 **Leaderboard** — friendly, not shaming
- 👏 **Emoji reactions** — react to contributions with 👏 🔥 💪 ✈️
- 🔐 **Auth** — email magic links + optional Google OAuth
- 🌙 **Dark mode** — full dark mode support

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in at minimum:

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | Random string — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `DATABASE_URL` | `file:./dev.db` for SQLite (default) |
| `EMAIL_SERVER_*` | SMTP credentials for magic link emails |

Google OAuth is **optional** — the app works with email-only sign-in.

### 3. Set up the database

```bash
npm run db:push     # Creates the SQLite file and applies the schema
npm run db:seed     # Loads demo data (Ibiza 2026 party + 4 members)
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Tip:** After seeding, the console prints the demo party's invite URL so you can test the join flow immediately.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:push` | Sync Prisma schema → database (SQLite: creates the file) |
| `npm run db:migrate` | Create a named migration (use for production Postgres) |
| `npm run db:seed` | Load demo data |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo in [vercel.com](https://vercel.com).
3. Set the following **Environment Variables** in the Vercel dashboard:

```
NEXTAUTH_SECRET=<generate with openssl rand -base64 32>
NEXTAUTH_URL=https://your-app.vercel.app
DATABASE_URL=<your postgres connection string — see below>
EMAIL_SERVER_HOST=...
EMAIL_SERVER_PORT=...
EMAIL_SERVER_USER=...
EMAIL_SERVER_PASSWORD=...
EMAIL_FROM=HolidaySaver <noreply@yourdomain.com>
GOOGLE_CLIENT_ID=...          # optional
GOOGLE_CLIENT_SECRET=...      # optional
```

4. Add a **build command override** (or add to `package.json` `build` script):

```bash
prisma generate && prisma migrate deploy && next build
```

Vercel will deploy automatically on every push to `main`.

---

## Switching from SQLite to Postgres (Production)

SQLite is great for local dev but not suitable for multi-instance production deployments.

### 1. Update `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"   // ← change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 2. Update `DATABASE_URL`

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/holidaysaver?sslmode=require"
```

Free options: **Supabase**, **Neon**, **Railway**, **PlanetScale** (MySQL variant).

### 3. Create and run migrations

```bash
npx prisma migrate dev --name init
```

For production deployments:

```bash
npx prisma migrate deploy
```

> **Note:** The `@default(cuid())` IDs and all other schema constructs are compatible with both SQLite and Postgres — no schema changes needed beyond the provider.

---

## Project Structure

```
holidaysaver/
├── app/
│   ├── (app)/               # Authenticated app routes (require session)
│   │   ├── dashboard/       # My Pots page
│   │   └── parties/
│   │       ├── new/         # Create party form
│   │       └── [partyId]/   # Party dashboard + settings
│   ├── api/                 # API routes
│   │   ├── auth/[...nextauth]/
│   │   ├── parties/
│   │   ├── contributions/
│   │   └── join/
│   ├── auth/                # Sign-in + error pages
│   └── join/[token]/        # Public invite landing page
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   └── *.tsx                # Feature components
├── lib/
│   ├── auth.ts              # NextAuth config
│   ├── prisma.ts            # Prisma singleton
│   ├── utils.ts             # Helpers (formatCurrency, progressMessage, etc.)
│   └── types.ts             # Shared TypeScript types
└── prisma/
    ├── schema.prisma        # Database schema
    └── seed.ts              # Demo data
```

---

## Security Notes

- All API routes verify session server-side before returning any data
- Host-only actions (edit party, remove members, regenerate invite) are enforced server-side
- Invite tokens are 21-char cryptographically random nanoids
- The join endpoint is rate-limited (10 attempts / user / minute)
- All money amounts are validated server-side (positive, ≤£50,000, ≤2 decimal places)
- Prisma's parameterised queries prevent SQL injection by default
