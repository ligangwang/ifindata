// lib/providers/admin_provider.dart
import 'package:flutter/material.dart';
import '../models/business_model_category.dart';
import '../services/admin_service.dart';

class AdminProvider with ChangeNotifier {
  final AdminService _adminService = AdminService();
  
  List<BusinessModelCategory> _businessModels = [];
  bool _isLoading = false;
  String? _error;
  bool _isAdmin = false;

  List<BusinessModelCategory> get businessModels => _businessModels;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAdmin => _isAdmin;

  // Check if current user is admin
  Future<void> checkAdminStatus(String uid) async {
    try {
      _isAdmin = await _adminService.isUserAdmin(uid);
      notifyListeners();
    } catch (e) {
      _isAdmin = false;
      notifyListeners();
    }
  }

  // Load all business models for admin management
  Future<void> loadBusinessModels() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _businessModels = await _adminService.getBusinessModels();
      _error = null;
    } catch (e) {
      _error = e.toString();
      _businessModels = [];
    }

    _isLoading = false;
    notifyListeners();
  }

  // Create a new business model
  Future<void> createBusinessModel(BusinessModelCategory category) async {
    try {
      await _adminService.createBusinessModel(category);
      await loadBusinessModels(); // Refresh the list
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  // Update an existing business model
  Future<void> updateBusinessModel(BusinessModelCategory category) async {
    try {
      await _adminService.updateBusinessModel(category);
      await loadBusinessModels(); // Refresh the list
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  // Delete a business model
  Future<void> deleteBusinessModel(String id) async {
    try {
      await _adminService.deleteBusinessModel(id);
      await loadBusinessModels(); // Refresh the list
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  // Add a company to a business model
  Future<void> addCompanyToBusinessModel(String businessModelId, CompanyExample company) async {
    try {
      await _adminService.addCompanyToBusinessModel(businessModelId, company);
      await loadBusinessModels(); // Refresh the list
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  // Remove a company from a business model
  Future<void> removeCompanyFromBusinessModel(String businessModelId, String companySymbol) async {
    try {
      await _adminService.removeCompanyFromBusinessModel(businessModelId, companySymbol);
      await loadBusinessModels(); // Refresh the list
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  // Update business model characteristics
  Future<void> updateBusinessModelCharacteristics(
    String businessModelId, 
    BusinessModelCharacteristics characteristics
  ) async {
    try {
      await _adminService.updateBusinessModelCharacteristics(businessModelId, characteristics);
      await loadBusinessModels(); // Refresh the list
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  // Set user admin status
  Future<void> setUserAdminStatus(String uid, bool isAdmin) async {
    try {
      await _adminService.setUserAdminStatus(uid, isAdmin);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
