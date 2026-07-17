import 'package:flutter/material.dart';
import '../../../../core/utils/payment_duration.dart';
import '../../../shared/services/commercial_api_service.dart';

const _kBg = Color(0xFF0F1218);
const _kCard = Color(0xFF162035);
const _kBorder = Color(0xFF2A2418);
const _kGold = Color(0xFFC9A84C);
const _kCream = Color(0xFFE8E1D5);
const _kSlate = Color(0xFF8B8680);

class CommercialAddPropertyPage extends StatefulWidget {
  const CommercialAddPropertyPage({super.key});

  @override
  State<CommercialAddPropertyPage> createState() => _CommercialAddPropertyPageState();
}

class _CommercialAddPropertyPageState extends State<CommercialAddPropertyPage> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _location = TextEditingController();
  final _address = TextEditingController();
  final _price = TextEditingController();
  final _area = TextEditingController();
  final _contactPhone = TextEditingController();
  final _contactEmail = TextEditingController();

  String _type = 'office';
  String _priceType = 'monthly';
  int _paymentDurationMonths = 3;
  bool _saving = false;
  String _error = '';

  final _types = ['office', 'retail', 'warehouse', 'commercial', 'industrial', 'residential'];
  final _priceTypes = [
    ('monthly', 'Monthly'),
    ('yearly', 'Yearly'),
    ('sale', 'Sale'),
  ];

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _location.dispose();
    _address.dispose();
    _price.dispose();
    _area.dispose();
    _contactPhone.dispose();
    _contactEmail.dispose();
    super.dispose();
  }

  String? _validate() {
    if (_title.text.trim().isEmpty) return 'Title is required';
    if (_description.text.trim().isEmpty) return 'Description is required';
    if (_location.text.trim().isEmpty) return 'Location is required';
    if (_address.text.trim().isEmpty) return 'Address is required';
    final price = double.tryParse(_price.text.trim());
    if (price == null || price <= 0) return 'Price must be greater than 0';
    final area = double.tryParse(_area.text.trim());
    if (area == null || area <= 0) return 'Area must be greater than 0';
    if (_contactPhone.text.trim().isEmpty) return 'Contact phone is required';
    if (_contactEmail.text.trim().isEmpty) return 'Contact email is required';
    if (_priceType != 'sale' && _paymentDurationMonths <= 0) {
      return 'Payment period is required for rentals';
    }
    return null;
  }

  Future<void> _submit() async {
    final err = _validate();
    if (err != null) {
      setState(() => _error = err);
      return;
    }

    setState(() {
      _saving = true;
      _error = '';
    });

    try {
      final today = DateTime.now().toIso8601String().split('T').first;
      final result = await CommercialApiService.createProperty({
        'title': _title.text.trim(),
        'description': _description.text.trim(),
        'type': _type,
        'location': _location.text.trim(),
        'address': _address.text.trim(),
        'price': double.parse(_price.text.trim()),
        'price_type': _priceType,
        'payment_duration_months': _priceType == 'sale' ? 1 : _paymentDurationMonths,
        'area': double.parse(_area.text.trim()),
        'bedrooms': 0,
        'bathrooms': 0,
        'parking_spaces': 0,
        'furnished': false,
        'available_from': today,
        'contact_phone': _contactPhone.text.trim(),
        'contact_email': _contactEmail.text.trim(),
      });

      if (!mounted) return;

      final hasProperty = result['property'] != null || result['data'] != null;
      if (result['success'] == false && !hasProperty) {
        setState(() {
          _error = result['message']?.toString() ?? 'Failed to create property';
          _saving = false;
        });
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Property submitted for approval')),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to create property. Please try again.';
        _saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final price = double.tryParse(_price.text.trim()) ?? 0;

    return Scaffold(
      backgroundColor: _kBg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1D26),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _kSlate),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Add Property', style: TextStyle(color: _kCream, fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_error.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
                ),
                child: Text(_error, style: const TextStyle(color: Colors.red, fontSize: 13)),
              ),
            _section('Basic Information', [
              _field('Title *', _title, 'e.g., Prime Office Space'),
              _field('Description *', _description, 'Describe the property...', maxLines: 4),
              _dropdown('Property Type *', _type, _types, (v) => setState(() => _type = v)),
              _field('Location *', _location, 'e.g., Dar es Salaam'),
              _field('Address *', _address, 'Full street address'),
            ]),
            const SizedBox(height: 16),
            _section('Pricing', [
              _field('Price (TZS) *', _price, '500000', keyboardType: TextInputType.number),
              _dropdown('Price Type *', _priceType, _priceTypes.map((e) => e.$1).toList(),
                  (v) => setState(() => _priceType = v),
                  labels: Map.fromEntries(_priceTypes.map((e) => MapEntry(e.$1, e.$2)))),
              if (_priceType != 'sale')
                _durationDropdown(),
              _field('Area (m²) *', _area, '120', keyboardType: TextInputType.number),
              if (_priceType != 'sale' && price > 0)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    'Tenant pays TZS ${periodRentTotal(price, _paymentDurationMonths).toStringAsFixed(0)} ${formatPaymentPeriodLabel(_paymentDurationMonths)}',
                    style: const TextStyle(color: _kGold, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
            ]),
            const SizedBox(height: 16),
            _section('Contact', [
              _field('Contact Phone *', _contactPhone, '0712 345 678', keyboardType: TextInputType.phone),
              _field('Contact Email *', _contactEmail, 'owner@example.com', keyboardType: TextInputType.emailAddress),
            ]),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _saving ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: _kGold,
                foregroundColor: _kBg,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: _saving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: _kBg))
                  : const Text('Submit Property', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: _kCream, fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          ...children.map((w) => Padding(padding: const EdgeInsets.only(bottom: 14), child: w)),
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController controller, String hint,
      {TextInputType? keyboardType, int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: _kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          onChanged: (_) => setState(() {}),
          style: const TextStyle(color: _kCream),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: _kSlate.withValues(alpha: 0.5)),
            filled: true,
            fillColor: const Color(0xFF1E2D4A),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: _kBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: _kBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: _kGold)),
          ),
        ),
      ],
    );
  }

  Widget _dropdown(String label, String value, List<String> items, ValueChanged<String> onChanged,
      {Map<String, String>? labels}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: _kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF1E2D4A),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: _kBorder),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              dropdownColor: const Color(0xFF1E2D4A),
              style: const TextStyle(color: _kCream),
              items: items.map((item) => DropdownMenuItem(
                value: item,
                child: Text(labels?[item] ?? item),
              )).toList(),
              onChanged: (v) { if (v != null) onChanged(v); },
            ),
          ),
        ),
      ],
    );
  }

  Widget _durationDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Payment Period *', style: TextStyle(color: _kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF1E2D4A),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: _kBorder),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<int>(
              value: _paymentDurationMonths,
              isExpanded: true,
              dropdownColor: const Color(0xFF1E2D4A),
              style: const TextStyle(color: _kCream),
              items: paymentDurationOptions.map((opt) => DropdownMenuItem(
                value: opt.value,
                child: Text(opt.label),
              )).toList(),
              onChanged: (v) { if (v != null) setState(() => _paymentDurationMonths = v); },
            ),
          ),
        ),
      ],
    );
  }
}
