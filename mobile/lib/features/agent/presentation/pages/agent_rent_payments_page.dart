import 'package:flutter/material.dart';
import '../../../../shared/services/agent_api_service.dart';
import 'agent_theme.dart';

class AgentRentPaymentsPage extends StatefulWidget {
  const AgentRentPaymentsPage({super.key});

  @override
  State<AgentRentPaymentsPage> createState() => _AgentRentPaymentsPageState();
}

class _AgentRentPaymentsPageState extends State<AgentRentPaymentsPage> {
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
    setState(() { _isLoading = true; _error = ''; });
    try {
      final results = await Future.wait([
        AgentApiService.getRentPayments(),
        AgentApiService.getRentPaymentStats(),
      ]);
      final paymentsData = results[0]['data'];
      final statsData = results[1]['data'];
      setState(() {
        _payments = paymentsData is List
            ? List<Map<String, dynamic>>.from(paymentsData.cast<Map<String, dynamic>>())
            : [];
        _stats = statsData is Map<String, dynamic> ? statsData : results[1];
        _isLoading = false;
      });
    } catch (_) {
      setState(() {
        _error = 'Unable to load rent payments.';
        _isLoading = false;
      });
    }
  }

  String _formatCurrency(dynamic value) {
    if (value == null) return 'TZS 0';
    final v = value is double ? value : (double.tryParse(value.toString()) ?? 0);
    if (v >= 1000000) return 'TZS ${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000) return 'TZS ${(v / 1000).toStringAsFixed(1)}K';
    return 'TZS ${v.toStringAsFixed(0)}';
  }

  String _formatDate(String dateStr) {
    try {
      final d = DateTime.parse(dateStr);
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return '—';
    }
  }

  Color _statusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return kSuccess;
      case 'pending':
        return kWarning;
      case 'overdue':
      case 'failed':
        return kDanger;
      default:
        return kSlate500;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kPageBg,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _header()),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            sliver: SliverToBoxAdapter(child: _statsRow()),
          ),
          if (_error.isNotEmpty)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              sliver: SliverToBoxAdapter(child: _errorBanner()),
            ),
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: kSlate800, strokeWidth: 2)),
            )
          else if (_payments.isEmpty)
            SliverFillRemaining(child: Center(child: AEmptyState(
              icon: Icons.payments_outlined,
              title: 'No rent payments yet',
              subtitle: 'Payments from tenants on your listings will appear here.',
            )))
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _paymentCard(_payments[i]),
                  ),
                  childCount: _payments.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _header() => Container(
    color: kHeaderBg,
    padding: EdgeInsets.only(
      top: MediaQuery.of(context).padding.top + 12,
      left: 18, right: 18, bottom: 20,
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        const Expanded(child: Text('Rent Payments',
          style: TextStyle(color: kWhite, fontSize: 20, fontWeight: FontWeight.w800))),
        IconButton(
          onPressed: _loadData,
          icon: const Icon(Icons.refresh_rounded, color: kWhite, size: 20),
        ),
      ]),
      const SizedBox(height: 4),
      const ALabel('Agent Workspace'),
      const SizedBox(height: 8),
      Text('${_payments.length} payment${_payments.length == 1 ? '' : 's'}',
        style: const TextStyle(color: kSlate400, fontSize: 13)),
    ]),
  );

  Widget _statsRow() {
    final items = [
      ('Total Collected', _formatCurrency(_stats['total_collected']), kSuccess, kSuccessBg),
      ('This Month', _formatCurrency(_stats['this_month']), kInfo, kInfoBg),
      ('Pending', '${_stats['pending_payments'] ?? 0}', kWarning, kWarningBg),
      ('Collection Rate', '${_formatRate(_stats['collection_rate'])}%', kSlate800, kSlate100),
    ];
    return SizedBox(
      height: 96,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final (label, value, accent, bg) = items[i];
          return Container(
            width: 120,
            padding: const EdgeInsets.all(12),
            decoration: kCardDecor,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Container(
                width: 28, height: 28,
                decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(7)),
                child: Icon(Icons.account_balance_wallet_outlined, color: accent, size: 14),
              ),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(value, style: const TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w800),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(label, style: const TextStyle(color: kSlate500, fontSize: 10)),
              ]),
            ]),
          );
        },
      ),
    );
  }

  String _formatRate(dynamic value) {
    final rate = value is num ? value.toDouble() : (double.tryParse(value?.toString() ?? '') ?? 0);
    return rate.toStringAsFixed(1);
  }

  Widget _errorBanner() => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: kDangerBg, borderRadius: BorderRadius.circular(8),
      border: Border.all(color: kDanger.withValues(alpha: 0.2))),
    child: Row(children: [
      const Icon(Icons.error_outline, size: 16, color: kDanger),
      const SizedBox(width: 8),
      Expanded(child: Text(_error, style: const TextStyle(color: kDanger, fontSize: 13))),
    ]),
  );

  Widget _paymentCard(Map<String, dynamic> payment) {
    final tenant = payment['tenant'] as Map<String, dynamic>? ?? {};
    final user = tenant['user'] as Map<String, dynamic>? ?? {};
    final property = payment['property'] as Map<String, dynamic>? ?? {};
    final status = payment['status'] as String?;
    final name = '${user['first_name'] ?? ''} ${user['last_name'] ?? ''}'.trim();

    return ACard(
      padding: const EdgeInsets.all(14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name.isEmpty ? 'Unknown tenant' : name,
              style: const TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w700)),
            Text(user['email']?.toString() ?? '', style: const TextStyle(color: kSlate400, fontSize: 11)),
          ])),
          AStatusBadge(label: status ?? 'unknown', color: _statusColor(status)),
        ]),
        if (property['title'] != null) ...[
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: kSlate100, borderRadius: BorderRadius.circular(8)),
            child: Text(property['title'].toString(),
              style: const TextStyle(color: kSlate800, fontSize: 12, fontWeight: FontWeight.w600)),
          ),
        ],
        const SizedBox(height: 10),
        Row(children: [
          Expanded(child: _detailCol('Amount', _formatCurrency(payment['amount']), bold: true)),
          Expanded(child: _detailCol('Due', _formatDate(payment['due_date']?.toString() ?? ''))),
          Expanded(child: _detailCol('Recorded', _formatDate(payment['created_at']?.toString() ?? ''))),
        ]),
      ]),
    );
  }

  Widget _detailCol(String label, String value, {bool bold = false}) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label.toUpperCase(), style: const TextStyle(color: kSlate500, fontSize: 9, fontWeight: FontWeight.w700)),
      const SizedBox(height: 3),
      Text(value, style: TextStyle(
        color: bold ? kSlate800 : kSlate600,
        fontSize: 12,
        fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
      )),
    ],
  );
}
