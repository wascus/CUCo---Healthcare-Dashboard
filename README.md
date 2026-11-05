# CUCo — Dashboard

A modular healthcare dashboard that combines an **Individual (Gamification)** view with a **Network (Relations)** view.

- **Individual (Gamification):** diary, habits, streaks, exercises, tests, knowledge list.
- **Network (Relations):** social/clinical graph, consent/permissions, interactions, insights.

**Stack:** Frontend — Vite + React (TypeScript). Backend — Fastify (TypeScript).  
The backend reads CSV files and exposes JSON APIs consumed by the frontend.

---

## Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **npm** ≥ 9
- **Git**

---

## Installation

### 1) Clone the repository

```bash
git clone https://github.com/ZivHoch/CUCo---Healthcare-Dashboard.git CUCo-dashboard
cd CUCo-dashboard
```

### 2) Install dependencies

**Backend**

```bash
cd backend
npm install
```

**Frontend**

```bash
cd ../frontend
npm install
```

### 3) Add data (CSV)

Place your CSVs in `backend/data/` (this folder is git-ignored):

```
backend/data/
  mental_health_and_technology_usage_2024.csv
  mental_wellness_tracker.csv
  Psychological_Assessment_Dataset.csv
```

> Tip: Commit only `*.sample.csv` files if you want sharable demo data; keep real data local.

---

## Running the project (development)

Open **two terminals**:

**Terminal A — Backend (Fastify)**

```bash
cd backend
npm run dev
# => http://localhost:5175
```

**Terminal B — Frontend (Vite)**

```bash
cd frontend
npm run dev
# => http://localhost:5173
```

The frontend is configured to call `/api/...` which is proxied to the backend (no CORS issues).

---

## Environment & configuration

### Backend (`backend`)

- **Environment variables (optional):**
  - `PORT` — default: `5175`
  - `HOST` — default: `0.0.0.0`
- **Scripts:**
  - `npm run dev` — start Fastify with TSX (watch mode)
  - `npm run build` — compile TypeScript to `dist/`
  - `npm start` — run compiled server

### Frontend (`frontend`)

- **Vite dev server:** `http://localhost:5173`
- **API base (optional):** Create `frontend/.env` to set an explicit base:
  ```env
  VITE_API_BASE=http://localhost:5175
  ```
- **Scripts:**
  - `npm run dev` — start Vite dev server
  - `npm run build` — production build to `dist/`
  - `npm run preview` — preview the production build locally

---

## Project structure

```
CUCo-dashboard/
├─ backend/
│  ├─ src/                # Fastify routes & CSV loaders
│  ├─ data/               # your CSVs (git-ignored)
│  ├─ package.json
│  └─ tsconfig.json
├─ frontend/
│  ├─ src/
│  │  ├─ app/             # Root layout, router, global styles (App.css)
│  │  ├─ features/
│  │  │  ├─ gamification/ # module layout + pages
│  │  │  └─ relations/    # module layout + pages
│  │  └─ services/        # API helpers (optional)
│  ├─ index.html
│  ├─ package.json
│  └─ vite.config.ts
└─ README.md
```

---

## Production

**Backend**

```bash
cd backend
npm run build
npm start
```

**Frontend**

```bash
cd frontend
npm run build
# serve ./dist with your static server (nginx, Netlify, Vercel, etc.)
# or locally:
npm run preview
```

In production, point the frontend to the backend’s public URL via `VITE_API_BASE`.

---

## Troubleshooting

- **Black screen / routing not working:** Ensure there is **one** `RouterProvider` (in `frontend/src/main.tsx`) and routes are nested under the root layout.
- **Invalid hook call / hooks crash:** Make sure React is deduped in Vite:
  ```ts
  // frontend/vite.config.ts
  export default defineConfig({
    // ...
    resolve: { dedupe: ["react", "react-dom"] },
  });
  ```
  Then reinstall: `rm -rf node_modules && npm install`.
- **Navbar not centered or header not flush to top:** Use only `App.css` for global styles (remove `index.css` import), and ensure `html, body, #root { margin: 0; padding: 0; }`.

---

## Contributing

- Keep feature code inside its module folder (`frontend/src/features/*`).
- Share common types/helpers via `frontend/src/app` or `frontend/src/services`.
- Open PRs with clear titles and small, focused changes.

---
