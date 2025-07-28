// lib/config/app_config.dart
class AppConfig {
  static const bool _kDebugMode =
      bool.fromEnvironment('dart.vm.product') == false;
  static const String _environment = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: 'development',
  );

  // Service configuration
  static bool get useMockServices {
    // Use mock services in development or when explicitly set
    return _environment == 'development' ||
        _environment == 'mock' ||
        const bool.fromEnvironment(
          'USE_MOCK_SERVICES',
          defaultValue: _kDebugMode,
        );
  }

  static bool get isProduction => _environment == 'production';
  static bool get isDevelopment => _environment == 'development';
  static bool get isTesting => _environment == 'testing';

  // API Configuration
  static String get apiBaseUrl {
    switch (_environment) {
      case 'production':
        return const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'https://api.ifindata.com',
        );
      case 'staging':
        return const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'https://staging-api.ifindata.com',
        );
      default:
        return const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'http://localhost:3000',
        );
    }
  }

  // Firebase Configuration
  static String get firebaseProjectId {
    return const String.fromEnvironment(
      'FIREBASE_PROJECT_ID',
      defaultValue: 'ifindata-dev',
    );
  }

  // Stripe Configuration
  static String get stripePublishableKey {
    if (isProduction) {
      return const String.fromEnvironment(
        'STRIPE_PUBLISHABLE_KEY_PROD',
        defaultValue: '',
      );
    } else {
      return const String.fromEnvironment(
        'STRIPE_PUBLISHABLE_KEY_TEST',
        defaultValue: '',
      );
    }
  }

  // Debug Configuration
  static bool get enableLogging => !isProduction;
  static bool get enableDebugBanner => isDevelopment;

  static void logConfig() {
    if (enableLogging) {
      print('=== App Configuration ===');
      print('Environment: $_environment');
      print('Use Mock Services: $useMockServices');
      print('API Base URL: $apiBaseUrl');
      print('Firebase Project: $firebaseProjectId');
      print('Debug Mode: $_kDebugMode');
      print('========================');
    }
  }
}
