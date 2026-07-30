import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/utils/property_images.dart';
import '../../../../shared/services/bnb_api_service.dart';
import '../../../../shared/services/user_service.dart';
import 'tenant_my_bnb_stays_page.dart';
import 'tenant_theme.dart';

enum _BookingStep { form, payment, pending, success, failed }

const _providers = [
  ('tigo', 'Tigo Pesa'),
  ('mpesa', 'M-Pesa'),
  ('airtel', 'Airtel Money'),
  ('halopesa', 'Halopesa'),
];

class TenantBnbPropertyDetailPage extends StatefulWidget {
  final int propertyId;
  const TenantBnbPropertyDetailPage({super.key, required this.propertyId});

  @override
  State<TenantBnbPropertyDetailPage> createState() => _TenantBnbPropertyDetailPageState();
}

class _TenantBnbPropertyDetailPageState extends State<TenantBnbPropertyDetailPage> {
  Map<String, dynamic> _property = {};
  bool _loading = true;
  String _error = '';
  DateTime? _checkIn;
  DateTime? _checkOut;
  int _guests = 1;
  bool _submitting = false;
  bool _paying = false;
  _BookingStep _step = _BookingStep.form;
  int? _bookingId;
  String _pendingOrderId = '';
  String _paymentMode = 'mobile_money';
  String _provider = 'tigo';
  String _payError = '';
  String _statusMessage = '';

  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _requestsCtrl = TextEditingController();
  final _payPhoneCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _prefillGuest();
    _load();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _requestsCtrl.dispose();
    _payPhoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _prefillGuest() async {
    await UserService().ensureLoaded();
    final user = UserService();
    if (user.userName != null && user.userName!.trim().isNotEmpty) {
      _nameCtrl.text = user.userName!.trim();
    }
    if (user.userEmail != null && user.userEmail!.trim().isNotEmpty) {
      _emailCtrl.text = user.userEmail!.trim();
    }
  }

  int get _nights {
    if (_checkIn == null || _checkOut == null) return 0;
    return _checkOut!.difference(_checkIn!).inDays;
  }

