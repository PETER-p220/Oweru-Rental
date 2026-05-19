// ============================================================
// landlord_rent_collection.dart — Rent Collection page
// ============================================================
import 'package:flutter/material.dart';
import 'landlord_theme.dart';

class LandlordRentCollectionPage extends StatefulWidget {
  const LandlordRentCollectionPage({super.key});
  @override
  State<LandlordRentCollectionPage> createState() => _LandlordRentCollectionPageState();
}

class _LandlordRentCollectionPageState extends State<LandlordRentCollectionPage> {
  final List<Payment> _payments = [];
  bool _loading = true;
  String _error = '';
  RentStats? _stats;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = '';
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _loading = false;
      _stats = RentStats(
        totalCollected: 5200000,
        thisMonth: 5200000,
        pendingPayments: 3,
        collectionRate: 95.0,
      );
      // For now, empty list - will be populated from API
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
      title: const Text('Rent Collection',
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
      // Stats
      if (_stats != null) ...[
        Row(children: [
          _StatCard(label: 'Total Collected', value: _formatCurrency(_stats!.totalCollected), color: kGold),
          const SizedBox(width: 12),
          _StatCard(label: 'This Month', value: _formatCurrency(_stats!.thisMonth), color: kGold),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          _StatCard(label: 'Pending', value: '${_stats!.pendingPayments}', color: kWarning),
          const SizedBox(width: 12),
          Expanded(child: _StatCard(label: 'Collection Rate', value: '${_stats!.collectionRate.toStringAsFixed(1)}%', color: kSuccess)),
        ]),
        const SizedBox(height: 20),
      ],

      // Error alert
      if (_error.isNotEmpty) ...[
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: kDanger.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: kDanger.withOpacity(0.3)),
          ),
          child: Row(children: [
            Icon(Icons.error_outline_rounded, color: kDanger, size: 16),
            const SizedBox(width: 8),
            Expanded(child: Text(_error, style: TextStyle(color: kDanger, fontSize: 12))),
          ]),
        ),
        const SizedBox(height: 12),
      ],

      // Payment list
      if (_payments.isEmpty) ...[
        LEmptyState(
          icon: Icons.account_balance_wallet_rounded,
          title: 'No rent payments found yet',
          subtitle: 'Payment records will appear once tenants start paying rent.',
        ),
      ] else ...[
        ..._payments.map((payment) => _PaymentCard(payment: payment)),
      ],
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

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) => Expanded(child: LCard(child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label.toUpperCase(), style: TextStyle(color: color, fontSize: 10, letterSpacing: 1)),
      const SizedBox(height: 8),
      Text(value, style: TextStyle(color: kCream, fontSize: 24, fontWeight: FontWeight.w700)),
    ],
  )));
}

class _PaymentCard extends StatelessWidget {
  final Payment payment;
  const _PaymentCard({required this.payment});

  @override
  Widget build(BuildContext context) => LCard(
    padding: const EdgeInsets.all(16),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(width: 40, height: 40,
          decoration: BoxDecoration(
            color: kGold.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(child: Text(
            payment.tenantName[0].toUpperCase(),
            style: TextStyle(color: kGold, fontSize: 18, fontWeight: FontWeight.w700),
          )),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(payment.tenantName, style: TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
          Text(payment.email, style: TextStyle(color: kSlate, fontSize: 11)),
        ])),
        LStatusBadge(label: payment.status, color: _getStatusColor(payment.status)),
      ]),
      const SizedBox(height: 12),
      Divider(color: kGold.withOpacity(0.1)),
      const SizedBox(height: 12),
      Row(children: [
        Icon(Icons.home_work_rounded, color: kSlate, size: 16),
        const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(payment.propertyTitle, style: TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w500)),
          Text(payment.propertyLocation, style: TextStyle(color: kSlate, fontSize: 11)),
        ])),
      ]),
      const SizedBox(height: 12),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Amount', style: TextStyle(color: kSlate, fontSize: 10)),
          Text(_formatCurrency(payment.amount), style: TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.w700)),
        ]),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('Due Date', style: TextStyle(color: kSlate, fontSize: 10)),
          Text(_formatDate(payment.dueDate), style: TextStyle(color: kCream, fontSize: 12)),
        ]),
      ]),
      const SizedBox(height: 8),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text('Recorded: ${_formatDate(payment.recordedAt)}', style: TextStyle(color: kSlateDim, fontSize: 10)),
      ]),
    ]),
  );

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'paid': return kSuccess;
      case 'pending': return kWarning;
      case 'overdue': return kDanger;
      default: return kSlate;
    }
  }

  String _formatCurrency(int amount) {
    if (amount >= 1000000) {
      return 'TZS ${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return 'TZS ${(amount / 1000).toStringAsFixed(0)}K';
    }
    return 'TZS $amount';
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

class Payment {
  final int id;
  final String tenantName;
  final String email;
  final String propertyTitle;
  final String propertyLocation;
  final int amount;
  final DateTime dueDate;
  final DateTime recordedAt;
  final String status;

  Payment({
    required this.id,
    required this.tenantName,
    required this.email,
    required this.propertyTitle,
    required this.propertyLocation,
    required this.amount,
    required this.dueDate,
    required this.recordedAt,
    required this.status,
  });
}

class RentStats {
  final int totalCollected;
  final int thisMonth;
  final int pendingPayments;
  final double collectionRate;

  RentStats({
    required this.totalCollected,
    required this.thisMonth,
    required this.pendingPayments,
    required this.collectionRate,
  });
}
