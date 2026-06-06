import 'package:flutter/material.dart';
import '../../../../shared/services/agent_api_service.dart';

class AgentCommissionsPage extends StatefulWidget {
  const AgentCommissionsPage({super.key});

  @override
  State<AgentCommissionsPage> createState() => _AgentCommissionsPageState();
}

class _AgentCommissionsPageState extends State<AgentCommissionsPage> {
  List<Map<String, dynamic>> _items = [];
  Map<String, dynamic> _stats = {};
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
      final results = await Future.wait([
        AgentApiService.getMyCommissions(),
        AgentApiService.getCommissionStats(),
      ]);
      setState(() {
        _items = results[0] as List<Map<String, dynamic>>;
        _stats = results[1] as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load commissions.';
        _isLoading = false;
      });
    }
  }

  int get _paidCount => _items.where((item) => item['status'] == 'paid').length;

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

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'paid':
        return const Color(0xFF22C55E);
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'cancelled':
      case 'failed':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF6B7280);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1218),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1D26),
        elevation: 0,
        title: const Text('My Commissions', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 18, fontWeight: FontWeight.w700)),
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
                const Text('My Commissions', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Commission records now come from the Laravel API instead of static mock data.',
                  style: TextStyle(color: Color(0xFF8B8680), fontSize: 13),
                ),
                const SizedBox(height: 22),
                // Stats Grid
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard('Transactions', '${_stats['total_transactions'] ?? _items.length}', const Color(0xFF38BDF8)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatCard('Paid', '$_paidCount', const Color(0xFF22C55E)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard('Pending', _formatCurrency(_stats['pending_commissions']), const Color(0xFFF59E0B)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatCard('Earned', _formatCurrency(_stats['total_earned']), const Color(0xFFFB7185)),
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Commission Records', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 18, fontWeight: FontWeight.w700)),
                      if (_items.isNotEmpty)
                        OutlinedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.download, size: 14),
                          label: const Text('Export CSV'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFC9A84C),
                            side: const BorderSide(color: Color(0xFFC9A84C)),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _isLoading
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFFC9A84C)))
                      : _items.isEmpty
                          ? const Center(
                              child: Text('No commission records found.', style: TextStyle(color: Color(0xFF8B8680), fontSize: 13)),
                            )
                          : SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: DataTable(
                                headingRowColor: WidgetStateProperty.all(const Color(0xFF2A2418)),
                                columns: const [
                                  DataColumn(label: Text('Property', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                                  DataColumn(label: Text('Amount', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                                  DataColumn(label: Text('Status', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                                  DataColumn(label: Text('Date', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                                ],
                                rows: _items.map((item) {
                                  final property = item['property'] as Map<String, dynamic>? ?? {};
                                  return DataRow(
                                    cells: [
                                      DataCell(Text(property['title'] ?? 'Property commission', style: const TextStyle(color: Color(0xFFE8E1D5)))),
                                      DataCell(Text(_formatCurrency(item['amount']), style: const TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w600))),
                                      DataCell(_buildStatusBadge(item['status'])),
                                      DataCell(Text(_formatDate(item['created_at'] ?? ''), style: const TextStyle(color: Color(0xFF8B8680)))),
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

  Widget _buildStatusBadge(String? status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: _getStatusColor(status).withValues(alpha: 0.3)),
      ),
      child: Text(
        (status ?? 'unknown').toUpperCase(),
        style: TextStyle(color: _getStatusColor(status), fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5),
      ),
    );
  }
}
