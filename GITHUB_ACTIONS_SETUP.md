# GitHub Actions CI/CD Setup Guide

## 🚀 **Automated Deployment with GitHub Actions**

Your repository now has GitHub Actions configured to automatically deploy to Firebase Hosting when you push to the main branch.

## 🔑 **Required GitHub Secrets**

You need to add these secrets to your GitHub repository:

### **Step 1: Go to GitHub Repository Settings**
1. Go to https://github.com/ligangwang/ifindata
2. Click **Settings** tab
3. Click **Secrets and variables** > **Actions**
4. Click **New repository secret**

### **Step 2: Add Firebase Configuration Secrets**

Add each of these secrets one by one:

#### **Production Firebase Secrets:**
- **Name**: `FIREBASE_API_KEY`
  - **Value**: `AIzaSyAmousFYiyLjNJK95tz1fMMWkqyELsN8wI`

- **Name**: `FIREBASE_AUTH_DOMAIN`
  - **Value**: `ifindata-80905.firebaseapp.com`

- **Name**: `FIREBASE_PROJECT_ID`
  - **Value**: `ifindata-80905`

- **Name**: `FIREBASE_STORAGE_BUCKET`
  - **Value**: `ifindata-80905.firebasestorage.app`

- **Name**: `FIREBASE_MESSAGING_SENDER_ID`
  - **Value**: `464830297405`

- **Name**: `FIREBASE_APP_ID`
  - **Value**: `1:464830297405:web:bb6c400bff8f03c83f8154`

- **Name**: `FIREBASE_MEASUREMENT_ID`
  - **Value**: `G-8FBVV30SY6`

#### **Google Sign-In Secret:**
- **Name**: `GOOGLE_CLIENT_ID`
  - **Value**: `464830297405-m3fhkgnl5t5f8ld3s7e69t3cegklqmfg.apps.googleusercontent.com`

#### **Firebase Service Account:**
- **Name**: `FIREBASE_SERVICE_ACCOUNT_IFINDATA_80905`
  - **Value**: [Get this from Firebase Console - see Step 3 below]

### **Step 3: Get Firebase Service Account Key**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ifindata-80905`
3. Go to **Project Settings** > **Service accounts**
4. Click **Generate new private key**
5. Download the JSON file
6. Copy the entire JSON content
7. Paste it as the value for `FIREBASE_SERVICE_ACCOUNT_IFINDATA_80905`

**Example JSON format:**
```json
{
  "type": "service_account",
  "project_id": "ifindata-80905",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "firebase-adminsdk-...@ifindata-80905.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

### **Step 4: Optional Staging Secrets** (for future staging environment)

If you want a staging environment, also add:
- `FIREBASE_API_KEY_STAGING`
- `FIREBASE_AUTH_DOMAIN_STAGING`
- `FIREBASE_PROJECT_ID_STAGING`
- `FIREBASE_STORAGE_BUCKET_STAGING`
- `FIREBASE_MESSAGING_SENDER_ID_STAGING`
- `FIREBASE_APP_ID_STAGING`
- `FIREBASE_MEASUREMENT_ID_STAGING`
- `GOOGLE_CLIENT_ID_STAGING`

## 🔄 **How the CI/CD Works**

### **When you push to main branch:**
1. ✅ GitHub Actions triggers automatically
2. ✅ Installs Flutter and dependencies
3. ✅ Runs tests
4. ✅ Builds app with production environment variables
5. ✅ Deploys to Firebase Hosting automatically
6. ✅ Your app is live at https://ifindata-80905.web.app

### **When you create a Pull Request:**
1. ✅ Builds the app
2. ✅ Runs tests
3. ✅ Creates preview deployment
4. ✅ Adds comment to PR with preview URL

## 🛠 **Workflow Features**

- **Automatic deployment** on push to main
- **Preview deployments** for pull requests
- **Manual deployment** via GitHub Actions tab
- **Environment separation** (production/staging)
- **Secure secrets management**
- **Build caching** for faster deployments

## 🚨 **Security Notes**

- ✅ All sensitive data stored in GitHub Secrets
- ✅ No API keys in code or logs
- ✅ Service account has minimal required permissions
- ✅ Secrets are encrypted and only accessible to your repository

## 📋 **Testing the Setup**

### **Step 1: Add all secrets to GitHub**
### **Step 2: Push a small change to main branch**
```bash
# Make a small change
echo "# Updated via CI/CD" >> README.md
git add README.md
git commit -m "test: trigger CI/CD deployment"
git push origin main
```

### **Step 3: Watch the deployment**
1. Go to your GitHub repository
2. Click **Actions** tab
3. Watch the "Deploy to Firebase Hosting" workflow run
4. Check your live site: https://ifindata-80905.web.app

## 🎯 **Next Steps**

1. **Add the GitHub secrets** (Step 1-3 above)
2. **Test the deployment** by pushing a change
3. **Enable branch protection** (optional) to require PR reviews
4. **Set up staging environment** (optional) for testing

Your CI/CD pipeline is now ready! 🚀
