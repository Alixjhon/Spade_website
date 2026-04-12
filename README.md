# SPADE Web

This repository now includes GitHub Actions CI/CD for the full system:

- Frontend CI: lint, typecheck, test, and production build.
- Backend CI: TypeScript typecheck and production build.
- CD: automatic deploy triggers for frontend and backend after a successful push to `main`.

## Workflows

- `/.github/workflows/ci.yml`
  Runs on every push and pull request.
- `/.github/workflows/deploy.yml`
  Runs only after the `CI` workflow succeeds on a push to `main`.
- `/render.yaml`
  Defines the Render frontend and backend services so Render uses the correct repo root and commands.

## Required GitHub Secrets

Set these in your GitHub repository settings before enabling deployment:

- `FRONTEND_DEPLOY_HOOK_URL`
  Deploy hook for your frontend host, such as Vercel or Netlify.
- `BACKEND_DEPLOY_HOOK_URL`
  Deploy hook for your backend host, such as Render, Railway, or another platform with an incoming deploy webhook.

If either secret is missing, that deploy job is skipped without failing the workflow.

## Expected Runtime Environment

Frontend:

- `VITE_API_BASE_URL`

Backend:

- `PORT`
- `DATABASE_URL`
- `ALLOWED_EMAIL_DOMAIN`
- `DEFAULT_PASSWORD`

These backend variables must still be configured on your hosting platform. GitHub Actions only validates the build; it does not provide runtime app secrets to your deployed services.

## Local Commands

Frontend:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

Backend:

- From repo root:
  - `npm run server`
  - `npm run server:typecheck`
  - `npm run server:build`
- From `server/`:
  - `npm run dev`
  - `npm run typecheck`
  - `npm run build`
  - `npm run start`

## Deployment Flow

1. Push changes to a branch or open a pull request.
2. GitHub Actions runs CI for both frontend and backend.
3. Merge to `main`.
4. After the `CI` workflow succeeds for that `main` push, GitHub Actions calls the configured frontend and backend deploy hooks.

If your default production branch is not `main`, update `head_branch == 'main'` in `/.github/workflows/deploy.yml`.

## Render Deployment

This repo includes `render.yaml` for Render Blueprint deploys.

Backend on Render:

- The backend is now a standalone Node package under `/server`.
- If you configure the backend manually in the Render dashboard, use:
  - Root Directory: `server`
  - Build Command: `npm ci && npm run build`
  - Start Command: `npm run start`
  - Health Check Path: `/api/health`
- Required backend environment variables:
  - `PORT=10000`
  - `DATABASE_URL`
  - `ALLOWED_EMAIL_DOMAIN`
  - `DEFAULT_PASSWORD`

Frontend on Render:

- Root Directory: `.`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Set `VITE_API_BASE_URL` to your backend Render URL, for example `https://spade-backend.onrender.com`

### Render Setup Guide

1. Push this repo to GitHub with the latest changes, including `server/package-lock.json` and `render.yaml`.
2. In Render, choose `New +` then `Blueprint`.
3. Connect the GitHub repository and select this repo.
4. Render will detect `render.yaml` and propose two services:
   - `spade-backend`
   - `spade-frontend`
5. For the backend service, fill in:
   - `DATABASE_URL`
   - `ALLOWED_EMAIL_DOMAIN`
   - `DEFAULT_PASSWORD`
6. For the frontend service, set:
   - `VITE_API_BASE_URL=https://<your-backend-service>.onrender.com`
7. Create the services and wait for the first deploy.

### Manual Render Setup

Backend:

- Service type: `Web Service`
- Root Directory: `server`
- Build Command: `npm ci && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/api/health`

Frontend:

- Service type: `Static Site`
- Root Directory: `.`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`

### Notes

- The backend creates and updates its database tables at startup.
- If you use Render PostgreSQL, copy its Internal or External Database URL into `DATABASE_URL`.
- If your frontend is calling the wrong API after deploy, the usual cause is an incorrect `VITE_API_BASE_URL`.
