# AssetFlow

Enterprise Asset & Resource Management System for the Odoo hackathon.

Track assets through their full lifecycle, allocate with conflict handling, book shared resources without overlaps, run maintenance approvals, and close structured audit cycles.

## Tech stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Prisma 5** + SQLite (easy local demo)
- Cookie JWT auth (`jose` + `bcryptjs`)
- Charts via `recharts`

## Quick start

```bash
cd AssetFlow
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo logins (password for all: `password123`)

| Email | Role |
|---|---|
| `admin@assetflow.com` | Admin |
| `manager@assetflow.com` | Asset Manager |
| `head@assetflow.com` | Department Head |
| `priya@assetflow.com` | Employee |
| `raj@assetflow.com` | Employee |

Signup always creates an **Employee**. Only Admin can promote roles in **Organization → Employees**.

## Features covered

1. Login / Signup (no self-assigned admin)
2. KPI Dashboard + overdue returns
3. Organization setup (Departments, Categories, Employee directory)
4. Asset registration & directory (auto tags `AF-0001`)
5. Allocation / transfer / return with conflict handling
6. Resource booking with overlap validation
7. Maintenance approval workflow
8. Audit cycles + discrepancy report
9. Reports & analytics
10. Notifications + activity logs

## Team Git ownership (3 members)

Use **one shared repo**. Each member works on a feature branch and opens PRs into `main`.

### Member 1 — Backend & Auth (owns data + APIs)

**Upload / own these paths:**

- `prisma/` (schema + seed)
- `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/types.ts`, `src/lib/utils.ts`
- `src/middleware.ts`
- `src/app/api/**` (all API routes)
- `.env.example`, DB scripts in `package.json`

**Branch idea:** `member1/backend-api`

**Commits should cover:** auth, RBAC, asset lifecycle APIs, booking overlap rules, maintenance/audit workflows, seed data.

### Member 2 — Core Ops UI

**Upload / own these paths:**

- `src/app/(app)/dashboard/`
- `src/app/(app)/assets/`
- `src/app/(app)/allocations/`
- `src/app/(app)/bookings/`
- `src/components/Sidebar.tsx`, `src/components/AppShell.tsx`, `src/components/ui.tsx`
- `src/lib/api-client.ts`

**Branch idea:** `member2/ops-ui`

**Commits should cover:** dashboard KPIs, asset register/search, allocation conflict UI + transfer/return, booking calendar/forms.

### Member 3 — Admin, Workflows & Insights UI

**Upload / own these paths:**

- `src/app/login/`, `src/app/signup/`
- `src/app/(app)/organization/`
- `src/app/(app)/maintenance/`
- `src/app/(app)/audits/`
- `src/app/(app)/reports/`
- `src/app/(app)/notifications/`
- `src/app/globals.css`, `src/app/layout.tsx`, `README.md`

**Branch idea:** `member3/workflows-ui`

**Commits should cover:** auth screens, org setup tabs, maintenance/audit flows, reports charts, notifications + activity log polish.

### Shared rules

1. Never commit `.env`, `node_modules/`, `.next/`, or `*.db`
2. Pull `main` before starting work: `git pull origin main`
3. One feature per PR; keep PRs reviewable
4. If two people touch the same file, coordinate in chat first
5. For the final hackathon submit: merge all PRs → tag `v1.0` → push `main`

### Suggested commit order (so GitHub history looks fair)

1. Member 1: initial scaffold + schema + auth APIs  
2. Member 2: shell + dashboard + assets/allocations/bookings UI  
3. Member 3: org/maintenance/audits/reports/notifications + README polish  
4. Everyone: bugfix PRs on their owned modules  

## Project structure

```
AssetFlow/
├── prisma/                 # DB schema + seed
├── src/app/(app)/          # Logged-in screens
├── src/app/api/            # REST API routes
├── src/components/         # Shared UI
└── src/lib/                # Auth, prisma, helpers
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start local server |
| `npm run db:push` | Sync schema to SQLite |
| `npm run db:seed` | Load demo users/assets |
| `npm run db:reset` | Wipe DB + reseed |
| `npm run build` | Production build |

## Mockup reference

POC wireframe: https://app.excalidraw.com/l/65VNwvy7c4X/5ceOBMjbDby
