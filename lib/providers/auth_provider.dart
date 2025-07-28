// lib/providers/auth_provider.dart
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/auth_service.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  User? _user;
  UserModel? _userModel;
  bool _isLoading = false;
  String? _errorMessage;

  User? get user => _user;
  UserModel? get userModel => _userModel;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    print('🔧 AuthProvider constructor called');
    _isLoading = true;
    // Don't call notifyListeners in constructor
    _initializeAuth();
  }

  void _initializeAuth() async {
    print('🔧 AuthProvider _initializeAuth called');
    try {
      // Get initial user state
      _user = _authService.currentUser;
      print('🔧 Initial user: ${_user?.email ?? 'null'}');
      _isLoading = false;

      // Notify listeners with initial state
      notifyListeners();

      // Listen to auth state changes
      _authService.authStateChanges.listen((User? user) {
        print('🔧 Auth state changed: ${user?.email ?? 'null'}');
        _user = user;
        if (user != null) {
          _loadUserModel();
        } else {
          _userModel = null;
        }
        notifyListeners();
      });
    } catch (e) {
      print('🔧 Error in _initializeAuth: $e');
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<void> _loadUserModel() async {
    // Load user model from Firestore if needed
    // This is a placeholder - implement based on your needs
    notifyListeners();
  }

  Future<bool> signInWithGoogle() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final result = await _authService.signInWithGoogle();

      if (result != null) {
        _user = result.user;
        await _loadUserModel();
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
      _userModel = null;
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
      return 'free';
    }
  }

  Future<void> updateSubscription(String subscriptionType) async {
    try {
      await _authService.updateUserSubscription(subscriptionType);
      await _loadUserModel();
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
