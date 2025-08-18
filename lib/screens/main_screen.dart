// lib/screens/main_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/business_model_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/admin_provider.dart';
import '../models/business_model_category.dart';
import '../utils/admin_setup.dart';
import 'subscription/subscription_screen.dart';
import 'profile/profile_screen.dart';
import 'business_model_category_screen.dart';
import 'admin/admin_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      const _HomeScreen(),
      const SubscriptionScreen(),
      const ProfileScreen(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.category_outlined),
            selectedIcon: Icon(Icons.category),
            label: 'Business Models',
          ),
          NavigationDestination(
            icon: Icon(Icons.star_outline),
            selectedIcon: Icon(Icons.star),
            label: 'Premium',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _HomeScreen extends StatefulWidget {
  const _HomeScreen();

  @override
  State<_HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<_HomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Business Model Explorer'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          Consumer2<AuthProvider, AdminProvider>(
            builder: (context, authProvider, adminProvider, child) {
              if (authProvider.user != null) {
                // Check admin status when user is available
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  adminProvider.checkAdminStatus(authProvider.user!.uid);
                });
                
                // Show admin button if user is admin
                if (adminProvider.isAdmin) {
                  return IconButton(
                    icon: const Icon(Icons.admin_panel_settings),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const AdminScreen()),
                    ),
                    tooltip: 'Admin Panel',
                  );
                } else {
                  // Show setup admin button if not admin yet
                  return PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert),
                    onSelected: (value) async {
                      if (value == 'make_admin') {
                        await AdminSetup.makeCurrentUserAdmin();
                        adminProvider.checkAdminStatus(authProvider.user!.uid);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Admin access granted!')),
                          );
                        }
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'make_admin',
                        child: Row(
                          children: [
                            Icon(Icons.admin_panel_settings, size: 16),
                            SizedBox(width: 8),
                            Text('Become Admin'),
                          ],
                        ),
                      ),
                    ],
                  );
                }
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<BusinessModelProvider>(
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
                  Text('Error: ${provider.error}'),
                  ElevatedButton(
                    onPressed: provider.loadCategories,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Welcome message
                _buildWelcomeCard(),
                const SizedBox(height: 20),

                // Search bar
                _buildSearchBar(provider),
                const SizedBox(height: 20),

                // Show search results or categories
                if (provider.searchQuery.isNotEmpty)
                  _buildSearchResults(provider)
                else ...[
                  // Statistics overview
                  _buildStatsOverview(provider),
                  const SizedBox(height: 20),
                  
                  // Business model categories
                  _buildCategoriesSection(provider),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildWelcomeCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.explore,
                  size: 32,
                  color: Theme.of(context).primaryColor,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Explore Business Models',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Discover how the world\'s leading companies make money. Browse by business model categories and understand revenue strategies.',
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar(BusinessModelProvider provider) {
    return TextField(
      controller: _searchController,
      decoration: InputDecoration(
        hintText: 'Search companies (e.g., Apple, Google, Tesla)',
        prefixIcon: const Icon(Icons.search),
        suffixIcon: provider.searchQuery.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.clear),
                onPressed: () {
                  _searchController.clear();
                  provider.clearSearch();
                },
              )
            : null,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      onChanged: (query) {
        provider.searchCompanies(query);
      },
    );
  }

  Widget _buildSearchResults(BusinessModelProvider provider) {
    if (provider.searchResults.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Center(
            child: Text('No companies found matching your search.'),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Search Results (${provider.searchResults.length})',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        ...provider.searchResults.map((company) => 
          _buildCompanySearchCard(company)
        ),
      ],
    );
  }

  Widget _buildCompanySearchCard(CompanyExample company) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          child: Text(
            company.symbol.substring(0, 1),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
        title: Row(
          children: [
            Text(
              company.symbol,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
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
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(company.name),
            Text(
              company.description,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '\$${company.marketCap.toStringAsFixed(1)}B',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            Text(
              '${company.revenueGrowth > 0 ? '+' : ''}${company.revenueGrowth.toStringAsFixed(1)}%',
              style: TextStyle(
                color: company.revenueGrowth > 0 ? Colors.green : Colors.red,
                fontSize: 12,
              ),
            ),
          ],
        ),
        isThreeLine: true,
      ),
    );
  }

  Widget _buildStatsOverview(BusinessModelProvider provider) {
    final stats = provider.getBusinessModelStats();
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Market Overview',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    'Categories',
                    '${stats['totalCategories']}',
                    Icons.category,
                    Colors.blue,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    'Companies',
                    '${stats['totalCompanies']}',
                    Icons.business,
                    Colors.green,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    'Total Market Cap',
                    '\$${(stats['totalMarketCap'] / 1000).toStringAsFixed(1)}T',
                    Icons.trending_up,
                    Colors.orange,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    'Avg Market Cap',
                    '\$${stats['averageMarketCap'].toStringAsFixed(0)}B',
                    Icons.analytics,
                    Colors.purple,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: Colors.grey,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildCategoriesSection(BusinessModelProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Business Model Categories',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1.2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: provider.categories.length,
          itemBuilder: (context, index) {
            final category = provider.categories[index];
            return _buildCategoryCard(category);
          },
        ),
      ],
    );
  }

  Widget _buildCategoryCard(BusinessModelCategory category) {
    return Card(
      child: InkWell(
        onTap: () => _navigateToCategory(category),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _getIcon(category.icon),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${category.companies.length}',
                      style: const TextStyle(
                        color: Colors.blue,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                category.name,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              Text(
                category.description,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
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
    
    return Icon(
      iconData,
      size: 24,
      color: Colors.blue,
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

  void _navigateToCategory(BusinessModelCategory category) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => BusinessModelCategoryScreen(category: category),
      ),
    );
  }
}
