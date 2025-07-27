// lib/providers/mock_auth_provider.dart
import 'package:flutter/material.dart';
import '../services/mock_auth_service.dart';

class MockAuthProvider extends ChangeNotifier {
  MockUser? _user;
  bool _isLoading = false;
  String? _errorMessage;

  MockUser? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;

  MockAuthProvider() {
    _initializeAuth();
  }

  void _initializeAuth() {
    MockAuthService.authStateChanges.addListener(() {
      _user = MockAuthService.authStateChanges.value;
      notifyListeners();
    });
  }

  Future<bool> signInWithGoogle() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final result = await MockAuthService.signInWithGoogle();

      if (result != null) {
        _user = result;
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    try {
      _isLoading = true;
      notifyListeners();

      await MockAuthService.signOut();
      _user = null;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<String> getUserSubscription() async {
    try {
      return await MockAuthService.getUserSubscription();
    } catch (e) {
      return 'free';
    }
  }

  Future<void> updateSubscription(String subscriptionType) async {
    try {
      await MockAuthService.updateUserSubscription(subscriptionType);
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
