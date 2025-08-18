// lib/providers/company_analysis_provider.dart
import 'package:flutter/foundation.dart';
import '../models/company_analysis.dart';
import '../services/company_analysis_service.dart';

class CompanyAnalysisProvider with ChangeNotifier {
  final CompanyAnalysisService _service = CompanyAnalysisService();

  Map<String, CompanyAnalysis> _analyses = {};
  bool _isLoading = false;
  String? _error;

  Map<String, CompanyAnalysis> get analyses => _analyses;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Get analysis for a specific company
  CompanyAnalysis? getAnalysis(String symbol) {
    return _analyses[symbol.toUpperCase()];
  }

  /// Load company analysis for a given symbol
  Future<CompanyAnalysis?> loadCompanyAnalysis(String symbol) async {
    _setLoading(true);
    _clearError();

    try {
      final analysis = await _service.getCompanyAnalysis(symbol);

      if (analysis != null) {
        _analyses[symbol.toUpperCase()] = analysis;
        notifyListeners();
      }

      return analysis;
    } catch (e) {
      _setError('Failed to load company analysis: ${e.toString()}');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  /// Refresh analysis for a specific company
  Future<void> refreshAnalysis(String symbol) async {
    await loadCompanyAnalysis(symbol);
  }

  /// Clear all cached analyses
  void clearAnalyses() {
    _analyses.clear();
    notifyListeners();
  }

  /// Remove analysis for a specific symbol
  void removeAnalysis(String symbol) {
    _analyses.remove(symbol.toUpperCase());
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
