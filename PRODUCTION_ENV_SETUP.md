# Production Environment Configuration Guide

## Overview
For production deployments, environment variables should be set directly in your hosting platform, not in `.env` files.

## Platform-Specific Setup

### Firebase Hosting + Cloud Functions
```bash
# Configure Firebase Functions environment
firebase functions:config:set \
  firebase.api_key="AIzaSyAmousFYiyLjNJK95tz1fMMWkqyELsN8wI" \
  firebase.auth_domain="ifindata-80905.firebaseapp.com" \
  firebase.project_id="ifindata-80905" \
  firebase.storage_bucket="ifindata-80905.firebasestorage.app" \
  firebase.messaging_sender_id="464830297405" \
  firebase.app_id="1:464830297405:web:bb6c400bff8f03c83f8154" \
  firebase.measurement_id="G-8FBVV30SY6"

# Deploy
firebase deploy
```

### GitHub Actions Deployment
Add these secrets in GitHub Repository Settings > Secrets:

**Required Secrets:**
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN` 
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

**GitHub Actions Workflow Example:**
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        
      - name: Build for web
        run: |
          flutter pub get
          flutter build web --dart-define=FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }} \
                            --dart-define=FIREBASE_AUTH_DOMAIN=${{ secrets.FIREBASE_AUTH_DOMAIN }} \
                            --dart-define=FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }}
                            
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: ifindata-80905
```

### Netlify
1. **Dashboard Method:**
   - Go to Site Settings > Environment Variables
   - Add each variable manually

2. **Netlify CLI:**
```bash
netlify env:set FIREBASE_API_KEY "AIzaSyAmousFYiyLjNJK95tz1fMMWkqyELsN8wI"
netlify env:set FIREBASE_AUTH_DOMAIN "ifindata-80905.firebaseapp.com"
netlify env:set FIREBASE_PROJECT_ID "ifindata-80905"
# ... etc
```

### Vercel
1. **Dashboard Method:**
   - Project Settings > Environment Variables
   - Add each variable with production scope

2. **Vercel CLI:**
```bash
vercel env add FIREBASE_API_KEY production
vercel env add FIREBASE_AUTH_DOMAIN production
# ... etc
```

## Security Best Practices

### ✅ **DO:**
- Use platform-provided environment variable systems
- Rotate API keys regularly
- Use different Firebase projects for dev/staging/prod
- Enable Firebase security rules
- Monitor API usage and quotas

### ❌ **DON'T:**
- Commit `.env` files to version control
- Share environment variables in plain text
- Use production keys in development
- Expose sensitive keys in client-side code

## Environment-Specific Configs

### Development
```bash
# Local .env file (gitignored)
ENVIRONMENT=development
FIREBASE_PROJECT_ID=ifindata-dev-80905
```

### Staging  
```bash
# Platform environment variables
ENVIRONMENT=staging
FIREBASE_PROJECT_ID=ifindata-staging-80905
```

### Production
```bash
# Platform environment variables
ENVIRONMENT=production
FIREBASE_PROJECT_ID=ifindata-80905
```

## Deployment Commands

### Local Development
```bash
flutter run -d web-server --web-port 8080
# Uses .env file automatically
```

### Production Build
```bash
# Build with environment variables from platform
flutter build web --release
```

### Firebase Deploy
```bash
# Deploy with production config
firebase deploy --only hosting
```
