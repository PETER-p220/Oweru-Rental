import 'dart:async';
import 'package:flutter/material.dart';
import '../services/tenant_api_service.dart';
import '../../features/tenant/presentation/pages/tenant_theme.dart';

/// Selcom rent payment after application approval — mirrors web `ApplicationsPage` modal.
class TenantRentPaymentSheet extends StatefulWidget {
  final Map<String, dynamic> application;
  final VoidCallback onPaid;

  const TenantRentPaymentSheet({
    super.key,
    required this.application,
    required this.onPaid,
  });

  @override
  State<TenantRentPaymentSheet> createState() => _TenantRentPaymentSheetState();
}

class _TenantRentPaymentSheetState extends State<TenantRentPaymentSheet> {
  static const _providers = [
    ('tigo', 'Tigo Pesa'),
    ('mpesa', 'M-Pesa'),
    ('airtel', 'Airtel Money'),
    ('halopesa', 'Halopesa'),
  ];

  final _phoneCtrl = TextEditingController();
  String _provider = 'tigo';
  bool _paying = false;
  String? _result; // success | error | waiting
  String _message = '';
  String _rentOrderId = '';
  Timer? _pollTimer;
  int _pollAttempts = 0;

  Map<String, dynamic>? get _property =>
      widget.application['property'] as Map<String, dynamic>?;

