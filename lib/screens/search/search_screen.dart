// lib/screens/search/search_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/stock_provider.dart';
import '../../providers/watchlist_provider.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Stocks'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: SearchBar(
              controller: _searchController,
              hintText: 'Search stocks by symbol or name...',
              leading: const Icon(Icons.search),
              onChanged: (value) {
                if (value.isNotEmpty) {
                  _performSearch(value);
                } else {
                  context.read<StockProvider>().clearSearchResults();
                }
              },
              trailing: [
                if (_searchController.text.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                      context.read<StockProvider>().clearSearchResults();
                    },
                  ),
              ],
            ),
          ),
        ),
      ),
      body: Consumer<StockProvider>(
        builder: (context, stockProvider, _) {
          if (stockProvider.isSearching) {
            return const Center(child: CircularProgressIndicator());
          }

          if (stockProvider.searchResults.isEmpty &&
              _searchController.text.isNotEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.search_off,
                    size: 64,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withOpacity(0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No results found',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Try searching with a different term',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            );
          }

          if (stockProvider.searchResults.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.search,
                    size: 64,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Search for Stocks',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Enter a stock symbol or company name to start searching',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withOpacity(0.7),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: stockProvider.searchResults.length,
            itemBuilder: (context, index) {
              final stock = stockProvider.searchResults[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: stock.isPositive
                        ? Colors.green
                        : Colors.red,
                    child: Text(
                      stock.symbol.substring(0, 2),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(
                    stock.symbol,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(stock.name),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '\$${stock.price.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            '${stock.changePercent.toStringAsFixed(2)}%',
                            style: TextStyle(
                              color: stock.isPositive
                                  ? Colors.green
                                  : Colors.red,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 8),
                      Consumer<WatchlistProvider>(
                        builder: (context, watchlistProvider, _) {
                          return IconButton(
                            icon: Icon(
                              watchlistProvider.watchlistSymbols.contains(
                                    stock.symbol,
                                  )
                                  ? Icons.bookmark
                                  : Icons.bookmark_border,
                              color:
                                  watchlistProvider.watchlistSymbols.contains(
                                    stock.symbol,
                                  )
                                  ? Theme.of(context).colorScheme.primary
                                  : null,
                            ),
                            onPressed: () {
                              watchlistProvider.toggleWatchlist(stock.symbol);
                            },
                          );
                        },
                      ),
                    ],
                  ),
                  onTap: () {
                    // Navigate to stock detail
                    _showStockDetail(context, stock);
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }

  void _performSearch(String query) {
    if (!_isSearching) {
      _isSearching = true;
      context.read<StockProvider>().searchStocks(query).then((_) {
        _isSearching = false;
      });
    }
  }

  void _showStockDetail(BuildContext context, stock) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.3,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                '${stock.symbol} - ${stock.name}',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              Text(
                'Stock details and charts would go here',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 16),
              Text(
                'Connect your stock API to view detailed information',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.7),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
