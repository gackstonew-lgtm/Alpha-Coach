# Arcade Fx Deployment & Infrastructure Guide

This guide describes the production deployment architecture for **Arcade Fx / Trader's Edge** on [Vercel](https://vercel.com) and [Supabase](https://supabase.com).

---

## 1. Architecture Overview

Arcade Fx is organized as a unified monorepo:
- **Frontend**: React + Vite 6 + TypeScript PWA (in `/frontend`), bundled with Tailwind CSS v3 LTS.
- **Backend / API**: Express + TypeScript serverless microservices in `/backend`, bundled into a standalone production serverless bundle (`api/app.bundle.js` and `frontend/api/app.bundle.js`) mounted via `api/index.js`.
- **MT5 Companion Bridge**: Python desktop application in `/bridge` providing zero-lag trade and position synchronization.
- **Database & Auth**: PostgreSQL via Supabase with row-level security (RLS).

```
   Client (Web / PWA)                Desktop MT5 Bridge
       (Browser)                      (Python Companion)
           │                                   │
           │                                   │
           ▼                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                 Vercel Edge Network / CDN                   │
│   (https://alpha-coach-pi.vercel.app / arcadefx.live)       │
├──────────────────────────────┬──────────────────────────────┤
│ Static Assets / SPA Routes   │ API Serverless Functions     │
│   (/index.html, /assets/*)   │   (/api/*, /health)          │
│   → frontend/dist            │   → api/index.js (Express)   │
└──────────────────────────────┴───────────────┬──────────────┘
                                               │
                                               ▼
                                  ┌───────────────────────────┐
                                  │     Supabase Platform     │
                                  │ (Auth, Postgres, Realtime)│
                                  └───────────────────────────┘
```

---

## 2. Serverless Function Routing

In Vercel Serverless Function architecture:
1. Entrypoint `api/index.js` receives all requests rewritten to `/api` or `/api/*`.
2. The Vercel rewrite destination must be `"/api"` (not `"/api/index.js"`). Pointing to `"/api/index.js"` causes Vercel's Edge Router to search for a static file named `index.js`, returning `DEPLOYMENT_NOT_FOUND` (HTML 404).
3. Both root `vercel.json` and `frontend/vercel.json` maintain matching rewrite contracts:
   - `{"source": "/health", "destination": "/api"}`
   - `{"source": "/api/(.*)", "destination": "/api"}`
   - `{"source": "/((?!api|health|.*\\..*).*)", "destination": "/index.html"}`

---

## 3. Environment Variables

Configure the following variables in **Vercel Project Settings > Environment Variables**:

| Variable Name | Environment | Required | Description |
|---|---|---|---|
| `VITE_API_URL` | Production / Preview | Optional | API URL for frontend. Defaults to relative `/api/v1` when blank. |
| `FRONTEND_URL` | Production / Preview | **Required** | Production web domain (e.g. `https://www.arcadefx.live`). |
| `SUPABASE_URL` | All | **Required** | Supabase project URL (`https://<project-ref>.supabase.co`). |
| `SUPABASE_ANON_KEY` | All | **Required** | Public Supabase Anon JWT key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production / Server | **Required** | Secret Supabase service role key for backend administration. |
| `ARCADE_FX_API_URL` | MT5 Desktop Bridge | Optional | Override for MT5 companion API endpoint. |
| `ARCADE_FX_WEB_URL` | MT5 Desktop Bridge | Optional | Override for MT5 companion web app pairing URL. |

> [!IMPORTANT]
> Never commit real secrets or service role keys to Git. The repository is public.

---

## 4. Vercel Dashboard Settings

1. **Git Integration**:
   - Production Branch: `main`
2. **Build & Development Settings**:
   - Framework Preset: `Vite` (or `Other`)
   - Root Directory: `.` (or `frontend`)
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist` (or `dist` if root directory is set to `frontend`)
   - Install Command: `npm install`

---

## 5. Local Development & Testing

```bash
# 1. Run automated test suites (Backend Jest + MT5 Python Bridge)
npm test

# 2. Build production assets & serverless bundles
npm run build

# 3. Start local development server
npm run dev
```

---

## 6. Troubleshooting

- **`DEPLOYMENT_NOT_FOUND` on `/api/v1/*`**: Check that the rewrites in `vercel.json` target `"/api"` and that `node scripts/build-api-bundle.js` has run to update `api/app.bundle.js`.
- **CORS Errors**: Ensure origin domain is listed in `allowedOrigins` in `backend/src/app.ts` or provided via `FRONTEND_URL`.
- **PostCSS / Tailwind Error**: Ensure Tailwind remains pinned to v3 (`^3.4.17`). Major updates are ignored via `.github/dependabot.yml`.
