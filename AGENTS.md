# Agent Development Guide

This document describes the development methodology used in this repository so an AI coding agent (Codex CLI) can continue work consistently in future sessions.

## Project Overview
- Purpose: Publish a white, SPA-style software developer portfolio via GitHub Pages.
- Data Source: Portfolio data is fetched from a Google Apps Script (GAS) Web App in production. For local development, an Express-based mock (`gas/local-server.js`) simulates the GAS endpoint.
- Containers:
  - `github-pages` (nginx): serves static site at `http://localhost:8000`.
  - `gas` (Node/Express): exposes GET-only API at `http://localhost:8888`.
- Orchestration: `compose.yaml` builds and runs both services.

## Architecture
- Frontend: `index.html` + `assets/css/main.css` + `assets/js/main.js`.
  - Hash-based SPA router (`#home`, `#about`, `#skills`, `#projects`, `#contact`).
  - On first page load, performs a single fetch to load portfolio JSON, then renders sections.
  - Uses IntersectionObserver for reveal-on-scroll animations and a responsive header menu.
- Runtime Config: `assets/config.js` defines `window.__APP_CONFIG__.API_BASE`.
  - Production: GitHub Actions writes `assets/config.js` from repository variable `API_BASE_URL`.
  - Local: If `API_BASE` is empty, the frontend falls back to `http://localhost:8888` on `localhost`.
- Local GAS Mock: `gas/local-server.js` (Express + CORS). GET-only with `/api/portfolio` and `/api/health`.

## Development Workflow
1. Planning
   - Use short, outcome-focused steps; prefer surgical changes.
   - When multiple actions are required, maintain a small plan and update status as you go.
2. Implementation
   - Edit files via patch-based changes.
   - Keep changes minimal and aligned with the existing style.
   - Don’t fix unrelated issues unless explicitly requested.
3. Verification
   - Local: `docker compose build && docker compose up`.
   - Open `http://localhost:8000` and confirm data fetched from `http://localhost:8888/api/portfolio`.
   - Health check: `curl http://localhost:8888/api/health` returns `{ ok: true }`.
4. Deployment
   - Production builds are static; GitHub Actions (pages.yml) generates `assets/config.js` using `vars.API_BASE_URL`.
   - Ensure the variable is set to the deployed GAS Web App URL.

## Coding Conventions
- SPA
  - Use hash routing; avoid server-side rewrites.
  - Fetch data once on initial load; re-render sections from JSON.
  - Escape dynamic text (`escapeHTML`, `escapeAttr`) before injecting into HTML.
- Styling
  - White base, accessible contrast; keep variables in `:root`.
  - Reuse existing classes, spacing, and naming.
- GAS Mock
  - GET-only; respond 405 to non-GET.
  - Set CORS to allow the static site to read data during local development.
- Docker
  - `gas/Dockerfile` uses build context `./gas`. COPY paths must be relative to that context (e.g., `COPY package.json .`).
  - `Dockerfile.pages` copies the repository into nginx html root.

## Adding Features Safely
- Data Model Changes
  - Update `gas/local-server.js` JSON structure first.
  - Update `assets/js/main.js` render functions to reflect changes.
  - Keep keys stable where possible; document changes below.
- New Sections / UI
  - Add a new route (e.g., `#blog`) to `routes` in `main.js` and a corresponding `<section id="blog" class="view">` in `index.html`.
  - Hook scroll reveal for dynamically inserted elements.
- Configuration
  - For production, never hard-code secrets. Use `assets/config.js` via Actions.
  - Variable name: `API_BASE_URL` in repository variables; exported to `window.__APP_CONFIG__.API_BASE`.

## Testing Checklist
- Local
  - `docker compose up` succeeds; no file-not-found in Docker build.
  - `http://localhost:8000` loads; initial fetch to `/api/portfolio` succeeds.
  - Navigation between routes updates sections without full page reload.
- Production (Pages)
  - Actions run shows step generating `assets/config.js` with the correct URL.
  - Site loads and fetches data from the configured GAS endpoint.

## Common Pitfalls
- Docker COPY Paths
  - Using `COPY gas/...` inside `gas/Dockerfile` will fail; paths are relative to `./gas`.
- GitHub Pages Environment Variables
  - No native runtime env vars; always generate `assets/config.js` at deploy time.
- CORS
  - Ensure GAS (or mock) allows GET requests from the site origin. The mock uses permissive CORS for local dev.

## Release Checklist
- Update mock data (or confirm real GAS endpoint) matches frontend expectations.
- Confirm `vars.API_BASE_URL` is set in the repository when deploying to Pages.
- Verify local and production URLs in README.
- Keep `.clasp.json` `scriptId` updated when working with real GAS.

## Files to Know
- `index.html`: SPA shell and sections.
- `assets/css/main.css`: Styling and animations.
- `assets/js/main.js`: Router, fetch, rendering, and interactions.
- `assets/config.js`: Runtime config written by Actions.
- `gas/local-server.js`: Express mock for GAS.
- `gas/Dockerfile`: GAS container build (Node 20-alpine).
- `Dockerfile.pages`: Static site in nginx.
- `compose.yaml`: Two-service orchestration.
- `.github/workflows/pages.yml`: Pages deployment workflow (injects API URL).

## Future Enhancements (Optional)
- TypeScript build for frontend with a minimal bundler.
- PWA (Workbox) for offline caching.
- Theming (dark mode) via CSS variables.
- Data schema validation in the frontend before rendering.

