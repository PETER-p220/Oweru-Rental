// ============================================================
// landlord_commission_reports.dart — Commission Reports page
// ============================================================
import 'package:flutter/material.dart';
import 'landlord_theme.dart';

class LandlordCommissionReportsPage extends StatefulWidget {
  const LandlordCommissionReportsPage({super.key});
  @override
  State<LandlordCommissionReportsPage> createState() => _LandlordCommissionReportsPageState();
}

class _LandlordCommissionReportsPageState extends State<LandlordCommissionReportsPage> {
  final List<Commission> _commissions = [];
  bool _loading = true;
  String _error = '';

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
      // For now, empty list - will be populated from API
    });
  }

  int get _totalCommissions => _commissions.fold(0, (sum, c) => sum + c.amount);

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
      title: const Text('Commission Reports',
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
      Row(children: [
        _StatCard(label: 'Commission Records', value: '${_commissions.length}', color: kGold),
        const SizedBox(width: 12),
        Expanded(child: _StatCard(label: 'Total Commissions', value: _formatCurrency(_totalCommissions), color: kGold)),
      ]),
      const SizedBox(height: 20),

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

      // Commission list
      if (_commissions.isEmpty) ...[
        LEmptyState(
          icon: Icons.receipt_long_rounded,
          title: 'No commission records found',
          subtitle: 'Commission reports from agents will appear here.',
        ),
      ] else ...[
        ..._commissions.map((commission) => _CommissionCard(commission: commission)),
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

class _CommissionCard extends StatelessWidget {
  final Commission commission;
  const _CommissionCard({required this.commission});

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
            commission.agentName[0].toUpperCase(),
            style: TextStyle(color: kGold, fontSize: 18, fontWeight: FontWeight.w700),
          )),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(commission.agentName, style: TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
          Text(commission.agentEmail, style: TextStyle(color: kSlate, fontSize: 11)),
        ])),
        LStatusBadge(label: commission.status, color: _getStatusColor(commission.status)),
      ]),
      const SizedBox(height: 12),
      Divider(color: kGold.withOpacity(0.1)),
      const SizedBox(height: 12),
      Row(children: [
        Icon(Icons.home_work_rounded, color: kSlate, size: 16),
        const SizedBox(width: 8),
        Expanded(child: Text(commission.propertyTitle, style: TextStyle(color: kCream, fontSize: 13))),
      ]),
      const SizedBox(height: 12),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Amount', style: TextStyle(color: kSlate, fontSize: 10)),
          Text(_formatCurrency(commission.amount), style: TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.w700)),
        ]),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('Created', style: TextStyle(color: kSlate, fontSize: 10)),
          Text(_formatDate(commission.createdAt), style: TextStyle(color: kCream, fontSize: 12)),
        ]),
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

class Commission {
  final int id;
  final String agentName;
  final String agentEmail;
  final String propertyTitle;
  final int amount;
  final DateTime createdAt;
  final String status;

  Commission({
    required this.id,
    required this.agentName,
    required this.agentEmail,
    required this.propertyTitle,
    required this.amount,
    required this.createdAt,
    required this.status,
  });
}
