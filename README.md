# IFinData Web

IFinData is now a web-first product built with Next.js for a financial knowledge graph experience. The platform centers on public companies, business models, and company relationships presented as an economic graph instead of a traditional stock dashboard.

## Product Direction

- Sector clusters become subgraphs in a larger economic graph.
- Public companies are the first entity type in scope.
- The MVP personalization mechanic is a heart-based loved entity action instead of watchlists.
- Google Cloud Run is the primary hosting target.
- Firebase Auth and Firestore remain part of the product stack.

## Tech Stack

- Next.js 16 with the App Router
- React 19
- Tailwind CSS 4
- Firestore for product state and user data
- Neo4j planned for graph traversal and relationship intelligence
- Google Cloud Run for deployment

## Local Development

1. Install dependencies.

```bash
npm install
```

2. Copy the environment template.

```bash
cp .env.example .env.local
```

3. Start the app.

```bash
npm run dev
```

4. Open http://localhost:3000.

## Fast Deploy Loop

For rapid feature-by-feature shipping to Google Cloud:

```bash
npm run smoke:install
npm run verify
npm run deploy:staging
```

That path validates the app, deploys the current revision to a staging Cloud Run service, and smoke-checks the deployed `/api/health` endpoint.

If you also want browser-level smoke checks after a local deploy:

```bash
PLAYWRIGHT_RUN_SMOKE=1 npm run deploy:staging
```

When staging looks correct:

```bash
npm run deploy:production
```

## Current MVP Surface

- A web-first landing page aligned to the graph-product direction
- Loved company interaction as the first personalization primitive
- Health endpoint at `/api/health`
- Firestore rules prepared for `users/{uid}/loved_entities/{entityId}`
- Cloud Run deployment files for containerized hosting

## Firestore MVP Model

- `users/{uid}` for profile and preferences
- `users/{uid}/loved_entities/{entityId}` for the heart action
- `public_company_cache/{companyId}` for read-optimized company metadata
- `saved_graph_views/{viewId}` reserved for curated graph presets

## Deployment

See DEPLOYMENT.md for Cloud Run instructions and Cloud Build usage.
