// lib/services/interfaces/auth_service_interface.dart
abstract class AuthServiceInterface {
  Stream<dynamic> get authStateChanges;
  dynamic get currentUser;
  Future<dynamic> signInWithGoogle();
  Future<void> signOut();
  Future<String> getUserSubscription();
  Future<void> updateUserSubscription(String subscriptionType);
}
