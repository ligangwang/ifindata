# Firebase Deployment Guide

## Prerequisites

### 1. Node.js Version Update Required
⚠️ **IMPORTANT**: Firebase CLI requires Node.js v20+ (you currently have v16.13.0)

**Update Node.js:**
1. Visit [nodejs.org](https://nodejs.org/) and download Node.js LTS (v20+)
2. Install the new version
3. Restart your terminal/PowerShell
4. Verify: `node --version` should show v20+

### 2. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 3. Login to Firebase
```bash
firebase login
```

### 4. Initialize Firebase Project (if not already done)
```bash
firebase init
```
- Select "Hosting" and "Firestore"
- Choose your existing Firebase project
- Set public directory to `build/web`
- Configure as single-page app: Yes
- Don't overwrite index.html

## Quick Deployment Commands

### Production Deployment
```bash
# Using PowerShell script
.\deploy-firebase.ps1

# Or manually
flutter build web --release --dart-define=ENVIRONMENT=production --dart-define=USE_MOCK_SERVICES=false
firebase deploy --only hosting
```

### Staging Deployment
```bash
# Using PowerShell script
.\deploy-staging.ps1

# Or manually
flutter build web --release --dart-define=ENVIRONMENT=staging --dart-define=USE_MOCK_SERVICES=false
firebase deploy --only hosting:staging
```

## Environment Configuration

The app automatically uses the correct environment based on build parameters:

- **Production**: Real Firebase services, Stripe live keys
- **Staging**: Real Firebase services, Stripe test keys
- **Development**: Mock services (local testing)

## Firebase Project Setup

### 1. Web App Configuration
In Firebase Console > Project Settings > General:
- Add a web app if not already added
- Copy the Firebase config object

### 2. Authentication Setup
In Firebase Console > Authentication:
- Enable Google Sign-in provider
- Add authorized domains for your hosting URL

### 3. Firestore Setup
In Firebase Console > Firestore Database:
- Create database in production mode
- Deploy security rules: `firebase deploy --only firestore:rules`

### 4. Hosting Configuration
The app is configured for Single Page Application (SPA) routing with proper cache headers for static assets.

## Deployment Workflow

1. **Test Locally**: Use mock services for development
   ```bash
   .\run-dev-mock.ps1
   ```

2. **Test with Real Services**: Test with actual Firebase
   ```bash
   .\run-dev-real.ps1
   ```

3. **Deploy to Staging**: Test deployment
   ```bash
   .\deploy-staging.ps1
   ```

4. **Deploy to Production**: Final deployment
   ```bash
   .\deploy-firebase.ps1
   ```

## Troubleshooting

### Build Issues
- Ensure all environment variables are set correctly
- Check that Firebase config is properly initialized
- Verify Stripe keys are configured for the target environment

### Deployment Issues
- Ensure Firebase CLI is logged in: `firebase login`
- Check that the correct project is selected: `firebase use --list`
- Verify hosting configuration in `firebase.json`

### Runtime Issues
- Check browser console for errors
- Verify Firebase project configuration
- Ensure authentication domains are whitelisted
- Check Firestore security rules

## Security Checklist

✅ Firestore security rules configured  
✅ Authentication domains whitelisted  
✅ Environment-specific API keys  
✅ No sensitive data in client code  
✅ HTTPS enforced for production  

## Post-Deployment

After successful deployment:
1. Test all major features (auth, data, payments)
2. Verify analytics and monitoring
3. Check performance metrics
4. Update DNS if using custom domain
