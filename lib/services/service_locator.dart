// lib/services/service_locator.dart
import '../config/app_config.dart';
import 'interfaces/auth_service_interface.dart';
import 'interfaces/stock_service_interface.dart';
import 'interfaces/watchlist_service_interface.dart';
import 'auth_service.dart';
import 'mock_auth_service.dart';
import 'stock_service.dart';
import 'mock_stock_service.dart';
import 'watchlist_service.dart';
import 'mock_watchlist_service.dart';
import 'stripe_service.dart';

class ServiceLocator {
  static ServiceLocator? _instance;
  static ServiceLocator get instance => _instance ??= ServiceLocator._();

  ServiceLocator._();

  // Auth Service Factory
  static AuthServiceInterface get authService {
    if (AppConfig.useMockServices) {
      return MockAuthServiceImpl();
    } else {
      return AuthServiceImpl();
    }
  }

  // Stock Service Factory
  static StockServiceInterface get stockService {
    if (AppConfig.useMockServices) {
      return MockStockServiceImpl();
    } else {
      return StockServiceImpl();
    }
  }

  // Watchlist Service Factory
  static WatchlistServiceInterface get watchlistService {
    if (AppConfig.useMockServices) {
      return MockWatchlistServiceImpl();
    } else {
      return WatchlistServiceImpl();
    }
  }

  // Stripe Service (always real, but uses test/prod keys based on environment)
  static StripeService get stripeService {
    return StripeService();
  }
}
