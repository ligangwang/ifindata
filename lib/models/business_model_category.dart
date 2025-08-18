// lib/models/business_model_category.dart
class BusinessModelCategory {
  final String id;
  final String name;
  final String description;
  final String icon;
  final List<CompanyExample> companies;
  final BusinessModelCharacteristics characteristics;

  BusinessModelCategory({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.companies,
    required this.characteristics,
  });

  factory BusinessModelCategory.fromJson(Map<String, dynamic> json) {
    return BusinessModelCategory(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      icon: json['icon'] ?? 'business',
      companies: (json['companies'] as List<dynamic>?)
          ?.map((company) => CompanyExample.fromJson(company))
          .toList() ?? [],
      characteristics: BusinessModelCharacteristics.fromJson(
        json['characteristics'] ?? {},
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'icon': icon,
      'companies': companies.map((company) => company.toJson()).toList(),
      'characteristics': characteristics.toJson(),
    };
  }
}

class CompanyExample {
  final String symbol;
  final String name;
  final String description;
  final double marketCap; // in billions
  final double revenueGrowth; // annual percentage
  final double grossMargin;
  final String region; // US, EU, ASIA, etc.

  CompanyExample({
    required this.symbol,
    required this.name,
    required this.description,
    required this.marketCap,
    required this.revenueGrowth,
    required this.grossMargin,
    required this.region,
  });

  factory CompanyExample.fromJson(Map<String, dynamic> json) {
    return CompanyExample(
      symbol: json['symbol'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      marketCap: (json['marketCap'] ?? 0).toDouble(),
      revenueGrowth: (json['revenueGrowth'] ?? 0).toDouble(),
      grossMargin: (json['grossMargin'] ?? 0).toDouble(),
      region: json['region'] ?? 'US',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'symbol': symbol,
      'name': name,
      'description': description,
      'marketCap': marketCap,
      'revenueGrowth': revenueGrowth,
      'grossMargin': grossMargin,
      'region': region,
    };
  }
}

class BusinessModelCharacteristics {
  final String revenueModel;
  final List<String> keyMetrics;
  final List<String> advantages;
  final List<String> challenges;
  final double typicalGrossMargin;
  final String scalabilityLevel; // high, medium, low
  final String capitalIntensity; // high, medium, low

  BusinessModelCharacteristics({
    required this.revenueModel,
    required this.keyMetrics,
    required this.advantages,
    required this.challenges,
    required this.typicalGrossMargin,
    required this.scalabilityLevel,
    required this.capitalIntensity,
  });

