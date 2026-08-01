import 'package:flutter/material.dart';
import '../../features/tenant/presentation/pages/tenant_bnb_property_detail_page.dart';
import '../../features/shared/pages/public_property_detail_page.dart';
import '../../features/tenant/presentation/pages/property_detail_page.dart';

class PropertyNav {
  static bool isBnbListing(Map<String, dynamic> property) {
    if (property['listing_type'] == 'bnb') return true;
    final type = (property['type'] ?? '').toString().toLowerCase();
    if (type.contains('bnb') || type.contains('short')) return true;
    if (property['max_guests'] != null) return true;
    return false;
  }

  static int? propertyId(Map<String, dynamic> property) {
    final raw = property['id'];
    if (raw is int) return raw;
    if (raw is String) return int.tryParse(raw);
    return null;
  }

  static void openDetail(BuildContext context, Map<String, dynamic> property, {bool useTenantPage = false}) {
    if (isBnbListing(property)) {
      final id = propertyId(property);
      if (id == null) return;
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => TenantBnbPropertyDetailPage(propertyId: id)),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => useTenantPage
            ? PropertyDetailPage(property: property)
            : PublicPropertyDetailPage(property: property),
      ),
    );
  }
}
