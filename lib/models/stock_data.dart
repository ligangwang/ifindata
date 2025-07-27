// lib/models/stock_data.dart
class StockData {
  final String symbol;
  final String name;
  final double price;
  final double change;
  final double changePercent;
  final double volume;
  final double marketCap;
  final double peRatio;
  final double high52Week;
  final double low52Week;
  final DateTime timestamp;

  StockData({
    required this.symbol,
    required this.name,
    required this.price,
    required this.change,
    required this.changePercent,
    required this.volume,
    required this.marketCap,
    required this.peRatio,
    required this.high52Week,
    required this.low52Week,
    required this.timestamp,
  });

  factory StockData.fromJson(Map<String, dynamic> json) {
    return StockData(
      symbol: json['symbol'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      change: (json['change'] ?? 0).toDouble(),
      changePercent: (json['changePercent'] ?? 0).toDouble(),
      volume: (json['volume'] ?? 0).toDouble(),
      marketCap: (json['marketCap'] ?? 0).toDouble(),
      peRatio: (json['peRatio'] ?? 0).toDouble(),
      high52Week: (json['high52Week'] ?? 0).toDouble(),
      low52Week: (json['low52Week'] ?? 0).toDouble(),
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'symbol': symbol,
      'name': name,
      'price': price,
      'change': change,
      'changePercent': changePercent,
      'volume': volume,
      'marketCap': marketCap,
      'peRatio': peRatio,
      'high52Week': high52Week,
      'low52Week': low52Week,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  bool get isPositive => change >= 0;
}

class StockSymbol {
  final String symbol;
  final String name;
  final String exchange;
  final String type;

  StockSymbol({
    required this.symbol,
    required this.name,
    required this.exchange,
    required this.type,
  });

  factory StockSymbol.fromJson(Map<String, dynamic> json) {
    return StockSymbol(
      symbol: json['symbol'] ?? '',
      name: json['name'] ?? '',
      exchange: json['exchange'] ?? '',
      type: json['type'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {'symbol': symbol, 'name': name, 'exchange': exchange, 'type': type};
  }
}
