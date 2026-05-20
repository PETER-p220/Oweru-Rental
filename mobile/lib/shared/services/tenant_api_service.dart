import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/auth_service.dart';
import '../../core/constants/api_config.dart';

class TenantApiService {
  static const String _baseUrl = ApiConfig.apiPath;
  static Map<String, String> get _headers => {
    'Accept': 'application/json',
    'Authorization': 'Bearer ${AuthService.token}',
    'Content-Type': 'application/json',
  };

  static Future<Map<String, dynamic>> getDashboard() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/dashboard'), headers: _headers);
      if (response.statusCode == 200) return jsonDecode(response.body);
    } catch (_) {}
    return {};
  }

  static Future<List<Map<String, dynamic>>> getApplications() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/applications'), headers: _headers);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final applications = data['data'] ?? data;
        return List<Map<String, dynamic>>.from((applications is List ? applications : []).cast<Map<String, dynamic>>());
      }
    } catch (_) {}
    return [];
  }

  static Future<List<Map<String, dynamic>>> getSavedProperties() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/saved-properties'), headers: _headers);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final properties = data['data'] ?? data;
        return List<Map<String, dynamic>>.from((properties is List ? properties : []).cast<Map<String, dynamic>>());
      }
    } catch (_) {}
    return [];
  }

  static Future<List<Map<String, dynamic>>> getPayments() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/payments'), headers: _headers);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final payments = data['data'] ?? data;
        return List<Map<String, dynamic>>.from((payments is List ? payments : []).cast<Map<String, dynamic>>());
      }
    } catch (_) {}
    return [];
  }

  static Future<List<Map<String, dynamic>>> getPaymentHistory() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/payment-history'), headers: _headers);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final history = data['data'] ?? data;
        return List<Map<String, dynamic>>.from((history is List ? history : []).cast<Map<String, dynamic>>());
      }
    } catch (_) {}
    return [];
  }

  static Future<Map<String, dynamic>> getPaymentStats() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/payment-stats'), headers: _headers);
      if (response.statusCode == 200) return jsonDecode(response.body);
    } catch (_) {}
    return {};
  }

  static Future<List<Map<String, dynamic>>> getDigitalContracts() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/digital-contracts'), headers: _headers);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final contracts = data['data'] ?? data;
        return List<Map<String, dynamic>>.from((contracts is List ? contracts : []).cast<Map<String, dynamic>>());
      }
    } catch (_) {}
    return [];
  }

  static Future<List<Map<String, dynamic>>> getNotifications() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/notifications'), headers: _headers);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final notifications = data['data'] ?? data;
        return List<Map<String, dynamic>>.from((notifications is List ? notifications : []).cast<Map<String, dynamic>>());
      }
    } catch (_) {}
    return [];
  }

  static Future<List<Map<String, dynamic>>> getMessages() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/messages'), headers: _headers);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final container = data['data'] ?? data;
        if (container is Map && container['messages'] is List) {
          return List<Map<String, dynamic>>.from((container['messages'] as List).cast<Map<String, dynamic>>());
        }
        return List<Map<String, dynamic>>.from((container is List ? container : []).cast<Map<String, dynamic>>());
      }
    } catch (_) {}
    return [];
  }

  static Future<Map<String, dynamic>> getAnalytics() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/analytics'), headers: _headers);
      if (response.statusCode == 200) return jsonDecode(response.body);
    } catch (_) {}
    return {};
  }

  static Future<bool> markNotificationAsRead(int id) async {
    try {
      final response = await http.patch(Uri.parse('$_baseUrl/tenant/notifications/$id/read'), headers: _headers);
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> markAllNotificationsAsRead() async {
    try {
      final response = await http.patch(Uri.parse('$_baseUrl/tenant/notifications/read-all'), headers: _headers);
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> sendMessage({required String body, String? subject}) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/tenant/messages'),
        headers: _headers,
        body: jsonEncode({'body': body, if (subject != null && subject.isNotEmpty) 'subject': subject}),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> submitDigitalContract({
    required int contractId,
    required Map<String, dynamic> fields,
    required String signature,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/tenant/digital-contracts/submit'),
        headers: _headers,
        body: jsonEncode({'contract_id': contractId, 'fields': fields, 'signature': signature}),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> makePayment(int paymentId, {required String paymentMethodId}) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/tenant/payments/$paymentId/pay'),
        headers: _headers,
        body: jsonEncode({'payment_method_id': paymentMethodId}),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }
}
