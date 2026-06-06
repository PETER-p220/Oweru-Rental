import 'dart:convert';

import 'package:flutter/material.dart';
import '../digital_contract/digital_contract_utils.dart';
import 'signature_pad_widget.dart';
import '../../features/tenant/presentation/pages/tenant_theme.dart';

/// Tenant contract signing UI — mirrors web `ContractSigningModal`.
class TenantContractSigningSheet extends StatefulWidget {
  final Map<String, dynamic> contract;
  final Future<bool> Function(int contractId, Map<String, String> fields, String signature) onSubmit;
  final Future<void> Function(int contractId, String fileName)? onDownload;

  const TenantContractSigningSheet({
    super.key,
    required this.contract,
    required this.onSubmit,
    this.onDownload,
  });

  @override
  State<TenantContractSigningSheet> createState() => _TenantContractSigningSheetState();
}

class _TenantContractSigningSheetState extends State<TenantContractSigningSheet> {
  late Map<String, String> _fieldValues;
  final Map<String, TextEditingController> _controllers = {};
  String _signatureDataUrl = '';
  bool _showSignPad = false;
  bool _submitting = false;
  String? _error;
  String? _expandedSection;

  List<ContractField> get _allFields => parseContractFieldsFromContract(widget.contract);
  List<ContractField> get _visibleFields => _allFields.where((f) => !f.landlordOnly).toList();
  List<ContractField> get _dataFields => _visibleFields.where((f) => f.type != 'signature').toList();

  String get _status => widget.contract['status']?.toString() ?? '';
  bool get _isReadOnly => _status == 'approved' || _status == 'pending_review';
  bool get _canSign => _status == 'pending_signature';

