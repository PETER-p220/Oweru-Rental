import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/auth_service.dart';
import '../services/user_service.dart';
import '../../core/constants/api_config.dart';

class TenantApiService {
  static const String _baseUrl = ApiConfig.apiPath;
  static Map<String, String> get _headers => {
    'Accept': 'application/json',
    'Authorization': 'Bearer ${UserService().token ?? AuthService.token}',
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
    required Map<String, String> fields,
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

  static Future<Map<String, dynamic>> makePayment(
    int paymentId, {
    required String phoneNumber,
    required String provider,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/tenant/payments/$paymentId/pay'),
        headers: _headers,
        body: jsonEncode({
          'phone_number': phoneNumber,
          'provider': provider,
        }),
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          'success': true,
          'message': data['message'] ?? 'Payment initiated',
          'transaction_id': data['data']?['transaction_id'],
        };
      }
      return {
        'success': false,
        'message': data['message'] ?? 'Payment failed',
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<bool> saveProperty(int propertyId) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/tenant/properties/$propertyId/save'),
        headers: _headers,
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> unsaveProperty(int propertyId) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/tenant/properties/$propertyId/save'),
        headers: _headers,
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<Map<String, dynamic>> createApplication(Map<String, dynamic> applicationData) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/tenant/applications'),
        headers: _headers,
        body: jsonEncode(applicationData),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      }
    } catch (_) {}
    return {};
  }

  static Future<Map<String, dynamic>> getApplicationStatus() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/applications/application-status'), headers: _headers);
      if (response.statusCode == 200) return jsonDecode(response.body);
    } catch (_) {}
    return {};
  }

  static Future<Map<String, dynamic>> getMyContract() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/contract'), headers: _headers);
      if (response.statusCode == 200) return jsonDecode(response.body);
    } catch (_) {}
    return {};
  }

  static Future<Map<String, dynamic>> createContract(Map<String, dynamic> contractData) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/tenant/contract'),
        headers: _headers,
        body: jsonEncode(contractData),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      }
    } catch (_) {}
    return {};
  }

  static Future<String> downloadContract(int contractId) async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/contracts/$contractId/download'), headers: _headers);
      if (response.statusCode == 200) return response.body;
    } catch (_) {}
    return '';
  }

  static Future<String> downloadDigitalContract(int contractId) async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/digital-contracts/$contractId/download'), headers: _headers);
      if (response.statusCode == 200) return response.body;
    } catch (_) {}
    return '';
  }

  static Future<List<Map<String, dynamic>>> getPaymentMethods() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/payment-methods'), headers: _headers);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final methods = data['data'] ?? data;
        return List<Map<String, dynamic>>.from((methods is List ? methods : []).cast<Map<String, dynamic>>());
      }
    } catch (_) {}
    return [];
  }

  static Future<Map<String, dynamic>> getPaymentSummary() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/payment-summary'), headers: _headers);
      if (response.statusCode == 200) return jsonDecode(response.body);
    } catch (_) {}
    return {};
  }

  static Future<String> downloadReceipt(int paymentId) async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/payments/$paymentId/receipt'), headers: _headers);
      if (response.statusCode == 200) return response.body;
    } catch (_) {}
    return '';
  }

  static Future<Map<String, dynamic>> getNotificationStats() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/tenant/notification-stats'), headers: _headers);
      if (response.statusCode == 200) return jsonDecode(response.body);
    } catch (_) {}
    return {};
  }

  static Future<bool> archiveNotification(int id) async {
    try {
      final response = await http.patch(Uri.parse('$_baseUrl/tenant/notifications/$id/archive'), headers: _headers);
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> deleteNotification(int id) async {
    try {
      final response = await http.delete(Uri.parse('$_baseUrl/tenant/notifications/$id'), headers: _headers);
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<Map<String, dynamic>> getProperty(int propertyId) async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/properties/$propertyId'), headers: _headers);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'] ?? data;
      }
    } catch (_) {}
    return {};
  }

  static Future<List<Map<String, dynamic>>> getPublicProperties() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/public/properties'), headers: _headers);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final properties = data['data'] ?? data;
        return List<Map<String, dynamic>>.from((properties is List ? properties : []).cast<Map<String, dynamic>>());
      }
    } catch (_) {}
    return [];
  }

  static Future<Map<String, dynamic>> updateApplicationPaymentStatus({
    required int applicationId,
    required String paymentStatus,
    required String paymentMethod,
    required String transactionId,
    required double amountPaid,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/tenant/applications/$applicationId/payment-status'),
        headers: _headers,
        body: jsonEncode({
          'payment_status': paymentStatus,
          'payment_method': paymentMethod,
          'transaction_id': transactionId,
          'amount_paid': amountPaid,
        }),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, ...Map<String, dynamic>.from(data is Map ? data : {})};
      }
      return {
        'success': false,
        'message': data is Map ? (data['message'] ?? 'Failed to update payment status') : 'Failed to update payment status',
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> initiateRentPayment({
    required int applicationId,
    required String phoneNumber,
    required String provider,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/tenant/rent/pay'),
        headers: _headers,
        body: jsonEncode({
          'application_id': applicationId,
          'phone_number': phoneNumber,
          'provider': provider,
        }),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return Map<String, dynamic>.from(data is Map ? data : {'success': true});
      }
      return {
        'success': false,
        'message': data is Map ? (data['message'] ?? 'Rent payment initiation failed') : 'Rent payment initiation failed',
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> checkRentPaymentStatus(String orderId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/tenant/rent/status/${Uri.encodeComponent(orderId)}'),
        headers: _headers,
      );
      final data = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return Map<String, dynamic>.from(data is Map ? data : {});
      }
      return {'success': false, 'message': 'Unable to check rent payment status'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> initiateSiteVisitPayment({
    required int propertyId,
    required String phoneNumber,
    required String provider,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/tenant/site-visit/pay'),
        headers: _headers,
        body: jsonEncode({
          'property_id': propertyId,
          'phone_number': phoneNumber,
          'provider': provider,
        }),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return Map<String, dynamic>.from(data is Map ? data : {'success': true});
      }
      return {
        'success': false,
        'message': data is Map ? (data['message'] ?? 'Payment initiation failed') : 'Payment initiation failed',
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> checkSiteVisitPaymentStatus(String orderId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/tenant/site-visit/status/${Uri.encodeComponent(orderId)}'),
        headers: _headers,
      );
      final data = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return Map<String, dynamic>.from(data is Map ? data : {});
      }
      return {'success': false, 'message': 'Unable to check payment status'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> initiateSelcomPayment({
    required double amount,
    required String phoneNumber,
    required String provider,
    required int propertyId,
    required int tenantId,
    String? customerEmail,
    String? customerName,
    String paymentType = 'site_visit',
  }) async {
    try {
      final orderId = 'OWERU_${DateTime.now().millisecondsSinceEpoch}_${DateTime.now().microsecondsSinceEpoch}';
      
      final requestBody = {
        'amount': amount,
        'phone_number': phoneNumber,
        'provider': provider.toUpperCase(),
        'customer_email': customerEmail ?? '$tenantId@oweru.com',
        'customer_name': customerName ?? 'Tenant $tenantId',
        'order_id': orderId,
        'payment_type': paymentType,
        'property_id': propertyId,
        'tenant_id': tenantId,
      };

      final response = await http.post(
        Uri.parse('$_baseUrl/payment/selcom/mobile-money?t=${DateTime.now().millisecondsSinceEpoch}'),
        headers: _headers,
        body: jsonEncode(requestBody),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        return data;
      } else {
        return {
          'success': false,
          'error': 'PAYMENT_INIT_FAILED',
          'message': 'Failed to initiate payment',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'NETWORK_ERROR',
        'message': 'Network error occurred while initiating payment',
      };
    }
  }
}
