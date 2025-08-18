# IFinData - Business Model Explorer

A comprehensive Flutter web application for exploring and categorizing public companies by their business models. Features Firebase authentication, Firestore backend, admin panel for content management, and Stripe payment integration.

## 🚀 Live Demo

**🌐 [View Live App](https://ifindata-80905.web.app)**

## ✨ Features

- **🏢 Business Model Categorization** - Explore companies grouped by revenue models
- **📊 Company Analysis** - Detailed business model breakdowns and characteristics
- **🔐 Google Authentication** - Secure login via Firebase Auth
- **👨‍💼 Admin Panel** - Content management for business models and companies
- **💾 Cloud Database** - Business data stored in Firestore
- **💳 Subscription Management** - Stripe integration for premium features
- **📱 Responsive Design** - Optimized for web and mobile
- **🎨 Modern UI** - Material 3 design with dark/light themes
- **🔍 Smart Search** - Find companies across all business model categories

## 🏗️ Architecture

This app uses an **environment-based configuration system** for business model data management and automatically switches between mock and real services without code changes.

### 🔧 Environment Configuration

The app supports three environments:
- **Development** (`development`) - Uses mock services by default
- **Staging** (`staging`) - Uses real services with test data
- **Production** (`production`) - Uses real services with live data

### 🎛️ Service Switching

Services are automatically selected based on environment variables:
```dart
// Automatically uses MockBusinessModelProvider or BusinessModelProvider
EnvironmentConfig.useMockServices ? MockBusinessModelProvider() : BusinessModelProvider()
```

## 🚀 Quick Start

### Development with Mock Services (Default)
```bash
flutter run -d web-server --web-port 8080
```

### Development with Real Services
```bash
flutter run -d web-server --web-port 8080 --dart-define=USE_MOCK_SERVICES=false
```

### Using PowerShell Scripts
```bash
# Mock services
.\run-dev-mock.ps1

# Real services  
.\run-dev-real.ps1

# Production build
.\build-prod.ps1
```

## 🚀 Deployment

### Prerequisites
- Node.js v20+ (required for Firebase CLI)
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project setup

### Quick Deploy
```bash
# Production deployment
.\deploy-firebase.ps1

# Staging deployment  
.\deploy-staging.ps1
```

### Alternative Deployment Methods
If you can't update Node.js locally:
- **GitHub Actions**: Automatic deployment on push
- **Firebase Console**: Manual upload via web interface
- **VS Code Extension**: Firebase Explorer extension
- **Cloud Shell**: Browser-based deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) and [MANUAL_DEPLOY.md](MANUAL_DEPLOY.md) for detailed instructions.

## 🛠️ Tech Stack

- **Frontend**: Flutter Web
- **Authentication**: Firebase Auth (Google Sign-In)
- **Database**: Cloud Firestore
- **Admin Panel**: Custom Flutter admin interface
- **Payments**: Stripe
- **State Management**: Provider
- **UI Components**: Material 3
- **Hosting**: Firebase Hosting

## 📁 Project Structure

```
lib/
├── config/           # Environment and app configuration
├── models/           # Business model and company data models
├── providers/        # State management (real and mock)
├── screens/          # UI screens including admin panel
├── services/         # Business logic and API calls
└── utils/            # Helper utilities and admin setup
```

## 🔧 Development

### Setup
1. Clone the repository
2. Install Flutter dependencies: `flutter pub get`
3. Run with mock services: `.\run-dev-mock.ps1`

### Environment Variables
```bash
ENVIRONMENT=development|staging|production
USE_MOCK_SERVICES=true|false
FIREBASE_PROJECT_ID=your-project-id
STRIPE_PUBLISHABLE_KEY_PROD=pk_live_...
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
```

### Testing
```bash
flutter test
```

## 🚀 Deployment Workflows

### GitHub Actions
Automatic deployment on push to main branch with environment-specific builds.

### Manual Deployment
1. Build: `flutter build web --release --dart-define=ENVIRONMENT=production`
2. Deploy: `firebase deploy --only hosting`

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📧 Contact

For questions or support, please open an issue on GitHub.

### 🔐 Authentication
- Google Sign-In integration with Firebase Auth
- Secure user session management
- User profile management with admin role support