  @override
  void initState() {
    super.initState();
    _fieldValues = {};
    for (final f in _dataFields) {
      final initial = f.tenantValue ?? f.value ?? '';
      _fieldValues[f.id] = initial;
      _controllers[f.id] = TextEditingController(text: initial);
    }
    _signatureDataUrl = widget.contract['tenant_signature']?.toString() ?? '';
    _expandedSection = fieldSections.isNotEmpty ? fieldSections.first.title : null;
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sm = contractStatusMeta(_status);
    final property = widget.contract['property'] as Map<String, dynamic>?;
    final title = widget.contract['title']?.toString() ?? 'Mkataba';

    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: const BoxDecoration(
          color: kBg2,
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        child: Column(
          children: [
            Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              decoration: BoxDecoration(
                color: kGold.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const TLabel('MKATABA WA KIDIJITALI'),
                            const SizedBox(height: 6),
                            Text(title, style: kHeadingStyle.copyWith(fontSize: 20)),
                            if (property != null) ...[
                              const SizedBox(height: 6),
                              Text(
                                [property['title'], property['location']].whereType<String>().where((s) => s.isNotEmpty).join(' — '),
                                style: kSubheadStyle,
                              ),
                            ],
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, color: kSlate),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _statusBanner(sm),
                  if (_hasFile) _fileBar(),
                  const SizedBox(height: 16),
                  if (_dataFields.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Text(
                        'Mkataba huu hauna sehemu za kujaza. Pakua hati ili kusoma maudhui yote.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: kSlate, fontSize: 14),
                      ),
                    )
                  else
                    ..._buildSections(),
                  if (_canSign || _signatureDataUrl.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _signatureBlock(),
                  ],
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!, style: const TextStyle(color: kDanger, fontSize: 13)),
                  ],
                  const SizedBox(height: 20),
                  if (_canSign && !_isReadOnly)
                    TGoldButton(
                      label: _submitting ? 'Inawasilishwa...' : 'Wasilisha Mkataba',
                      icon: Icons.send_rounded,
                      onTap: _submitting ? null : _handleSubmit,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool get _hasFile {
    final url = widget.contract['file_url'];
    final name = widget.contract['file_name'];
    return (url != null && url.toString().isNotEmpty) || (name != null && name.toString().isNotEmpty);
  }

  Widget _statusBanner(ContractStatusMeta sm) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: sm.color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: sm.color.withValues(alpha: 0.35)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(sm.icon, color: sm.color, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(sm.label, style: TextStyle(color: sm.color, fontWeight: FontWeight.w600, fontSize: 14)),
                if (sm.description.isNotEmpty)
                  Text(sm.description, style: const TextStyle(color: kSlate, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _fileBar() {
    final name = widget.contract['file_name']?.toString() ?? 'mkataba.pdf';
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kGoldDim,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kGoldBorder),
      ),
      child: Row(
        children: [
          const Icon(Icons.description_rounded, color: kGold),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 14)),
                const Text('Hati ya mkataba — pakua ili kusoma vizuri',
                    style: TextStyle(color: kSlate, fontSize: 12)),
              ],
            ),
          ),
          if (widget.onDownload != null)
            TextButton.icon(
              onPressed: () => widget.onDownload!((widget.contract['id'] as num).toInt(), name),
              icon: const Icon(Icons.download_rounded, size: 16),
              label: const Text('Pakua'),
            ),
        ],
      ),
    );
  }

  List<Widget> _buildSections() {
    final widgets = <Widget>[];
    for (final section in fieldSections) {
      final fields = _dataFields.where((f) => section.ids.contains(f.id)).toList();
      if (fields.isEmpty) continue;
      final isOpen = _expandedSection == section.title;
      widgets.add(
        Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: kBg3,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: kBorder),
          ),
          child: Column(
            children: [
              InkWell(
                onTap: () => setState(() => _expandedSection = isOpen ? null : section.title),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(section.title,
                            style: const TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 14)),
                      ),
                      Icon(isOpen ? Icons.expand_less : Icons.expand_more, color: kSlate, size: 20),
                    ],
                  ),
                ),
              ),
              if (isOpen)
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                  child: Column(
                    children: fields.map(_fieldInput).toList(),
                  ),
                ),
            ],
          ),
        ),
      );
    }
    final ungrouped = _dataFields.where((f) => !allSectionIds.contains(f.id)).toList();
    if (ungrouped.isNotEmpty) {
      widgets.add(Column(children: ungrouped.map(_fieldInput).toList()));
    }
    return widgets;
  }

  Widget _fieldInput(ContractField field) {
    final ctrl = _controllers[field.id]!;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${field.label}${field.required ? ' *' : ''}',
              style: const TextStyle(color: kSlate, fontSize: 12)),
          const SizedBox(height: 6),
          TextField(
            enabled: !_isReadOnly,
            maxLines: field.type == 'textarea' ? 4 : 1,
            keyboardType: _keyboardFor(field.type),
            controller: ctrl,
            onChanged: (v) => _fieldValues[field.id] = v,
            style: const TextStyle(color: kCream, fontSize: 13),
            decoration: _inputDecor(field.placeholder),
          ),
        ],
      ),
    );
  }

  TextInputType _keyboardFor(String type) {
    if (type == 'number') return TextInputType.number;
    return TextInputType.text;
  }

  InputDecoration _inputDecor(String? hint) => InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: kSlateDim),
        filled: true,
        fillColor: kBg,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kBorder)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      );

  Widget _buildSignaturePreview() {
    if (_signatureDataUrl.isEmpty) {
      return const SizedBox.shrink();
    }
    if (_signatureDataUrl.startsWith('data:image')) {
      try {
        final b64 = _signatureDataUrl.split(',').last;
        final bytes = base64Decode(b64);
        return Image.memory(bytes, height: 60, fit: BoxFit.contain);
      } catch (_) {}
    }
    return const Text('Sahihi imehifadhiwa', style: TextStyle(color: kSlate));
  }

  Widget _signatureBlock() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const TLabel('SAHIHI YA MPANGAJI'),
        const SizedBox(height: 10),
        if (_signatureDataUrl.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              border: Border.all(color: kBorder),
              borderRadius: BorderRadius.circular(8),
              color: kBg3,
            ),
            child: _buildSignaturePreview(),
          ),
        if (_canSign && !_isReadOnly) ...[
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () => setState(() => _showSignPad = true),
            icon: const Icon(Icons.draw_rounded, color: kGold, size: 18),
            label: Text(_signatureDataUrl.isEmpty ? 'Chora Sahihi' : 'Badilisha Sahihi',
                style: const TextStyle(color: kGold)),
            style: OutlinedButton.styleFrom(side: const BorderSide(color: kGoldBorder)),
          ),
        ],
        if (_showSignPad)
          SignaturePadWidget(
            strokeColor: kGold,
            onCancel: () => setState(() => _showSignPad = false),
            onSave: (dataUrl) => setState(() {
              _signatureDataUrl = dataUrl;
              _showSignPad = false;
            }),
          ),
      ],
    );
  }

  Future<void> _handleSubmit() async {
    setState(() => _error = null);
    final missing = _dataFields.where((f) => f.required && !(_fieldValues[f.id]?.trim().isNotEmpty ?? false));
    if (missing.isNotEmpty) {
      setState(() => _error = 'Tafadhali jaza: ${missing.map((f) => f.label).join(', ')}');
      return;
    }
    if (_signatureDataUrl.isEmpty) {
      setState(() => _error = 'Tafadhali toa sahihi yako kabla ya kuwasilisha.');
      return;
    }
    setState(() => _submitting = true);
    final ok = await widget.onSubmit(
      (widget.contract['id'] as num).toInt(),
      Map<String, String>.from(_fieldValues),
      _signatureDataUrl,
    );
    if (!mounted) return;
    setState(() => _submitting = false);
    if (ok) {
      Navigator.pop(context, true);
    } else {
      setState(() => _error = 'Imeshindwa kuwasilisha mkataba. Jaribu tena.');
    }
  }
}
