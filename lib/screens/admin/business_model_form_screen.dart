// lib/screens/admin/business_model_form_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/admin_provider.dart';
import '../../models/business_model_category.dart';

class BusinessModelFormScreen extends StatefulWidget {
  final BusinessModelCategory? businessModel;

  const BusinessModelFormScreen({super.key, this.businessModel});

  @override
  State<BusinessModelFormScreen> createState() => _BusinessModelFormScreenState();
}

class _BusinessModelFormScreenState extends State<BusinessModelFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _revenueModelController;
  late final TextEditingController _keyMetricsController;
  late final TextEditingController _advantagesController;
  late final TextEditingController _challengesController;
  late final TextEditingController _grossMarginController;
  
  String _selectedIcon = 'business';
  String _scalabilityLevel = 'medium';
  String _capitalIntensity = 'medium';
  bool _isLoading = false;

  final List<String> _iconOptions = [
    'business',
    'cloud_done',
    'shopping_cart',
    'ads_click',
    'subscriptions',
    'precision_manufacturing',
    'account_balance',
  ];

  final List<String> _levelOptions = ['low', 'medium', 'high'];

  @override
  void initState() {
    super.initState();
    
    final model = widget.businessModel;
    _nameController = TextEditingController(text: model?.name ?? '');
    _descriptionController = TextEditingController(text: model?.description ?? '');
    _revenueModelController = TextEditingController(text: model?.characteristics.revenueModel ?? '');
    _keyMetricsController = TextEditingController(
      text: model?.characteristics.keyMetrics.join(', ') ?? ''
    );
    _advantagesController = TextEditingController(
      text: model?.characteristics.advantages.join(', ') ?? ''
    );
    _challengesController = TextEditingController(
      text: model?.characteristics.challenges.join(', ') ?? ''
    );
    _grossMarginController = TextEditingController(
      text: model?.characteristics.typicalGrossMargin.toString() ?? ''
    );
    
    if (model != null) {
      _selectedIcon = model.icon;
      _scalabilityLevel = model.characteristics.scalabilityLevel;
      _capitalIntensity = model.characteristics.capitalIntensity;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _revenueModelController.dispose();
    _keyMetricsController.dispose();
    _advantagesController.dispose();
    _challengesController.dispose();
    _grossMarginController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.businessModel != null;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Business Model' : 'Create Business Model'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else
            TextButton(
              onPressed: _saveBusinessModel,
              child: Text(
                isEditing ? 'Update' : 'Create',
                style: const TextStyle(color: Colors.white),
              ),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildBasicInfoSection(),
              const SizedBox(height: 24),
              _buildCharacteristicsSection(),
              const SizedBox(height: 24),
              _buildIconSection(),
              const SizedBox(height: 32),
              if (!_isLoading)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _saveBusinessModel,
                    child: Text(isEditing ? 'Update Business Model' : 'Create Business Model'),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBasicInfoSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Basic Information',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Business Model Name',
                hintText: 'e.g., Software as a Service (SaaS)',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a business model name';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description',
                hintText: 'Brief description of this business model',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a description';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCharacteristicsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Business Model Characteristics',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _revenueModelController,
              decoration: const InputDecoration(
                labelText: 'Revenue Model',
                hintText: 'e.g., Subscription-based recurring revenue',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter the revenue model';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _keyMetricsController,
              decoration: const InputDecoration(
                labelText: 'Key Metrics (comma-separated)',
                hintText: 'e.g., MRR, Churn Rate, LTV/CAC, ARR',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _advantagesController,
              decoration: const InputDecoration(
                labelText: 'Advantages (comma-separated)',
                hintText: 'e.g., Predictable revenue, High scalability',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _challengesController,
              decoration: const InputDecoration(
                labelText: 'Challenges (comma-separated)',
                hintText: 'e.g., Customer acquisition cost, Churn management',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _grossMarginController,
              decoration: const InputDecoration(
                labelText: 'Typical Gross Margin (%)',
                hintText: 'e.g., 75.0',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter the typical gross margin';
                }
                final margin = double.tryParse(value);
                if (margin == null || margin < 0 || margin > 100) {
                  return 'Please enter a valid percentage (0-100)';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _scalabilityLevel,
                    decoration: const InputDecoration(
                      labelText: 'Scalability Level',
                      border: OutlineInputBorder(),
                    ),
                    items: _levelOptions.map((level) =>
                      DropdownMenuItem(
                        value: level,
                        child: Text(level.toUpperCase()),
                      ),
                    ).toList(),
                    onChanged: (value) {
                      setState(() {
                        _scalabilityLevel = value ?? 'medium';
                      });
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _capitalIntensity,
                    decoration: const InputDecoration(
                      labelText: 'Capital Intensity',
                      border: OutlineInputBorder(),
                    ),
                    items: _levelOptions.map((level) =>
                      DropdownMenuItem(
                        value: level,
                        child: Text(level.toUpperCase()),
                      ),
                    ).toList(),
                    onChanged: (value) {
                      setState(() {
                        _capitalIntensity = value ?? 'medium';
                      });
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIconSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Icon Selection',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: _iconOptions.map((iconName) {
                final isSelected = _selectedIcon == iconName;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedIcon = iconName;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: isSelected ? Colors.blue : Colors.grey,
                        width: isSelected ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(8),
                      color: isSelected ? Colors.blue.withValues(alpha: 0.1) : null,
                    ),
                    child: Column(
                      children: [
                        _getIcon(iconName),
                        const SizedBox(height: 4),
                        Text(
                          iconName,
                          style: TextStyle(
                            fontSize: 10,
                            color: isSelected ? Colors.blue : Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _getIcon(String iconName) {
    IconData iconData;
    switch (iconName) {
      case 'cloud_done':
        iconData = Icons.cloud_done;
        break;
      case 'shopping_cart':
        iconData = Icons.shopping_cart;
        break;
      case 'ads_click':
        iconData = Icons.ads_click;
        break;
      case 'subscriptions':
        iconData = Icons.subscriptions;
        break;
      case 'precision_manufacturing':
        iconData = Icons.precision_manufacturing;
        break;
      case 'account_balance':
        iconData = Icons.account_balance;
        break;
      default:
        iconData = Icons.business;
    }
    
    return Icon(iconData, size: 24, color: Colors.blue);
  }

  List<String> _parseCommaSeparatedList(String text) {
    return text
        .split(',')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList();
  }

  Future<void> _saveBusinessModel() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final characteristics = BusinessModelCharacteristics(
        revenueModel: _revenueModelController.text.trim(),
        keyMetrics: _parseCommaSeparatedList(_keyMetricsController.text),
        advantages: _parseCommaSeparatedList(_advantagesController.text),
        challenges: _parseCommaSeparatedList(_challengesController.text),
        typicalGrossMargin: double.parse(_grossMarginController.text),
        scalabilityLevel: _scalabilityLevel,
        capitalIntensity: _capitalIntensity,
      );

      final businessModel = BusinessModelCategory(
        id: widget.businessModel?.id ?? '',
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim(),
        icon: _selectedIcon,
        companies: widget.businessModel?.companies ?? [],
        characteristics: characteristics,
      );

      final adminProvider = context.read<AdminProvider>();
      
      if (widget.businessModel != null) {
        await adminProvider.updateBusinessModel(businessModel);
      } else {
        await adminProvider.createBusinessModel(businessModel);
      }

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.businessModel != null
                  ? 'Business model updated successfully'
                  : 'Business model created successfully',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
}
