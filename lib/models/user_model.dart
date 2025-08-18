// lib/models/user_model.dart
import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String email;
  final String? displayName;
  final String? photoURL;
  final String subscription;
  final DateTime createdAt;
  final DateTime lastLogin;
  final List<String> watchlist;
  final bool isAdmin;

  UserModel({
    required this.uid,
    required this.email,
    this.displayName,
    this.photoURL,
    required this.subscription,
    required this.createdAt,
    required this.lastLogin,
    this.watchlist = const [],
    this.isAdmin = false,
  });

  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return UserModel(
      uid: doc.id,
      email: data['email'] ?? '',
      displayName: data['displayName'],
      photoURL: data['photoURL'],
      subscription: data['subscription'] ?? 'free',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      lastLogin: (data['lastLogin'] as Timestamp?)?.toDate() ?? DateTime.now(),
      watchlist: List<String>.from(data['watchlist'] ?? []),
      isAdmin: data['isAdmin'] ?? false,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'email': email,
      'displayName': displayName,
      'photoURL': photoURL,
      'subscription': subscription,
      'createdAt': Timestamp.fromDate(createdAt),
      'lastLogin': Timestamp.fromDate(lastLogin),
      'watchlist': watchlist,
      'isAdmin': isAdmin,
    };
  }

  UserModel copyWith({
    String? uid,
    String? email,
    String? displayName,
    String? photoURL,
    String? subscription,
    DateTime? createdAt,
    DateTime? lastLogin,
    List<String>? watchlist,
    bool? isAdmin,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      photoURL: photoURL ?? this.photoURL,
      subscription: subscription ?? this.subscription,
      createdAt: createdAt ?? this.createdAt,
      lastLogin: lastLogin ?? this.lastLogin,
      watchlist: watchlist ?? this.watchlist,
      isAdmin: isAdmin ?? this.isAdmin,
    );
  }

  bool get isPremium => subscription != 'free';
  bool get isBasic => subscription == 'basic';
  bool get isPremiumPlan => subscription == 'premium';
  bool get isPro => subscription == 'pro';
}
