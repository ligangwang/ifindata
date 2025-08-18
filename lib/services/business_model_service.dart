// lib/services/business_model_service.dart
import '../models/business_model_category.dart';

class BusinessModelService {
  /// Get all business model categories
  List<BusinessModelCategory> getAllCategories() {
    return BusinessModelCategories.getAllCategories();
  }

  /// Get a specific category by ID
  BusinessModelCategory? getCategoryById(String id) {
    return BusinessModelCategories.getCategoryById(id);
  }

  /// Search companies across all categories
  List<CompanyExample> searchCompanies(String query) {
    final categories = getAllCategories();
    final allCompanies = <CompanyExample>[];
    
    for (final category in categories) {
      allCompanies.addAll(category.companies);
    }
    
    if (query.isEmpty) return allCompanies;
    
    return allCompanies.where((company) {
      return company.name.toLowerCase().contains(query.toLowerCase()) ||
             company.symbol.toLowerCase().contains(query.toLowerCase()) ||
             company.description.toLowerCase().contains(query.toLowerCase());
    }).toList();
  }

  /// Get companies by region
  List<CompanyExample> getCompaniesByRegion(String region) {
    final categories = getAllCategories();
    final companies = <CompanyExample>[];
    
    for (final category in categories) {
      companies.addAll(
        category.companies.where((company) => company.region == region)
      );
    }
    
    return companies;
  }

  /// Get top companies by market cap
  List<CompanyExample> getTopCompaniesByMarketCap({int limit = 10}) {
    final categories = getAllCategories();
    final allCompanies = <CompanyExample>[];
    
    for (final category in categories) {
      allCompanies.addAll(category.companies);
    }
    
    allCompanies.sort((a, b) => b.marketCap.compareTo(a.marketCap));
    return allCompanies.take(limit).toList();
  }

  /// Get fastest growing companies
  List<CompanyExample> getFastestGrowingCompanies({int limit = 10}) {
    final categories = getAllCategories();
    final allCompanies = <CompanyExample>[];
    
    for (final category in categories) {
      allCompanies.addAll(category.companies);
    }
    
    allCompanies.sort((a, b) => b.revenueGrowth.compareTo(a.revenueGrowth));
    return allCompanies.take(limit).toList();
  }

  /// Get companies with highest gross margins
  List<CompanyExample> getHighestMarginCompanies({int limit = 10}) {
    final categories = getAllCategories();
    final allCompanies = <CompanyExample>[];
    
    for (final category in categories) {
      allCompanies.addAll(category.companies);
    }
    
    allCompanies.sort((a, b) => b.grossMargin.compareTo(a.grossMargin));
    return allCompanies.take(limit).toList();
  }

  /// Get business model statistics
  Map<String, dynamic> getBusinessModelStats() {
    final categories = getAllCategories();
    final stats = <String, dynamic>{};
    
    // Total companies by category
    final companiesByCategory = <String, int>{};
    double totalMarketCap = 0;
    int totalCompanies = 0;
    
    for (final category in categories) {
      companiesByCategory[category.name] = category.companies.length;
      totalCompanies += category.companies.length;
      
      for (final company in category.companies) {
        totalMarketCap += company.marketCap;
      }
    }
    
    stats['totalCategories'] = categories.length;
    stats['totalCompanies'] = totalCompanies;
    stats['totalMarketCap'] = totalMarketCap;
    stats['companiesByCategory'] = companiesByCategory;
    stats['averageMarketCap'] = totalMarketCap / totalCompanies;
    
    return stats;
  }
}