### 🏢 Business Model Analysis
- Public company categorization by business models
- 6 major business model categories (SaaS, E-commerce, Advertising, Subscription, Hardware, Financial)
- Company details with market cap, revenue growth, and regional data
- Business model characteristics and revenue stream analysis
- Search functionality across all companies and categories

### 📋 Business Model Categories
- **SaaS (Software as a Service)**: Subscription-based software companies
- **E-commerce & Marketplaces**: Online retail and platform businesses
- **Advertising & Media**: Revenue through advertising and content
- **Subscription Services**: Recurring revenue entertainment and services
- **Hardware & Manufacturing**: Physical product sales and manufacturing
- **Financial Services**: Banking, payments, and financial technology

### 👨‍� Admin Panel (Admin Users Only)
- **Business Model Management**: Create, edit, delete business model categories
- **Company Management**: Add/remove companies from categories
- **Content Control**: Edit business model characteristics and descriptions
- **Statistics Dashboard**: Overview of total models and companies
- **Icon Customization**: Visual branding for business model categories
- **Secure Access**: Admin-only features with role-based permissions

### 💳 Subscription Plans
- **Free Plan**: Basic access to business model categories
- **Basic Plan ($9.99/month)**: Enhanced company details and analysis
- **Premium Plan ($19.99/month)**: Advanced business model insights
- **Pro Plan ($39.99/month)**: Full access with detailed analytics

## Tech Stack

### Frontend
- **Flutter Web**: Cross-platform UI framework
- **Material Design 3**: Modern UI components
- **Provider**: State management
- **Responsive Design**: Adaptive layouts for web and mobile

### Backend Services
- **Firebase Auth**: User authentication with Google Sign-In
- **Cloud Firestore**: NoSQL database for business model data
- **Firebase Hosting**: Web hosting
- **Admin Services**: Custom admin functionality for content management

### Payment Processing
- **Stripe**: Secure payment processing
- **Flutter Stripe**: Native Stripe integration

### Additional Libraries
- **http**: API communications
- **shared_preferences**: Local storage
- **url_launcher**: External link handling
- **intl**: Internationalization

## Project Structure

```
lib/
├── config/
│   ├── firebase_config.dart    # Firebase configuration
│   └── stripe_config.dart      # Stripe configuration
├── models/
│   ├── business_model_category.dart # Business model data models
│   ├── company_analysis.dart   # Company analysis models
│   └── user_model.dart         # User data models with admin roles
├── providers/
│   ├── auth_provider.dart      # Authentication state management
│   ├── business_model_provider.dart # Business model state management
│   ├── company_analysis_provider.dart # Company analysis state
│   └── admin_provider.dart     # Admin functionality state management
├── screens/
│   ├── auth/
│   │   └── login_screen.dart   # Login interface
│   ├── admin/
│   │   ├── admin_screen.dart   # Admin panel dashboard
│   │   └── business_model_form_screen.dart # Business model editor
│   ├── dashboard/
│   │   └── dashboard_screen.dart # Main dashboard
│   ├── search/
│   │   └── search_screen.dart  # Company search
│   ├── subscription/
│   │   └── subscription_screen.dart # Premium plans
│   ├── profile/
│   │   └── profile_screen.dart # User profile
│   ├── business_model_category_screen.dart # Category details
│   ├── company_analysis_screen.dart # Company analysis
│   └── main_screen.dart        # Navigation wrapper
├── services/
│   ├── auth_service.dart       # Authentication logic
│   ├── business_model_service.dart # Business model data service
│   ├── company_analysis_service.dart # Company analysis service
│   ├── admin_service.dart      # Admin panel operations
│   └── stripe_service.dart     # Payment processing
├── utils/
│   └── admin_setup.dart        # Admin role setup utilities
└── main.dart                   # App entry point
```

## Setup Instructions

