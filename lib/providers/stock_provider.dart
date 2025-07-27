// lib/providers/stock_provider.dart
import 'package:flutter/material.dart';
import '../models/stock_data.dart';
import '../services/stock_service.dart';

class StockProvider extends ChangeNotifier {
  final StockService _stockService = StockService();

  List<StockData> _marketIndices = [];
  List<StockData> _trendingStocks = [];
  List<StockData> _searchResults = [];
  StockData? _selectedStock;
  List<StockData> _historicalData = [];

  bool _isLoading = false;
  bool _isSearching = false;
  bool _isLoadingHistorical = false;
  String? _errorMessage;

  // Getters
  List<StockData> get marketIndices => _marketIndices;
  List<StockData> get trendingStocks => _trendingStocks;
  List<StockData> get searchResults => _searchResults;
  StockData? get selectedStock => _selectedStock;
  List<StockData> get historicalData => _historicalData;

  bool get isLoading => _isLoading;
  bool get isSearching => _isSearching;
  bool get isLoadingHistorical => _isLoadingHistorical;
  String? get errorMessage => _errorMessage;

  // Load market indices
  Future<void> loadMarketIndices() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      _marketIndices = await _stockService.getMarketIndices();
    } catch (e) {
      _errorMessage = 'Failed to load market data: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Load trending stocks
  Future<void> loadTrendingStocks() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      _trendingStocks = await _stockService.getTrendingStocks();
    } catch (e) {
      _errorMessage = 'Failed to load trending stocks: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Search stocks
  Future<void> searchStocks(String query) async {
    if (query.isEmpty) {
      _searchResults = [];
      notifyListeners();
      return;
    }

    try {
      _isSearching = true;
      _errorMessage = null;
      notifyListeners();

      final symbols = await _stockService.searchStocks(query);
      _searchResults = [];

      // Get stock data for search results
      for (final symbol in symbols.take(10)) {
        // Limit to 10 results
        final stockData = await _stockService.getStockQuote(symbol.symbol);
        if (stockData != null) {
          _searchResults.add(stockData);
        }
      }
    } catch (e) {
      _errorMessage = 'Failed to search stocks: $e';
    } finally {
      _isSearching = false;
      notifyListeners();
    }
  }

  // Get stock quote
  Future<void> getStockQuote(String symbol) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      _selectedStock = await _stockService.getStockQuote(symbol);
    } catch (e) {
      _errorMessage = 'Failed to load stock data: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Load historical data
  Future<void> loadHistoricalData(
    String symbol, {
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      _isLoadingHistorical = true;
      _errorMessage = null;
      notifyListeners();

      _historicalData = await _stockService.getHistoricalData(
        symbol,
        startDate: startDate,
        endDate: endDate,
      );
    } catch (e) {
      _errorMessage = 'Failed to load historical data: $e';
    } finally {
      _isLoadingHistorical = false;
      notifyListeners();
    }
  }

  // Clear search results
  void clearSearchResults() {
    _searchResults = [];
    notifyListeners();
  }

  // Clear selected stock
  void clearSelectedStock() {
    _selectedStock = null;
    _historicalData = [];
    notifyListeners();
  }

  // Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  // Refresh data
  Future<void> refreshData() async {
    await Future.wait([loadMarketIndices(), loadTrendingStocks()]);
  }
}
