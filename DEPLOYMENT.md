# Deployment

The goal is a fast, safe loop:

1. Build locally.
2. Publish to a staging Cloud Run service.
3. Smoke-test `/api/health`.
4. Promote to production when the feature is ready.

## Recommended Agile Flow

For day-to-day iteration:

```bash
npm run smoke:install
npm run verify
npm run deploy:staging
```

That staging deploy command will:

1. Run lint, typecheck, and production build.
2. Build and push the container with Cloud Build.
3. Deploy to the staging Cloud Run service.
4. Fetch the deployed service URL.
5. Call `/api/health` and fail if the app is not healthy.

If you want local browser smoke coverage too:

```bash
PLAYWRIGHT_RUN_SMOKE=1 npm run deploy:staging
```

That will run the Playwright smoke suite against the deployed Cloud Run URL after the health check succeeds.

When the feature is confirmed in staging:

```bash
npm run deploy:production
```

## Prerequisites

- Google Cloud project with billing enabled
- Cloud Run, Cloud Build, and Artifact Registry APIs enabled
- `gcloud` installed and authenticated
- Artifact Registry repository created once

Create the repository once:

```bash
gcloud artifacts repositories create ifindata \
  --repository-format=docker \
  --location=us-central1
```

## Local Environment Variables

Before using the deploy scripts, export:

```bash
export GOOGLE_CLOUD_PROJECT=your-gcp-project-id
export GOOGLE_CLOUD_REGION=us-central1
export CLOUD_RUN_SERVICE_STAGING=ifindata-web-staging
export CLOUD_RUN_SERVICE_PRODUCTION=ifindata-web
```

Optional:

```bash
export APP_ENVIRONMENT=staging
```

## CI/CD Recommendation

- Push to `dev`: auto-deploy to staging.
- Push to `main`: auto-deploy to production only when you are comfortable with that cadence.
- For stricter control, keep production on manual workflow dispatch.

This repository is set up for:

- fast local staging deploys
- GitHub Actions staging deployment on `dev`
- GitHub Actions production deployment on `main` or manual dispatch
- post-deploy Playwright smoke checks in CI

## Health Check

The app exposes `/api/health` and returns environment, revision, and commit metadata when available. Use it as the first smoke test after every deployment.

## Runtime Variables

Set Cloud Run environment variables for:

- `NEXT_PUBLIC_*` Firebase client configuration
- Stripe secrets
- Neo4j credentials
- `APP_ENVIRONMENT`
- `GIT_SHA` if you want deploy metadata in the health endpoint
