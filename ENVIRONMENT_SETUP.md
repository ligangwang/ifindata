# Environment Setup Guide

## Prerequisites
1. Copy `.env.example` to `.env`
2. Fill in your actual Firebase configuration values
3. Never commit the `.env` file to version control

## Firebase Configuration

### Step 1: Get your Firebase config
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`ifindata-80905`)
3. Go to Project Settings > General
4. Scroll down to "Your apps" section
5. Click on the web app (</>) icon
6. Copy the config values

### Step 2: Update your .env file
```bash
# Firebase Configuration
FIREBASE_API_KEY=your_actual_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Security Notes
- The `.env` file is already added to `.gitignore` 
- Never commit real API keys or secrets
- Use environment variables for all sensitive configuration
- The `.env.example` file shows the expected format with placeholder values

## Running the App
```bash
# Development
flutter run -d web-server --web-port 8080

# The app will automatically load the .env file
```

## Deployment
For production deployment, set environment variables in your hosting platform:
- Firebase Hosting: Use Firebase Functions config
- Netlify: Use environment variables in dashboard
- Vercel: Use environment variables in dashboard