  double get _rentAmount {
    final price = _property?['price'] ?? widget.application['rent'];
    if (price == null) return 0;
    if (price is num) return price.toDouble();
    final cleaned = price.toString().replaceAll(RegExp(r'[^0-9.]'), '');
    return double.tryParse(cleaned) ?? 0;
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _phoneCtrl.dispose();
    super.dispose();
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollAttempts = 0;
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _pollStatus());
    _pollStatus();
  }

  Future<void> _pollStatus() async {
    if (_rentOrderId.isEmpty) return;
    _pollAttempts += 1;
    final res = await TenantApiService.checkRentPaymentStatus(_rentOrderId);
    final status = res['data']?['rent_payment_status']?.toString();
    if (!mounted) return;

    if (status == 'paid') {
      _pollTimer?.cancel();
      setState(() {
        _result = 'success';
        _message = 'Rent payment confirmed!';
        _paying = false;
      });
      widget.onPaid();
    } else if (status == 'failed') {
      _pollTimer?.cancel();
      setState(() {
        _result = 'error';
        _message = 'Rent payment was not completed. Please try again.';
        _paying = false;
      });
    } else if (_pollAttempts >= 40) {
      setState(() {
        _message = 'Still waiting for confirmation. Keep this screen open or check My Applications.';
      });
    }
  }

  Future<void> _payRent() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.length < 10) {
      setState(() {
        _result = 'error';
        _message = 'Please enter a valid phone number (at least 10 digits).';
      });
      return;
    }
    if (_rentAmount <= 0) {
      setState(() {
        _result = 'error';
        _message = 'Unable to determine rent amount for this application.';
      });
      return;
    }

    final appId = (widget.application['id'] as num).toInt();

    setState(() {
      _paying = true;
      _result = null;
      _message = '';
    });

    try {
      final result = await TenantApiService.initiateRentPayment(
        applicationId: appId,
        phoneNumber: phone,
        provider: _provider,
      );

      final orderId = result['data']?['order_id']?.toString();
      if (result['success'] == true && orderId != null && orderId.isNotEmpty) {
        setState(() {
          _rentOrderId = orderId;
          _result = 'waiting';
          _message = result['message']?.toString() ??
              'Approve the ${_provider.toUpperCase()} prompt on your phone.';
        });
        _startPolling();
      } else {
        throw Exception(result['message']?.toString() ?? 'Payment initiation failed');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _result = 'error';
        _message = e.toString().replaceFirst('Exception: ', '');
        _paying = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = _property?['title']?.toString() ?? 'Property';
    final location = _property?['location']?.toString() ?? '';

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: kGold.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const TLabel('SECURE PAYMENT'),
              const SizedBox(height: 6),
              const Text('Pay Monthly Rent',
                  style: TextStyle(color: kCream, fontSize: 20, fontWeight: FontWeight.w700)),
              const Text('Powered by Selcom · Oweru',
                  style: TextStyle(color: kSlate, fontSize: 12)),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: kBg3,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: kBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 14)),
                    if (location.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.location_on_rounded, size: 14, color: kGold),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(location, style: const TextStyle(color: kSlate, fontSize: 12)),
                          ),
                        ],
                      ),
                    ],
                    const Divider(height: 20, color: kBorder),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Amount Due', style: TextStyle(color: kSlate, fontSize: 13)),
                        Text(
                          'TZS ${_rentAmount.toStringAsFixed(0)}',
                          style: const TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Text('PAYMENT PROVIDER',
                  style: TextStyle(color: kSlate, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1)),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _providers.map((p) {
                  final selected = _provider == p.$1;
                  return GestureDetector(
                    onTap: _paying ? null : () => setState(() => _provider = p.$1),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: selected ? kGold : kBg3,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: selected ? kGold : kBorder),
                      ),
                      child: Text(
                        p.$2,
                        style: TextStyle(
                          color: selected ? kBg : kCream,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),
              const Text('PHONE NUMBER',
                  style: TextStyle(color: kSlate, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1)),
              const SizedBox(height: 8),
              TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                enabled: !_paying,
                style: const TextStyle(color: kCream),
                decoration: InputDecoration(
                  hintText: '0712 345 678',
                  hintStyle: const TextStyle(color: kSlateDim),
                  prefixIcon: const Icon(Icons.phone_rounded, color: kSlate, size: 20),
                  filled: true,
                  fillColor: kBg3,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  const Icon(Icons.verified_user_rounded, color: kSuccess, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '256-bit SSL Secured · Trusted by Selcom',
                      style: TextStyle(color: kSuccess.withValues(alpha: 0.9), fontSize: 12),
                    ),
                  ),
                ],
              ),
              if (_result != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: (_result == 'success' ? kSuccess : kDanger).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: (_result == 'success' ? kSuccess : kDanger).withValues(alpha: 0.35),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        _result == 'success' ? Icons.check_circle_rounded : Icons.error_outline_rounded,
                        color: _result == 'success' ? kSuccess : kDanger,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(_message,
                            style: TextStyle(
                              color: _result == 'success' ? kSuccess : kDanger,
                              fontSize: 13,
                              height: 1.4,
                            )),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TGhostButton(
                      label: _result == 'success' ? 'Done' : 'Cancel',
                      onTap: _paying ? null : () => Navigator.pop(context),
                    ),
                  ),
                  if (_result != 'success') ...[
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: TGoldButton(
                        label: _paying ? 'Processing...' : 'Pay Rent',
                        icon: Icons.payments_rounded,
                        onTap: (_paying || _phoneCtrl.text.trim().length < 10) ? null : _payRent,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Whether rent has been paid for an approved application (matches web intent).
bool tenantApplicationRentPaid(Map<String, dynamic> app, {Set<int>? locallyPaidIds}) {
  if (locallyPaidIds != null && locallyPaidIds.contains((app['id'] as num?)?.toInt())) {
    return true;
  }
  if (app['rent_paid'] == true) return true;
  if ((app['rent_payment_status']?.toString() ?? '') == 'paid') return true;
  return false;
}

bool tenantApplicationNeedsRentPayment(Map<String, dynamic> app, {Set<int>? locallyPaidIds}) {
  if (app['can_pay_rent'] == true) return true;
  final status = (app['status']?.toString() ?? '').toLowerCase();
  return status == 'approved' && !tenantApplicationRentPaid(app, locallyPaidIds: locallyPaidIds);
}