  factory BusinessModelCharacteristics.fromJson(Map<String, dynamic> json) {
    return BusinessModelCharacteristics(
      revenueModel: json['revenueModel'] ?? '',
      keyMetrics: List<String>.from(json['keyMetrics'] ?? []),
      advantages: List<String>.from(json['advantages'] ?? []),
      challenges: List<String>.from(json['challenges'] ?? []),
      typicalGrossMargin: (json['typicalGrossMargin'] ?? 0).toDouble(),
      scalabilityLevel: json['scalabilityLevel'] ?? 'medium',
      capitalIntensity: json['capitalIntensity'] ?? 'medium',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'revenueModel': revenueModel,
      'keyMetrics': keyMetrics,
      'advantages': advantages,
      'challenges': challenges,
      'typicalGrossMargin': typicalGrossMargin,
      'scalabilityLevel': scalabilityLevel,
      'capitalIntensity': capitalIntensity,
    };
  }
}

// Predefined business model categories
class BusinessModelCategories {
  static List<BusinessModelCategory> getAllCategories() {
    return [
      // Software as a Service (SaaS)
      BusinessModelCategory(
        id: 'saas',
        name: 'Software as a Service (SaaS)',
        description: 'Subscription-based software delivered over the internet',
        icon: 'cloud_done',
        companies: [
          CompanyExample(
            symbol: 'CRM',
            name: 'Salesforce',
            description: 'Customer relationship management platform',
            marketCap: 280.5,
            revenueGrowth: 11.2,
            grossMargin: 76.0,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'ADBE',
            name: 'Adobe',
            description: 'Creative and digital experience software',
            marketCap: 235.8,
            revenueGrowth: 9.8,
            grossMargin: 87.2,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'MSFT',
            name: 'Microsoft',
            description: 'Cloud computing and productivity software',
            marketCap: 3100.0,
            revenueGrowth: 13.1,
            grossMargin: 69.8,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'SNOW',
            name: 'Snowflake',
            description: 'Cloud data warehouse platform',
            marketCap: 45.2,
            revenueGrowth: 36.0,
            grossMargin: 76.8,
            region: 'US',
          ),
        ],
        characteristics: BusinessModelCharacteristics(
          revenueModel: 'Recurring subscription revenue',
          keyMetrics: ['Monthly/Annual Recurring Revenue (MRR/ARR)', 'Customer Acquisition Cost (CAC)', 'Lifetime Value (LTV)', 'Churn Rate', 'Net Revenue Retention'],
          advantages: ['Predictable revenue', 'High gross margins', 'Scalable', 'Strong customer relationships'],
          challenges: ['High customer acquisition costs', 'Churn management', 'Continuous innovation required'],
          typicalGrossMargin: 75.0,
          scalabilityLevel: 'high',
          capitalIntensity: 'low',
        ),
      ),

      // E-commerce & Marketplace
      BusinessModelCategory(
        id: 'marketplace',
        name: 'E-commerce & Marketplace',
        description: 'Platforms connecting buyers and sellers, earning commissions or fees',
        icon: 'shopping_cart',
        companies: [
          CompanyExample(
            symbol: 'AMZN',
            name: 'Amazon',
            description: 'Global e-commerce and cloud services',
            marketCap: 1850.0,
            revenueGrowth: 9.4,
            grossMargin: 47.8,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'SHOP',
            name: 'Shopify',
            description: 'E-commerce platform for businesses',
            marketCap: 95.2,
            revenueGrowth: 21.0,
            grossMargin: 51.8,
            region: 'CA',
          ),
          CompanyExample(
            symbol: 'ETSY',
            name: 'Etsy',
            description: 'Marketplace for handmade and vintage items',
            marketCap: 6.8,
            revenueGrowth: 6.2,
            grossMargin: 71.2,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'EBAY',
            name: 'eBay',
            description: 'Online auction and marketplace platform',
            marketCap: 28.5,
            revenueGrowth: -1.3,
            grossMargin: 82.1,
            region: 'US',
          ),
        ],
        characteristics: BusinessModelCharacteristics(
          revenueModel: 'Commission fees, listing fees, advertising revenue',
          keyMetrics: ['Gross Merchandise Value (GMV)', 'Take Rate', 'Active Users', 'Transaction Volume', 'Seller Growth'],
          advantages: ['Network effects', 'Asset-light model', 'Multiple revenue streams'],
          challenges: ['Two-sided market dynamics', 'Competition', 'Trust and safety'],
          typicalGrossMargin: 60.0,
          scalabilityLevel: 'high',
          capitalIntensity: 'low',
        ),
      ),

      // Digital Advertising
      BusinessModelCategory(
        id: 'advertising',
        name: 'Digital Advertising',
        description: 'Companies that monetize through digital advertising and data',
        icon: 'ads_click',
        companies: [
          CompanyExample(
            symbol: 'GOOGL',
            name: 'Alphabet (Google)',
            description: 'Search, advertising, and cloud services',
            marketCap: 2180.0,
            revenueGrowth: 8.4,
            grossMargin: 57.2,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'META',
            name: 'Meta (Facebook)',
            description: 'Social media and virtual reality platforms',
            marketCap: 1420.0,
            revenueGrowth: 16.0,
            grossMargin: 81.5,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'SNAP',
            name: 'Snap Inc.',
            description: 'Multimedia messaging and AR platform',
            marketCap: 16.8,
            revenueGrowth: 5.0,
            grossMargin: 51.0,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'TTD',
            name: 'The Trade Desk',
            description: 'Programmatic advertising platform',
            marketCap: 35.2,
            revenueGrowth: 23.2,
            grossMargin: 82.8,
            region: 'US',
          ),
        ],
        characteristics: BusinessModelCharacteristics(
          revenueModel: 'Cost-per-click (CPC), cost-per-impression (CPM), performance-based advertising',
          keyMetrics: ['Daily/Monthly Active Users (DAU/MAU)', 'Average Revenue Per User (ARPU)', 'Ad Load', 'Engagement Rate'],
          advantages: ['High margins', 'Scalable', 'Strong network effects'],
          challenges: ['Privacy regulations', 'Ad blocking', 'Platform dependency'],
          typicalGrossMargin: 68.0,
          scalabilityLevel: 'high',
          capitalIntensity: 'low',
        ),
      ),

      // Subscription Services
      BusinessModelCategory(
        id: 'subscription',
        name: 'Subscription Services',
        description: 'Recurring revenue from content, services, or products',
        icon: 'subscriptions',
        companies: [
          CompanyExample(
            symbol: 'NFLX',
            name: 'Netflix',
            description: 'Streaming entertainment service',
            marketCap: 195.0,
            revenueGrowth: 6.7,
            grossMargin: 43.5,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'SPOT',
            name: 'Spotify',
            description: 'Music streaming platform',
            marketCap: 48.2,
            revenueGrowth: 11.3,
            grossMargin: 27.6,
            region: 'EU',
          ),
          CompanyExample(
            symbol: 'DIS',
            name: 'Disney',
            description: 'Entertainment and streaming services',
            marketCap: 175.8,
            revenueGrowth: 7.8,
            grossMargin: 35.2,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'PTON',
            name: 'Peloton',
            description: 'Connected fitness subscriptions',
            marketCap: 2.1,
            revenueGrowth: -23.5,
            grossMargin: 44.2,
            region: 'US',
          ),
        ],
        characteristics: BusinessModelCharacteristics(
          revenueModel: 'Monthly/annual subscription fees',
          keyMetrics: ['Subscriber Count', 'Monthly Recurring Revenue (MRR)', 'Churn Rate', 'Customer Lifetime Value (CLV)'],
          advantages: ['Predictable revenue', 'Customer loyalty', 'Scalable content'],
          challenges: ['Content costs', 'Market saturation', 'Subscription fatigue'],
          typicalGrossMargin: 38.0,
          scalabilityLevel: 'medium',
          capitalIntensity: 'medium',
        ),
      ),

      // Hardware & Manufacturing
      BusinessModelCategory(
        id: 'hardware',
        name: 'Hardware & Manufacturing',
        description: 'Companies that design and manufacture physical products',
        icon: 'precision_manufacturing',
        companies: [
          CompanyExample(
            symbol: 'AAPL',
            name: 'Apple',
            description: 'Consumer electronics and services',
            marketCap: 3450.0,
            revenueGrowth: 2.8,
            grossMargin: 46.2,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'TSLA',
            name: 'Tesla',
            description: 'Electric vehicles and energy storage',
            marketCap: 850.0,
            revenueGrowth: 18.8,
            grossMargin: 21.1,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'NVDA',
            name: 'NVIDIA',
            description: 'Graphics processing units and AI chips',
            marketCap: 2900.0,
            revenueGrowth: 126.0,
            grossMargin: 73.2,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'AMD',
            name: 'AMD',
            description: 'Computer processors and graphics cards',
            marketCap: 235.0,
            revenueGrowth: 4.2,
            grossMargin: 45.8,
            region: 'US',
          ),
        ],
        characteristics: BusinessModelCharacteristics(
          revenueModel: 'Product sales, licensing, services',
          keyMetrics: ['Unit Sales', 'Average Selling Price (ASP)', 'Gross Margin', 'Inventory Turnover'],
          advantages: ['Tangible products', 'Brand loyalty', 'Ecosystem effects'],
          challenges: ['Supply chain complexity', 'Capital intensive', 'Cyclical demand'],
          typicalGrossMargin: 46.0,
          scalabilityLevel: 'medium',
          capitalIntensity: 'high',
        ),
      ),

      // Financial Services
      BusinessModelCategory(
        id: 'fintech',
        name: 'Financial Technology',
        description: 'Digital financial services and payment platforms',
        icon: 'account_balance',
        companies: [
          CompanyExample(
            symbol: 'V',
            name: 'Visa',
            description: 'Global payment processing network',
            marketCap: 545.0,
            revenueGrowth: 9.6,
            grossMargin: 96.8,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'MA',
            name: 'Mastercard',
            description: 'Payment processing and financial services',
            marketCap: 425.0,
            revenueGrowth: 11.2,
            grossMargin: 96.4,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'PYPL',
            name: 'PayPal',
            description: 'Digital payments platform',
            marketCap: 68.5,
            revenueGrowth: 8.1,
            grossMargin: 47.8,
            region: 'US',
          ),
          CompanyExample(
            symbol: 'SQ',
            name: 'Block (Square)',
            description: 'Payment processing and financial services',
            marketCap: 45.8,
            revenueGrowth: 12.4,
            grossMargin: 32.1,
            region: 'US',
          ),
        ],
        characteristics: BusinessModelCharacteristics(
          revenueModel: 'Transaction fees, interchange fees, subscription fees',
          keyMetrics: ['Transaction Volume', 'Take Rate', 'Active Accounts', 'Revenue per User'],
          advantages: ['High margins', 'Network effects', 'Recurring revenue'],
          challenges: ['Regulation', 'Security risks', 'Competition'],
          typicalGrossMargin: 68.0,
          scalabilityLevel: 'high',
          capitalIntensity: 'low',
        ),
      ),
    ];
  }

  static BusinessModelCategory? getCategoryById(String id) {
    try {
      return getAllCategories().firstWhere((category) => category.id == id);
    } catch (e) {
      return null;
    }
  }
}
