// ============================================================
// PAYMENTS PAGE — homepage color scheme
// ============================================================
import 'package:flutter/material.dart';
import '../../../../shared/services/tenant_api_service.dart';
import 'tenant_theme.dart';

class PaymentsPage extends StatefulWidget {
  const PaymentsPage({super.key});
  @override
  State<PaymentsPage> createState() => _PaymentsPageState();
}

class _PaymentsPageState extends State<PaymentsPage> {
  List<Map<String, dynamic>> _pending  = [];
  List<Map<String, dynamic>> _upcoming = [];
  bool _isLoading = true;
  String _error = '';
  String _method = 'tigo';
  bool _processing = false;

  static const _methods = [
    {'id': 'tigo',     'name': 'Tigo Money',    'icon': Icons.phone_android_rounded},
    {'id': 'mpesa',    'name': 'M-Pesa',         'icon': Icons.phone_android_rounded},
    {'id': 'airtel',   'name': 'Airtel Money',   'icon': Icons.phone_android_rounded},
    {'id': 'halopesa', 'name': 'Halo Pesa',      'icon': Icons.phone_android_rounded},
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = ''; });
    try {
      final payments = await TenantApiService.getPayments();
      if (mounted) setState(() {
        _pending  = payments.where((p) => p['status'] != 'paid').toList();
        _upcoming = payments.where((p) =>
          p['status'] == 'paid' || p['status'] == 'scheduled').toList();
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    appBar: _appBar(),
    body: _isLoading
        ? _skeleton()
        : _error.isNotEmpty
            ? TErrorState(message: _error, onRetry: _load)
            : RefreshIndicator(
                onRefresh: _load,
                color: kGold,
                backgroundColor: kBg2,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                  children: [
                    if (_pending.isNotEmpty) ...[
                      const TSectionHeader('Pending Payments'),
                      ..._pending.map(_pendingCard),
                      const SizedBox(height: 8),
                    ],
                    const TSectionHeader('Upcoming Payments'),
                    if (_upcoming.isEmpty)
                      const TEmptyState(
                        icon: Icons.calendar_month_rounded,
                        title: 'No upcoming payments',
                        subtitle: 'You\'re all caught up! New payments will appear here.',
                      )
                    else
                      ..._upcoming.map(_upcomingCard),
                  ],
                ),
              ),
  );

  PreferredSizeWidget _appBar() => AppBar(
    backgroundColor: kBg2,
    elevation: 0,
    iconTheme: const IconThemeData(color: kGold),
    title: const Text('Payments',
      style: TextStyle(color: kCream, fontSize: 17, fontWeight: FontWeight.w700)),
    actions: [
      IconButton(onPressed: _load,
        icon: const Icon(Icons.refresh_rounded, color: kGold, size: 20)),
    ],
  );

  Widget _pendingCard(Map<String, dynamic> pay) {
    final property      = pay['property']?.toString() ?? 'Property';
    final amount        = pay['amount'] ?? pay['price'] ?? 0;
    final dueDate       = pay['due_date']?.toString() ?? 'TBD';
    final daysRemaining = pay['days_remaining'] ?? 5;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kBg2, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kWarning.withOpacity(0.35))),
      child: Column(children: [
        Row(children: [
          Container(width: 42, height: 42,
            decoration: BoxDecoration(color: kWarning.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.warning_amber_rounded, color: kWarning, size: 20)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(property,
              style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
            Text('Due in $daysRemaining days',
              style: const TextStyle(color: kWarning, fontSize: 11, fontWeight: FontWeight.w600)),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('TZS $amount',
              style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w700)),
            Text(dueDate, style: const TextStyle(color: kSlateDim, fontSize: 10)),
          ]),
        ]),
        const SizedBox(height: 14),
        TGoldButton(label: 'Pay Now', onTap: () => _showModal(context, pay)),
      ]),
    );
  }

  Widget _upcomingCard(Map<String, dynamic> pay) {
    final month   = pay['month']?.toString() ?? 'Upcoming';
    final dueDate = pay['due_date']?.toString() ?? 'TBD';
    final amount  = pay['amount'] ?? pay['price'] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kBg2, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder)),
      child: Row(children: [
        Container(width: 44, height: 44,
          decoration: BoxDecoration(color: kGoldDim, borderRadius: BorderRadius.circular(10),
            border: Border.all(color: kGoldBorder)),
          child: const Icon(Icons.calendar_month_rounded, color: kGold, size: 20)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(month, style: const TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600)),
          Text(dueDate, style: const TextStyle(color: kSlate, fontSize: 10)),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('TZS $amount',
            style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w700)),
          const Text('Not due yet', style: TextStyle(color: kSuccess, fontSize: 10, fontWeight: FontWeight.w500)),
        ]),
      ]),
    );
  }

  void _showModal(BuildContext context, Map<String, dynamic> pay) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: kBg2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _PaymentModal(
        payment: pay,
        method: _method,
        processing: _processing,
        methods: _methods,
        onMethodChanged: (v) => setState(() => _method = v),
        onPay: (ctx) => _process(ctx, pay),
      ),
    );
  }

  Future<void> _process(BuildContext ctx, Map<String, dynamic> pay) async {
    setState(() => _processing = true);
    final paymentId = (pay['id'] as num?)?.toInt();
    bool success = false;
    if (paymentId != null) {
      success = await TenantApiService.makePayment(paymentId, paymentMethodId: _method);
    }
    if (!mounted) return;
    setState(() => _processing = false);
    Navigator.pop(ctx);
    ScaffoldMessenger.of(ctx).showSnackBar(
      SnackBar(
        content: Text(
          success ? 'Payment submitted successfully!' : 'Failed to submit payment',
          style: const TextStyle(color: kBg, fontWeight: FontWeight.w600),
        ),
        backgroundColor: success ? kGold : kDanger,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
    if (success) {
      await _load();
    }
  }

  Widget _skeleton() => ListView(
    padding: const EdgeInsets.all(16),
    children: List.generate(3, (_) => const TSkeletonCard(height: 110)),
  );
}

// ── Payment Modal ─────────────────────────────────────────────
class _PaymentModal extends StatefulWidget {
  final Map<String, dynamic> payment;
  final String method;
  final bool processing;
  final List<Map<String, dynamic>> methods;
  final ValueChanged<String> onMethodChanged;
  final Future<void> Function(BuildContext) onPay;
  const _PaymentModal({
    required this.payment, required this.method, required this.processing,
    required this.methods, required this.onMethodChanged, required this.onPay});
  @override
  State<_PaymentModal> createState() => _PaymentModalState();
}

class _PaymentModalState extends State<_PaymentModal> {
  late String _method;
  bool _processing = false;
  final _phoneCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _method = widget.method;
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pay    = widget.payment;
    final amount = pay['amount'] ?? pay['price'] ?? 0;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Handle
          Center(child: Container(width: 36, height: 4,
            decoration: BoxDecoration(color: kGoldBorder, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Make Payment',
                style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
              Text(pay['property']?.toString() ?? '',
                style: const TextStyle(color: kSlate, fontSize: 12)),
            ])),
            GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(width: 32, height: 32,
                decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.close_rounded, color: kSlate, size: 18))),
          ]),
          const SizedBox(height: 20),
          // Amount card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(gradient: kBannerGradient,
              borderRadius: BorderRadius.circular(12), border: Border.all(color: kGoldBorder)),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Amount Due', style: TextStyle(color: kSlate, fontSize: 12)),
              Text('TZS $amount',
                style: const TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700)),
            ]),
          ),
          const SizedBox(height: 20),
          const Text('Payment Method',
            style: TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          ...widget.methods.map((m) {
            final sel = _method == m['id'];
            return GestureDetector(
              onTap: () {
                final selected = m['id'] as String;
                setState(() => _method = selected);
                widget.onMethodChanged(selected);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: sel ? kGold.withOpacity(0.08) : kBg3,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: sel ? kGold : kBorder)),
                child: Row(children: [
                  Icon(m['icon'] as IconData, color: sel ? kGold : kSlate, size: 20),
                  const SizedBox(width: 12),
                  Expanded(child: Text(m['name'] as String,
                    style: TextStyle(color: sel ? kCream : kSlate,
                      fontSize: 13, fontWeight: sel ? FontWeight.w600 : FontWeight.w400))),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: 18, height: 18,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: sel ? kGold : kSlateDim, width: 2),
                      color: sel ? kGold : Colors.transparent),
                    child: sel
                        ? const Icon(Icons.check, size: 11, color: kBg)
                        : const SizedBox()),
                ]),
              ),
            );
          }),
          const SizedBox(height: 14),
          const Text('Phone Number',
            style: TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          TextField(
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: kCream, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Enter phone number',
              hintStyle: const TextStyle(color: kSlateDim),
              prefixText: '+255 ',
              prefixStyle: const TextStyle(color: kGold, fontWeight: FontWeight.w600),
              filled: true, fillColor: kBg3,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border:        OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kBorder)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kGold)),
            ),
          ),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 13),
                decoration: BoxDecoration(border: Border.all(color: kGoldBorder),
                  borderRadius: BorderRadius.circular(10)),
                child: const Text('Cancel', textAlign: TextAlign.center,
                  style: TextStyle(color: kSlate, fontSize: 13, fontWeight: FontWeight.w600)),
              ),
            )),
            const SizedBox(width: 10),
            Expanded(flex: 2, child: GestureDetector(
              onTap: _processing ? null : () async {
                setState(() => _processing = true);
                await widget.onPay(context);
                if (mounted) setState(() => _processing = false);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 13),
                decoration: BoxDecoration(
                  gradient: _processing ? null : kGoldGradient,
                  color: _processing ? kSlateDim : null,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: _processing ? [] : const [
                    BoxShadow(color: Color(0x30C89128), blurRadius: 10, offset: Offset(0, 4))]),
                child: Center(child: _processing
                    ? const SizedBox(width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: kWhite))
                    : const Text('Pay Now', textAlign: TextAlign.center,
                        style: TextStyle(color: kBg, fontSize: 13, fontWeight: FontWeight.w700))),
              ),
            )),
          ]),
        ]),
      ),
    );
  }
}