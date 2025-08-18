// lib/models/stock_analysis.dart
class StockAnalysis {
  final String symbol;
  final DateTime analysisDate;
  final TechnicalAnalysis technical;
  final FundamentalAnalysis fundamental;
  final SentimentAnalysis sentiment;
  final RiskMetrics risk;
  final PriceTargets priceTargets;
  final List<AnalystRecommendation> recommendations;

  StockAnalysis({
    required this.symbol,
    required this.analysisDate,
    required this.technical,
    required this.fundamental,
    required this.sentiment,
    required this.risk,
    required this.priceTargets,
    required this.recommendations,
  });

  factory StockAnalysis.fromJson(Map<String, dynamic> json) {
    return StockAnalysis(
      symbol: json['symbol'] ?? '',
      analysisDate:
          DateTime.tryParse(json['analysisDate'] ?? '') ?? DateTime.now(),
      technical: TechnicalAnalysis.fromJson(json['technical'] ?? {}),
      fundamental: FundamentalAnalysis.fromJson(json['fundamental'] ?? {}),
      sentiment: SentimentAnalysis.fromJson(json['sentiment'] ?? {}),
      risk: RiskMetrics.fromJson(json['risk'] ?? {}),
      priceTargets: PriceTargets.fromJson(json['priceTargets'] ?? {}),
      recommendations: (json['recommendations'] as List? ?? [])
          .map((r) => AnalystRecommendation.fromJson(r))
          .toList(),
    );
  }
}

class TechnicalAnalysis {
  final Map<String, double> indicators; // RSI, MACD, SMA, EMA, etc.
  final String trend; // bullish, bearish, neutral
  final double trendStrength; // 0-100
  final List<SupportResistance> levels;
  final Map<String, String> patterns; // chart patterns detected
  final double momentum; // -100 to 100

  TechnicalAnalysis({
    required this.indicators,
    required this.trend,
    required this.trendStrength,
    required this.levels,
    required this.patterns,
    required this.momentum,
  });

  factory TechnicalAnalysis.fromJson(Map<String, dynamic> json) {
    return TechnicalAnalysis(
      indicators: Map<String, double>.from(json['indicators'] ?? {}),
      trend: json['trend'] ?? 'neutral',
      trendStrength: (json['trendStrength'] ?? 0).toDouble(),
      levels: (json['levels'] as List? ?? [])
          .map((l) => SupportResistance.fromJson(l))
          .toList(),
      patterns: Map<String, String>.from(json['patterns'] ?? {}),
      momentum: (json['momentum'] ?? 0).toDouble(),
    );
  }

  // Technical indicator getters
  double get rsi => indicators['RSI'] ?? 0;
  double get macd => indicators['MACD'] ?? 0;
  double get sma20 => indicators['SMA_20'] ?? 0;
  double get ema50 => indicators['EMA_50'] ?? 0;
  double get bollingerUpper => indicators['BB_UPPER'] ?? 0;
  double get bollingerLower => indicators['BB_LOWER'] ?? 0;
  double get stochasticK => indicators['STOCH_K'] ?? 0;
  double get williamsR => indicators['WILLIAMS_R'] ?? 0;
}

class FundamentalAnalysis {
  final Map<String, double> ratios; // P/E, P/B, ROE, etc.
  final FinancialHealth financialHealth;
  final GrowthMetrics growth;
  final ValuationMetrics valuation;
  final String sector;
  final String industry;
  final int marketCapCategory; // 1=small, 2=mid, 3=large cap

  FundamentalAnalysis({
    required this.ratios,
    required this.financialHealth,
    required this.growth,
    required this.valuation,
    required this.sector,
    required this.industry,
    required this.marketCapCategory,
  });

  factory FundamentalAnalysis.fromJson(Map<String, dynamic> json) {
    return FundamentalAnalysis(
      ratios: Map<String, double>.from(json['ratios'] ?? {}),
      financialHealth: FinancialHealth.fromJson(json['financialHealth'] ?? {}),
      growth: GrowthMetrics.fromJson(json['growth'] ?? {}),
      valuation: ValuationMetrics.fromJson(json['valuation'] ?? {}),
      sector: json['sector'] ?? '',
      industry: json['industry'] ?? '',
      marketCapCategory: json['marketCapCategory'] ?? 2,
    );
  }

