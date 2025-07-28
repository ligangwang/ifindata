# Firebase Authentication Setup Guide

## 🔥 Firebase Configuration Status
✅ **Firebase project configured:** `ifindata-80905`  
✅ **Firebase SDK configured:** All config values updated  
✅ **Firestore configured:** Ready for user data  
✅ **Google Sign-In:** OAuth client ID configured  
✅ **Privacy Policy & Terms:** Deployed and accessible  

## 📋 Setup Steps Required

### 1. ✅ Firebase Project Setup (COMPLETED)
Your Firebase project `ifindata-80905` is already configured with:
- Web app registration
- API keys and configuration
- Firebase Auth enabled

### 2. 🔧 Google Sign-In OAuth Setup (ACTION NEEDED)

To complete Google Sign-In setup:

#### Step 2a: Get Google OAuth Client ID

**Option A: Using Google Cloud Console (Recommended)**
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials?project=ifindata-80905)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen first:
   - **User Type:** External
   - **App name:** IFinData
   - **User support email:** Your email
   - **Developer contact:** Your email
   - **App logo:** Upload your app logo (optional)
   - **App domain:** `ifindata-80905.web.app`
   - **Privacy Policy URL:** `https://ifindata-80905.web.app/privacy-policy.html`
   - **Terms of Service URL:** `https://ifindata-80905.web.app/terms-of-service.html`
4. Create OAuth client ID:
   - **Application type:** Web application
   - **Name:** IFinData Web Client
   - **Authorized JavaScript origins:** 
     - `http://localhost:8080`
     - `https://ifindata-80905.web.app`
     - `https://ifindata-80905.firebaseapp.com`
   - **Authorized redirect URIs:**
     - `http://localhost:8080/__/auth/handler`
     - `https://ifindata-80905.web.app/__/auth/handler`
     - `https://ifindata-80905.firebaseapp.com/__/auth/handler`

**Option B: Using gcloud CLI**
```bash
# First, install alpha components (if not already done)
gcloud components install alpha

# Create OAuth client (requires proper IAM permissions)
gcloud alpha iap oauth-clients create \
  --display-name="IFinData Web Client"
```

#### Step 2b: Update Client ID in Code
Once you have the Client ID (format: `xxxxx.apps.googleusercontent.com`), update:

**File: `web/index.html`** (line ~37):
```html
<meta name="google-signin-client_id" content="YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com">
```

### 3. 🔐 Firebase Authentication Provider Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `ifindata-80905`
3. Navigate to: **Authentication > Sign-in method**
4. Enable **Google** provider:
   - Add your OAuth Client ID from step 2a
   - Add your Client Secret (from Google Cloud Console)
   - Add authorized domains:
     - `localhost` (for development)
     - `ifindata-80905.web.app` (for production)

### 4. 🗄️ Firestore Database Setup

1. In Firebase Console: **Firestore Database**
2. Ensure database is created (should already exist)
3. Update security rules if needed:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Watchlists are user-specific
    match /watchlists/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Testing Authentication

After completing the setup:

1. **Build with real services:**
   ```bash
   flutter build web --release --dart-define=ENVIRONMENT=production --dart-define=USE_MOCK_SERVICES=false
   ```

2. **Deploy and test:**
   ```bash
   firebase deploy --only hosting
   ```

3. **Test Google Sign-In:**
   - Visit: https://ifindata-80905.web.app
   - Click "Sign in with Google"
   - Verify user data appears in Firestore

## 🔍 Troubleshooting

### Common Issues:

**Error: "Missing required parameter: redirect_uri"**
- This occurs when creating OAuth client without proper redirect URIs
- **Solution:** Ensure you add ALL required redirect URIs:
  - `http://localhost:8080/__/auth/handler` (development)
  - `https://ifindata-80905.web.app/__/auth/handler` (production)
  - `https://ifindata-80905.firebaseapp.com/__/auth/handler` (Firebase)
- **Note:** The `/__/auth/handler` path is required by Firebase Auth

**Error: "OAuth client not found"**
- Verify Client ID is correct in `web/index.html`
- Check authorized domains in Google Cloud Console

**Error: "Firebase Auth domain not authorized"**
- Add your domain to Firebase Auth authorized domains
- Ensure OAuth redirect URIs include `/__/auth/handler`

**Error: "Firestore permission denied"**
- Check Firestore security rules
- Verify user is authenticated before Firestore operations

### Debug Commands:
```bash
# Check Firebase project
firebase projects:list

# Verify Firebase config
firebase apps:list --project ifindata-80905

# Test build locally
flutter run -d web-server --web-port 8080 --dart-define=USE_MOCK_SERVICES=false
```

## ✅ Final Checklist

- [ ] Privacy Policy and Terms of Service pages deployed to web
- [ ] Google OAuth Client ID obtained and configured
- [ ] Firebase Auth Google provider enabled
- [ ] Authorized domains added to both Google Cloud and Firebase
- [ ] Firestore security rules updated
- [ ] App tested with real authentication
- [ ] Production deployment verified

## 📧 Need Help?

If you encounter issues:
1. Check browser developer console for error messages
2. Verify all URLs and client IDs are correct
3. Test in incognito mode to avoid cached credentials
4. Check Firebase Console logs for authentication errors
