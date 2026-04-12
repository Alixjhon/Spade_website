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

- `npm run server:typecheck`
- `npm run server:build`

## Deployment Flow

1. Push changes to a branch or open a pull request.
2. GitHub Actions runs CI for both frontend and backend.
3. Merge to `main`.
4. After the `CI` workflow succeeds for that `main` push, GitHub Actions calls the configured frontend and backend deploy hooks.

If your default production branch is not `main`, update `head_branch == 'main'` in `/.github/workflows/deploy.yml`.
