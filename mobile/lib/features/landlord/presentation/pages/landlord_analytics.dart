// ============================================================
// landlord_analytics.dart — Analytics page
// ============================================================
import 'package:flutter/material.dart';
import 'landlord_theme.dart';

class LandlordAnalyticsPage extends StatefulWidget {
  const LandlordAnalyticsPage({super.key});
  @override
  State<LandlordAnalyticsPage> createState() => _LandlordAnalyticsPageState();
}

class _LandlordAnalyticsPageState extends State<LandlordAnalyticsPage> {
  bool _loading = true;
  AnalyticsData? _data;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _loading = false;
      _data = AnalyticsData(
        totalProperties: 8,
        occupiedProperties: 6,
        occupancyRate: 75.0,
        monthlyRevenue: 5200000,
        pendingPayments: 3,
        totalTenants: 12,
        avgRentPerProperty: 650000,
        revenueTrend: [4500000, 4800000, 5100000, 4900000, 5200000, 5200000],
      );
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    appBar: AppBar(
      backgroundColor: kBg2,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_rounded, color: kGold),
        onPressed: () => Navigator.pop(context),
      ),
      title: const Text('Analytics',
        style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600)),
    ),
    body: _loading ? _buildLoading() : _buildContent(),
  );

  Widget _buildLoading() => const Center(
    child: CircularProgressIndicator(color: kGold),
  );

  Widget _buildContent() => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      // Overview stats
      LSectionHeader('Overview'),
      const SizedBox(height: 12),
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.8,
        children: [
          _MetricCard(
            label: 'Total Properties',
            value: '${_data!.totalProperties}',
            icon: Icons.home_work_rounded,
            color: kGold,
          ),
          _MetricCard(
            label: 'Occupancy Rate',
            value: '${_data!.occupancyRate.toStringAsFixed(0)}%',
            icon: Icons.pie_chart_rounded,
            color: kSuccess,
          ),
          _MetricCard(
            label: 'Monthly Revenue',
            value: _formatCurrency(_data!.monthlyRevenue),
            icon: Icons.account_balance_wallet_rounded,
            color: kInfo,
          ),
          _MetricCard(
            label: 'Pending Payments',
            value: '${_data!.pendingPayments}',
            icon: Icons.receipt_long_rounded,
            color: kWarning,
          ),
        ],
      ),
      const SizedBox(height: 20),

      // Revenue trend
      LSectionHeader('Revenue Trend (6 months)'),
      const SizedBox(height: 12),
      LCard(child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(
            height: 150,
            child: _RevenueChart(data: _data!.revenueTrend),
          ),
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('6 months ago', style: TextStyle(color: kSlate, fontSize: 10)),
            Text('Today', style: TextStyle(color: kSlate, fontSize: 10)),
          ]),
        ]),
      )),
      const SizedBox(height: 20),

      // Property performance
      LSectionHeader('Property Performance'),
      const SizedBox(height: 12),
      LCard(child: Column(children: [
        _PerformanceRow(
          label: 'Total Tenants',
          value: '${_data!.totalTenants}',
          color: kGold,
        ),
        Divider(color: kGold.withOpacity(0.1)),
        _PerformanceRow(
          label: 'Avg Rent/Property',
          value: _formatCurrency(_data!.avgRentPerProperty),
          color: kInfo,
        ),
        Divider(color: kGold.withOpacity(0.1)),
        _PerformanceRow(
          label: 'Occupied Properties',
          value: '${_data!.occupiedProperties} / ${_data!.totalProperties}',
          color: kSuccess,
        ),
      ])),
      const SizedBox(height: 20),

      // Quick insights
      LSectionHeader('Quick Insights'),
      const SizedBox(height: 12),
      LCard(child: Column(children: [
        _InsightCard(
          icon: Icons.trending_up_rounded,
          title: 'Revenue Up',
          description: '8% increase from last month',
          color: kSuccess,
        ),
        const SizedBox(height: 12),
        _InsightCard(
          icon: Icons.warning_rounded,
          title: '3 Pending Payments',
          description: 'Follow up with tenants',
          color: kWarning,
        ),
      ])),
    ],
  );

  String _formatCurrency(int amount) {
    if (amount >= 1000000) {
      return 'TZS ${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return 'TZS ${(amount / 1000).toStringAsFixed(0)}K';
    }
    return 'TZS $amount';
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _MetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) => LCard(child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Container(width: 32, height: 32,
        decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: color, size: 16)),
      const SizedBox(height: 8),
      Text(label, style: TextStyle(color: kSlate, fontSize: 10)),
      const SizedBox(height: 4),
      Text(value, style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
    ],
  ));
}

class _RevenueChart extends StatelessWidget {
  final List<int> data;
  const _RevenueChart({required this.data});

  @override
  Widget build(BuildContext context) {
    final max = data.reduce((a, b) => a > b ? a : b);
    final min = data.reduce((a, b) => a < b ? a : b);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: data.map((value) {
        final height = ((value - min) / (max - min)) * 100;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Container(
              height: height.clamp(10, 100).toDouble(),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [kGold.withOpacity(0.3), kGold],
                ),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _PerformanceRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _PerformanceRow({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 12),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: TextStyle(color: kCream, fontSize: 13)),
      Text(value, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600)),
    ]),
  );
}

class _InsightCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final Color color;
  const _InsightCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });

  @override
  Widget build(BuildContext context) => Row(children: [
    Container(width: 40, height: 40,
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
      child: Icon(icon, color: color, size: 20)),
    const SizedBox(width: 12),
    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
      Text(description, style: TextStyle(color: kSlate, fontSize: 11)),
    ])),
  ]);
}

class AnalyticsData {
  final int totalProperties;
  final int occupiedProperties;
  final double occupancyRate;
  final int monthlyRevenue;
  final int pendingPayments;
  final int totalTenants;
  final int avgRentPerProperty;
  final List<int> revenueTrend;

  AnalyticsData({
    required this.totalProperties,
    required this.occupiedProperties,
    required this.occupancyRate,
    required this.monthlyRevenue,
    required this.pendingPayments,
    required this.totalTenants,
    required this.avgRentPerProperty,
    required this.revenueTrend,
  });
}
