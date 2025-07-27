// lib/services/watchlist_service.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/stock_data.dart';
import 'stock_service.dart';

class WatchlistService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final StockService _stockService = StockService();

  // Get user's watchlist
  Stream<List<String>> getWatchlistStream() {
    final user = _auth.currentUser;
    if (user == null) return Stream.value([]);

    return _firestore.collection('users').doc(user.uid).snapshots().map((doc) {
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        return List<String>.from(data['watchlist'] ?? []);
      }
      return <String>[];
    });
  }

  // Add stock to watchlist
  Future<bool> addToWatchlist(String symbol) async {
    try {
      final user = _auth.currentUser;
      if (user == null) return false;

      final userDoc = _firestore.collection('users').doc(user.uid);
      await userDoc.update({
        'watchlist': FieldValue.arrayUnion([symbol.toUpperCase()]),
      });
      return true;
    } catch (e) {
      print('Error adding to watchlist: $e');
      return false;
    }
  }

  // Remove stock from watchlist
  Future<bool> removeFromWatchlist(String symbol) async {
    try {
      final user = _auth.currentUser;
      if (user == null) return false;

      final userDoc = _firestore.collection('users').doc(user.uid);
      await userDoc.update({
        'watchlist': FieldValue.arrayRemove([symbol.toUpperCase()]),
      });
      return true;
    } catch (e) {
      print('Error removing from watchlist: $e');
      return false;
    }
  }

  // Get watchlist with stock data
  Future<List<StockData>> getWatchlistWithData() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return [];

      final userDoc = await _firestore.collection('users').doc(user.uid).get();
      if (!userDoc.exists) return [];

      final data = userDoc.data() as Map<String, dynamic>;
      final watchlist = List<String>.from(data['watchlist'] ?? []);

      final List<StockData> stockDataList = [];
      for (final symbol in watchlist) {
        final stockData = await _stockService.getStockQuote(symbol);
        if (stockData != null) {
          stockDataList.add(stockData);
        }
      }

      return stockDataList;
    } catch (e) {
      print('Error getting watchlist with data: $e');
      return [];
    }
  }

  // Check if stock is in watchlist
  Future<bool> isInWatchlist(String symbol) async {
    try {
      final user = _auth.currentUser;
      if (user == null) return false;

      final userDoc = await _firestore.collection('users').doc(user.uid).get();
      if (!userDoc.exists) return false;

      final data = userDoc.data() as Map<String, dynamic>;
      final watchlist = List<String>.from(data['watchlist'] ?? []);
      return watchlist.contains(symbol.toUpperCase());
    } catch (e) {
      print('Error checking watchlist: $e');
      return false;
    }
  }

  // Get watchlist count
  Future<int> getWatchlistCount() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return 0;

      final userDoc = await _firestore.collection('users').doc(user.uid).get();
      if (!userDoc.exists) return 0;

      final data = userDoc.data() as Map<String, dynamic>;
      final watchlist = List<String>.from(data['watchlist'] ?? []);
      return watchlist.length;
    } catch (e) {
      print('Error getting watchlist count: $e');
      return 0;
    }
  }
}
