// lib/models/company_analysis.dart
class CompanyAnalysis {
  final String symbol;
  final String companyName;
  final DateTime analysisDate;
  final BusinessModelAnalysis businessModel;
  final CompanyCultureAnalysis culture;
  final CompetitiveAnalysis competitive;
  final LeadershipAnalysis leadership;
  final InnovationAnalysis innovation;
  final SustainabilityAnalysis sustainability;

  CompanyAnalysis({
    required this.symbol,
    required this.companyName,
    required this.analysisDate,
    required this.businessModel,
    required this.culture,
    required this.competitive,
    required this.leadership,
    required this.innovation,
    required this.sustainability,
  });

  factory CompanyAnalysis.fromJson(Map<String, dynamic> json) {
    return CompanyAnalysis(
      symbol: json['symbol'] ?? '',
      companyName: json['companyName'] ?? '',
      analysisDate:
          DateTime.tryParse(json['analysisDate'] ?? '') ?? DateTime.now(),
      businessModel: BusinessModelAnalysis.fromJson(
        json['businessModel'] ?? {},
      ),
      culture: CompanyCultureAnalysis.fromJson(json['culture'] ?? {}),
      competitive: CompetitiveAnalysis.fromJson(json['competitive'] ?? {}),
      leadership: LeadershipAnalysis.fromJson(json['leadership'] ?? {}),
      innovation: InnovationAnalysis.fromJson(json['innovation'] ?? {}),
      sustainability: SustainabilityAnalysis.fromJson(
        json['sustainability'] ?? {},
      ),
    );
  }
}

class BusinessModelAnalysis {
  final String
  modelType; // subscription, marketplace, saas, manufacturing, etc.
  final List<RevenueStream> revenueStreams;
  final CustomerSegmentAnalysis customerSegments;
  final ValueProposition valueProposition;
  final OperationalEfficiency operations;
  final ScalabilityAssessment scalability;
  final MonetizationStrategy monetization;
  final double moatStrength; // 0-100 competitive moat strength

  BusinessModelAnalysis({
    required this.modelType,
    required this.revenueStreams,
    required this.customerSegments,
    required this.valueProposition,
    required this.operations,
    required this.scalability,
    required this.monetization,
    required this.moatStrength,
  });

  factory BusinessModelAnalysis.fromJson(Map<String, dynamic> json) {
    return BusinessModelAnalysis(
      modelType: json['modelType'] ?? '',
      revenueStreams: (json['revenueStreams'] as List? ?? [])
          .map((r) => RevenueStream.fromJson(r))
          .toList(),
      customerSegments: CustomerSegmentAnalysis.fromJson(
        json['customerSegments'] ?? {},
      ),
      valueProposition: ValueProposition.fromJson(
        json['valueProposition'] ?? {},
      ),
      operations: OperationalEfficiency.fromJson(json['operations'] ?? {}),
      scalability: ScalabilityAssessment.fromJson(json['scalability'] ?? {}),
      monetization: MonetizationStrategy.fromJson(json['monetization'] ?? {}),
      moatStrength: (json['moatStrength'] ?? 0).toDouble(),
    );
  }
}

class CompanyCultureAnalysis {
  final CultureProfile cultureProfile;
  final EmployeeEngagement employeeEngagement;
  final DiversityInclusion diversityInclusion;
  final WorkLifeBalance workLifeBalance;
  final LearningDevelopment learningDevelopment;
  final CommunicationStyle communication;
  final OrganizationalStructure structure;
  final double cultureStrength; // 0-100 overall culture score

  CompanyCultureAnalysis({
    required this.cultureProfile,
    required this.employeeEngagement,
    required this.diversityInclusion,
    required this.workLifeBalance,
    required this.learningDevelopment,
    required this.communication,
    required this.structure,
    required this.cultureStrength,
  });

  factory CompanyCultureAnalysis.fromJson(Map<String, dynamic> json) {
    return CompanyCultureAnalysis(
      cultureProfile: CultureProfile.fromJson(json['cultureProfile'] ?? {}),
      employeeEngagement: EmployeeEngagement.fromJson(
        json['employeeEngagement'] ?? {},
      ),
      diversityInclusion: DiversityInclusion.fromJson(
        json['diversityInclusion'] ?? {},
      ),
      workLifeBalance: WorkLifeBalance.fromJson(json['workLifeBalance'] ?? {}),
      learningDevelopment: LearningDevelopment.fromJson(
        json['learningDevelopment'] ?? {},
      ),
      communication: CommunicationStyle.fromJson(json['communication'] ?? {}),
      structure: OrganizationalStructure.fromJson(json['structure'] ?? {}),
      cultureStrength: (json['cultureStrength'] ?? 0).toDouble(),
    );
  }
}

