// lib/services/stock_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/stock_data.dart';

class StockService {
  static const String _baseUrl =
      'https://api.example.com'; // Replace with actual API
  static const String _apiKey =
      'YOUR_STOCK_API_KEY'; // Replace with your API key

  // Get stock quote
  Future<StockData?> getStockQuote(String symbol) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/quote?symbol=$symbol&apikey=$_apiKey'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return StockData.fromJson(data);
      } else {
        throw Exception('Failed to load stock data');
      }
    } catch (e) {
      print('Error fetching stock quote: $e');
      return null;
    }
  }

  // Get stock historical data
  Future<List<StockData>> getHistoricalData(
    String symbol, {
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      final start = startDate.toIso8601String().split('T')[0];
      final end = endDate.toIso8601String().split('T')[0];

      final response = await http.get(
        Uri.parse(
          '$_baseUrl/historical?symbol=$symbol&start=$start&end=$end&apikey=$_apiKey',
        ),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        return data.map((item) => StockData.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load historical data');
      }
    } catch (e) {
      print('Error fetching historical data: $e');
      return [];
    }
  }

  // Search stocks
  Future<List<StockSymbol>> searchStocks(String query) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/search?query=$query&apikey=$_apiKey'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        return data.map((item) => StockSymbol.fromJson(item)).toList();
      } else {
        throw Exception('Failed to search stocks');
      }
    } catch (e) {
      print('Error searching stocks: $e');
      return [];
    }
  }

  // Get market indices
  Future<List<StockData>> getMarketIndices() async {
    try {
      final indices = [
        'SPY',
        'QQQ',
        'DIA',
        'IWM',
      ]; // S&P 500, NASDAQ, Dow, Russell 2000
      final List<StockData> results = [];

      for (final symbol in indices) {
        final data = await getStockQuote(symbol);
        if (data != null) {
          results.add(data);
        }
      }

      return results;
    } catch (e) {
      print('Error fetching market indices: $e');
      return [];
    }
  }

  // Get trending stocks
  Future<List<StockData>> getTrendingStocks() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/trending?apikey=$_apiKey'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        return data.map((item) => StockData.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load trending stocks');
      }
    } catch (e) {
      print('Error fetching trending stocks: $e');
      return [];
    }
  }
}
