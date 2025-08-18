// lib/screens/business_model_category_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/business_model_category.dart';
import '../providers/company_analysis_provider.dart';
import 'company_analysis_screen.dart';

class BusinessModelCategoryScreen extends StatelessWidget {
  final BusinessModelCategory category;
  
  const BusinessModelCategoryScreen({
    super.key,
    required this.category,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(category.name),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Category Overview
            _buildOverviewCard(),
            const SizedBox(height: 16),
            
            // Characteristics
            _buildCharacteristicsCard(),
            const SizedBox(height: 16),
            
            // Companies in this category
            _buildCompaniesSection(context),
          ],
        ),
      ),
    );
  }
  
  Widget _buildOverviewCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _getIcon(category.icon),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        category.name,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        category.description,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Revenue Model: ${category.characteristics.revenueModel}',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildCharacteristicsCard() {
    final char = category.characteristics;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Business Model Characteristics',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            // Key metrics
            _buildCharacteristicSection(
              'Key Metrics',
              char.keyMetrics,
              Icons.analytics,
              Colors.blue,
            ),
            const SizedBox(height: 12),
            
            // Advantages
            _buildCharacteristicSection(
              'Advantages',
              char.advantages,
              Icons.thumb_up,
              Colors.green,
            ),
            const SizedBox(height: 12),
            
            // Challenges
            _buildCharacteristicSection(
              'Challenges',
              char.challenges,
              Icons.warning,
              Colors.orange,
            ),
            const SizedBox(height: 16),
            
            // Key statistics
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    'Typical Gross Margin',
                    '${char.typicalGrossMargin.toStringAsFixed(1)}%',
                    Icons.trending_up,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    'Scalability',
                    char.scalabilityLevel.toUpperCase(),
                    Icons.rocket_launch,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    'Capital Intensity',
                    char.capitalIntensity.toUpperCase(),
                    Icons.account_balance,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildCharacteristicSection(
    String title,
    List<String> items,
    IconData icon,
    Color color,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...items.map((item) => 
          Padding(
            padding: const EdgeInsets.only(left: 28, bottom: 4),
            child: Text('• $item'),
          )
        ),
      ],
    );
  }
  
  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.blue, size: 24),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.blue,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
  
  Widget _buildCompaniesSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Companies (${category.companies.length})',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              'Tap to analyze',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        
        ...category.companies.map((company) => 
          _buildCompanyCard(context, company)
        ),
      ],
    );
  }
  
  Widget _buildCompanyCard(BuildContext context, CompanyExample company) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => _navigateToCompanyAnalysis(context, company),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              company.symbol,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: _getRegionColor(company.region),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                company.region,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          company.name,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          company.description,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right),
                ],
              ),
              const SizedBox(height: 12),
              
              // Company metrics
              Row(
                children: [
                  Expanded(
                    child: _buildCompanyMetric(
                      'Market Cap',
                      '\$${company.marketCap.toStringAsFixed(1)}B',
                    ),
                  ),
                  Expanded(
                    child: _buildCompanyMetric(
                      'Revenue Growth',
                      '${company.revenueGrowth > 0 ? '+' : ''}${company.revenueGrowth.toStringAsFixed(1)}%',
                    ),
                  ),
                  Expanded(
                    child: _buildCompanyMetric(
                      'Gross Margin',
                      '${company.grossMargin.toStringAsFixed(1)}%',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildCompanyMetric(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            color: Colors.grey,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
  
  Color _getRegionColor(String region) {
    switch (region) {
      case 'US':
        return Colors.blue;
      case 'EU':
        return Colors.green;
      case 'ASIA':
        return Colors.orange;
      case 'CA':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }
  
  Widget _getIcon(String iconName) {
    IconData iconData;
    switch (iconName) {
      case 'cloud_done':
        iconData = Icons.cloud_done;
        break;
      case 'shopping_cart':
        iconData = Icons.shopping_cart;
        break;
      case 'ads_click':
        iconData = Icons.ads_click;
        break;
      case 'subscriptions':
        iconData = Icons.subscriptions;
        break;
      case 'precision_manufacturing':
        iconData = Icons.precision_manufacturing;
        break;
      case 'account_balance':
        iconData = Icons.account_balance;
        break;
      default:
        iconData = Icons.business;
    }
    
    return Icon(
      iconData,
      size: 32,
      color: Colors.blue,
    );
  }
  
  void _navigateToCompanyAnalysis(BuildContext context, CompanyExample company) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ChangeNotifierProvider(
          create: (_) => CompanyAnalysisProvider(),
          child: CompanyAnalysisScreen(symbol: company.symbol),
        ),
      ),
    );
  }
}
