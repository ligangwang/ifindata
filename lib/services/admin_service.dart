// lib/services/admin_service.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/business_model_category.dart';

class AdminService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final String _collection = 'business_models';

  // Get all business models for admin management
  Future<List<BusinessModelCategory>> getBusinessModels() async {
    try {
      final snapshot = await _firestore.collection(_collection).get();
      return snapshot.docs.map((doc) {
        final data = doc.data();
        return BusinessModelCategory.fromJson({...data, 'id': doc.id});
      }).toList();
    } catch (e) {
      throw Exception('Failed to load business models: $e');
    }
  }

  // Create a new business model
  Future<void> createBusinessModel(BusinessModelCategory category) async {
    try {
      final data = category.toJson();
      data.remove('id'); // Remove ID for creation
      await _firestore.collection(_collection).add(data);
    } catch (e) {
      throw Exception('Failed to create business model: $e');
    }
  }

  // Update an existing business model
  Future<void> updateBusinessModel(BusinessModelCategory category) async {
    try {
      if (category.id.isEmpty) {
        throw Exception('Business model ID is required for update');
      }
      final data = category.toJson();
      data.remove('id'); // Remove ID from data
      await _firestore.collection(_collection).doc(category.id).update(data);
    } catch (e) {
      throw Exception('Failed to update business model: $e');
    }
  }

  // Delete a business model
  Future<void> deleteBusinessModel(String id) async {
    try {
      await _firestore.collection(_collection).doc(id).delete();
    } catch (e) {
      throw Exception('Failed to delete business model: $e');
    }
  }

  // Add a company to a business model
  Future<void> addCompanyToBusinessModel(String businessModelId, CompanyExample company) async {
    try {
      final docRef = _firestore.collection(_collection).doc(businessModelId);
      await _firestore.runTransaction((transaction) async {
        final doc = await transaction.get(docRef);
        if (!doc.exists) {
          throw Exception('Business model not found');
        }
        
        final data = doc.data()!;
        final companies = List<Map<String, dynamic>>.from(data['companies'] ?? []);
        companies.add(company.toJson());
        
        transaction.update(docRef, {'companies': companies});
      });
    } catch (e) {
      throw Exception('Failed to add company: $e');
    }
  }

  // Remove a company from a business model
  Future<void> removeCompanyFromBusinessModel(String businessModelId, String companySymbol) async {
    try {
      final docRef = _firestore.collection(_collection).doc(businessModelId);
      await _firestore.runTransaction((transaction) async {
        final doc = await transaction.get(docRef);
        if (!doc.exists) {
          throw Exception('Business model not found');
        }
        
        final data = doc.data()!;
        final companies = List<Map<String, dynamic>>.from(data['companies'] ?? []);
        companies.removeWhere((company) => company['symbol'] == companySymbol);
        
        transaction.update(docRef, {'companies': companies});
      });
    } catch (e) {
      throw Exception('Failed to remove company: $e');
    }
  }

  // Update business model characteristics
  Future<void> updateBusinessModelCharacteristics(
    String businessModelId, 
    BusinessModelCharacteristics characteristics
  ) async {
    try {
      await _firestore.collection(_collection).doc(businessModelId).update({
        'characteristics': characteristics.toJson(),
      });
    } catch (e) {
      throw Exception('Failed to update characteristics: $e');
    }
  }

  // Check if user is admin
  Future<bool> isUserAdmin(String uid) async {
    try {
      final userDoc = await _firestore.collection('users').doc(uid).get();
      if (!userDoc.exists) return false;
      return userDoc.data()?['isAdmin'] ?? false;
    } catch (e) {
      return false;
    }
  }

  // Set user admin status (only for super admin)
  Future<void> setUserAdminStatus(String uid, bool isAdmin) async {
    try {
      await _firestore.collection('users').doc(uid).update({
        'isAdmin': isAdmin,
      });
    } catch (e) {
      throw Exception('Failed to update admin status: $e');
    }
  }
}
