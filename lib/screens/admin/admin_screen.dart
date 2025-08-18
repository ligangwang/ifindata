// lib/screens/admin/admin_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/admin_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/business_model_category.dart';
import 'business_model_form_screen.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = context.read<AuthProvider>();
      final adminProvider = context.read<AdminProvider>();
      
      if (authProvider.user != null) {
        adminProvider.checkAdminStatus(authProvider.user!.uid);
        adminProvider.loadBusinessModels();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Panel'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<AdminProvider>().loadBusinessModels();
            },
          ),
        ],
      ),
      body: Consumer2<AdminProvider, AuthProvider>(
        builder: (context, adminProvider, authProvider, child) {
          if (!adminProvider.isAdmin) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'Access Denied',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text('You need admin privileges to access this page.'),
                ],
              ),
            );
          }

          if (adminProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (adminProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                  const SizedBox(height: 16),
                  Text('Error: ${adminProvider.error}'),
                  ElevatedButton(
                    onPressed: () => adminProvider.loadBusinessModels(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              // Admin stats
              _buildAdminStats(adminProvider),
              
              // Business models list
              Expanded(
                child: _buildBusinessModelsList(adminProvider),
              ),
            ],
          );
        },
      ),
      floatingActionButton: Consumer<AdminProvider>(
        builder: (context, adminProvider, child) {
          if (!adminProvider.isAdmin) return const SizedBox.shrink();
          
          return FloatingActionButton(
            onPressed: () => _navigateToBusinessModelForm(),
            child: const Icon(Icons.add),
          );
        },
      ),
    );
  }

  Widget _buildAdminStats(AdminProvider adminProvider) {
    final totalModels = adminProvider.businessModels.length;
    final totalCompanies = adminProvider.businessModels
        .fold<int>(0, (sum, model) => sum + model.companies.length);

    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                children: [
                  const Icon(Icons.category, color: Colors.blue),
                  const SizedBox(height: 8),
                  Text(
                    '$totalModels',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                  const Text('Business Models'),
                ],
              ),
            ),
            Expanded(
              child: Column(
                children: [
                  const Icon(Icons.business, color: Colors.green),
                  const SizedBox(height: 8),
                  Text(
                    '$totalCompanies',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                  const Text('Companies'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBusinessModelsList(AdminProvider adminProvider) {
    if (adminProvider.businessModels.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.category_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No business models found'),
            Text('Tap the + button to create one'),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: adminProvider.businessModels.length,
      itemBuilder: (context, index) {
        final businessModel = adminProvider.businessModels[index];
        return _buildBusinessModelCard(businessModel, adminProvider);
      },
    );
  }

  Widget _buildBusinessModelCard(BusinessModelCategory businessModel, AdminProvider adminProvider) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        leading: _getIcon(businessModel.icon),
        title: Text(
          businessModel.name,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(businessModel.description),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${businessModel.companies.length} companies',
                style: const TextStyle(
                  color: Colors.blue,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            PopupMenuButton<String>(
              onSelected: (action) => _handleBusinessModelAction(action, businessModel, adminProvider),
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(Icons.edit, size: 16),
                      SizedBox(width: 8),
                      Text('Edit'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, size: 16, color: Colors.red),
                      SizedBox(width: 8),
                      Text('Delete', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Revenue model
                Text(
                  'Revenue Model: ${businessModel.characteristics.revenueModel}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                
                // Companies
                const Text(
                  'Companies:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                if (businessModel.companies.isEmpty)
                  const Text('No companies added yet')
                else
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: businessModel.companies.map((company) =>
                      Chip(
                        label: Text(company.symbol),
                        deleteIcon: const Icon(Icons.close, size: 16),
                        onDeleted: () => _removeCompany(businessModel.id, company.symbol, adminProvider),
                      ),
                    ).toList(),
                  ),
                const SizedBox(height: 16),
                
                // Actions
                Row(
                  children: [
                    ElevatedButton.icon(
                      onPressed: () => _addCompany(businessModel, adminProvider),
                      icon: const Icon(Icons.add),
                      label: const Text('Add Company'),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton.icon(
                      onPressed: () => _editCharacteristics(businessModel, adminProvider),
                      icon: const Icon(Icons.settings),
                      label: const Text('Edit Details'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
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
    
    return Icon(iconData, color: Colors.blue);
  }

  void _handleBusinessModelAction(String action, BusinessModelCategory businessModel, AdminProvider adminProvider) {
    switch (action) {
      case 'edit':
        _navigateToBusinessModelForm(businessModel: businessModel);
        break;
      case 'delete':
        _deleteBusinessModel(businessModel, adminProvider);
        break;
    }
  }

  void _navigateToBusinessModelForm({BusinessModelCategory? businessModel}) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => BusinessModelFormScreen(businessModel: businessModel),
      ),
    );
  }

  void _deleteBusinessModel(BusinessModelCategory businessModel, AdminProvider adminProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Business Model'),
        content: Text('Are you sure you want to delete "${businessModel.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await adminProvider.deleteBusinessModel(businessModel.id);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Business model deleted successfully')),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e')),
                  );
                }
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _addCompany(BusinessModelCategory businessModel, AdminProvider adminProvider) {
    _showCompanyDialog(businessModel, adminProvider);
  }

  void _removeCompany(String businessModelId, String companySymbol, AdminProvider adminProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Company'),
        content: Text('Remove $companySymbol from this business model?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await adminProvider.removeCompanyFromBusinessModel(businessModelId, companySymbol);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Company removed successfully')),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e')),
                  );
                }
              }
            },
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _editCharacteristics(BusinessModelCategory businessModel, AdminProvider adminProvider) {
    // Navigate to characteristics editor
    // This could be implemented as a separate screen
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Characteristics editor coming soon')),
    );
  }

  void _showCompanyDialog(BusinessModelCategory businessModel, AdminProvider adminProvider) {
    final symbolController = TextEditingController();
    final nameController = TextEditingController();
    final descriptionController = TextEditingController();
    final marketCapController = TextEditingController();
    final revenueGrowthController = TextEditingController();
    final grossMarginController = TextEditingController();
    String selectedRegion = 'US';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Company'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: symbolController,
                decoration: const InputDecoration(labelText: 'Symbol (e.g., AAPL)'),
              ),
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Company Name'),
              ),
              TextField(
                controller: descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
                maxLines: 2,
              ),
              TextField(
                controller: marketCapController,
                decoration: const InputDecoration(labelText: 'Market Cap (Billions)'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: revenueGrowthController,
                decoration: const InputDecoration(labelText: 'Revenue Growth (%)'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: grossMarginController,
                decoration: const InputDecoration(labelText: 'Gross Margin (%)'),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedRegion,
                decoration: const InputDecoration(labelText: 'Region'),
                items: ['US', 'EU', 'ASIA', 'CA'].map((region) =>
                  DropdownMenuItem(value: region, child: Text(region)),
                ).toList(),
                onChanged: (value) => selectedRegion = value ?? 'US',
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              try {
                final company = CompanyExample(
                  symbol: symbolController.text.trim(),
                  name: nameController.text.trim(),
                  description: descriptionController.text.trim(),
                  marketCap: double.tryParse(marketCapController.text) ?? 0,
                  revenueGrowth: double.tryParse(revenueGrowthController.text) ?? 0,
                  grossMargin: double.tryParse(grossMarginController.text) ?? 0,
                  region: selectedRegion,
                );

                await adminProvider.addCompanyToBusinessModel(businessModel.id, company);
                
                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Company added successfully')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e')),
                  );
                }
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}
