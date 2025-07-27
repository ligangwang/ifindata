// lib/config/stripe_config.dart
class StripeConfig {
  static const String publishableKey = "YOUR_STRIPE_PUBLISHABLE_KEY";
  static const String secretKey =
      "YOUR_STRIPE_SECRET_KEY"; // Never expose this in client code

  // Subscription plans
  static const String basicPlanId = "price_basic_monthly";
  static const String premiumPlanId = "price_premium_monthly";
  static const String proPlanId = "price_pro_monthly";
}
