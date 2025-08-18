import 'package:flutter/material.dart';

void main() {
  runApp(const MinimalApp());
}

class MinimalApp extends StatelessWidget {
  const MinimalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'IFinData (Minimal)',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const MinimalHome(),
    );
  }
}

class MinimalHome extends StatefulWidget {
  const MinimalHome({super.key});

  @override
  State<MinimalHome> createState() => _MinimalHomeState();
}

class _MinimalHomeState extends State<MinimalHome> {
  final List<Map<String, String>> _stocks = [
    {'symbol': 'AAPL', 'name': 'Apple Inc.', 'price': '189.23'},
    {'symbol': 'GOOGL', 'name': 'Alphabet Inc.', 'price': '132.47'},
    {'symbol': 'MSFT', 'name': 'Microsoft Corp.', 'price': '358.12'},
  ];

  final Set<String> _watchlist = {};

  void _toggleWatch(String symbol) {
    setState(() {
      if (_watchlist.contains(symbol)) {
        _watchlist.remove(symbol);
      } else {
        _watchlist.add(symbol);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('IFinData — Minimal'),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0),
            child: Center(child: Text('Watchlist: ${_watchlist.length}')),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Market Snapshot',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView.separated(
                itemCount: _stocks.length,
                separatorBuilder: (_, __) => const Divider(),
                itemBuilder: (context, index) {
                  final s = _stocks[index];
                  final symbol = s['symbol']!;
                  final inWatch = _watchlist.contains(symbol);
                  return ListTile(
                    title: Text('${s['symbol']} — ${s['name']}'),
                    subtitle: Text('\$${s['price']}'),
                    trailing: IconButton(
                      icon: Icon(
                        inWatch ? Icons.star : Icons.star_border,
                        color: inWatch ? Colors.amber : null,
                      ),
                      onPressed: () => _toggleWatch(symbol),
                      tooltip: inWatch
                          ? 'Remove from watchlist'
                          : 'Add to watchlist',
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Quick Notes',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const Text(
              'This minimal build uses static mock data and stores the watchlist in memory. Use this for fast local testing.',
            ),
          ],
        ),
      ),
    );
  }
}