### Prerequisites
- Flutter SDK (latest stable version)
- Firebase project setup
- Stripe account for payments
- Admin access setup for content management

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ifindata
```

### 2. Install Dependencies
```bash
flutter pub get
```

### 3. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Google Sign-In provider
3. Create a Firestore database
4. Add your web app to the Firebase project
5. Update the Firebase configuration in:
   - `lib/config/firebase_config.dart`
   - `web/index.html`
   - `lib/main.dart`

### 4. Stripe Setup
1. Create a Stripe account at [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your publishable and secret keys
3. Create subscription products and prices
4. Update `lib/config/stripe_config.dart` with your keys and price IDs

### 5. Admin Setup
1. Run the app and sign in with Google
2. Click the three-dot menu (⋮) in the top-right corner
3. Select "Become Admin" to grant yourself admin privileges
4. Access the Admin Panel via the admin icon (⚙️) or Profile menu
5. Start creating business model categories and adding companies

### 6. Remove Admin Setup (Production)
For production deployment, remove the admin setup functionality:
- Remove the admin setup button from `main_screen.dart`
- Delete `lib/utils/admin_setup.dart`
- Manually set admin status in Firestore: `users/{uid}.isAdmin = true`

### 7. Run the Application
```bash
flutter run -d web-server --web-port 8080
```

## 🎯 Admin Panel Usage

### Accessing Admin Features
1. **Sign in** with your Google account
2. **Become Admin**: Click the ⋮ menu → "Become Admin"
3. **Access Panel**: Click the ⚙️ icon or go to Profile → "Admin Panel"

### Admin Capabilities
- **Create Business Models**: Add new business model categories
- **Edit Categories**: Modify names, descriptions, characteristics
- **Manage Companies**: Add/remove companies from categories
- **Set Characteristics**: Define revenue models, metrics, advantages
- **Icon Selection**: Choose visual icons for categories
- **Statistics View**: Monitor total models and companies

## Configuration Files to Update

### Firebase Configuration
Replace placeholders in these files with your actual Firebase config:
- `lib/config/firebase_config.dart`
- `lib/main.dart`
- `web/index.html`

### Stripe Configuration
Update `lib/config/stripe_config.dart`:
```dart
static const String publishableKey = "pk_test_your_publishable_key";
static const String basicPlanId = "price_your_basic_plan_id";
static const String premiumPlanId = "price_your_premium_plan_id";
static const String proPlanId = "price_your_pro_plan_id";
```

### Business Model Data
The app comes with predefined business model categories:
- SaaS (Software as a Service)
- E-commerce & Marketplaces  
- Advertising & Media
- Subscription Services
- Hardware & Manufacturing
- Financial Services

Admins can modify, add, or remove categories through the Admin Panel.

## Security Considerations

### API Keys
- Never expose secret keys in client code
- Use environment variables for sensitive data
- Implement proper API key rotation

### Firebase Security
- Configure Firestore security rules
- Implement proper user authentication checks
- Use Firebase Admin SDK for server-side operations

### Stripe Security
- Process payments on secure backend servers
- Validate webhooks with signing secrets
- Implement proper error handling

## Deployment

### Firebase Hosting
```bash
flutter build web
firebase deploy
```

### Custom Hosting
```bash
flutter build web --release
# Deploy contents of build/web/ to your hosting provider
```

## Environment Variables
Create a `.env` file for local development:
```
FIREBASE_API_KEY=your_firebase_api_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
USE_MOCK_SERVICES=false
ENVIRONMENT=development
```

## 🎯 Key Features Overview

### For Regular Users
- **Explore Business Models**: Browse 6+ categories of business models
- **Company Search**: Find companies across all categories
- **Detailed Analysis**: View business model characteristics and company data
- **Subscription Plans**: Access premium features and detailed analytics

### For Admin Users  
- **Content Management**: Full CRUD operations for business models
- **Company Management**: Add/edit/remove companies from categories
- **Statistics Dashboard**: View app usage and content metrics
- **Role Management**: Control admin access (manual Firestore setup)

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Support
For questions and support, please contact [ligangwangs@gmail.com](mailto:ligangwangs@gmail.com).

## Roadmap
- [ ] Mobile app versions (iOS/Android)
- [ ] Advanced business model analytics
- [ ] Company performance tracking
- [ ] Industry comparison tools
- [ ] AI-powered business model recommendations
- [ ] Export functionality for business data
- [ ] International company database
- [ ] Dark mode theme
- [ ] Push notifications for new companies
- [ ] Advanced search and filtering

---

**Disclaimer**: This application is for educational and informational purposes only. Business model categorizations are for analysis and learning. Always conduct your own research before making any business or investment decisions.
