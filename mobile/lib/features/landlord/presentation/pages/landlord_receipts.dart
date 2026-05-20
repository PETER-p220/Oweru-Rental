import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordReceiptsPage extends StatefulWidget {
  const LandlordReceiptsPage({super.key});

  @override
  State<LandlordReceiptsPage> createState() => _LandlordReceiptsPageState();
}

class _LandlordReceiptsPageState extends State<LandlordReceiptsPage> {
  List<Map<String, dynamic>> _receipts = [];
  bool _isLoading = true;
  String _error = '';
  String _info = '';

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
      final receipts = await LandlordApiService.getReceipts();
      setState(() {
        _receipts = receipts;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load receipts.';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleDownload(int id) async {
    try {
      setState(() => _info = '');
      await LandlordApiService.downloadOwnerReceipt(id);
      setState(() => _info = 'Receipt request sent.');
    } catch (e) {
      setState(() => _info = 'Receipt download is not available yet.');
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
      case 'completed':
      case 'paid':
        return const Color(0xFF10B981);
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'failed':
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
        title: const Text('Payment Receipts', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
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
                const Text('Payment Receipts', style: TextStyle(color: kCream, fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Browse completed payment records from the owner receipts endpoint and trigger receipt downloads when the system supports them.',
                  style: TextStyle(color: kSlate, fontSize: 13),
                ),
              ],
            ),
          ),
          // Error/Info Alerts
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
          if (_info.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: kGold.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kGold.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info, size: 16, color: kGold),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_info, style: const TextStyle(color: kGold, fontSize: 14))),
                ],
              ),
            ),
          // Receipts List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: kGold))
                : _receipts.isEmpty
                    ? const Center(
                        child: Text('No completed receipts found.', style: TextStyle(color: kSlate, fontSize: 13)),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _receipts.length,
                        itemBuilder: (context, index) => _buildReceiptCard(_receipts[index]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildReceiptCard(Map<String, dynamic> receipt) {
    final tenant = receipt['tenant'] as Map<String, dynamic>? ?? {};
    final user = tenant['user'] as Map<String, dynamic>? ?? {};
    final property = receipt['property'] as Map<String, dynamic>? ?? {};
    final status = receipt['status'] as String?;
    final type = receipt['type'] as String? ?? 'payment';

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
          const SizedBox(height: 16),
          // Details Row
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Type', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(type, style: const TextStyle(color: kCream, fontSize: 13)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Amount', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(_formatCurrency(receipt['amount']), style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Date', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(_formatDate(receipt['created_at'] ?? ''), style: const TextStyle(color: kCream, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Download Button
          OutlinedButton.icon(
            onPressed: () => _handleDownload(receipt['id']),
            icon: const Icon(Icons.download, size: 14),
            label: const Text('Download'),
            style: OutlinedButton.styleFrom(
              foregroundColor: kGold,
              side: const BorderSide(color: kGold),
            ),
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
