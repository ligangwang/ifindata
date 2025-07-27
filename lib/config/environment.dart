// lib/config/environment.dart
enum Environment {
  development,
  staging,
  production,
}

class EnvironmentConfig {
  static const String _envKey = 'ENVIRONMENT';
  static const String _useMockKey = 'USE_MOCK_SERVICES';
  
  static Environment get environment {
    const envString = String.fromEnvironment(_envKey, defaultValue: 'development');
    switch (envString.toLowerCase()) {
      case 'production':
        return Environment.production;
      case 'staging':
        return Environment.staging;
      default:
        return Environment.development;
    }
  }
  
  static bool get useMockServices {
    // Check explicit override first
    const mockOverride = String.fromEnvironment(_useMockKey);
    if (mockOverride.isNotEmpty) {
      return mockOverride.toLowerCase() == 'true';
    }
    
    // Default: use mocks in development, real services in production
    return environment == Environment.development;
  }
  
  static bool get isProduction => environment == Environment.production;
  static bool get isDevelopment => environment == Environment.development;
  static bool get isStaging => environment == Environment.staging;
  
  static String get displayName {
    switch (environment) {
      case Environment.production:
        return 'Production';
      case Environment.staging:
        return 'Staging';
      case Environment.development:
        return 'Development';
    }
  }
  
  static void logEnvironment() {
    print('🌍 Environment: $displayName');
    print('🔧 Mock Services: ${useMockServices ? "Enabled" : "Disabled"}');
  }
}
