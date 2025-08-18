// lib/utils/admin_setup.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AdminSetup {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Call this function once to make the current user an admin
  /// This is a one-time setup function - remove it after use
  static Future<void> makeCurrentUserAdmin() async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null) {
        print('❌ No user is currently signed in');
        return;
      }

      // Update user document to set admin status
      await _firestore.collection('users').doc(currentUser.uid).set({
        'email': currentUser.email,
        'displayName': currentUser.displayName,
        'photoURL': currentUser.photoURL,
        'isAdmin': true,
        'subscription': 'free',
        'createdAt': FieldValue.serverTimestamp(),
        'lastLogin': FieldValue.serverTimestamp(),
        'watchlist': [],
      }, SetOptions(merge: true));

      print('✅ Successfully made ${currentUser.email} an admin!');
    } catch (e) {
      print('❌ Error making user admin: $e');
    }
  }

  /// Check if current user is admin
  static Future<bool> isCurrentUserAdmin() async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null) return false;

      final userDoc = await _firestore.collection('users').doc(currentUser.uid).get();
      return userDoc.data()?['isAdmin'] ?? false;
    } catch (e) {
      return false;
    }
  }
}
