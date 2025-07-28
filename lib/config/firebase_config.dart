// lib/config/firebase_config.dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

class FirebaseConfig {
  // Try dart-define first (for production builds), then .env file (for development)
  static String get apiKey {
    const dartDefineValue = String.fromEnvironment('FIREBASE_API_KEY');
    if (dartDefineValue.isNotEmpty) return dartDefineValue;

    try {
      return dotenv.env['FIREBASE_API_KEY'] ?? 'your_firebase_api_key_here';
    } catch (e) {
      return 'your_firebase_api_key_here';
    }
  }

  static String get authDomain {
    const dartDefineValue = String.fromEnvironment('FIREBASE_AUTH_DOMAIN');
    if (dartDefineValue.isNotEmpty) return dartDefineValue;

    try {
      return dotenv.env['FIREBASE_AUTH_DOMAIN'] ??
          'your_project.firebaseapp.com';
    } catch (e) {
      return 'your_project.firebaseapp.com';
    }
  }

  static String get projectId {
    const dartDefineValue = String.fromEnvironment('FIREBASE_PROJECT_ID');
    if (dartDefineValue.isNotEmpty) return dartDefineValue;

    try {
      return dotenv.env['FIREBASE_PROJECT_ID'] ?? 'your_project_id';
    } catch (e) {
      return 'your_project_id';
    }
  }

  static String get storageBucket {
    const dartDefineValue = String.fromEnvironment('FIREBASE_STORAGE_BUCKET');
    if (dartDefineValue.isNotEmpty) return dartDefineValue;

    try {
      return dotenv.env['FIREBASE_STORAGE_BUCKET'] ??
          'your_project.firebasestorage.app';
    } catch (e) {
      return 'your_project.firebasestorage.app';
    }
  }

  static String get messagingSenderId {
    const dartDefineValue = String.fromEnvironment(
      'FIREBASE_MESSAGING_SENDER_ID',
    );
    if (dartDefineValue.isNotEmpty) return dartDefineValue;

    try {
      return dotenv.env['FIREBASE_MESSAGING_SENDER_ID'] ??
          'your_messaging_sender_id';
    } catch (e) {
      return 'your_messaging_sender_id';
    }
  }

  static String get appId {
    const dartDefineValue = String.fromEnvironment('FIREBASE_APP_ID');
    if (dartDefineValue.isNotEmpty) return dartDefineValue;

    try {
      return dotenv.env['FIREBASE_APP_ID'] ?? 'your_firebase_app_id';
    } catch (e) {
      return 'your_firebase_app_id';
    }
  }

  static String get measurementId {
    const dartDefineValue = String.fromEnvironment('FIREBASE_MEASUREMENT_ID');
    if (dartDefineValue.isNotEmpty) return dartDefineValue;

    try {
      return dotenv.env['FIREBASE_MEASUREMENT_ID'] ?? 'your_measurement_id';
    } catch (e) {
      return 'your_measurement_id';
    }
  }
}
