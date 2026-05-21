import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordRentCollectionPage extends StatefulWidget {
  const LandlordRentCollectionPage({super.key});

  @override
  State<LandlordRentCollectionPage> createState() => _LandlordRentCollectionPageState();
}

class _LandlordRentCollectionPageState extends State<LandlordRentCollectionPage> {
  List<Map<String, dynamic>> _payments = [];
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
        LandlordApiService.getRentCollection(),
        LandlordApiService.getRentCollectionStats(),
      ]);
      setState(() {
        _payments = results[0] as List<Map<String, dynamic>>;
        _stats = results[1];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load rent collection data.';
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

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return const Color(0xFF10B981);
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'overdue':
      case 'failed':
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
        title: const Text('Rent Collection', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
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
                const Text('Rent Collection', style: TextStyle(color: kCream, fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Track live payment records and collection stats from the owner payment endpoints.',
                  style: TextStyle(color: kSlate, fontSize: 13),
                ),
                const SizedBox(height: 22),
                // Metrics Row
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricCard('Total collected', _formatCurrency(_stats['total_collected'])),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildMetricCard('This month', _formatCurrency(_stats['this_month'])),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricCard('Pending payments', '${_stats['pending_payments'] ?? 0}'),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildMetricCard('Collection rate', '${(_stats['collection_rate'] ?? 0).toStringAsFixed(1)}%'),
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
          // Payments List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: kGold))
                : _payments.isEmpty
                    ? const Center(
                        child: Text('No rent payments found yet.', style: TextStyle(color: kSlate, fontSize: 13)),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _payments.length,
                        itemBuilder: (context, index) => _buildPaymentCard(_payments[index]),
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

  Widget _buildPaymentCard(Map<String, dynamic> payment) {
    final tenant = payment['tenant'] as Map<String, dynamic>? ?? {};
    final user = tenant['user'] as Map<String, dynamic>? ?? {};
    final property = payment['property'] as Map<String, dynamic>? ?? {};
    final status = payment['status'] as String?;

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
          // Tenant Info
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
                      '${user['first_name'] ?? ''} ${user['last_name'] ?? ''}',
                      style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(user['email'] ?? 'No email', style: const TextStyle(color: kSlate, fontSize: 13)),
                  ],
                ),
              ),
              _buildStatusBadge(status ?? 'unknown'),
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
          if (property['location'] != null)
            Padding(
              padding: const EdgeInsets.only(left: 18, top: 2),
              child: Text(property['location'], style: const TextStyle(color: kSlate, fontSize: 12)),
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
                    Text(_formatCurrency(payment['amount']), style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Due', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(_formatDate(payment['due_date'] ?? ''), style: const TextStyle(color: kCream, fontSize: 13)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Recorded', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(_formatDate(payment['created_at'] ?? ''), style: const TextStyle(color: kCream, fontSize: 13)),
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
