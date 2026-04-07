# Quinfosys™ QuDrugForge Frontend

Next.js 14 (App Router) frontend for the drug discovery research workspace.

This app includes dashboard analytics, workspace orchestration, pipeline execution, results review, similarity search, and molecular visualization workflows.

## Features

- App Router pages for auth + dashboard workflows
- Typed API client with environment-based URL configuration
- Reusable loading, empty, error, and tooltip components
- Persisted light/dark theme switching
- Workspace controls for stage-specific and full `/pipeline` flow
- Live pipeline status, logs, progress, and result rendering
- Molecular visualization support (3DMol.js)
- Dedicated pages for molecules, similarity, chemical space, simulation, history, and settings
- Dockerized production deployment support

## Molecular Viewer Status

The molecular viewer is present and active.

Primary implementation points:

- 3D viewer component: `src/components/molecules/ThreeDMoleculeViewer.tsx`
- Molecule viewer panel component: `src/components/molecules/MoleculeViewer.tsx`
- Visualization route using 3D viewer: `src/app/(dashboard)/visualization/page.tsx`
- Optional canvas mock viewer in Copilot: `src/app/(dashboard)/copilot/components/MoleculeViewerCanvas.tsx`

No re-add was required.

## Theme Switching (Light/Dark)

Theme switching is implemented with class-based dark mode and persisted in localStorage.

- Toggle component: `src/components/shared/ThemeToggle.tsx`
- Root theme initialization script: `src/app/layout.tsx`
- Toggle placement:
  - Dashboard shell header
  - Auth layout (login/signup/forgot-password)

Storage key used: `qdrugforge.theme`

## Tech Stack

- Next.js 14
- React 18
- TypeScript 5
- Tailwind CSS 3.4 (`darkMode: class`)
- Zustand
- Recharts, Plotly, 3DMol.js

## Project Structure (Frontend)

- `src/app` - App Router pages/layouts
- `src/components` - UI + domain components
- `src/services` - API/session/auth/service layer
- `src/store` - Zustand stores
- `src/types` - shared TypeScript types

## Environment Configuration

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Optional:

```bash
NEXT_PUBLIC_API_TIMEOUT_MS=10000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Primary backend endpoints expected through `NEXT_PUBLIC_API_URL`:

- `POST /pipeline/run`
- `GET /pipeline/status/{experiment_id}`
- `GET /pipeline/results/{experiment_id}`

Also used by the frontend for full workspace behavior:

- `POST /workspace/generate`
- `POST /workspace/docking`
- `GET /pipeline/experiments`
- `POST /pipeline/experiments`

## Local Development

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

## Production Build

```bash
npm run lint
npm run build
npm run start
```

## Docker (Minimal Production Setup)

Docker files are in the frontend root:

- `Dockerfile` (Node 20 multi-stage, standalone output)
- `.dockerignore`

Build + run:

```bash
docker build -t qdrugforge-frontend ./frontend
docker run --rm -p 3000:3000 --env-file ./frontend/.env.local qdrugforge-frontend
```

## Deployment Notes

- Next config uses `output: "standalone"` for compact runtime image.
- API client resolves base URL from `NEXT_PUBLIC_API_URL` first, with safe runtime fallbacks.
- Ensure backend is reachable from the deployed frontend environment.

## Windows Path Caveat

On Windows, webpack can fail if the project path contains `!`.

If build fails with path validation errors, run build from a mirrored path without special characters.

## Quick Validation Checklist

- `npm run lint` passes
- `npm run build` passes
- Auth route loads (`/login`)
- Dashboard route loads (`/dashboard`)
- Workspace route loads (`/workspace`)
- Molecules route loads (`/molecules`)
- Similarity routes load (`/similarity`, `/similarity-search`)
- Chemical space route loads (`/chemical-space`)
- Simulation route loads (`/simulation`)
- Copilot route loads (`/copilot`)
- Settings route loads (`/settings`)
- Results route loads (`/results`)
- Visualization route loads (`/visualization`)
- History route loads (`/dashboard/history`)
- Pipeline workspace can start a run and poll status from the backend
- `NEXT_PUBLIC_API_URL` points to a reachable FastAPI server

## Related Docs

- `../README.md`
- `../ARCHITECTURE.md`
- `../DEVELOPMENT.md`