// Business Model Components
class RevenueStream {
  final String name;
  final String type; // recurring, one-time, usage-based, etc.
  final double percentage; // % of total revenue
  final String description;
  final double growthRate;
  final double predictability; // 0-100 how predictable this stream is

  RevenueStream({
    required this.name,
    required this.type,
    required this.percentage,
    required this.description,
    required this.growthRate,
    required this.predictability,
  });

  factory RevenueStream.fromJson(Map<String, dynamic> json) {
    return RevenueStream(
      name: json['name'] ?? '',
      type: json['type'] ?? '',
      percentage: (json['percentage'] ?? 0).toDouble(),
      description: json['description'] ?? '',
      growthRate: (json['growthRate'] ?? 0).toDouble(),
      predictability: (json['predictability'] ?? 0).toDouble(),
    );
  }
}

class CustomerSegmentAnalysis {
  final List<CustomerSegment> segments;
  final double customerLifetimeValue;
  final double acquisitionCost;
  final double churnRate;
  final double retentionRate;
  final String primarySegment;

  CustomerSegmentAnalysis({
    required this.segments,
    required this.customerLifetimeValue,
    required this.acquisitionCost,
    required this.churnRate,
    required this.retentionRate,
    required this.primarySegment,
  });

  factory CustomerSegmentAnalysis.fromJson(Map<String, dynamic> json) {
    return CustomerSegmentAnalysis(
      segments: (json['segments'] as List? ?? [])
          .map((s) => CustomerSegment.fromJson(s))
          .toList(),
      customerLifetimeValue: (json['customerLifetimeValue'] ?? 0).toDouble(),
      acquisitionCost: (json['acquisitionCost'] ?? 0).toDouble(),
      churnRate: (json['churnRate'] ?? 0).toDouble(),
      retentionRate: (json['retentionRate'] ?? 0).toDouble(),
      primarySegment: json['primarySegment'] ?? '',
    );
  }
}

class ValueProposition {
  final String coreValue;
  final List<String> keyBenefits;
  final String differentiator;
  final double customerSatisfaction; // 0-100
  final String painPointSolved;
  final double marketFit; // 0-100 product-market fit score

  ValueProposition({
    required this.coreValue,
    required this.keyBenefits,
    required this.differentiator,
    required this.customerSatisfaction,
    required this.painPointSolved,
    required this.marketFit,
  });

  factory ValueProposition.fromJson(Map<String, dynamic> json) {
    return ValueProposition(
      coreValue: json['coreValue'] ?? '',
      keyBenefits: List<String>.from(json['keyBenefits'] ?? []),
      differentiator: json['differentiator'] ?? '',
      customerSatisfaction: (json['customerSatisfaction'] ?? 0).toDouble(),
      painPointSolved: json['painPointSolved'] ?? '',
      marketFit: (json['marketFit'] ?? 0).toDouble(),
    );
  }
}

class OperationalEfficiency {
  final double automationLevel; // 0-100% of processes automated
  final double digitalTransformation; // 0-100 digital maturity
  final Map<String, double> kpis; // operational KPIs
  final String operationalModel; // lean, agile, traditional, etc.
  final double efficiencyScore; // 0-100 overall efficiency

  OperationalEfficiency({
    required this.automationLevel,
    required this.digitalTransformation,
    required this.kpis,
    required this.operationalModel,
    required this.efficiencyScore,
  });

  factory OperationalEfficiency.fromJson(Map<String, dynamic> json) {
    return OperationalEfficiency(
      automationLevel: (json['automationLevel'] ?? 0).toDouble(),
      digitalTransformation: (json['digitalTransformation'] ?? 0).toDouble(),
      kpis: Map<String, double>.from(json['kpis'] ?? {}),
      operationalModel: json['operationalModel'] ?? '',
      efficiencyScore: (json['efficiencyScore'] ?? 0).toDouble(),
    );
  }
}

// Culture Components
class CultureProfile {
  final List<String> coreValues;
  final String
  cultureType; // innovative, collaborative, hierarchical, results-driven, etc.
  final double transparencyLevel; // 0-100
  final double trustLevel; // 0-100
  final String decisionMaking; // top-down, consensus, delegated, etc.
  final List<String> culturalStrengths;
  final List<String> culturalChallenges;

  CultureProfile({
    required this.coreValues,
    required this.cultureType,
    required this.transparencyLevel,
    required this.trustLevel,
    required this.decisionMaking,
    required this.culturalStrengths,
    required this.culturalChallenges,
  });

