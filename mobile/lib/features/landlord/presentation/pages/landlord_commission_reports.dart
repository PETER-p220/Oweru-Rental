import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordCommissionReportsPage extends StatefulWidget {
  const LandlordCommissionReportsPage({super.key});

  @override
  State<LandlordCommissionReportsPage> createState() => _LandlordCommissionReportsPageState();
}

class _LandlordCommissionReportsPageState extends State<LandlordCommissionReportsPage> {
  List<Map<String, dynamic>> _commissions = [];
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
      final commissions = await LandlordApiService.getCommissionReports();
      setState(() {
        _commissions = commissions;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load commission reports.';
        _isLoading = false;
      });
    }
  }

  double get _total {
    return _commissions.fold<double>(0, (sum, item) => sum + (double.tryParse(item['amount']?.toString() ?? '0') ?? 0));
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

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'paid':
        return const Color(0xFF10B981);
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'cancelled':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF6B7280);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        title: const Text('Commission Reports', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
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
                const SizedBox(height: 16),
                const Text('Commission Reports', style: TextStyle(color: kCream, fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Review live commission payouts tied to your properties from the owner commission reports endpoint.',
                  style: TextStyle(color: kSlate, fontSize: 13),
                ),
                const SizedBox(height: 22),
                // Metrics Row
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricCard('Commission records', '${_commissions.length}'),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildMetricCard('Total commissions', _formatCurrency(_total)),
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
                color: const Color(0xFFEF4444).withOpacity(0.06),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.18)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error, size: 16, color: Color(0xFFEF4444)),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_error, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 14))),
                ],
              ),
            ),
          // Commissions List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: kGold))
                : _commissions.isEmpty
                    ? const Center(
                        child: Text('No commission records found.', style: TextStyle(color: kSlate, fontSize: 13)),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _commissions.length,
                        itemBuilder: (context, index) => _buildCommissionCard(_commissions[index]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: kBg3,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 0.14),
          ),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(color: kCream, fontSize: 30, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _buildCommissionCard(Map<String, dynamic> commission) {
    final agent = commission['agent'] as Map<String, dynamic>? ?? {};
    final property = commission['property'] as Map<String, dynamic>? ?? {};
    final status = commission['status'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kBg2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Agent Info
          Row(
            children: [
              const CircleAvatar(
                backgroundColor: kGold,
                child: Icon(Icons.person, color: kBg, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${agent['first_name'] ?? ''} ${agent['last_name'] ?? ''}',
                      style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(agent['email'] ?? 'No email', style: const TextStyle(color: kSlate, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Property Info
          Row(
            children: [
              const Icon(Icons.location_on, size: 12, color: kGold),
              const SizedBox(width: 6),
              Expanded(
                child: Text(property['title'] ?? 'Untitled property', style: const TextStyle(color: kCream, fontSize: 13)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Details Row
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Amount', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(_formatCurrency(commission['amount']), style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Created', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(_formatDate(commission['created_at'] ?? ''), style: const TextStyle(color: kCream, fontSize: 13)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Status', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    if (status != null)
                      _buildStatusBadge(status)
                    else
                      const Text('unknown', style: TextStyle(color: kSlate, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withOpacity(0.12),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: _getStatusColor(status).withOpacity(0.3)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: _getStatusColor(status), fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5),
      ),
    );
  }
}
