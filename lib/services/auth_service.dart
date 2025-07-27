// lib/services/auth_service.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Get current user
  User? get currentUser => _auth.currentUser;

  // Auth state changes stream
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Sign in with Google
  Future<UserCredential?> signInWithGoogle() async {
    try {
      // Trigger the authentication flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        return null; // The user canceled the sign-in
      }

      // Obtain the auth details from the request
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      // Create a new credential
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Sign in to Firebase with the Google credential
      final UserCredential userCredential = await _auth.signInWithCredential(
        credential,
      );

      // Create or update user document in Firestore
      await _createUserDocument(userCredential.user!);

      return userCredential;
    } catch (e) {
      print('Error signing in with Google: $e');
      rethrow;
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      await _auth.signOut();
    } catch (e) {
      print('Error signing out: $e');
      rethrow;
    }
  }

  // Create user document in Firestore
  Future<void> _createUserDocument(User user) async {
    try {
      final userDoc = _firestore.collection('users').doc(user.uid);
      final docSnapshot = await userDoc.get();

      if (!docSnapshot.exists) {
        await userDoc.set({
          'uid': user.uid,
          'email': user.email,
          'displayName': user.displayName,
          'photoURL': user.photoURL,
          'createdAt': FieldValue.serverTimestamp(),
          'subscription': 'free', // Default subscription
          'lastLogin': FieldValue.serverTimestamp(),
        });
      } else {
        // Update last login
        await userDoc.update({'lastLogin': FieldValue.serverTimestamp()});
      }
    } catch (e) {
      print('Error creating/updating user document: $e');
      rethrow;
    }
  }

  // Get user subscription status
  Future<String> getUserSubscription() async {
    try {
      final user = currentUser;
      if (user == null) return 'free';

      final userDoc = await _firestore.collection('users').doc(user.uid).get();
      return userDoc.data()?['subscription'] ?? 'free';
    } catch (e) {
      print('Error getting user subscription: $e');
      return 'free';
    }
  }

  // Update user subscription
  Future<void> updateUserSubscription(String subscriptionType) async {
    try {
      final user = currentUser;
      if (user == null) return;

      await _firestore.collection('users').doc(user.uid).update({
        'subscription': subscriptionType,
        'subscriptionUpdated': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error updating user subscription: $e');
      rethrow;
    }
  }
}
