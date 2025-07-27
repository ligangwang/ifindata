// lib/services/interfaces/stock_service_interface.dart
abstract class StockServiceInterface {
  Future<List<dynamic>> getMarketIndices();
  Future<List<dynamic>> getTrendingStocks();
  Future<List<dynamic>> searchStocks(String query);
  Future<List<dynamic>> getHistoricalData(String symbol, String period);
}
