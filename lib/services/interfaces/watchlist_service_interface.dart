// lib/services/interfaces/watchlist_service_interface.dart
abstract class WatchlistServiceInterface {
  Future<List<String>> getWatchlistSymbols();
  Future<void> addToWatchlist(String symbol);
  Future<void> removeFromWatchlist(String symbol);
  Future<List<dynamic>> getWatchlistData();
}
