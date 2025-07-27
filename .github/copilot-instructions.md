# Copilot Instructions for IFinData - Stock Analysis App

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Flutter web application for stock analysis with the following key features:
- Google Sign-In authentication via Firebase Auth
- Firestore as the backend database
- Stripe integration for subscription payments
- Real-time stock data analysis and visualization
- Responsive web design

## Technology Stack
- **Frontend**: Flutter Web
- **Authentication**: Firebase Auth with Google Sign-In
- **Database**: Cloud Firestore
- **Payments**: Stripe for subscription management
- **State Management**: Provider or Riverpod (to be determined)
- **Charts**: fl_chart for data visualization

## Code Style Guidelines
- Follow Dart and Flutter best practices
- Use proper widget composition and separation of concerns
- Implement responsive design patterns for web
- Use meaningful variable and function names
- Add comprehensive error handling
- Include proper documentation for complex business logic

## Architecture Patterns
- Use MVVM or Clean Architecture patterns
- Separate business logic from UI components
- Create service classes for Firebase and Stripe operations
- Use dependency injection for better testability

## Security Considerations
- Never expose API keys in client code
- Use Firebase Security Rules for Firestore
- Implement proper authentication state management
- Validate all user inputs
- Use HTTPS for all API communications

## Key Dependencies
- firebase_core, firebase_auth, cloud_firestore
- google_sign_in
- stripe_payment, flutter_stripe
- fl_chart for stock charts
- http for API calls
- provider or riverpod for state management
