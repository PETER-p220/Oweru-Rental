import 'package:flutter/material.dart';
import 'agent_theme.dart';
import '../../../../shared/services/agent_api_service.dart';

class AgentPayoutHistoryPage extends StatefulWidget {
  const AgentPayoutHistoryPage({super.key});

  @override
  State<AgentPayoutHistoryPage> createState() => _AgentPayoutHistoryPageState();
}

class _AgentPayoutHistoryPageState extends State<AgentPayoutHistoryPage> {
  List<Map<String, dynamic>> _items = [];
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
      final items = await AgentApiService.getPayoutHistory();
      setState(() {
        _items = items;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load payout history.';
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

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '—';
    }
  }

  double get _totalPaid {
    return _items.fold(0.0, (sum, item) => sum + (double.tryParse(item['amount']?.toString() ?? '0') ?? 0));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kPageBg,
      appBar: AppBar(
        backgroundColor: kCardBg,
        elevation: 0,
        title: const Text('Payout History', style: TextStyle(color: kSlate800, fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          // Header Section
          Container(
            padding: const EdgeInsets.all(20),
            color: kCardBg,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Agent Workspace', style: TextStyle(color: kSlate500, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
                const SizedBox(height: 16),
                const Text('Payout History', style: TextStyle(color: kSlate800, fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Paid commission payouts from the backend.',
                  style: TextStyle(color: kSlate500, fontSize: 13),
                ),
                const SizedBox(height: 22),
                // Stats Grid
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard('Payouts', '${_items.length}', const Color(0xFF38BDF8)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatCard('Total Paid', _formatCurrency(_totalPaid), const Color(0xFF22C55E)),
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
              color: kCardBg,
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: kGold))
                  : _items.isEmpty
                      ? const Center(
                          child: Text('No paid payouts found.', style: TextStyle(color: kSlate500, fontSize: 13)),
                        )
                      : SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: DataTable(
                            headingRowColor: WidgetStateProperty.all(const Color(0xFF2A2418)),
                            columns: const [
                              DataColumn(label: Text('Property', style: TextStyle(color: kGold, fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Amount', style: TextStyle(color: kGold, fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Paid At', style: TextStyle(color: kGold, fontWeight: FontWeight.w700))),
                            ],
                            rows: _items.map((item) {
                              final property = item['property'] as Map<String, dynamic>? ?? {};
                              return DataRow(
                                cells: [
                                  DataCell(Text(property['title'] ?? 'Commission payout', style: const TextStyle(color: kSlate800))),
                                  DataCell(Text(_formatCurrency(item['amount']), style: const TextStyle(color: kGold, fontWeight: FontWeight.w600))),
                                  DataCell(Text(_formatDate(item['paid_at'] ?? ''), style: const TextStyle(color: kSlate500))),
                                ],
                              );
                            }).toList(),
                          ),
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
