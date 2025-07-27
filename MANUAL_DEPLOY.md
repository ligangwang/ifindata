# Manual Local Deployment (Alternative Method)

If you can't update Node.js immediately, you can still deploy manually:

## Option 1: Use GitHub Actions (Recommended)
1. Push your code to GitHub
2. Set up repository secrets in GitHub Settings > Secrets:
   - `FIREBASE_SERVICE_ACCOUNT`: Service account JSON
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_PROJECT_ID_PROD`: Production project ID
   - `FIREBASE_PROJECT_ID_STAGING`: Staging project ID
   - `STRIPE_PUBLISHABLE_KEY_PROD`: Stripe live key
   - `STRIPE_PUBLISHABLE_KEY_TEST`: Stripe test key
3. The workflow will automatically deploy on push to main

## Option 2: Build Locally, Upload via Firebase Console
1. Build the Flutter web app:
   ```bash
   flutter build web --release --dart-define=ENVIRONMENT=production --dart-define=USE_MOCK_SERVICES=false
   ```
2. Go to Firebase Console > Hosting
3. Click "Add another site" or select existing site
4. Click "Get started" or "Manage"
5. Use Firebase Console's upload feature to upload the `build/web` folder

## Option 3: Use Firebase Hosting via VS Code Extension
1. Install "Firebase Explorer" VS Code extension
2. Sign in to Firebase through the extension
3. Right-click on `build/web` folder
4. Select "Deploy to Firebase Hosting"

## Option 4: Use Cloud Shell (Browser-based)
1. Go to [shell.cloud.google.com](https://shell.cloud.google.com)
2. Upload your project files
3. Run deployment commands in Cloud Shell:
   ```bash
   npm install -g firebase-tools
   firebase login
   cd your-project
   flutter build web --release --dart-define=ENVIRONMENT=production
   firebase deploy --only hosting
   ```

## Environment Variables for Production
When building for production, make sure to set these variables:
- `ENVIRONMENT=production`
- `USE_MOCK_SERVICES=false`
- `FIREBASE_PROJECT_ID=your-prod-project-id`
- `STRIPE_PUBLISHABLE_KEY_PROD=your-stripe-live-key`

## Testing Before Deployment
Always test with real services before deploying:
```bash
.\run-dev-real.ps1
```
Verify that authentication, data loading, and payments work correctly.