  factory CultureProfile.fromJson(Map<String, dynamic> json) {
    return CultureProfile(
      coreValues: List<String>.from(json['coreValues'] ?? []),
      cultureType: json['cultureType'] ?? '',
      transparencyLevel: (json['transparencyLevel'] ?? 0).toDouble(),
      trustLevel: (json['trustLevel'] ?? 0).toDouble(),
      decisionMaking: json['decisionMaking'] ?? '',
      culturalStrengths: List<String>.from(json['culturalStrengths'] ?? []),
      culturalChallenges: List<String>.from(json['culturalChallenges'] ?? []),
    );
  }
}

class EmployeeEngagement {
  final double satisfactionScore; // 0-100
  final double engagementScore; // 0-100
  final double turnoverRate; // annual turnover %
  final double promotionRate; // internal promotion %
  final Map<String, double> engagementFactors;
  final List<String> topEngagementDrivers;

  EmployeeEngagement({
    required this.satisfactionScore,
    required this.engagementScore,
    required this.turnoverRate,
    required this.promotionRate,
    required this.engagementFactors,
    required this.topEngagementDrivers,
  });

  factory EmployeeEngagement.fromJson(Map<String, dynamic> json) {
    return EmployeeEngagement(
      satisfactionScore: (json['satisfactionScore'] ?? 0).toDouble(),
      engagementScore: (json['engagementScore'] ?? 0).toDouble(),
      turnoverRate: (json['turnoverRate'] ?? 0).toDouble(),
      promotionRate: (json['promotionRate'] ?? 0).toDouble(),
      engagementFactors: Map<String, double>.from(
        json['engagementFactors'] ?? {},
      ),
      topEngagementDrivers: List<String>.from(
        json['topEngagementDrivers'] ?? [],
      ),
    );
  }
}

class DiversityInclusion {
  final Map<String, double>
  demographics; // gender, ethnicity, age, etc. percentages
  final double inclusionScore; // 0-100
  final double payEquityScore; // 0-100
  final List<String> diversityInitiatives;
  final double leadershipDiversity; // 0-100 diversity in leadership

  DiversityInclusion({
    required this.demographics,
    required this.inclusionScore,
    required this.payEquityScore,
    required this.diversityInitiatives,
    required this.leadershipDiversity,
  });

  factory DiversityInclusion.fromJson(Map<String, dynamic> json) {
    return DiversityInclusion(
      demographics: Map<String, double>.from(json['demographics'] ?? {}),
      inclusionScore: (json['inclusionScore'] ?? 0).toDouble(),
      payEquityScore: (json['payEquityScore'] ?? 0).toDouble(),
      diversityInitiatives: List<String>.from(
        json['diversityInitiatives'] ?? [],
      ),
      leadershipDiversity: (json['leadershipDiversity'] ?? 0).toDouble(),
    );
  }
}

// Supporting classes
class CustomerSegment {
  final String name;
  final double percentage;
  final String characteristics;
  final double profitability;

  CustomerSegment({
    required this.name,
    required this.percentage,
    required this.characteristics,
    required this.profitability,
  });

  factory CustomerSegment.fromJson(Map<String, dynamic> json) {
    return CustomerSegment(
      name: json['name'] ?? '',
      percentage: (json['percentage'] ?? 0).toDouble(),
      characteristics: json['characteristics'] ?? '',
      profitability: (json['profitability'] ?? 0).toDouble(),
    );
  }
}

class ScalabilityAssessment {
  final double scalabilityScore; // 0-100
  final List<String> scalabilityFactors;
  final List<String> growthConstraints;
  final String scalabilityStage; // early, scaling, mature

  ScalabilityAssessment({
    required this.scalabilityScore,
    required this.scalabilityFactors,
    required this.growthConstraints,
    required this.scalabilityStage,
  });

  factory ScalabilityAssessment.fromJson(Map<String, dynamic> json) {
    return ScalabilityAssessment(
      scalabilityScore: (json['scalabilityScore'] ?? 0).toDouble(),
      scalabilityFactors: List<String>.from(json['scalabilityFactors'] ?? []),
      growthConstraints: List<String>.from(json['growthConstraints'] ?? []),
      scalabilityStage: json['scalabilityStage'] ?? '',
    );
  }
}

class MonetizationStrategy {
  final String strategy; // freemium, subscription, marketplace, etc.
  final double pricingPower; // 0-100
  final double customerStickiness; // 0-100
  final List<String> upsellOpportunities;

  MonetizationStrategy({
    required this.strategy,
    required this.pricingPower,
    required this.customerStickiness,
    required this.upsellOpportunities,
  });

