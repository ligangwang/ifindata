// lib/services/mock_stock_service.dart
import '../models/stock_data.dart';
import 'dart:math';

class MockStockService {
  static final Random _random = Random();

  // Generate mock stock data
  static StockData _generateMockStock(String symbol, String name) {
    final basePrice = 50 + _random.nextDouble() * 300; // $50-$350
    final change = (_random.nextDouble() - 0.5) * 10; // -$5 to +$5
    final changePercent = (change / basePrice) * 100;

    return StockData(
      symbol: symbol,
      name: name,
      price: basePrice + change,
      change: change,
      changePercent: changePercent,
      volume: 1000000 + _random.nextInt(9000000).toDouble(),
      marketCap:
          (basePrice * 1000000000) + _random.nextInt(500000000).toDouble(),
      peRatio: 15 + _random.nextDouble() * 20,
      high52Week: basePrice + 50 + _random.nextDouble() * 50,
      low52Week: basePrice - 50 - _random.nextDouble() * 30,
      timestamp: DateTime.now(),
    );
  }

  // Get mock market indices
  static Future<List<StockData>> getMarketIndices() async {
    await Future.delayed(const Duration(milliseconds: 800));

    return [
      _generateMockStock('SPY', 'SPDR S&P 500 ETF'),
      _generateMockStock('QQQ', 'Invesco QQQ ETF'),
      _generateMockStock('DIA', 'SPDR Dow Jones ETF'),
      _generateMockStock('IWM', 'iShares Russell 2000 ETF'),
    ];
  }

  // Get mock trending stocks
  static Future<List<StockData>> getTrendingStocks() async {
    await Future.delayed(const Duration(milliseconds: 1000));

    return [
      _generateMockStock('AAPL', 'Apple Inc.'),
      _generateMockStock('GOOGL', 'Alphabet Inc.'),
      _generateMockStock('MSFT', 'Microsoft Corporation'),
      _generateMockStock('AMZN', 'Amazon.com Inc.'),
      _generateMockStock('TSLA', 'Tesla Inc.'),
      _generateMockStock('META', 'Meta Platforms Inc.'),
      _generateMockStock('NVDA', 'NVIDIA Corporation'),
      _generateMockStock('NFLX', 'Netflix Inc.'),
    ];
  }

  // Get mock stock quote
  static Future<StockData?> getStockQuote(String symbol) async {
    await Future.delayed(const Duration(milliseconds: 600));

    // Define some known stocks
    final stockNames = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corporation',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'NVDA': 'NVIDIA Corporation',
      'NFLX': 'Netflix Inc.',
      'SPY': 'SPDR S&P 500 ETF',
      'QQQ': 'Invesco QQQ ETF',
      'DIA': 'SPDR Dow Jones ETF',
      'IWM': 'iShares Russell 2000 ETF',
    };

    final name = stockNames[symbol.toUpperCase()] ?? '$symbol Corporation';
    return _generateMockStock(symbol.toUpperCase(), name);
  }

  // Mock search stocks
  static Future<List<StockSymbol>> searchStocks(String query) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final allStocks = [
      StockSymbol(
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        type: 'Common Stock',
      ),
      StockSymbol(
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        exchange: 'NASDAQ',
        type: 'Common Stock',
      ),
      StockSymbol(
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        exchange: 'NASDAQ',
        type: 'Common Stock',
      ),
      StockSymbol(
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        exchange: 'NASDAQ',
        type: 'Common Stock',
      ),
      StockSymbol(
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        exchange: 'NASDAQ',
        type: 'Common Stock',
      ),
      StockSymbol(
        symbol: 'META',
        name: 'Meta Platforms Inc.',
        exchange: 'NASDAQ',
        type: 'Common Stock',
      ),
      StockSymbol(
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        exchange: 'NASDAQ',
        type: 'Common Stock',
      ),
      StockSymbol(
        symbol: 'NFLX',
        name: 'Netflix Inc.',
        exchange: 'NASDAQ',
        type: 'Common Stock',
      ),
      StockSymbol(
        symbol: 'JPM',
        name: 'JPMorgan Chase & Co.',
        exchange: 'NYSE',
        type: 'Common Stock',
      ),
      StockSymbol(
        symbol: 'V',
        name: 'Visa Inc.',
        exchange: 'NYSE',
        type: 'Common Stock',
      ),
      StockSymbol(
        symbol: 'JNJ',
        name: 'Johnson & Johnson',
        exchange: 'NYSE',
        type: 'Common Stock',
      ),
      StockSymbol(
        symbol: 'WMT',
        name: 'Walmart Inc.',
        exchange: 'NYSE',
        type: 'Common Stock',
      ),
    ];

    // Filter stocks based on query
    final filteredStocks = allStocks.where((stock) {
      final queryLower = query.toLowerCase();
      return stock.symbol.toLowerCase().contains(queryLower) ||
          stock.name.toLowerCase().contains(queryLower);
    }).toList();

    return filteredStocks;
  }

  // Mock historical data
  static Future<List<StockData>> getHistoricalData(
    String symbol, {
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    await Future.delayed(const Duration(milliseconds: 1200));

    final List<StockData> historicalData = [];
    final days = endDate.difference(startDate).inDays;
    final basePrice = 100 + _random.nextDouble() * 200;

    for (int i = 0; i <= days; i++) {
      final date = startDate.add(Duration(days: i));
      final priceVariation = (_random.nextDouble() - 0.5) * 10;
      final price = basePrice + priceVariation;
      final change = (_random.nextDouble() - 0.5) * 5;

      historicalData.add(
        StockData(
          symbol: symbol,
          name: '$symbol Corporation',
          price: price,
          change: change,
          changePercent: (change / price) * 100,
          volume: 1000000 + _random.nextInt(5000000).toDouble(),
          marketCap: price * 1000000000,
          peRatio: 15 + _random.nextDouble() * 20,
          high52Week: price + 50,
          low52Week: price - 50,
          timestamp: date,
        ),
      );
    }

    return historicalData;
  }
}
