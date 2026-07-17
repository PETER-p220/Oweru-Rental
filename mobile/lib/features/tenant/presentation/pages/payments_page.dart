// ============================================================
// PAYMENTS PAGE — homepage color scheme
// ============================================================
import 'package:flutter/material.dart';
import '../../../../shared/services/tenant_api_service.dart';
import '../../../../shared/utils/payment_status_utils.dart';
import 'tenant_theme.dart';

class PaymentsPage extends StatefulWidget {
  const PaymentsPage({super.key});
  @override
  State<PaymentsPage> createState() => _PaymentsPageState();
}

class _PaymentsPageState extends State<PaymentsPage> {
  List<Map<String, dynamic>> _pending  = [];
  List<Map<String, dynamic>> _recent   = [];
  Map<String, dynamic> _stats = {};
  bool _isLoading = true;
  String _error = '';
  String _method = 'tigo';
  bool _processing = false;

  static bool _isPaid(String? status) {
    final s = (status ?? '').toLowerCase();
    return s == 'paid' || s == 'completed';
  }

  static String _propertyTitle(Map<String, dynamic> pay) {
    final property = pay['property'];
    if (property is Map) return property['title']?.toString() ?? 'Property';
    return pay['description']?.toString() ?? 'Property';
  }

  static String _fmtAmount(dynamic amount) {
    final v = _asNum(amount);
    if (v >= 1000000) return 'TZS ${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000) return 'TZS ${(v / 1000).toStringAsFixed(1)}K';
    return 'TZS ${v.toStringAsFixed(0)}';
  }

  static num _asNum(dynamic value, [num fallback = 0]) {
    if (value is num) return value;
    return num.tryParse(value?.toString() ?? '') ?? fallback;
  }

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
      final results = await Future.wait([
        TenantApiService.getPayments(),
        TenantApiService.getPaymentStats(),
        TenantApiService.getPaymentMethods(),
      ]);
      final payments = results[0] as List<Map<String, dynamic>>;
      final statsRes = results[1] as Map<String, dynamic>;
      final methods  = results[2] as List<Map<String, dynamic>>;

      final rentPayments = payments.where((p) => p['type']?.toString() != 'site_visit').toList();

      if (mounted) {
        setState(() {
          _stats = (statsRes['data'] as Map<String, dynamic>?) ?? {};
          _pending = rentPayments.where((p) => !_isPaid(p['status']?.toString())).toList();
          _recent  = rentPayments.where((p) => _isPaid(p['status']?.toString())).take(5).toList();
          if (methods.isNotEmpty && _method.isEmpty) {
            _method = methods.first['id']?.toString() ?? 'tigo';
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = 'Unable to load payments'; _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    appBar: tenantPageAppBar('Payments', actions: [
      IconButton(
        onPressed: _load,
        icon: const Icon(Icons.refresh_rounded, color: kWhite, size: 20),
      ),
    ]),
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
                    _statsRow(),
                    const SizedBox(height: 16),
                    if (_pending.isNotEmpty) ...[
                      const TSectionHeader('Pending Payments'),
                      ..._pending.map(_pendingCard),
                      const SizedBox(height: 8),
                    ] else
                      const TEmptyState(
                        icon: Icons.check_circle_outline_rounded,
                        title: 'No pending payments',
                        subtitle: 'You\'re all caught up on rent payments.',
                      ),
                    if (_recent.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      const TSectionHeader('Recent Payments'),
                      ..._recent.map(_recentCard),
                    ],
                  ],
                ),
              ),
  );

  Widget _statsRow() {
    final totalPaid = _asNum(_stats['total_paid']);
    final pending   = _asNum(_stats['pending_payments'], _pending.length);
    final thisMonth = _asNum(_stats['this_month']);

    return Row(children: [
      Expanded(child: _statTile('Total Paid', _fmtAmount(totalPaid), kSuccess)),
      const SizedBox(width: 8),
      Expanded(child: _statTile('Pending', '$pending', kWarning)),
      const SizedBox(width: 8),
      Expanded(child: _statTile('This Month', _fmtAmount(thisMonth), kInfo)),
    ]);
  }

