// lib/services/mock_watchlist_service.dart
import '../models/stock_data.dart';
import 'mock_stock_service.dart';

class MockWatchlistService {
  static List<String> _watchlist = [
    'AAPL',
    'GOOGL',
    'MSFT',
  ]; // Default watchlist
  static final List<Function(List<String>)> _listeners = [];

  static List<String> get watchlist => List.from(_watchlist);

  // Add listener for watchlist changes
  static void addListener(Function(List<String>) listener) {
    _listeners.add(listener);
  }

  // Remove listener
  static void removeListener(Function(List<String>) listener) {
    _listeners.remove(listener);
  }

  // Notify all listeners
  static void _notifyListeners() {
    for (final listener in _listeners) {
      listener(_watchlist);
    }
  }

  // Get watchlist stream (simulated)
  static Stream<List<String>> getWatchlistStream() async* {
    yield _watchlist;
    // In a real implementation, this would listen to database changes
  }

  // Add stock to watchlist
  static Future<bool> addToWatchlist(String symbol) async {
    await Future.delayed(const Duration(milliseconds: 300));

    if (!_watchlist.contains(symbol.toUpperCase())) {
      _watchlist.add(symbol.toUpperCase());
      _notifyListeners();
      return true;
    }
    return false;
  }

  // Remove stock from watchlist
  static Future<bool> removeFromWatchlist(String symbol) async {
    await Future.delayed(const Duration(milliseconds: 300));

    if (_watchlist.contains(symbol.toUpperCase())) {
      _watchlist.remove(symbol.toUpperCase());
      _notifyListeners();
      return true;
    }
    return false;
  }

  // Get watchlist with stock data
  static Future<List<StockData>> getWatchlistWithData() async {
    await Future.delayed(const Duration(milliseconds: 500));

    final List<StockData> stockDataList = [];
    for (final symbol in _watchlist) {
      final stockData = await MockStockService.getStockQuote(symbol);
      if (stockData != null) {
        stockDataList.add(stockData);
      }
    }

    return stockDataList;
  }

  // Check if stock is in watchlist
  static Future<bool> isInWatchlist(String symbol) async {
    await Future.delayed(const Duration(milliseconds: 100));
    return _watchlist.contains(symbol.toUpperCase());
  }

  // Get watchlist count
  static Future<int> getWatchlistCount() async {
    await Future.delayed(const Duration(milliseconds: 50));
    return _watchlist.length;
  }
}