  factory MonetizationStrategy.fromJson(Map<String, dynamic> json) {
    return MonetizationStrategy(
      strategy: json['strategy'] ?? '',
      pricingPower: (json['pricingPower'] ?? 0).toDouble(),
      customerStickiness: (json['customerStickiness'] ?? 0).toDouble(),
      upsellOpportunities: List<String>.from(json['upsellOpportunities'] ?? []),
    );
  }
}

class WorkLifeBalance {
  final double workLifeScore; // 0-100
  final Map<String, bool> benefits; // remote work, flexible hours, etc.
  final double burnoutRate; // 0-100
  final List<String> wellnessPrograms;

  WorkLifeBalance({
    required this.workLifeScore,
    required this.benefits,
    required this.burnoutRate,
    required this.wellnessPrograms,
  });

  factory WorkLifeBalance.fromJson(Map<String, dynamic> json) {
    return WorkLifeBalance(
      workLifeScore: (json['workLifeScore'] ?? 0).toDouble(),
      benefits: Map<String, bool>.from(json['benefits'] ?? {}),
      burnoutRate: (json['burnoutRate'] ?? 0).toDouble(),
      wellnessPrograms: List<String>.from(json['wellnessPrograms'] ?? []),
    );
  }
}

class LearningDevelopment {
  final double investmentPerEmployee; // annual L&D spend per employee
  final double skillDevelopmentScore; // 0-100
  final List<String> learningPrograms;
  final double careerProgressionRate; // 0-100

  LearningDevelopment({
    required this.investmentPerEmployee,
    required this.skillDevelopmentScore,
    required this.learningPrograms,
    required this.careerProgressionRate,
  });

  factory LearningDevelopment.fromJson(Map<String, dynamic> json) {
    return LearningDevelopment(
      investmentPerEmployee: (json['investmentPerEmployee'] ?? 0).toDouble(),
      skillDevelopmentScore: (json['skillDevelopmentScore'] ?? 0).toDouble(),
      learningPrograms: List<String>.from(json['learningPrograms'] ?? []),
      careerProgressionRate: (json['careerProgressionRate'] ?? 0).toDouble(),
    );
  }
}

class CommunicationStyle {
  final String style; // open, hierarchical, collaborative, etc.
  final double feedbackFrequency; // 0-100
  final List<String> communicationChannels;
  final double informationAccessibility; // 0-100

  CommunicationStyle({
    required this.style,
    required this.feedbackFrequency,
    required this.communicationChannels,
    required this.informationAccessibility,
  });

  factory CommunicationStyle.fromJson(Map<String, dynamic> json) {
    return CommunicationStyle(
      style: json['style'] ?? '',
      feedbackFrequency: (json['feedbackFrequency'] ?? 0).toDouble(),
      communicationChannels: List<String>.from(
        json['communicationChannels'] ?? [],
      ),
      informationAccessibility: (json['informationAccessibility'] ?? 0)
          .toDouble(),
    );
  }
}

class OrganizationalStructure {
  final String type; // flat, hierarchical, matrix, holacracy, etc.
  final int hierarchyLevels;
  final double autonomyLevel; // 0-100
  final String managementStyle;

  OrganizationalStructure({
    required this.type,
    required this.hierarchyLevels,
    required this.autonomyLevel,
    required this.managementStyle,
  });

  factory OrganizationalStructure.fromJson(Map<String, dynamic> json) {
    return OrganizationalStructure(
      type: json['type'] ?? '',
      hierarchyLevels: json['hierarchyLevels'] ?? 0,
      autonomyLevel: (json['autonomyLevel'] ?? 0).toDouble(),
      managementStyle: json['managementStyle'] ?? '',
    );
  }
}

// Placeholder classes for completeness
class CompetitiveAnalysis {
  final String placeholder;
  CompetitiveAnalysis({required this.placeholder});
  factory CompetitiveAnalysis.fromJson(Map<String, dynamic> json) =>
      CompetitiveAnalysis(placeholder: '');
}

class LeadershipAnalysis {
  final String placeholder;
  LeadershipAnalysis({required this.placeholder});
  factory LeadershipAnalysis.fromJson(Map<String, dynamic> json) =>
      LeadershipAnalysis(placeholder: '');
}

class InnovationAnalysis {
  final String placeholder;
  InnovationAnalysis({required this.placeholder});
  factory InnovationAnalysis.fromJson(Map<String, dynamic> json) =>
      InnovationAnalysis(placeholder: '');
}

class SustainabilityAnalysis {
  final String placeholder;
  SustainabilityAnalysis({required this.placeholder});
  factory SustainabilityAnalysis.fromJson(Map<String, dynamic> json) =>
      SustainabilityAnalysis(placeholder: '');
}
