// lib/screens/watchlist/watchlist_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/watchlist_provider.dart';
import '../../providers/auth_provider.dart';

class WatchlistScreen extends StatelessWidget {
  const WatchlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Watchlist'),
        actions: [
          Consumer<WatchlistProvider>(
            builder: (context, watchlistProvider, _) {
              return IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () {
                  watchlistProvider.refreshWatchlistData();
                },
              );
            },
          ),
        ],
      ),
      body: Consumer2<WatchlistProvider, AuthProvider>(
        builder: (context, watchlistProvider, authProvider, _) {
          if (watchlistProvider.isLoading &&
              watchlistProvider.watchlistData.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (watchlistProvider.watchlistData.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.bookmark_outline,
                    size: 64,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Your watchlist is empty',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Add stocks to your watchlist to track them here',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withOpacity(0.7),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () {
                      // Navigate to search - you would implement navigation here
                      // For now, just show a message
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Navigate to search screen'),
                        ),
                      );
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Add Stocks'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => watchlistProvider.refreshWatchlistData(),
            child: Column(
              children: [
                // Watchlist info
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FutureBuilder<String>(
                          future: authProvider.getUserSubscription(),
                          builder: (context, snapshot) {
                            final subscription = snapshot.data ?? 'free';
                            final limit = watchlistProvider.getWatchlistLimit(
                              subscription,
                            );
                            final count = watchlistProvider.watchlistCount;

                            return Text(
                              limit == -1
                                  ? 'Unlimited watchlist ($count stocks)'
                                  : 'Watchlist: $count / $limit stocks',
                              style: TextStyle(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onPrimaryContainer,
                                fontWeight: FontWeight.w600,
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                // Watchlist items
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: watchlistProvider.watchlistData.length,
                    itemBuilder: (context, index) {
                      final stock = watchlistProvider.watchlistData[index];
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
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        stock.isPositive
                                            ? Icons.trending_up
                                            : Icons.trending_down,
                                        color: stock.isPositive
                                            ? Colors.green
                                            : Colors.red,
                                        size: 16,
                                      ),
                                      const SizedBox(width: 2),
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
                                ],
                              ),
                              const SizedBox(width: 8),
                              PopupMenuButton(
                                icon: const Icon(Icons.more_vert),
                                itemBuilder: (context) => [
                                  PopupMenuItem(
                                    value: 'view',
                                    child: const Row(
                                      children: [
                                        Icon(Icons.visibility),
                                        SizedBox(width: 8),
                                        Text('View Details'),
                                      ],
                                    ),
                                  ),
                                  PopupMenuItem(
                                    value: 'remove',
                                    child: const Row(
                                      children: [
                                        Icon(
                                          Icons.remove_circle,
                                          color: Colors.red,
                                        ),
                                        SizedBox(width: 8),
                                        Text(
                                          'Remove',
                                          style: TextStyle(color: Colors.red),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                                onSelected: (value) {
                                  if (value == 'remove') {
                                    _removeFromWatchlist(
                                      context,
                                      watchlistProvider,
                                      stock.symbol,
                                    );
                                  } else if (value == 'view') {
                                    _showStockDetail(context, stock);
                                  }
                                },
                              ),
                            ],
                          ),
                          onTap: () => _showStockDetail(context, stock),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _removeFromWatchlist(
    BuildContext context,
    WatchlistProvider watchlistProvider,
    String symbol,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove from Watchlist'),
        content: Text(
          'Are you sure you want to remove $symbol from your watchlist?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              watchlistProvider.removeFromWatchlist(symbol);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('$symbol removed from watchlist'),
                  action: SnackBarAction(
                    label: 'Undo',
                    onPressed: () {
                      watchlistProvider.addToWatchlist(symbol);
                    },
                  ),
                ),
              );
            },
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
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
              const SizedBox(height: 16),
              Text(
                '\$${stock.price.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    stock.isPositive ? Icons.trending_up : Icons.trending_down,
                    color: stock.isPositive ? Colors.green : Colors.red,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${stock.change.toStringAsFixed(2)} (${stock.changePercent.toStringAsFixed(2)}%)',
                    style: TextStyle(
                      color: stock.isPositive ? Colors.green : Colors.red,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                'Detailed charts and analysis would appear here',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
