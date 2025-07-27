import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/environment.dart';
import 'providers/auth_provider.dart';
import 'providers/mock_auth_provider.dart';
import 'providers/stock_provider.dart';
import 'providers/mock_stock_provider.dart';
import 'providers/watchlist_provider.dart';
import 'providers/mock_watchlist_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/main_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Log current environment configuration
  EnvironmentConfig.logEnvironment();

  // Initialize services based on environment
  if (!EnvironmentConfig.useMockServices) {
    // Initialize Firebase and Stripe for production
    // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    // await Stripe.instance.initialize(publishableKey: AppConfig.stripePublishableKey);
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: _buildProviders(),
      child: MaterialApp(
        title: 'IFinData - Stock Analysis',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF1976D2),
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          appBarTheme: const AppBarTheme(centerTitle: true, elevation: 0),
        ),
        darkTheme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF1976D2),
            brightness: Brightness.dark,
          ),
          useMaterial3: true,
          appBarTheme: const AppBarTheme(centerTitle: true, elevation: 0),
        ),
        home: _buildHome(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }

  List<ChangeNotifierProvider> _buildProviders() {
    if (EnvironmentConfig.useMockServices) {
      return [
        ChangeNotifierProvider(create: (_) => MockAuthProvider()),
        ChangeNotifierProvider(create: (_) => MockStockProvider()),
        ChangeNotifierProvider(create: (_) => MockWatchlistProvider()),
      ];
    } else {
      return [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => StockProvider()),
        ChangeNotifierProvider(create: (_) => WatchlistProvider()),
      ];
    }
  }

  Widget _buildHome() {
    if (EnvironmentConfig.useMockServices) {
      return Consumer<MockAuthProvider>(
        builder: (context, authProvider, _) {
          if (authProvider.isAuthenticated) {
            return const MainScreen();
          } else {
            return const LoginScreen();
          }
        },
      );
    } else {
      return Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          if (authProvider.isAuthenticated) {
            return const MainScreen();
          } else {
            return const LoginScreen();
          }
        },
      );
    }
  }
}
