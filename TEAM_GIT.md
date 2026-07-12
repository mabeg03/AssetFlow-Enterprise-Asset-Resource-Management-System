# Who uploads what to Git (3 members)

One repo. Three owners. Feature branches → PR → `main`.

## Member 1 — Backend / Database / Auth

**Branch:** `member1/backend-api`

| Upload these | Why |
|---|---|
| `prisma/schema.prisma` | Database models |
| `prisma/seed.ts` | Demo data |
| `src/lib/prisma.ts` | DB client |
| `src/lib/auth.ts` | Login session + RBAC |
| `src/lib/types.ts` | Role/status types |
| `src/lib/utils.ts` | Shared helpers |
| `src/middleware.ts` | Route protection |
| `src/app/api/**` | All REST APIs |
| `.env.example` | Env template (never `.env`) |

```bash
git checkout -b member1/backend-api
git add prisma src/lib src/middleware.ts src/app/api .env.example
git commit -m "feat: add Prisma schema, auth, and AssetFlow APIs"
git push -u origin member1/backend-api
```

---

## Member 2 — Core operations UI

**Branch:** `member2/ops-ui`

| Upload these | Why |
|---|---|
| `src/components/**` | Sidebar, shell, UI kit |
| `src/lib/api-client.ts` | Frontend API helper |
| `src/app/(app)/dashboard/**` | KPI home |
| `src/app/(app)/assets/**` | Asset register/directory |
| `src/app/(app)/allocations/**` | Allocate / transfer / return |
| `src/app/(app)/bookings/**` | Shared resource booking |

```bash
git checkout -b member2/ops-ui
git add src/components src/lib/api-client.ts src/app/(app)/dashboard src/app/(app)/assets src/app/(app)/allocations src/app/(app)/bookings
git commit -m "feat: add dashboard, assets, allocations, and bookings UI"
git push -u origin member2/ops-ui
```

---

## Member 3 — Admin, workflows, reports, docs

**Branch:** `member3/workflows-ui`

| Upload these | Why |
|---|---|
| `src/app/login/**` | Login screen |
| `src/app/signup/**` | Employee signup |
| `src/app/(app)/organization/**` | Depts / categories / promote roles |
| `src/app/(app)/maintenance/**` | Maintenance workflow |
| `src/app/(app)/audits/**` | Audit cycles |
| `src/app/(app)/reports/**` | Analytics |
| `src/app/(app)/notifications/**` | Alerts + activity log |
| `src/app/globals.css` | Theme |
| `src/app/layout.tsx` | Fonts / metadata |
| `README.md` | Project docs |
| `TEAM_GIT.md` | This file |

```bash
git checkout -b member3/workflows-ui
git add src/app/login src/app/signup "src/app/(app)/organization" "src/app/(app)/maintenance" "src/app/(app)/audits" "src/app/(app)/reports" "src/app/(app)/notifications" src/app/globals.css src/app/layout.tsx README.md TEAM_GIT.md
git commit -m "feat: add org setup, workflows, reports, and docs"
git push -u origin member3/workflows-ui
```

---

## Do NOT upload

- `node_modules/`
- `.next/`
- `.env` (secrets)
- `prisma/dev.db` / any `*.db`
- personal IDE folders

## Fair contribution tip for judges

1. Member 1 merges first (foundation)
2. Member 2 merges ops UI
3. Member 3 merges workflows + README
4. Each person keeps fixing bugs only in their folders
