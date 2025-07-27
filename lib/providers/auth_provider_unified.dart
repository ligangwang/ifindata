// lib/providers/auth_provider_unified.dart
import 'package:flutter/material.dart';
import '../services/service_locator.dart';
import '../services/interfaces/auth_service_interface.dart';

class AuthProvider extends ChangeNotifier {
  late final AuthServiceInterface _authService;
  dynamic _user;
  bool _isLoading = false;
  String? _errorMessage;

  dynamic get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _authService = ServiceLocator.authService;
    _initializeAuth();
  }

  void _initializeAuth() {
    _authService.authStateChanges.listen((user) {
      _user = user;
      notifyListeners();
    });
  }

  Future<bool> signInWithGoogle() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final result = await _authService.signInWithGoogle();

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

      await _authService.signOut();
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
      return await _authService.getUserSubscription();
    } catch (e) {
      _errorMessage = e.toString();
      return 'free';
    }
  }

  Future<void> updateSubscription(String subscriptionType) async {
    try {
      await _authService.updateUserSubscription(subscriptionType);
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    }
  }
}
