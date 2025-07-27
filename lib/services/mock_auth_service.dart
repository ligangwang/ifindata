// lib/services/mock_auth_service.dart
import 'package:flutter/foundation.dart';

class MockUser {
  final String uid;
  final String? email;
  final String? displayName;
  final String? photoURL;

  MockUser({required this.uid, this.email, this.displayName, this.photoURL});
}

class MockAuthService {
  static MockUser? _currentUser;
  static final ValueNotifier<MockUser?> _authStateNotifier = ValueNotifier(
    null,
  );

  static MockUser? get currentUser => _currentUser;
  static ValueListenable<MockUser?> get authStateChanges => _authStateNotifier;

  static Future<MockUser?> signInWithGoogle() async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));

    _currentUser = MockUser(
      uid: 'mock_user_123',
      email: 'demo@ifindata.com',
      displayName: 'Demo User',
      photoURL: 'https://via.placeholder.com/150',
    );

    _authStateNotifier.value = _currentUser;
    return _currentUser;
  }

  static Future<void> signOut() async {
    await Future.delayed(const Duration(milliseconds: 500));
    _currentUser = null;
    _authStateNotifier.value = null;
  }

  static Future<String> getUserSubscription() async {
    await Future.delayed(const Duration(milliseconds: 100));
    return 'free'; // Default subscription
  }

  static Future<void> updateUserSubscription(String subscriptionType) async {
    await Future.delayed(const Duration(milliseconds: 500));
    // In a real app, this would update the database
    print('Updated subscription to: $subscriptionType');
  }
}
