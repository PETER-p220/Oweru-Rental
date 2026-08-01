import 'package:url_launcher/url_launcher.dart';

class PropertyShare {
  static const String baseOrigin = 'https://rental.oweru.com';

  /// Share preview URL — WhatsApp crawls this for og:image property photo preview.
  static String buildUrl(int propertyId, {int? agentId}) {
    final q = agentId != null ? '?agent=$agentId' : '';
    return '$baseOrigin/api/public/share/property/$propertyId$q';
  }

  /// Direct SPA property page (no rich preview).
  static String buildPageUrl(int propertyId, {int? agentId}) {
    final q = agentId != null ? '?agent=$agentId' : '';
    return '$baseOrigin/property/$propertyId$q';
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