  Widget _statTile(String label, String value, Color color) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: kBg2,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: kBorder),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: kSlate500, fontSize: 10)),
      const SizedBox(height: 4),
      Text(value, style: TextStyle(color: color, fontSize: 14, fontWeight: FontWeight.w700)),
    ]),
  );

  Widget _pendingCard(Map<String, dynamic> pay) {
    final property  = _propertyTitle(pay);
    final amount    = pay['amount'] ?? 0;
    final dueDate   = pay['due_date']?.toString() ?? 'TBD';
    final status    = (pay['status']?.toString() ?? 'pending').toLowerCase();
    final desc      = pay['description']?.toString() ?? 'Rent payment';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kBg2, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kWarning.withValues(alpha: 0.35))),
      child: Column(children: [
        Row(children: [
          Container(width: 42, height: 42,
            decoration: BoxDecoration(color: kWarning.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.warning_amber_rounded, color: kWarning, size: 20)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(property,
              style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
            Text(desc,
              style: const TextStyle(color: kSlate500, fontSize: 11)),
            const SizedBox(height: 4),
            TStatusBadge(label: status, color: status == 'failed' ? kDanger : kWarning),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(_fmtAmount(amount),
              style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w700)),
            Text('Due $dueDate', style: const TextStyle(color: kSlateDim, fontSize: 10)),
          ]),
        ]),
        const SizedBox(height: 14),
        TGoldButton(label: 'Pay Now', onTap: () => _showModal(context, pay)),
      ]),
    );
  }

  Widget _recentCard(Map<String, dynamic> pay) {
    final property = _propertyTitle(pay);
    final dueDate  = pay['paid_at']?.toString() ?? pay['due_date']?.toString() ?? '—';
    final amount   = pay['amount'] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kBg2, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder)),
      child: Row(children: [
        Container(width: 44, height: 44,
          decoration: BoxDecoration(color: kSuccessBg, borderRadius: BorderRadius.circular(10)),
          child: const Icon(Icons.check_circle_rounded, color: kSuccess, size: 20)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(property, style: const TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600)),
          Text(dueDate, style: const TextStyle(color: kSlate, fontSize: 10)),
        ])),
        Text(_fmtAmount(amount),
          style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w700)),
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
        onPay: (ctx, phone) => _process(ctx, pay, phone),
      ),
    );
  }

  Future<void> _process(BuildContext ctx, Map<String, dynamic> pay, String phone) async {
    if (phone.trim().length < 10) {
      ScaffoldMessenger.of(ctx).showSnackBar(
        const SnackBar(content: Text('Please enter a valid phone number')),
      );
      return;
    }
    setState(() => _processing = true);
    final paymentId = (pay['id'] as num?)?.toInt();
    Map<String, dynamic> result = {'success': false, 'message': 'Invalid payment'};
    if (paymentId != null) {
      result = await TenantApiService.makePayment(
        paymentId,
        phoneNumber: phone.trim(),
        provider: _method,
      );
    }
    if (!mounted) return;

    if (result['success'] != true) {
      setState(() => _processing = false);
      Navigator.pop(ctx);
      ScaffoldMessenger.of(ctx).showSnackBar(
        SnackBar(
          content: Text(result['message']?.toString() ?? 'Failed to submit payment'),
          backgroundColor: kDanger,
        ),
      );
      return;
    }

    final pollId = (result['payment_id'] as num?)?.toInt() ?? paymentId;
    String finalMessage = result['message']?.toString() ?? 'Waiting for payment confirmation...';
    var paid = false;

    if (pollId != null) {
      for (var attempt = 0; attempt < 40; attempt++) {
        await Future.delayed(const Duration(seconds: 3));
        final statusRes = await TenantApiService.checkMonthlyPaymentStatus(pollId);
        final status = parsePaymentStatus(statusRes);
        if (status == 'paid') {
          paid = true;
          finalMessage = paymentConfirmationMessage('monthly', 'paid');
          break;
        }
        if (status == 'failed') {
          finalMessage = paymentConfirmationMessage('monthly', 'failed');
          break;
        }
      }
      if (!paid && !finalMessage.contains('not completed')) {
        finalMessage = 'Payment submitted. Confirmation may take a moment — pull to refresh.';
      }
    }

    if (!mounted) return;
    setState(() => _processing = false);
    Navigator.pop(ctx);
    ScaffoldMessenger.of(ctx).showSnackBar(
      SnackBar(
        content: Text(
          finalMessage,
          style: const TextStyle(color: kBg, fontWeight: FontWeight.w600),
        ),
        backgroundColor: paid ? kGold : kWarning,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
    if (paid) {
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
  final Future<void> Function(BuildContext, String phone) onPay;
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
              Text(_PaymentsPageState._propertyTitle(pay),
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
                  color: sel ? kGold.withValues(alpha: 0.08) : kBg3,
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
                final phone = _phoneCtrl.text.trim();
                if (phone.length < 10) return;
                setState(() => _processing = true);
                await widget.onPay(context, phone);
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