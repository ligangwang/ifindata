# IFinData - Professional Stock Analysis Platform

A comprehensive Flutter web application for stock market analysis with Firebase authentication, Firestore backend, and Stripe payment integration.

## 🚀 Live Demo

**🌐 [View Live App](https://ifindata-80905.web.app)**

## ✨ Features

- **📊 Real-time Stock Analysis** - Live market data and charts
- **🔐 Google Authentication** - Secure login via Firebase Auth
- **💾 Cloud Database** - User data stored in Firestore
- **💳 Subscription Management** - Stripe integration for premium features
- **📱 Responsive Design** - Optimized for web and mobile
- **🎨 Modern UI** - Material 3 design with dark/light themes

## 🏗️ Architecture

This app uses an **environment-based configuration system** that automatically switches between mock and real services without code changes.

### 🔧 Environment Configuration

The app supports three environments:
- **Development** (`development`) - Uses mock services by default
- **Staging** (`staging`) - Uses real services with test data
- **Production** (`production`) - Uses real services with live data

### 🎛️ Service Switching

Services are automatically selected based on environment variables:
```dart
// Automatically uses MockAuthProvider or AuthProvider
EnvironmentConfig.useMockServices ? MockAuthProvider() : AuthProvider()
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
- **Payments**: Stripe
- **State Management**: Provider
- **Charts**: fl_chart
- **Hosting**: Firebase Hosting

## 📁 Project Structure

```
lib/
├── config/           # Environment and app configuration
├── models/           # Data models
├── providers/        # State management (real and mock)
├── screens/          # UI screens
└── services/         # Business logic and API calls
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
- User profile management

### 📊 Stock Analysis
- Real-time stock data visualization
- Market indices tracking (S&P 500, NASDAQ, Dow Jones, Russell 2000)
- Trending stocks discovery
- Advanced charting capabilities with fl_chart
- Historical data analysis

### 📋 Watchlist Management
- Personalized stock watchlists
- Real-time price updates
- Add/remove stocks with subscription limits
- Quick access to favorite stocks

### 💳 Subscription Plans
- **Free Plan**: Basic features with limited watchlist (5 stocks)
- **Basic Plan ($9.99/month)**: Extended features with 10 stocks watchlist
- **Premium Plan ($19.99/month)**: Advanced analytics with 50 stocks watchlist
- **Pro Plan ($39.99/month)**: Unlimited features with AI-powered insights

### 🔄 Real-time Updates
- Live stock price updates
- Market data synchronization
- Push notifications for price alerts

## Tech Stack

### Frontend
- **Flutter Web**: Cross-platform UI framework
- **Material Design 3**: Modern UI components
- **Provider**: State management
- **fl_chart**: Advanced charting library

### Backend Services
- **Firebase Auth**: User authentication
- **Cloud Firestore**: NoSQL database
- **Firebase Hosting**: Web hosting (optional)

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
│   ├── stock_data.dart         # Stock data models
│   └── user_model.dart         # User data models
├── providers/
│   ├── auth_provider.dart      # Authentication state management
│   ├── stock_provider.dart     # Stock data state management
│   └── watchlist_provider.dart # Watchlist state management
├── screens/
│   ├── auth/
│   │   └── login_screen.dart   # Login interface
│   ├── dashboard/
│   │   └── dashboard_screen.dart # Main dashboard
│   ├── search/
│   │   └── search_screen.dart  # Stock search
│   ├── watchlist/
│   │   └── watchlist_screen.dart # Watchlist management
│   ├── subscription/
│   │   └── subscription_screen.dart # Premium plans
│   ├── profile/
│   │   └── profile_screen.dart # User profile
│   └── main_screen.dart        # Navigation wrapper
├── services/
│   ├── auth_service.dart       # Authentication logic
│   ├── stock_service.dart      # Stock API integration
│   ├── stripe_service.dart     # Payment processing
│   └── watchlist_service.dart  # Watchlist operations
└── main.dart                   # App entry point
```

## Setup Instructions

### Prerequisites
- Flutter SDK (latest stable version)
- Firebase project setup
- Stripe account for payments
- Stock API access (e.g., Alpha Vantage, IEX Cloud, or Polygon)

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

### 5. Stock API Setup
1. Choose a stock data provider (Alpha Vantage, IEX Cloud, etc.)
2. Get your API key
3. Update `lib/services/stock_service.dart` with your API configuration

### 6. Google Sign-In Configuration
1. Configure OAuth 2.0 credentials in Google Cloud Console
2. Add your domain to authorized origins
3. Update the client ID in `web/index.html`

### 7. Run the Application
```bash
flutter run -d web-server --web-port 8080
```

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

### Stock API Configuration
Update `lib/services/stock_service.dart`:
```dart
static const String _baseUrl = 'https://your-stock-api.com';
static const String _apiKey = 'your_api_key';
```

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
STOCK_API_KEY=your_stock_api_key
```

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
- [ ] Advanced technical indicators
- [ ] Portfolio performance tracking
- [ ] Social trading features
- [ ] AI-powered market predictions
- [ ] Options and futures support
- [ ] International market data
- [ ] Dark mode theme
- [ ] Push notifications
- [ ] Export data functionality

---

**Disclaimer**: This application is for educational and informational purposes only. Stock market investments carry risk, and past performance does not guarantee future results. Always consult with financial advisors before making investment decisions.