  num _computeTotal() {
    if (_nights <= 0) return 0;
    final price = num.tryParse(_property['price']?.toString() ?? '0') ?? 0;
    final cleaning = num.tryParse(_property['cleaning_fee']?.toString() ?? '0') ?? 0;
    final service = num.tryParse(_property['service_fee']?.toString() ?? '0') ?? 0;
    return (_nights * price) + cleaning + service;
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = ''; });
    try {
      final data = await BnbApiService.getPublicProperty(widget.propertyId);
      setState(() { _property = data; _loading = false; });
    } catch (_) {
      setState(() { _error = 'Could not load property.'; _loading = false; });
    }
  }

  String _fmt(num? n) {
    final v = (n ?? 0).toDouble();
    if (v >= 1000000) return 'TZS ${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000) return 'TZS ${(v / 1000).toStringAsFixed(0)}k';
    return 'TZS ${v.toStringAsFixed(0)}';
  }

  Future<void> _pickDate(bool isCheckIn) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: isCheckIn ? now.add(const Duration(days: 1)) : (_checkIn ?? now).add(const Duration(days: 2)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked == null) return;
    setState(() {
      if (isCheckIn) {
        _checkIn = picked;
        if (_checkOut != null && !_checkOut!.isAfter(_checkIn!)) _checkOut = null;
      } else {
        _checkOut = picked;
      }
    });
  }

  int? _parseBookingId(dynamic data) {
    if (data is! Map) return null;
    final raw = data['booking_id'] ?? data['id'];
    if (raw is int) return raw;
    return int.tryParse(raw?.toString() ?? '');
  }

  Future<void> _createBooking() async {
    if (_checkIn == null || _checkOut == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select check-in and check-out dates')));
      return;
    }
    if (_nights <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Check-out must be after check-in')));
      return;
    }
    if (_nameCtrl.text.trim().isEmpty || _emailCtrl.text.trim().isEmpty || _phoneCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name, email, and phone are required')));
      return;
    }

    final maxGuests = int.tryParse(_property['max_guests']?.toString() ?? '') ?? 20;
    if (_guests > maxGuests) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Maximum $maxGuests guests allowed')));
      return;
    }

    await UserService().ensureLoaded();
    if (UserService().token == null || UserService().token!.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to book and pay securely.')),
      );
      await Navigator.pushNamed(context, '/login');
      return;
    }

    setState(() { _submitting = true; _payError = ''; });
    final res = await BnbApiService.createGuestBooking({
      'property_id': widget.propertyId,
      'property_title': _property['title']?.toString(),
      'customer_name': _nameCtrl.text.trim(),
      'customer_email': _emailCtrl.text.trim(),
      'customer_phone': _phoneCtrl.text.trim(),
      'check_in': _checkIn!.toIso8601String().split('T').first,
      'check_out': _checkOut!.toIso8601String().split('T').first,
      'guest_count': _guests,
      'guests': _guests,
      'special_requests': _requestsCtrl.text.trim().isEmpty ? null : _requestsCtrl.text.trim(),
      'total_amount': _computeTotal(),
    });
    if (!mounted) return;

    if (res['success'] == true) {
      final bookingId = _parseBookingId(res['data']);
      setState(() {
        _submitting = false;
        _bookingId = bookingId;
        _payPhoneCtrl.text = _phoneCtrl.text.trim();
        _step = _BookingStep.payment;
      });
    } else {
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message']?.toString() ?? 'Booking failed')),
      );
    }
  }

  Future<void> _pollPayment(String orderId) async {
    for (var attempt = 0; attempt < 40; attempt++) {
      if (!mounted || _step != _BookingStep.pending) return;
      await Future.delayed(const Duration(seconds: 3));
      final res = await BnbApiService.checkBookingPaymentStatus(orderId);
      final status = res['payment_status']?.toString().toLowerCase();
      if (status == 'paid') {
        if (!mounted) return;
        setState(() {
          _step = _BookingStep.success;
          _statusMessage = res['message']?.toString() ?? 'Payment confirmed. Your stay is booked.';
        });
        return;
      }
      if (status == 'failed') {
        if (!mounted) return;
        setState(() {
          _step = _BookingStep.failed;
          _payError = res['message']?.toString() ?? 'Payment was not completed.';
        });
        return;
      }
    }
    if (!mounted) return;
    setState(() {
      _statusMessage = 'Payment submitted. Confirmation may take a moment — check My Stays.';
    });
  }

  Future<void> _pay() async {
    if (_bookingId == null) return;
    final phone = _payPhoneCtrl.text.trim();
    if (_paymentMode == 'mobile_money' && phone.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid payment phone number')),
      );
      return;
    }

    setState(() { _paying = true; _payError = ''; });
    final res = await BnbApiService.initiateBookingPayment(
      _bookingId!,
      paymentMode: _paymentMode,
      phoneNumber: phone.isNotEmpty ? phone : _phoneCtrl.text.trim(),
      provider: _paymentMode == 'mobile_money' ? _provider : null,
    );
    if (!mounted) return;
    setState(() => _paying = false);

    if (res['success'] != true) {
      setState(() {
        _payError = res['message']?.toString() ?? 'Payment failed';
        _step = _BookingStep.failed;
      });
      return;
    }

    final data = res['data'];
    final orderId = data is Map
        ? (data['order_id'] ?? data['transaction_id'])?.toString() ?? ''
        : '';
    final checkoutUrl = data is Map ? data['checkout_url']?.toString() : null;

    if (_paymentMode == 'bank' && checkoutUrl != null && checkoutUrl.isNotEmpty) {
      final uri = Uri.parse(checkoutUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }

    setState(() {
      _pendingOrderId = orderId;
      _statusMessage = res['message']?.toString() ??
          (_paymentMode == 'bank'
              ? 'Complete payment in the browser, then return here.'
              : 'Approve the ${_provider.toUpperCase()} prompt on your phone.');
      _step = _BookingStep.pending;
    });

    if (orderId.isNotEmpty) {
      _pollPayment(orderId);
    }
  }

  InputDecoration _field(String label) => InputDecoration(
        labelText: label,
        filled: true,
        fillColor: kWhite,
        border: const OutlineInputBorder(),
      );

  Widget _buildFormStep() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Book this stay', style: TextStyle(fontWeight: FontWeight.w700, color: kSlate800)),
      const SizedBox(height: 12),
      TextField(controller: _nameCtrl, decoration: _field('Full name')),
      const SizedBox(height: 10),
      TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, decoration: _field('Email')),
      const SizedBox(height: 10),
      TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone, decoration: _field('Phone (for payment)')),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: OutlinedButton(onPressed: () => _pickDate(true), child: Text(_checkIn == null ? 'Check-in' : '${_checkIn!.day}/${_checkIn!.month}/${_checkIn!.year}'))),
        const SizedBox(width: 8),
        Expanded(child: OutlinedButton(onPressed: () => _pickDate(false), child: Text(_checkOut == null ? 'Check-out' : '${_checkOut!.day}/${_checkOut!.month}/${_checkOut!.year}'))),
      ]),
      const SizedBox(height: 12),
      Row(children: [
        const Text('Guests', style: TextStyle(color: kSlate600)),
        const Spacer(),
        IconButton(onPressed: _guests > 1 ? () => setState(() => _guests--) : null, icon: const Icon(Icons.remove_circle_outline)),
        Text('$_guests', style: const TextStyle(fontWeight: FontWeight.w700)),
        IconButton(onPressed: () => setState(() => _guests++), icon: const Icon(Icons.add_circle_outline)),
      ]),
      const SizedBox(height: 12),
      TextField(controller: _requestsCtrl, maxLines: 2, decoration: _field('Special requests (optional)')),
      if (_nights > 0) ...[
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: kWarningBg, borderRadius: BorderRadius.circular(10), border: Border.all(color: kGold.withValues(alpha: 0.35))),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(_fmt(_computeTotal()), style: const TextStyle(fontWeight: FontWeight.w800, color: kSlate800)),
            Text('$_nights night${_nights == 1 ? '' : 's'}', style: const TextStyle(color: kSlate500, fontSize: 12)),
          ]),
        ),
      ],
      const SizedBox(height: 16),
      SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kSlate900, padding: const EdgeInsets.symmetric(vertical: 14)),
          onPressed: (_submitting || _nights <= 0) ? null : _createBooking,
          child: _submitting
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Continue to payment', style: TextStyle(fontWeight: FontWeight.w800)),
        ),
      ),
    ]);
  }

  Widget _buildPaymentStep() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Pay ${_fmt(_computeTotal())}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: kSlate800)),
      const SizedBox(height: 6),
      const Text('Complete payment to confirm your stay.', style: TextStyle(color: kSlate500, fontSize: 13)),
      const SizedBox(height: 16),
      Row(children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => setState(() => _paymentMode = 'mobile_money'),
            style: OutlinedButton.styleFrom(
              backgroundColor: _paymentMode == 'mobile_money' ? kGoldDim : null,
              side: BorderSide(color: _paymentMode == 'mobile_money' ? kGold : kBorder),
            ),
            child: const Text('Mobile money', style: TextStyle(fontSize: 12)),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton(
            onPressed: () => setState(() => _paymentMode = 'bank'),
            style: OutlinedButton.styleFrom(
              backgroundColor: _paymentMode == 'bank' ? kGoldDim : null,
              side: BorderSide(color: _paymentMode == 'bank' ? kGold : kBorder),
            ),
            child: const Text('Bank / card', style: TextStyle(fontSize: 12)),
          ),
        ),
      ]),
      const SizedBox(height: 12),
      TextField(
        controller: _payPhoneCtrl,
        keyboardType: TextInputType.phone,
        decoration: _field('Payment phone number'),
      ),
      if (_paymentMode == 'mobile_money') ...[
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _providers.map((p) {
            final active = _provider == p.$1;
            return ChoiceChip(
              label: Text(p.$2, style: const TextStyle(fontSize: 11)),
              selected: active,
              onSelected: (_) => setState(() => _provider = p.$1),
              selectedColor: kGoldDim,
            );
          }).toList(),
        ),
      ] else ...[
        const SizedBox(height: 8),
        const Text(
          'You will be redirected to Selcom secure checkout to pay by bank transfer or card.',
          style: TextStyle(color: kSlate500, fontSize: 12, height: 1.4),
        ),
      ],
      if (_payError.isNotEmpty) ...[
        const SizedBox(height: 10),
        Text(_payError, style: const TextStyle(color: kDanger, fontSize: 13)),
      ],
      const SizedBox(height: 16),
      SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kSlate900, padding: const EdgeInsets.symmetric(vertical: 14)),
          onPressed: _paying ? null : _pay,
          child: _paying
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : Text(
                  _paymentMode == 'bank' ? 'Continue to bank checkout' : 'Pay with ${_provider.toUpperCase()}',
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
        ),
      ),
      TextButton(
        onPressed: () => setState(() { _step = _BookingStep.form; _payError = ''; }),
        child: const Text('Back to dates'),
      ),
    ]);
  }

  Widget _buildPendingStep() {
    return Column(children: [
      const SizedBox(height: 24),
      const CircularProgressIndicator(color: kGold),
      const SizedBox(height: 20),
      const Text('Waiting for payment', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: kSlate800)),
      const SizedBox(height: 8),
      Text(_statusMessage, textAlign: TextAlign.center, style: const TextStyle(color: kSlate500, fontSize: 13, height: 1.5)),
      if (_pendingOrderId.isNotEmpty) ...[
        const SizedBox(height: 10),
        Text('Ref: $_pendingOrderId', style: const TextStyle(color: kSlate400, fontSize: 11)),
      ],
    ]);
  }

  Widget _buildSuccessStep() {
    return Column(children: [
      const SizedBox(height: 24),
      const Icon(Icons.check_circle_rounded, color: kSuccess, size: 56),
      const SizedBox(height: 16),
      const Text('Booking confirmed', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: kSuccess)),
      const SizedBox(height: 8),
      Text(_statusMessage, textAlign: TextAlign.center, style: const TextStyle(color: kSlate500, fontSize: 13)),
      const SizedBox(height: 20),
      SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kSlate900, padding: const EdgeInsets.symmetric(vertical: 14)),
          onPressed: () => Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const TenantMyBnbStaysPage()),
          ),
          child: const Text('View My Stays', style: TextStyle(fontWeight: FontWeight.w800)),
        ),
      ),
    ]);
  }

  Widget _buildFailedStep() {
    return Column(children: [
      const SizedBox(height: 24),
      const Icon(Icons.error_outline_rounded, color: kDanger, size: 48),
      const SizedBox(height: 12),
      const Text('Payment failed', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: kDanger)),
      const SizedBox(height: 8),
      Text(_payError.isNotEmpty ? _payError : 'Payment was not completed.', textAlign: TextAlign.center, style: const TextStyle(color: kSlate500, fontSize: 13)),
      const SizedBox(height: 20),
      SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: () => setState(() { _step = _BookingStep.payment; _payError = ''; }),
          child: const Text('Try again'),
        ),
      ),
    ]);
  }

  Widget _buildBookingPanel() {
    switch (_step) {
      case _BookingStep.form:
        return _buildFormStep();
      case _BookingStep.payment:
        return _buildPaymentStep();
      case _BookingStep.failed:
        return _buildFailedStep();
      case _BookingStep.pending:
        return _buildPendingStep();
      case _BookingStep.success:
        return _buildSuccessStep();
    }
  }

  @override
  Widget build(BuildContext context) {
    final img = getPropertyImageUrl(_property);

    return Scaffold(
      backgroundColor: kBg,
      appBar: tenantPageAppBar(_property['title']?.toString() ?? 'BnB Stay'),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kGold))
          : _error.isNotEmpty
              ? TErrorState(message: _error, onRetry: _load)
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    if (_step == _BookingStep.form) ...[
                      if (img.isNotEmpty)
                        ClipRRect(borderRadius: BorderRadius.circular(14), child: Image.network(img, height: 200, width: double.infinity, fit: BoxFit.cover))
                      else
                        Container(height: 200, width: double.infinity, decoration: BoxDecoration(color: kSlate200, borderRadius: BorderRadius.circular(14)), child: const Icon(Icons.hotel_rounded, size: 48, color: kSlate400)),
                      const SizedBox(height: 16),
                      Text(_property['title']?.toString() ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: kSlate800)),
                      const SizedBox(height: 6),
                      Row(children: [
                        const Icon(Icons.location_on_outlined, size: 16, color: kSlate500),
                        const SizedBox(width: 4),
                        Expanded(child: Text(_property['location']?.toString() ?? '—', style: const TextStyle(color: kSlate500))),
                      ]),
                      const SizedBox(height: 12),
                      Text('${_fmt(num.tryParse(_property['price']?.toString() ?? '0'))} / night', style: const TextStyle(color: kGold, fontSize: 18, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 16),
                      Text(_property['description']?.toString() ?? '', style: const TextStyle(color: kSlate600, height: 1.5)),
                      const SizedBox(height: 24),
                    ],
                    _buildBookingPanel(),
                  ]),
                ),
    );
  }
}
