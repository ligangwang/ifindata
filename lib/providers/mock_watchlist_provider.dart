// lib/providers/mock_watchlist_provider.dart
import 'package:flutter/material.dart';
import '../models/stock_data.dart';
import '../services/mock_watchlist_service.dart';

class MockWatchlistProvider extends ChangeNotifier {
  List<String> _watchlistSymbols = [];
  List<StockData> _watchlistData = [];
  bool _isLoading = false;
  String? _errorMessage;

  // Getters
  List<String> get watchlistSymbols => _watchlistSymbols;
  List<StockData> get watchlistData => _watchlistData;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get watchlistCount => _watchlistSymbols.length;

  MockWatchlistProvider() {
    _initializeWatchlist();
  }

  void _initializeWatchlist() {
    // Initialize with current watchlist
    _watchlistSymbols = MockWatchlistService.watchlist;
    _loadWatchlistData();

    // Listen to watchlist changes
    MockWatchlistService.addListener((symbols) {
      _watchlistSymbols = symbols;
      _loadWatchlistData();
      notifyListeners();
    });
  }

  // Load watchlist data
  Future<void> _loadWatchlistData() async {
    if (_watchlistSymbols.isEmpty) {
      _watchlistData = [];
      return;
    }

    try {
      _isLoading = true;
      notifyListeners();

      _watchlistData = await MockWatchlistService.getWatchlistWithData();
    } catch (e) {
      _errorMessage = 'Failed to load watchlist data: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Add stock to watchlist
  Future<bool> addToWatchlist(String symbol) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final success = await MockWatchlistService.addToWatchlist(symbol);

      if (success) {
        // Update local state immediately
        _watchlistSymbols = MockWatchlistService.watchlist;
        await _loadWatchlistData();
        return true;
      } else {
        _errorMessage = 'Stock already in watchlist';
        return false;
      }
    } catch (e) {
      _errorMessage = 'Error adding to watchlist: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Remove stock from watchlist
  Future<bool> removeFromWatchlist(String symbol) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final success = await MockWatchlistService.removeFromWatchlist(symbol);

      if (success) {
        // Update local state immediately
        _watchlistSymbols = MockWatchlistService.watchlist;
        await _loadWatchlistData();
        return true;
      } else {
        _errorMessage = 'Failed to remove from watchlist';
        return false;
      }
    } catch (e) {
      _errorMessage = 'Error removing from watchlist: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Check if stock is in watchlist
  Future<bool> isInWatchlist(String symbol) async {
    try {
      return await MockWatchlistService.isInWatchlist(symbol);
    } catch (e) {
      return false;
    }
  }

  // Toggle watchlist status
  Future<bool> toggleWatchlist(String symbol) async {
    final inWatchlist = await isInWatchlist(symbol);

    if (inWatchlist) {
      return await removeFromWatchlist(symbol);
    } else {
      return await addToWatchlist(symbol);
    }
  }

  // Refresh watchlist data
  Future<void> refreshWatchlistData() async {
    await _loadWatchlistData();
  }

  // Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  // Get watchlist limit based on subscription
  int getWatchlistLimit(String subscription) {
    switch (subscription.toLowerCase()) {
      case 'basic':
        return 10;
      case 'premium':
        return 50;
      case 'pro':
        return -1; // Unlimited
      default:
        return 5; // Free plan
    }
  }

  // Check if can add more to watchlist
  bool canAddToWatchlist(String subscription) {
    final limit = getWatchlistLimit(subscription);
    return limit == -1 || _watchlistSymbols.length < limit;
  }
}