  // Financial ratio getters
  double get peRatio => ratios['PE'] ?? 0;
  double get pbRatio => ratios['PB'] ?? 0;
  double get roe => ratios['ROE'] ?? 0;
  double get roa => ratios['ROA'] ?? 0;
  double get debtToEquity => ratios['DEBT_TO_EQUITY'] ?? 0;
  double get currentRatio => ratios['CURRENT_RATIO'] ?? 0;
  double get grossMargin => ratios['GROSS_MARGIN'] ?? 0;
  double get netMargin => ratios['NET_MARGIN'] ?? 0;
}

class SentimentAnalysis {
  final double score; // -100 to 100
  final String
  sentiment; // very_bearish, bearish, neutral, bullish, very_bullish
  final Map<String, int> socialMentions; // platform -> mention count
  final double institutionalOwnership; // 0-100%
  final double insiderTrading; // net insider buying/selling score
  final List<NewsItem> recentNews;

  SentimentAnalysis({
    required this.score,
    required this.sentiment,
    required this.socialMentions,
    required this.institutionalOwnership,
    required this.insiderTrading,
    required this.recentNews,
  });

  factory SentimentAnalysis.fromJson(Map<String, dynamic> json) {
    return SentimentAnalysis(
      score: (json['score'] ?? 0).toDouble(),
      sentiment: json['sentiment'] ?? 'neutral',
      socialMentions: Map<String, int>.from(json['socialMentions'] ?? {}),
      institutionalOwnership: (json['institutionalOwnership'] ?? 0).toDouble(),
      insiderTrading: (json['insiderTrading'] ?? 0).toDouble(),
      recentNews: (json['recentNews'] as List? ?? [])
          .map((n) => NewsItem.fromJson(n))
          .toList(),
    );
  }
}

class RiskMetrics {
  final double beta; // market sensitivity
  final double volatility; // annualized volatility %
  final double sharpeRatio;
  final double maxDrawdown; // worst peak-to-trough decline
  final double valueAtRisk; // 1-day 95% VaR
  final String riskRating; // low, medium, high
  final Map<String, double> riskFactors;

  RiskMetrics({
    required this.beta,
    required this.volatility,
    required this.sharpeRatio,
    required this.maxDrawdown,
    required this.valueAtRisk,
    required this.riskRating,
    required this.riskFactors,
  });

  factory RiskMetrics.fromJson(Map<String, dynamic> json) {
    return RiskMetrics(
      beta: (json['beta'] ?? 1.0).toDouble(),
      volatility: (json['volatility'] ?? 0).toDouble(),
      sharpeRatio: (json['sharpeRatio'] ?? 0).toDouble(),
      maxDrawdown: (json['maxDrawdown'] ?? 0).toDouble(),
      valueAtRisk: (json['valueAtRisk'] ?? 0).toDouble(),
      riskRating: json['riskRating'] ?? 'medium',
      riskFactors: Map<String, double>.from(json['riskFactors'] ?? {}),
    );
  }
}

class PriceTargets {
  final double consensusTarget;
  final double highTarget;
  final double lowTarget;
  final double averageTarget;
  final int numberOfAnalysts;
  final double upside; // potential upside %
  final String recommendation; // strong_buy, buy, hold, sell, strong_sell

  PriceTargets({
    required this.consensusTarget,
    required this.highTarget,
    required this.lowTarget,
    required this.averageTarget,
    required this.numberOfAnalysts,
    required this.upside,
    required this.recommendation,
  });

  factory PriceTargets.fromJson(Map<String, dynamic> json) {
    return PriceTargets(
      consensusTarget: (json['consensusTarget'] ?? 0).toDouble(),
      highTarget: (json['highTarget'] ?? 0).toDouble(),
      lowTarget: (json['lowTarget'] ?? 0).toDouble(),
      averageTarget: (json['averageTarget'] ?? 0).toDouble(),
      numberOfAnalysts: json['numberOfAnalysts'] ?? 0,
      upside: (json['upside'] ?? 0).toDouble(),
      recommendation: json['recommendation'] ?? 'hold',
    );
  }
}

