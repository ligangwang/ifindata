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
npm run graph:migrate
npm run verify
npm run deploy:staging
```

That staging deploy command will:

1. Run Firestore graph migrations.
2. Run lint, typecheck, and production build.
3. Build and push the container with Cloud Build.
4. Deploy to the staging Cloud Run service.
5. Fetch the deployed service URL.
6. Call `/api/health` and fail if the app is not healthy.

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
- Cloud Firestore API enabled (`firestore.googleapis.com`)
- Default Firestore database created (`(default)`, Native mode)
- `gcloud` installed and authenticated
- Artifact Registry repository created once

Enable Firestore API once per project:

```bash
gcloud services enable firestore.googleapis.com --project "$GOOGLE_CLOUD_PROJECT"
```

Create Firestore database once per project (if not already created):

```bash
gcloud firestore databases create \
  --project "$GOOGLE_CLOUD_PROJECT" \
  --database="(default)" \
  --location=us-central1 \
  --type=firestore-native
```

Optional deploy behavior:

- Set `FIRESTORE_AUTO_ENABLE_API=1` to let deploy attempt enabling Firestore API automatically.
- If service enable permissions are missing, deploy will fail with a clear message before migrations run.
- `FIRESTORE_PROJECT_ID` can be set when Firestore lives in a different project than Cloud Run.

Firestore preflight project resolution order:

1. `FIRESTORE_PROJECT_ID`
2. `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. `GOOGLE_CLOUD_PROJECT`

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

## IAM For Migrations

The identity used by deploy (for example the service account in `GCP_SA_KEY`) must be able to read/write Firestore documents for graph migrations.

Minimum recommended role on the target project:

```bash
gcloud projects add-iam-policy-binding "$GOOGLE_CLOUD_PROJECT" \
  --member="serviceAccount:YOUR_DEPLOY_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

To confirm which principal CI is using, inspect the `gcloud auth list` output in the deploy workflow logs.
