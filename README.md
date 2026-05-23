# AppGen — JSON → UI Runtime

A metadata-driven frontend that converts JSON configuration into a fully working application — forms, dashboards, tables, charts — with graceful degradation on invalid/broken configs.

---

## Stack

| Layer      | Tech                          |
|------------|-------------------------------|
| Frontend   | Next.js 14, React 18, TypeScript, TailwindCSS |
| Backend    | Next.js API Routes, Zod validation |
| Database   | PostgreSQL (Neon), Prisma ORM |
| Auth       | NextAuth v5, GitHub OAuth     |
| Deployment | Vercel (frontend) + Neon (DB) |

---

## Local Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/ai-app-generator
cd ai-app-generator
npm install
```

### 2. Run instantly in local demo mode

If you just want the app working locally without Neon or GitHub OAuth:

```bash
npm run dev
```

What you get in local demo mode:
- Public app gallery + app viewer
- Editor live preview
- Save, update, and delete through local JSON-backed API storage
- Health endpoint at `/api/health`

Local demo data is stored in `data/apps.json`.

### 3. Configure environment for full database + auth mode

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL="postgresql://..."        # Neon connection string
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_GITHUB_ID="your-github-oauth-id"
AUTH_GITHUB_SECRET="your-github-oauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Set up database

```bash
npm run db:push        # Push schema to Neon
npm run db:seed        # Seed 3 sample apps
```

### 5. Run dev server

```bash
npm run dev
# → http://localhost:3000
```

---

## Routes

| Route | Description |
|-------|-------------|
| `/`            | Main editor — JSON config → live preview |
| `/dashboard`   | Gallery of saved apps |
| `/app/[slug]`  | View any app by its slug |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`    | `/api/apps`              | List all public apps (or user's apps if authed) |
| `POST`   | `/api/apps`              | Create a new app (auth required) |
| `GET`    | `/api/apps/[id]`         | Get app by id or slug |
| `PUT`    | `/api/apps/[id]`         | Update app + push new config version (auth required) |
| `DELETE` | `/api/apps/[id]`         | Delete app (auth required) |
| `POST`   | `/api/configs/validate`  | Validate config JSON without saving |
| `GET`    | `/api/health`            | DB health check |

---

## Supported Component Types

| Type | Description |
|------|-------------|
| `stat`   | KPI card with value, delta, color |
| `table`  | Data table with columns + rows |
| `chart`  | SVG bar chart with labels + data array |
| `form`   | Full form engine with validation |

### Supported field types (inside `form`)
`text`, `email`, `password`, `number`, `textarea`, `select`, `toggle`, `date`, `url`, `tel`

### Graceful degradation
- `null` components → skip with index shown
- Unknown component types → yellow fallback UI
- Missing/invalid columns in table → warning
- Non-numeric chart data → fallback message
- Unknown form field types → yellow skip notice
- Invalid JSON in editor → last valid config retained, error banner shown
- Component runtime crashes → caught by ErrorBoundary, shown inline

---

## Deployment — Vercel + Neon

Production mode expects a real `DATABASE_URL` and GitHub OAuth credentials. Without those, the app still works locally in demo mode, but persistent multi-user deployment should use Neon + NextAuth.

### Neon (Database)

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project → copy the **Connection string**
3. Use it as `DATABASE_URL`

### GitHub OAuth

1. [github.com/settings/developers](https://github.com/settings/developers) → New OAuth App
2. Homepage URL: `https://your-app.vercel.app`
3. Callback URL: `https://your-app.vercel.app/api/auth/callback/github`
4. Copy Client ID → `AUTH_GITHUB_ID`
5. Generate secret → `AUTH_GITHUB_SECRET`

### Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

Or connect GitHub repo in Vercel dashboard and add environment variables:

```
DATABASE_URL
AUTH_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
NEXTAUTH_URL=https://your-app.vercel.app
```

After deploy, run seed via Vercel CLI:
```bash
vercel env pull .env.local
npm run db:seed
```

---

## Config JSON Shape

```json
{
  "type": "dashboard",
  "title": "My App",
  "components": [
    { "type": "stat",  "label": "Users",   "value": "1,200", "delta": "+5%", "color": "accent" },
    { "type": "table", "title": "Orders",  "columns": ["Name","Status"], "rows": [["Alice","active"]] },
    { "type": "chart", "title": "Weekly",  "labels": ["Mon","Tue"], "data": [40, 80] },
    { "type": "form",  "title": "Sign Up", "fields": [
      { "type": "text",  "name": "name",  "label": "Name",  "required": true },
      { "type": "email", "name": "email", "label": "Email", "required": true }
    ]}
  ]
}
```

---

## Architecture Decisions

- **ErrorBoundary on every component** — a broken field cannot crash the app or its siblings
- **Zod validation server-side** — all API inputs validated, but partial configs still saved with warnings
- **Config versioning** — every `PUT` with a new config creates a new version row; old versions preserved
- **Slug-based routing** — apps accessible by human-readable URL, deduped automatically
- **Guards module** — all config reads go through `isStr()`, `isArr()`, `isObj()`, `isNum()` — never a raw cast
- **Debounced JSON parsing** — 380ms debounce prevents thrashing on every keystroke

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── apps/route.ts           ← GET list, POST create
│   │   ├── apps/[id]/route.ts      ← GET, PUT, DELETE
│   │   ├── configs/validate/route.ts
│   │   └── health/route.ts
│   ├── app/[slug]/page.tsx         ← Public app viewer
│   ├── dashboard/page.tsx          ← App gallery
│   ├── page.tsx                    ← Editor home
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── engine/
│   │   ├── AppRenderer.tsx         ← Top-level layout engine
│   │   ├── ComponentDispatcher.tsx ← Type → component registry
│   │   ├── ErrorBoundary.tsx
│   │   ├── StatCard.tsx
│   │   ├── TableComponent.tsx
│   │   ├── ChartComponent.tsx
│   │   ├── FormComponent.tsx
│   │   └── guards.ts               ← Safe type guards
│   └── ui/
│       ├── JsonEditor.tsx
│       └── LoadingState.tsx
├── hooks/index.ts                  ← useApps, useApp, useJsonEditor
├── lib/
│   ├── auth.ts                     ← NextAuth config
│   ├── prisma.ts                   ← Singleton client
│   └── config-validator.ts         ← Zod schemas
├── types/index.ts
prisma/
├── schema.prisma
└── seed.ts
```