// Supporting classes
class SupportResistance {
  final double level;
  final String type; // support, resistance
  final double strength; // 0-100

  SupportResistance({
    required this.level,
    required this.type,
    required this.strength,
  });

  factory SupportResistance.fromJson(Map<String, dynamic> json) {
    return SupportResistance(
      level: (json['level'] ?? 0).toDouble(),
      type: json['type'] ?? 'support',
      strength: (json['strength'] ?? 0).toDouble(),
    );
  }
}

class FinancialHealth {
  final String grade; // A+, A, B+, B, C+, C, D
  final double score; // 0-100
  final Map<String, String> factors;

  FinancialHealth({
    required this.grade,
    required this.score,
    required this.factors,
  });

  factory FinancialHealth.fromJson(Map<String, dynamic> json) {
    return FinancialHealth(
      grade: json['grade'] ?? 'C',
      score: (json['score'] ?? 50).toDouble(),
      factors: Map<String, String>.from(json['factors'] ?? {}),
    );
  }
}

class GrowthMetrics {
  final double revenueGrowth1Y;
  final double revenueGrowth3Y;
  final double epsGrowth1Y;
  final double epsGrowth3Y;
  final String growthStage; // early, growth, mature, declining

  GrowthMetrics({
    required this.revenueGrowth1Y,
    required this.revenueGrowth3Y,
    required this.epsGrowth1Y,
    required this.epsGrowth3Y,
    required this.growthStage,
  });

  factory GrowthMetrics.fromJson(Map<String, dynamic> json) {
    return GrowthMetrics(
      revenueGrowth1Y: (json['revenueGrowth1Y'] ?? 0).toDouble(),
      revenueGrowth3Y: (json['revenueGrowth3Y'] ?? 0).toDouble(),
      epsGrowth1Y: (json['epsGrowth1Y'] ?? 0).toDouble(),
      epsGrowth3Y: (json['epsGrowth3Y'] ?? 0).toDouble(),
      growthStage: json['growthStage'] ?? 'mature',
    );
  }
}

class ValuationMetrics {
  final String valuation; // undervalued, fairly_valued, overvalued
  final double fairValue;
  final double discount; // % discount/premium to fair value
  final Map<String, double> valuationModels; // DCF, comparable, etc.

  ValuationMetrics({
    required this.valuation,
    required this.fairValue,
    required this.discount,
    required this.valuationModels,
  });

  factory ValuationMetrics.fromJson(Map<String, dynamic> json) {
    return ValuationMetrics(
      valuation: json['valuation'] ?? 'fairly_valued',
      fairValue: (json['fairValue'] ?? 0).toDouble(),
      discount: (json['discount'] ?? 0).toDouble(),
      valuationModels: Map<String, double>.from(json['valuationModels'] ?? {}),
    );
  }
}

class AnalystRecommendation {
  final String firm;
  final String analyst;
  final String recommendation;
  final double priceTarget;
  final DateTime date;
  final String summary;

  AnalystRecommendation({
    required this.firm,
    required this.analyst,
    required this.recommendation,
    required this.priceTarget,
    required this.date,
    required this.summary,
  });

  factory AnalystRecommendation.fromJson(Map<String, dynamic> json) {
    return AnalystRecommendation(
      firm: json['firm'] ?? '',
      analyst: json['analyst'] ?? '',
      recommendation: json['recommendation'] ?? 'hold',
      priceTarget: (json['priceTarget'] ?? 0).toDouble(),
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      summary: json['summary'] ?? '',
    );
  }
}

class NewsItem {
  final String title;
  final String summary;
  final String source;
  final DateTime date;
  final double sentimentScore;
  final String url;

  NewsItem({
    required this.title,
    required this.summary,
    required this.source,
    required this.date,
    required this.sentimentScore,
    required this.url,
  });

  factory NewsItem.fromJson(Map<String, dynamic> json) {
    return NewsItem(
      title: json['title'] ?? '',
      summary: json['summary'] ?? '',
      source: json['source'] ?? '',
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      sentimentScore: (json['sentimentScore'] ?? 0).toDouble(),
      url: json['url'] ?? '',
    );
  }
}
