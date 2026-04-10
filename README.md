# IFinData Web

IFinData is a Next.js web app for exploring company relationship graphs.

Current stack:
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Firebase Auth (Google + email/password)
- Firestore for user personalization data
- Cloud Run for deployment

## Local Development

1. Install dependencies.

```bash
npm install
```

2. Copy and fill environment variables.

```bash
cp .env.example .env.local
```

3. Run the app.

```bash
npm run dev
```

4. Run Firestore graph migrations (idempotent).

```bash
npm run graph:migrate
```

4. Open http://localhost:3000.

## Required Environment Variables

Client Firebase config:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

Cloud and deployment:
- GOOGLE_CLOUD_PROJECT
- GOOGLE_CLOUD_REGION

See .env.example for full details.

## APIs

- /api/company/[id]
- /api/company/search
- /api/graph/[id]
- /api/health
- /api/loved-entities

## Graph Data Migrations

- `npm run graph:migrate`: runs all ordered Firestore graph migrations in `scripts/graph/migrations`.
- `npm run graph:seed`: runs only the initial graph seed migration.

## Firestore Model (MVP)

- loved_entities collection for user "loved" items
- documents keyed by userId_entityId_entityType

## Deploy

Validate and deploy:

```bash
npm run verify
npm run deploy:staging
```

When staging is healthy:

```bash
npm run deploy:production
```

For Cloud Run setup details, see DEPLOYMENT.md.
