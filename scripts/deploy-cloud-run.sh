#!/usr/bin/env bash

set -euo pipefail

target="${1:-staging}"

project_id="${GOOGLE_CLOUD_PROJECT:?GOOGLE_CLOUD_PROJECT is required}"
region="${GOOGLE_CLOUD_REGION:-us-central1}"

case "$target" in
  staging)
    service_name="${CLOUD_RUN_SERVICE_STAGING:-ifindata-web-staging}"
    app_environment="${APP_ENVIRONMENT:-staging}"
    ;;
  production)
    service_name="${CLOUD_RUN_SERVICE_PRODUCTION:-ifindata-web}"
    app_environment="${APP_ENVIRONMENT:-production}"
    ;;
  *)
    echo "Unsupported target: $target"
    echo "Usage: ./scripts/deploy-cloud-run.sh [staging|production]"
    exit 1
    ;;
esac

echo "[1/4] Verifying application"
npm run verify

echo "[2/4] Deploying $service_name to Cloud Run via Cloud Build"
build_submit_args=(
  --project "$project_id"
  --config cloudbuild.yaml
  --substitutions "_SERVICE_NAME=$service_name,_REGION=$region,_APP_ENVIRONMENT=$app_environment,_NEXT_PUBLIC_APP_ENVIRONMENT=$app_environment,_GIT_SHA=${GIT_SHA:-local},_NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY:-},_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-},_NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-},_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:-},_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-},_NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID:-},_NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:-}"
)

if [[ -n "${CLOUD_BUILD_DEFAULT_BUCKETS_BEHAVIOR:-}" ]]; then
  build_submit_args+=(--default-buckets-behavior "$CLOUD_BUILD_DEFAULT_BUCKETS_BEHAVIOR")
fi

if [[ -n "${CLOUD_BUILD_SOURCE_STAGING_DIR:-}" ]]; then
  bucket_root="$(echo "$CLOUD_BUILD_SOURCE_STAGING_DIR" | sed -E 's#^(gs://[^/]+).*$#\1#')"

  if gcloud storage ls "$bucket_root" >/dev/null 2>&1; then
    build_submit_args+=(--gcs-source-staging-dir "$CLOUD_BUILD_SOURCE_STAGING_DIR")
  else
    echo "WARN: cannot access $bucket_root with current credentials; falling back to default Cloud Build source staging behavior"
  fi
fi

if [[ "${DEBUG_GCLOUD_DEPLOY:-0}" == "1" ]]; then
  echo "Deploy debug context:"
  echo "  target=$target"
  echo "  project_id=$project_id"
  echo "  region=$region"
  echo "  service_name=$service_name"
  echo "  app_environment=$app_environment"
  echo "  cloud_build_source_staging_dir=${CLOUD_BUILD_SOURCE_STAGING_DIR:-<unset>}"
  echo "  cloud_build_default_buckets_behavior=${CLOUD_BUILD_DEFAULT_BUCKETS_BEHAVIOR:-<unset>}"
  printf '  gcloud builds submit args:'
  printf ' %q' "${build_submit_args[@]}"
  printf ' %q\n' .
  echo "Authenticated accounts:"
  gcloud auth list
  echo "Active gcloud config:"
  gcloud config list
fi

gcloud builds submit "${build_submit_args[@]}" .

echo "[3/4] Resolving deployed service URL"
service_url="$(gcloud run services describe "$service_name" \
  --project "$project_id" \
  --region "$region" \
  --format='value(status.url)')"

if [[ -z "$service_url" ]]; then
  echo "Failed to resolve Cloud Run service URL"
  exit 1
fi

echo "[4/4] Smoke testing $service_url/api/health"
curl --fail --show-error --silent "$service_url/api/health"
echo

if [[ "${PLAYWRIGHT_RUN_SMOKE:-0}" == "1" ]]; then
  echo "Running Playwright smoke checks against $service_url"
  PLAYWRIGHT_BASE_URL="$service_url" \
  PLAYWRIGHT_EXPECT_STAGING_BANNER="$([[ "$target" == "staging" ]] && echo 1 || echo 0)" \
  npm run smoke:test
fi

echo "Deploy complete: $service_url"