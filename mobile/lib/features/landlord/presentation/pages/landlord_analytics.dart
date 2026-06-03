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
      backgroundColor: kPageBg,
      extendBodyBehindAppBar: true,
      body: CustomScrollView(
        slivers: [
          // ── Slate header (matching dashboard) ──────
          SliverToBoxAdapter(child: _slateHeader()),
          
          // ── Metrics Grid ─────────────────────────────
          if (_isLoading)
            SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: kSlate800, strokeWidth: 2)))
          else if (_error.isNotEmpty)
            SliverFillRemaining(child: Center(child: Text(_error, style: const TextStyle(color: kDanger))))
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
              sliver: SliverGrid(delegate: SliverChildBuilderDelegate(
                (_, i) => _MetricCard(
                  label: _metricLabels[i],
                  value: _metricValues(i, propertyPerformance, financialMetrics, tenantMetrics),
                  icon: _metricIcons[i],
                  accent: _metricAccents[i],
                  bg: _metricBgs[i],
                ),
                childCount: _metricLabels.length,
              ), gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.2,
              )),
            ),
        ],
      ),
    );
  }

  // ── Slate header block ───────────────────────────────────
  Widget _slateHeader() => Container(
    color: kHeaderBg,
    padding: EdgeInsets.only(
      top: MediaQuery.of(context).padding.top + 12,
      left: 18, right: 18, bottom: 20),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Top bar
      Row(children: [
        const Text('Analytics',
          style: TextStyle(color: kWhite, fontSize: 20,
            fontWeight: FontWeight.w800, letterSpacing: -0.3)),
      ]),
      const SizedBox(height: 16),
      // Stats summary
      const Text('Performance metrics for your portfolio',
        style: TextStyle(color: kSlate400, fontSize: 13)),
    ]),
  );

  // ── Metric data ───────────────────────────────────────────
  static const _metricLabels = [
    'Total Properties',
    'Occupied',
    'Available',
    'Average Rent',
    'Occupancy Rate',
    'Total Revenue',
    'Monthly Revenue',
    'Total Tenants',
    'New Tenants',
  ];

  static const _metricIcons = [
    Icons.home_work_outlined,
    Icons.people_outline,
    Icons.check_circle_outline,
    Icons.attach_money_outlined,
    Icons.percent,
    Icons.account_balance_wallet_outlined,
    Icons.trending_up,
    Icons.people_outline,
    Icons.person_add,
  ];

  static const _metricAccents = [
    kSlate800,
    kSuccess,
    kInfo,
    kWarning,
    kSlate800,
    kSuccess,
    kInfo,
    kSlate800,
    kSuccess,
  ];

  static const _metricBgs = [
    kSlate100,
    kSuccessBg,
    kInfoBg,
    kWarningBg,
    kSlate100,
    kSuccessBg,
    kInfoBg,
    kSlate100,
    kSuccessBg,
  ];

  String _metricValues(int index, Map<String, dynamic> propertyPerformance, Map<String, dynamic> financialMetrics, Map<String, dynamic> tenantMetrics) {
    switch (index) {
      case 0: return '${propertyPerformance['total_properties'] ?? 0}';
      case 1: return '${propertyPerformance['occupied_properties'] ?? 0}';
      case 2: return '${propertyPerformance['available_properties'] ?? 0}';
      case 3: return _formatCurrency(propertyPerformance['avg_rent']);
      case 4: return '${(propertyPerformance['occupancy_rate'] ?? 0).toStringAsFixed(1)}%';
      case 5: return _formatCurrency(financialMetrics['total_revenue']);
      case 6: return _formatCurrency(financialMetrics['monthly_revenue']);
      case 7: return '${tenantMetrics['total_tenants'] ?? 0}';
      case 8: return '${tenantMetrics['new_tenants_this_month'] ?? 0}';
      default: return '—';
    }
  }
}

// ════════════════════════════════════════════════════════════
// Sub-widgets (matching dashboard)
// ════════════════════════════════════════════════════════════

// Metric card — redesigned
class _MetricCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color accent, bg;

  const _MetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.accent,
    required this.bg,
  });

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: kCardBg,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: kBorder)),
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Container(
        width: 28, height: 28,
        decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(7)),
        child: Icon(icon, color: accent, size: 14)),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value,
          style: const TextStyle(color: kSlate800, fontSize: 20,
            fontWeight: FontWeight.w800, letterSpacing: -0.3),
          maxLines: 1, overflow: TextOverflow.ellipsis),
        const SizedBox(height: 2),
        Text(label,
          style: const TextStyle(color: kSlate500, fontSize: 10)),
      ]),
    ]),
  ),
  );
}
