import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordAnalyticsPage extends StatefulWidget {
  const LandlordAnalyticsPage({super.key});

  @override
  State<LandlordAnalyticsPage> createState() => _LandlordAnalyticsPageState();
}

class _LandlordAnalyticsPageState extends State<LandlordAnalyticsPage> {
  Map<String, dynamic> _analytics = {};
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final analytics = await LandlordApiService.getAnalytics();
      setState(() {
        _analytics = analytics;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load analytics.';
        _isLoading = false;
      });
    }
  }

  String _formatCurrency(dynamic value) {
    if (value == null) return 'TZS 0';
    final double numericValue = value is double ? value : (double.tryParse(value.toString()) ?? 0);
    if (numericValue >= 1000000) {
      return 'TZS ${(numericValue / 1000000).toStringAsFixed(1)}M';
    } else if (numericValue >= 1000) {
      return 'TZS ${(numericValue / 1000).toStringAsFixed(1)}K';
    }
    return 'TZS ${numericValue.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final propertyPerformance = _analytics['property_performance'] as Map<String, dynamic>? ?? {};
    final financialMetrics = _analytics['financial_metrics'] as Map<String, dynamic>? ?? {};
    final tenantMetrics = _analytics['tenant_metrics'] as Map<String, dynamic>? ?? {};

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        title: const Text('Analytics', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          // Header Section
          Container(
            padding: const EdgeInsets.all(20),
            color: kBg2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Landlord Workspace', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
                const SizedBox(height: 8),
                const Text('Analytics', style: TextStyle(color: kCream, fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Live performance metrics from the owner analytics endpoint, focused on occupancy, rent pricing, and landlord portfolio health.',
                  style: TextStyle(color: kSlate, fontSize: 13),
                ),
              ],
            ),
          ),
          // Metrics Grid
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: kGold))
                : _error.isNotEmpty
                    ? Center(child: Text(_error, style: const TextStyle(color: Color(0xFFE07070))))
                    : SingleChildScrollView(
                        padding: const EdgeInsets.all(20),
                        child: GridView.count(
                          crossAxisCount: 2,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          mainAxisSpacing: 16,
                          crossAxisSpacing: 16,
                          childAspectRatio: 1.2,
                          children: [
                            _buildMetricCard('Total properties', '${propertyPerformance['total_properties'] ?? 0}'),
                            _buildMetricCard('Occupied', '${propertyPerformance['occupied_properties'] ?? 0}'),
                            _buildMetricCard('Available', '${propertyPerformance['available_properties'] ?? 0}'),
                            _buildMetricCard('Average rent', _formatCurrency(propertyPerformance['avg_rent'])),
                            _buildMetricCard('Occupancy rate', '${(propertyPerformance['occupancy_rate'] ?? 0).toStringAsFixed(1)}%'),
                            _buildMetricCard('Total revenue', _formatCurrency(financialMetrics['total_revenue'])),
                            _buildMetricCard('Monthly revenue', _formatCurrency(financialMetrics['monthly_revenue'])),
                            _buildMetricCard('Total tenants', '${tenantMetrics['total_tenants'] ?? 0}'),
                            _buildMetricCard('New tenants this month', '${tenantMetrics['new_tenants_this_month'] ?? 0}'),
                          ],
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kBg2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.14),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(color: kCream, fontSize: 30, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}
