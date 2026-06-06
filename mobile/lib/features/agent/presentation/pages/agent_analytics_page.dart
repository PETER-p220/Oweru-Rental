import 'package:flutter/material.dart';
import '../../../../shared/services/agent_api_service.dart';

class AgentAnalyticsPage extends StatefulWidget {
  const AgentAnalyticsPage({super.key});

  @override
  State<AgentAnalyticsPage> createState() => _AgentAnalyticsPageState();
}

class _AgentAnalyticsPageState extends State<AgentAnalyticsPage> {
  Map<String, dynamic> _analytics = {};
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final analytics = await AgentApiService.getAnalytics();
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
    final performanceMetrics = _analytics['performance_metrics'] as Map<String, dynamic>? ?? {};
    final revenueMetrics = _analytics['revenue_metrics'] as Map<String, dynamic>? ?? {};
    final topProperties = revenueMetrics['top_performing_properties'] as List<dynamic>? ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFF0F1218),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1D26),
        elevation: 0,
        title: const Text('Analytics', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          // Header Section
          Container(
            padding: const EdgeInsets.all(20),
            color: const Color(0xFF1A1D26),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Agent Workspace', style: TextStyle(color: Color(0xFF8B8680), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
                const SizedBox(height: 16),
                const Text('Analytics', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Performance and revenue metrics from the Laravel agent analytics endpoint.',
                  style: TextStyle(color: Color(0xFF8B8680), fontSize: 13),
                ),
                const SizedBox(height: 22),
                // Stats Grid
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard('Properties', '${performanceMetrics['total_properties'] ?? 0}', const Color(0xFF38BDF8)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatCard('Leads', '${performanceMetrics['total_leads'] ?? 0}', const Color(0xFF22C55E)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard('Conversion', '${(performanceMetrics['conversion_rate'] ?? 0).toStringAsFixed(1)}%', const Color(0xFFF59E0B)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatCard('Commissions', _formatCurrency(revenueMetrics['total_commissions']), const Color(0xFFFB7185)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Error Alert
          if (_error.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.18)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error, size: 16, color: Color(0xFFEF4444)),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_error, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 14))),
                ],
              ),
            ),
          // Table Section
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(20),
              color: const Color(0xFF1A1D26),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Top Performing Properties', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 16),
                  _isLoading
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFFC9A84C)))
                      : topProperties.isEmpty
                          ? const Center(
                              child: Text('No analytics records found.', style: TextStyle(color: Color(0xFF8B8680), fontSize: 13)),
                            )
                          : SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: DataTable(
                                headingRowColor: WidgetStateProperty.all(const Color(0xFF2A2418)),
                                columns: const [
                                  DataColumn(label: Text('Top Property', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                                  DataColumn(label: Text('Applications', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                                  DataColumn(label: Text('Leads', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                                  DataColumn(label: Text('Price', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                                ],
                                rows: topProperties.map((item) {
                                  return DataRow(
                                    cells: [
                                      DataCell(Text(item['title'] ?? 'Unknown', style: const TextStyle(color: Color(0xFFE8E1D5)))),
                                      DataCell(Text('${item['applications'] ?? 0}', style: const TextStyle(color: Color(0xFF8B8680)))),
                                      DataCell(Text('${item['leads'] ?? 0}', style: const TextStyle(color: Color(0xFF8B8680)))),
                                      DataCell(Text(_formatCurrency(item['price']), style: const TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w600))),
                                    ],
                                  );
                                }).toList(),
                              ),
                            ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 0.14),
          ),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(color: color, fontSize: 30, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
