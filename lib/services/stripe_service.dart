// lib/services/stripe_service.dart
import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/stripe_config.dart';

class StripeService {
  static final StripeService _instance = StripeService._internal();
  factory StripeService() => _instance;
  StripeService._internal();

  // Initialize Stripe
  static Future<void> init() async {
    Stripe.publishableKey = StripeConfig.publishableKey;
    await Stripe.instance.applySettings();
  }

  // Create payment intent for subscription
  Future<Map<String, dynamic>?> createPaymentIntent({
    required String amount,
    required String currency,
    required String customerId,
    required String priceId,
  }) async {
    try {
      // This should be done on your backend server for security
      // For demonstration purposes only - DO NOT use in production
      final response = await http.post(
        Uri.parse('https://your-backend-url.com/create-payment-intent'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'amount': amount,
          'currency': currency,
          'customer_id': customerId,
          'price_id': priceId,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to create payment intent');
      }
    } catch (e) {
      print('Error creating payment intent: $e');
      return null;
    }
  }

  // Create subscription
  Future<bool> createSubscription({
    required String customerId,
    required String priceId,
    required String paymentMethodId,
  }) async {
    try {
      // This should be done on your backend server
      final response = await http.post(
        Uri.parse('https://your-backend-url.com/create-subscription'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'customer_id': customerId,
          'price_id': priceId,
          'payment_method_id': paymentMethodId,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error creating subscription: $e');
      return false;
    }
  }

  // Present payment sheet
  Future<bool> presentPaymentSheet({required String clientSecret}) async {
    try {
      await Stripe.instance.presentPaymentSheet();
      return true;
    } catch (e) {
      print('Error presenting payment sheet: $e');
      return false;
    }
  }

  // Initialize payment sheet
  Future<bool> initPaymentSheet({
    required String clientSecret,
    required String customerId,
    required String merchantDisplayName,
  }) async {
    try {
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          customerId: customerId,
          merchantDisplayName: merchantDisplayName,
          style: ThemeMode.system,
        ),
      );
      return true;
    } catch (e) {
      print('Error initializing payment sheet: $e');
      return false;
    }
  }

  // Get subscription plans
  List<Map<String, dynamic>> getSubscriptionPlans() {
    return [
      {
        'id': StripeConfig.basicPlanId,
        'name': 'Basic Plan',
        'price': '\$9.99',
        'interval': 'month',
        'features': [
          'Basic stock analysis',
          'Limited watchlist',
          'Email alerts',
          'Basic charts',
        ],
      },
      {
        'id': StripeConfig.premiumPlanId,
        'name': 'Premium Plan',
        'price': '\$19.99',
        'interval': 'month',
        'features': [
          'Advanced stock analysis',
          'Unlimited watchlist',
          'Real-time alerts',
          'Advanced charts',
          'Portfolio tracking',
        ],
      },
      {
        'id': StripeConfig.proPlanId,
        'name': 'Pro Plan',
        'price': '\$39.99',
        'interval': 'month',
        'features': [
          'Everything in Premium',
          'AI-powered insights',
          'Custom indicators',
          'API access',
          'Priority support',
        ],
      },
    ];
  }
}
