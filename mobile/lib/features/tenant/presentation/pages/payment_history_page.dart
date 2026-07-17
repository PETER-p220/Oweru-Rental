import 'package:flutter/material.dart';
import '../../../../shared/services/tenant_api_service.dart';
import 'tenant_theme.dart';

class PaymentHistoryPage extends StatefulWidget {
  const PaymentHistoryPage({super.key});
  @override
  State<PaymentHistoryPage> createState() => _PaymentHistoryPageState();
}

class _PaymentHistoryPageState extends State<PaymentHistoryPage> {
  List<Map<String, dynamic>> _history = [];
  bool _isLoading = true;
  String _error = '';

  num get _totalPaid => _history.fold<num>(0, (s, p) {
    final amount = p['amount'];
    if (amount is num) return s + amount;
    return s + (num.tryParse(amount?.toString() ?? '') ?? 0);
  });

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });
    try {
      final data = await TenantApiService.getPaymentHistory();
      if (!mounted) return;
      setState(() {
        _history = data;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load payment history';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    appBar: tenantPageAppBar('Payment History'),
    body: _isLoading
        ? ListView(
            padding: const EdgeInsets.all(16),
            children: List.generate(4, (_) => const TSkeletonCard(height: 92)),
          )
        : _error.isNotEmpty
            ? TErrorState(message: _error, onRetry: _load)
            : RefreshIndicator(
                onRefresh: _load,
                color: kGold,
                backgroundColor: kBg2,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                  children: [
                    _summaryCard(),
                    const SizedBox(height: 20),
                    const TSectionHeader('Recent Payments'),
                    if (_history.isEmpty)
                      const TEmptyState(
                        icon: Icons.payments_rounded,
                        title: 'No payments yet',
                        subtitle: 'Completed rent payments will appear here.',
                      )
                    else
                      ..._history.map(_historyCard),
                  ],
                ),
              ),
  );

  Widget _summaryCard() => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      gradient: kBannerGradient,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: kGoldBorder),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Total Paid', style: TextStyle(color: kSlate, fontSize: 12, fontWeight: FontWeight.w500)),
      const SizedBox(height: 10),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text('TZS ${_totalPaid.toStringAsFixed(0)}',
          style: const TextStyle(color: kGold, fontSize: 22, fontWeight: FontWeight.w700)),
        TStatusBadge(label: '${_history.length} PAYMENTS', color: kInfo),
      ]),
    ]),
  );

  Widget _historyCard(Map<String, dynamic> p) {
    final month = (p['month'] ?? p['period'] ?? 'Payment').toString();
    final amount = p['amount'] ?? 0;
    final transactionId = (p['transactionId'] ?? p['transaction_id'] ?? 'N/A').toString();
    final method = (p['method'] ?? p['payment_method'] ?? 'Mobile Money').toString();
    final date = (p['date'] ?? p['paid_at'] ?? p['created_at'] ?? '').toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: kBg2, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(color: kSuccess.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
          child: const Icon(Icons.check_circle_rounded, color: kSuccess, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(month, style: const TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 3),
          Text('$transactionId · $method', style: const TextStyle(color: kSlateDim, fontSize: 10)),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('TZS $amount', style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w700)),
          Text(date, style: const TextStyle(color: kSlateDim, fontSize: 10)),
        ]),
      ]),
    );
  }
}