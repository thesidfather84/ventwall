# VentWall

Anonymous venting wall — write it, throw it, let it go.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 7 + Tailwind CSS 4 |
| Backend | Express 5 + Node.js 24 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4 + drizzle-zod |
| Monorepo | pnpm workspaces |

## Repo layout

```
ventwall-app/
├── api/
│   └── index.ts           ← Vercel serverless function (wraps Express)
├── artifacts/
│   ├── ventwall/          ← React/Vite frontend
│   └── api-server/        ← Express API server
├── lib/
│   ├── db/                ← Drizzle schema + PostgreSQL client
│   ├── api-spec/          ← OpenAPI spec (source of truth)
│   ├── api-zod/           ← Generated Zod schemas
│   └── api-client-react/  ← Generated React Query hooks
├── data/
│   └── reflections.json   ← Curated reflection prompts
├── vercel.json
└── pnpm-workspace.yaml
```

## Local development (Replit)

The app runs via three Replit workflows:

| Workflow | Command |
|----------|---------|
| API server | `pnpm --filter @workspace/api-server run dev` |
| Frontend | `pnpm --filter @workspace/ventwall run dev` |

Required environment variables (set in Replit Secrets):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_PASSWORD` | Admin panel password |
| `SESSION_SECRET` | Session signing key |

## Deploying to Vercel

### Prerequisites

1. **Database** — provision a Postgres database (recommended: [Neon](https://neon.tech) free tier). Copy the connection string.
2. **GitHub repo** — push this repo to `github.com/<you>/ventwall-app`.

### Vercel project settings

Create a new Vercel project connected to the GitHub repo and set these values:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Other |
| **Root Directory** | *(leave blank — use repo root)* |
| **Build Command** | `pnpm --filter @workspace/ventwall run build` |
| **Output Directory** | `artifacts/ventwall/dist/public` |
| **Install Command** | `pnpm install --frozen-lockfile` |
| **Node.js Version** | 22.x |

### Environment variables (set in Vercel dashboard)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon/Postgres connection string |
| `ADMIN_PASSWORD` | Admin panel password |
| `SESSION_SECRET` | Any long random string |
| `NODE_ENV` | `production` |

### How routing works on Vercel

`vercel.json` wires everything together:

- `/api/*` → `api/index.ts` (Vercel serverless function, wraps Express)
- Everything else → `artifacts/ventwall/dist/public/index.html` (SPA fallback)
- Static assets (`/assets/*`) get long-lived immutable cache headers

### DNS for ventwall.app

After the Vercel deployment URL is working, add these records at your DNS registrar (Cloudflare recommended — it provides the `CF-IPCountry` header the geo-restriction feature uses):

| Type | Name | Value |
|------|------|-------|
| `A` | `@` (root) | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com.` |

Then add `ventwall.app` and `www.ventwall.app` as custom domains in the Vercel project dashboard.

**Important — Cloudflare proxy**: If using Cloudflare, set the proxy status to **Proxied** (orange cloud) for the US-only geo-restriction to work. The Express server reads `CF-IPCountry` header set by Cloudflare.

### Go-live checklist

- [ ] Vercel deployment URL loads the app
- [ ] Can create a post (tests the API + DB connection)
- [ ] `ventwall.app` DNS is pointing to Vercel
- [ ] `www.ventwall.app` redirects to the root domain
- [ ] Admin panel works at `/admin`
- [ ] Replit deployment is still running as backup
- [ ] Decommission Replit deployment only after all above pass

## Database schema changes

```bash
# Push schema changes to the database
pnpm --filter @workspace/db run push
```

## Regenerate API client after spec changes

```bash
pnpm --filter @workspace/api-spec run codegen
```
