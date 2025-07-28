# Google Cloud APIs Required for IFinData

## 📋 **Required APIs Checklist**

### **✅ Core Firebase APIs** (Usually auto-enabled)
- [ ] Firebase Authentication API
- [ ] Cloud Firestore API  
- [ ] Firebase Hosting API
- [ ] Firebase Analytics API

### **🔧 Manual Enable Required**
- [ ] **Google People API** ⚠️ **[REQUIRED FOR GOOGLE SIGN-IN]**
  - **URL**: https://console.developers.google.com/apis/api/people.googleapis.com/overview?project=464830297405
  - **Purpose**: Get user profile info after Google Sign-In
  - **Status**: ⚠️ **NEEDS TO BE ENABLED**

### **💰 Optional (for future features)**
- [ ] Google Analytics API
- [ ] YouTube Data API (if needed)
- [ ] Gmail API (if needed)

## 🛠 **How to Enable APIs**

### **Method 1: Direct Links**
Click the direct link for each API above.

### **Method 2: Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `ifindata-80905`
3. Navigate to **APIs & Services** > **Library**
4. Search for the API name
5. Click **Enable**

### **Method 3: Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **General**
4. Scroll to **Google Cloud Platform (GCP) resource location**
5. Click **"Manage service accounts"**
6. This opens Google Cloud Console where you can enable APIs

## 🚨 **Current Issue**

**Error**: People API is disabled
**Solution**: Enable People API using the link above
**Project ID**: 464830297405
**Direct Fix**: https://console.developers.google.com/apis/api/people.googleapis.com/overview?project=464830297405

## ⏱ **After Enabling**

1. **Wait**: 2-3 minutes for propagation
2. **Test**: Try Google Sign-In in your app again
3. **Verify**: Sign-in should complete successfully

## 🔐 **Security Note**

- People API is safe to enable
- It only accesses basic profile info (name, email, photo)
- Required for standard Google Sign-In flow
- No additional costs for basic usage
