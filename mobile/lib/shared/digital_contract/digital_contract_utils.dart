import 'dart:convert';

import 'package:flutter/material.dart';

/// Contract field — mirrors frontend `ContractField`.
class ContractField {
  final String id;
  final String label;
  final String type;
  final bool required;
  final String? value;
  final String? placeholder;
  final bool landlordOnly;
  final String? tenantValue;

  const ContractField({
    required this.id,
    required this.label,
    required this.type,
    required this.required,
    this.value,
    this.placeholder,
    this.landlordOnly = false,
    this.tenantValue,
  });

  factory ContractField.fromJson(Map<String, dynamic> json) {
    return ContractField(
      id: json['id']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
      type: json['type']?.toString() ?? 'text',
      required: json['required'] == true,
      value: json['value']?.toString(),
      placeholder: json['placeholder']?.toString(),
      landlordOnly: json['landlord_only'] == true || json['landlordOnly'] == true,
      tenantValue: json['tenant_value']?.toString(),
    );
  }
}

List<ContractField> parseContractFields(dynamic raw) {
  if (raw is List) {
    return raw
        .whereType<Map>()
        .map((e) => ContractField.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }
  if (raw is String && raw.isNotEmpty) {
    try {
      final decoded = jsonDecode(raw);
      return parseContractFields(decoded);
    } catch (_) {}
  }
  return [];
}

List<ContractField> parseContractFieldsFromContract(Map<String, dynamic> contract) {
  return parseContractFields(contract['fields']);
}

/// Accordion sections — same IDs as frontend `FIELD_SECTIONS`.
const fieldSections = [
  (
    title: 'Taarifa za Mpangaji',
    ids: [
      'tenant_full_name', 'tenant_nida', 'tenant_phone', 'tenant_nationality',
      'tenant_occupation', 'tenant_address', 'tenant_gender', 'tenant_age',
    ],
  ),
  (
    title: 'Taarifa za Mali / Chumba',
    ids: [
      'room_number', 'room_purpose',
      'house_number', 'house_location', 'house_bedrooms', 'house_livingrooms',
      'house_kitchens', 'house_bathrooms', 'house_purpose', 'tenant_count',
    ],
  ),
  (
    title: 'Muda na Kodi',
    ids: ['start_date', 'end_date', 'contract_months', 'monthly_rent', 'total_paid', 'paid_months'],
  ),
  (
    title: 'Taarifa za Mdhamini',
    ids: ['guarantor_name', 'guarantor_nida', 'guarantor_phone', 'guarantor_address', 'guarantor_nationality'],
  ),
  (
    title: 'Masharti ya Ziada',
    ids: ['property_items', 'special_terms'],
  ),
];

final allSectionIds = fieldSections.expand((s) => s.ids).toSet();

bool contractIsVisibleToTenant(Map<String, dynamic> contract) {
  return (contract['status']?.toString() ?? '') != 'draft';
}

class ContractStatusMeta {
  final String label;
  final Color color;
  final IconData icon;
  final String description;

  const ContractStatusMeta({
    required this.label,
    required this.color,
    required this.icon,
    this.description = '',
  });
}

ContractStatusMeta contractStatusMeta(String status) {
  switch (status) {
    case 'pending_signature':
      return const ContractStatusMeta(
        label: 'Inasubiri Sahihi Yako',
        color: Color(0xFFC9A84C),
        icon: Icons.draw_rounded,
        description: 'Jaza sehemu zote kisha toa sahihi yako chini ya fomu.',
      );
    case 'pending_review':
      return const ContractStatusMeta(
        label: 'Inakaguliwa na Mpangishaji',
        color: Color(0xFF3B82F6),
        icon: Icons.schedule_rounded,
        description: 'Mpangishaji anakagua mkataba wako uliosainishwa.',
      );
    case 'approved':
      return const ContractStatusMeta(
        label: 'Imeidhinishwa',
        color: Color(0xFF16A34A),
        icon: Icons.check_circle_rounded,
        description: 'Mkataba wako umekubaliwa na mpangishaji. Karibu!',
      );
    case 'rejected':
      return const ContractStatusMeta(
        label: 'Imekataliwa',
        color: Color(0xFFDC2626),
        icon: Icons.error_outline_rounded,
        description: 'Mkataba ulikataliwa. Wasiliana na mpangishaji.',
      );
    case 'draft':
      return const ContractStatusMeta(
        label: 'Rasimu',
        color: Color(0xFF6B7280),
        icon: Icons.description_outlined,
      );
    default:
      return ContractStatusMeta(
        label: status.replaceAll('_', ' '),
        color: const Color(0xFF94A3B8),
        icon: Icons.info_outline_rounded,
      );
  }
}
