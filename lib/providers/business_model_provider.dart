// lib/providers/business_model_provider.dart
import 'package:flutter/foundation.dart';
import '../models/business_model_category.dart';
import '../services/business_model_service.dart';

class BusinessModelProvider with ChangeNotifier {
  final BusinessModelService _service = BusinessModelService();
  
  List<BusinessModelCategory> _categories = [];
  List<CompanyExample> _searchResults = [];
  String _searchQuery = '';
  bool _isLoading = false;
  String? _error;
  
  List<BusinessModelCategory> get categories => _categories;
  List<CompanyExample> get searchResults => _searchResults;
  String get searchQuery => _searchQuery;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  BusinessModelProvider() {
    loadCategories();
  }
  
  /// Load all business model categories
  void loadCategories() {
    _setLoading(true);
    _clearError();
    
    try {
      _categories = _service.getAllCategories();
      notifyListeners();
    } catch (e) {
      _setError('Failed to load business model categories: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }
  
  /// Search companies across all categories
  void searchCompanies(String query) {
    _searchQuery = query;
    _searchResults = _service.searchCompanies(query);
    notifyListeners();
  }
  
  /// Get a specific category by ID
  BusinessModelCategory? getCategoryById(String id) {
    return _service.getCategoryById(id);
  }
  
  /// Get companies by region
  List<CompanyExample> getCompaniesByRegion(String region) {
    return _service.getCompaniesByRegion(region);
  }
  
  /// Get top companies by market cap
  List<CompanyExample> getTopCompaniesByMarketCap({int limit = 10}) {
    return _service.getTopCompaniesByMarketCap(limit: limit);
  }
  
  /// Get fastest growing companies
  List<CompanyExample> getFastestGrowingCompanies({int limit = 10}) {
    return _service.getFastestGrowingCompanies(limit: limit);
  }
  
  /// Get companies with highest gross margins
  List<CompanyExample> getHighestMarginCompanies({int limit = 10}) {
    return _service.getHighestMarginCompanies(limit: limit);
  }
  
  /// Get business model statistics
  Map<String, dynamic> getBusinessModelStats() {
    return _service.getBusinessModelStats();
  }
  
  /// Clear search results
  void clearSearch() {
    _searchQuery = '';
    _searchResults = [];
    notifyListeners();
  }
  
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }
  
  void _setError(String error) {
    _error = error;
    notifyListeners();
  }
  
  void _clearError() {
    _error = null;
  }
}
