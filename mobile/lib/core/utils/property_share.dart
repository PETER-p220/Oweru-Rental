import 'package:url_launcher/url_launcher.dart';
import 'property_nav.dart';

enum PropertyShareKind { rental, bnb }

class PropertyShare {
  static const String baseOrigin = 'https://rental.oweru.com';

  /// Share preview URL — WhatsApp crawls this for og:image property photo preview.
  static String buildUrl(int propertyId, {int? agentId, PropertyShareKind kind = PropertyShareKind.rental}) {
    final segment = kind == PropertyShareKind.bnb ? 'bnb' : 'property';
    final q = kind == PropertyShareKind.rental && agentId != null ? '?agent=$agentId' : '';
    return '$baseOrigin/api/public/share/$segment/$propertyId$q';
  }

  static String buildPageUrl(int propertyId, {int? agentId, PropertyShareKind kind = PropertyShareKind.rental}) {
    if (kind == PropertyShareKind.bnb) return '$baseOrigin/bnb/$propertyId';
    final q = agentId != null ? '?agent=$agentId' : '';
    return '$baseOrigin/property/$propertyId$q';
  }

  static PropertyShareKind kindFor(Map<String, dynamic> property) {
    if (PropertyNav.isBnbListing(property)) return PropertyShareKind.bnb;
    return PropertyShareKind.rental;
  }

  static String buildMessage(String title, String url) {
    final name = title.trim().isEmpty ? 'this property' : title.trim();
    return 'Check out this property on Oweru: $name\n$url';
  }

  static Future<void> shareWhatsApp(String message) async {
    final uri = Uri.parse('https://wa.me/?text=${Uri.encodeComponent(message)}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
