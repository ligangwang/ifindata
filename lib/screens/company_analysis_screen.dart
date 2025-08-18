// lib/screens/company_analysis_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/company_analysis.dart';
import '../providers/company_analysis_provider.dart';

class CompanyAnalysisScreen extends StatefulWidget {
  final String symbol;

  const CompanyAnalysisScreen({Key? key, required this.symbol})
    : super(key: key);

  @override
  State<CompanyAnalysisScreen> createState() => _CompanyAnalysisScreenState();
}

class _CompanyAnalysisScreenState extends State<CompanyAnalysisScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);

    // Load analysis when screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CompanyAnalysisProvider>().loadCompanyAnalysis(
        widget.symbol,
      );
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.symbol} Business Model'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Revenue Streams'),
            Tab(text: 'Customers & Value'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<CompanyAnalysisProvider>().refreshAnalysis(
                widget.symbol,
              );
            },
          ),
        ],
      ),
      body: Consumer<CompanyAnalysisProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading analysis',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    provider.error!,
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      provider.loadCompanyAnalysis(widget.symbol);
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final analysis = provider.getAnalysis(widget.symbol);

          if (analysis == null) {
            return const Center(child: Text('No analysis available'));
          }

          return TabBarView(
            controller: _tabController,
            children: [
              _buildBusinessModelOverviewTab(analysis),
              _buildRevenueStreamsTab(analysis),
              _buildCustomersAndValueTab(analysis),
            ],
          );
        },
      ),
    );
  }

  Widget _buildBusinessModelOverviewTab(CompanyAnalysis analysis) {
    final business = analysis.businessModel;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionCard('Business Overview', [
            _buildInfoRow('Company', analysis.companyName),
            _buildInfoRow(
              'Model Type',
              business.modelType.replaceAll('_', ' ').toUpperCase(),
            ),
            _buildInfoRow(
              'Moat Strength',
              '${business.moatStrength.toStringAsFixed(1)}/100',
            ),
            _buildInfoRow('Last Updated', _formatDate(analysis.analysisDate)),
          ]),
          const SizedBox(height: 16),

          _buildSectionCard('Value Proposition', [
            _buildInfoRow('Core Value', business.valueProposition.coreValue),
            _buildInfoRow(
              'Differentiator',
              business.valueProposition.differentiator,
            ),
            _buildInfoRow(
              'Customer Satisfaction',
              '${business.valueProposition.customerSatisfaction.toStringAsFixed(1)}%',
            ),
            _buildInfoRow(
              'Market Fit Score',
              '${business.valueProposition.marketFit.toStringAsFixed(1)}/100',
            ),
          ]),
          const SizedBox(height: 16),

          _buildSectionCard(
            'Key Benefits',
            business.valueProposition.keyBenefits
                .map(
                  (benefit) => ListTile(
                    leading: const Icon(
                      Icons.check_circle,
                      color: Colors.green,
                    ),
                    title: Text(benefit),
                    dense: true,
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 16),

          _buildSectionCard('Operational Efficiency', [
            _buildProgressRow(
              'Automation Level',
              business.operations.automationLevel,
            ),
            _buildProgressRow(
              'Digital Transformation',
              business.operations.digitalTransformation,
            ),
            _buildProgressRow(
              'Overall Efficiency',
              business.operations.efficiencyScore,
            ),
            _buildInfoRow(
              'Operational Model',
              business.operations.operationalModel
                  .replaceAll('_', ' ')
                  .toUpperCase(),
            ),
          ]),
          const SizedBox(height: 16),

          _buildSectionCard('Scalability Assessment', [
            _buildProgressRow(
              'Scalability Score',
              business.scalability.scalabilityScore,
            ),
            _buildInfoRow(
              'Stage',
              business.scalability.scalabilityStage
                  .replaceAll('_', ' ')
                  .toUpperCase(),
            ),
            const SizedBox(height: 8),
            const Text(
              'Scalability Factors:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            ...business.scalability.scalabilityFactors.map(
              (factor) => Padding(
                padding: const EdgeInsets.only(left: 16, top: 4),
                child: Row(
                  children: [
                    const Icon(Icons.arrow_right, color: Colors.blue),
                    Expanded(child: Text(factor)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Growth Constraints:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            ...business.scalability.growthConstraints.map(
              (constraint) => Padding(
                padding: const EdgeInsets.only(left: 16, top: 4),
                child: Row(
                  children: [
                    const Icon(Icons.warning, color: Colors.orange),
                    Expanded(child: Text(constraint)),
                  ],
                ),
              ),
            ),
          ]),
        ],
      ),
    );
  }

  Widget _buildRevenueStreamsTab(CompanyAnalysis analysis) {
    final revenueStreams = analysis.businessModel.revenueStreams;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionCard('Revenue Distribution', [
            SizedBox(height: 200, child: _buildRevenueChart(revenueStreams)),
          ]),
          const SizedBox(height: 16),

          ...revenueStreams.map(
            (stream) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _buildSectionCard(stream.name, [
                _buildInfoRow(
                  'Type',
                  stream.type.replaceAll('_', ' ').toUpperCase(),
                ),
                _buildInfoRow(
                  'Revenue Share',
                  '${stream.percentage.toStringAsFixed(1)}%',
                ),
                _buildInfoRow(
                  'Growth Rate',
                  '${stream.growthRate > 0 ? '+' : ''}${stream.growthRate.toStringAsFixed(1)}%',
                ),
                _buildProgressRow('Predictability', stream.predictability),
                const SizedBox(height: 8),
                Text(
                  stream.description,
                  style: const TextStyle(fontStyle: FontStyle.italic),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomersAndValueTab(CompanyAnalysis analysis) {
    final business = analysis.businessModel;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionCard('Customer Segments', [
            _buildInfoRow(
              'Primary Segment',
              business.customerSegments.primarySegment,
            ),
            _buildInfoRow(
              'Customer Lifetime Value',
              '\$${business.customerSegments.customerLifetimeValue.toStringAsFixed(0)}',
            ),
            _buildInfoRow(
              'Acquisition Cost',
              '\$${business.customerSegments.acquisitionCost.toStringAsFixed(0)}',
            ),
            _buildProgressRow(
              'Retention Rate',
              business.customerSegments.retentionRate,
            ),
            _buildProgressRow(
              'Churn Rate',
              100 - business.customerSegments.churnRate,
              isReverse: true,
            ),
          ]),
          const SizedBox(height: 16),

          ...business.customerSegments.segments.map(
            (segment) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _buildSectionCard('${segment.name} Segment', [
                _buildInfoRow(
                  'Market Share',
                  '${segment.percentage.toStringAsFixed(1)}%',
                ),
                _buildProgressRow('Profitability', segment.profitability),
                const SizedBox(height: 8),
                Text(
                  segment.characteristics,
                  style: const TextStyle(fontStyle: FontStyle.italic),
                ),
              ]),
            ),
          ),

          _buildSectionCard('Value Proposition Details', [
            _buildInfoRow('Core Value', business.valueProposition.coreValue),
            _buildInfoRow(
              'Key Differentiator',
              business.valueProposition.differentiator,
            ),
            _buildInfoRow(
              'Pain Point Solved',
              business.valueProposition.painPointSolved,
            ),
            _buildProgressRow(
              'Customer Satisfaction',
              business.valueProposition.customerSatisfaction,
            ),
            _buildProgressRow(
              'Product-Market Fit',
              business.valueProposition.marketFit,
            ),
            const SizedBox(height: 12),
            const Text(
              'Key Benefits:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            ...business.valueProposition.keyBenefits.map(
              (benefit) => Padding(
                padding: const EdgeInsets.only(left: 16, top: 4),
                child: Row(
                  children: [
                    const Icon(Icons.star, color: Colors.amber),
                    const SizedBox(width: 8),
                    Expanded(child: Text(benefit)),
                  ],
                ),
              ),
            ),
          ]),
          const SizedBox(height: 16),

          _buildSectionCard('Monetization Strategy', [
            _buildInfoRow(
              'Strategy',
              business.monetization.strategy.replaceAll('_', ' ').toUpperCase(),
            ),
            _buildProgressRow(
              'Pricing Power',
              business.monetization.pricingPower,
            ),
            _buildProgressRow(
              'Customer Stickiness',
              business.monetization.customerStickiness,
            ),
            const SizedBox(height: 12),
            const Text(
              'Upsell Opportunities:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            ...business.monetization.upsellOpportunities.map(
              (opportunity) => Padding(
                padding: const EdgeInsets.only(left: 16, top: 4),
                child: Row(
                  children: [
                    const Icon(Icons.trending_up, color: Colors.green),
                    const SizedBox(width: 8),
                    Expanded(child: Text(opportunity)),
                  ],
                ),
              ),
            ),
          ]),
        ],
      ),
    );
  }

  Widget _buildSectionCard(String title, List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  Widget _buildProgressRow(
    String label,
    double value, {
    bool isReverse = false,
  }) {
    final displayValue = isReverse ? 100 - value : value;
    final color = _getProgressColor(displayValue);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
              Text('${displayValue.toStringAsFixed(1)}%'),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: displayValue / 100,
            backgroundColor: Colors.grey[300],
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ],
      ),
    );
  }

  Color _getProgressColor(double value) {
    if (value >= 80) return Colors.green;
    if (value >= 60) return Colors.orange;
    return Colors.red;
  }

  Widget _buildRevenueChart(List<RevenueStream> streams) {
    // Simple text-based chart for now
    // In a real app, you'd use fl_chart or similar
    return Column(
      children: streams
          .map(
            (stream) => Expanded(
              flex: (stream.percentage * 10).round(),
              child: Container(
                width: double.infinity,
                margin: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: _getRevenueColor(streams.indexOf(stream)),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Center(
                  child: Text(
                    '${stream.name}\n${stream.percentage.toStringAsFixed(1)}%',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          )
          .toList(),
    );
  }

  Color _getRevenueColor(int index) {
    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.teal,
      Colors.indigo,
    ];
    return colors[index % colors.length];
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
