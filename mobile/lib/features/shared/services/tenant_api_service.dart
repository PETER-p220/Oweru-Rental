import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/constants/api_config.dart';
import '../services/auth_service.dart';

class TenantApiService {
  // Get Tenant Dashboard
  static Future<Map<String, dynamic>> getDashboard() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/tenant/dashboard'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {'success': false, 'message': 'Failed to fetch dashboard'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  // Get Saved Properties
  static Future<List<Map<String, dynamic>>> getSavedProperties() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/tenant/saved-properties'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final properties = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (properties is List ? properties : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Applications
  static Future<List<Map<String, dynamic>>> getApplications() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/tenant/applications'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final applications = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (applications is List ? applications : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Contract
  static Future<Map<String, dynamic>?> getContract() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/tenant/contract'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Error: $e');
    }
    return null;
  }

  // Get Digital Contracts
  static Future<List<Map<String, dynamic>>> getDigitalContracts() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/tenant/digital-contracts'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final contracts = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (contracts is List ? contracts : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Payments
  static Future<List<Map<String, dynamic>>> getPayments() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/tenant/payments'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final payments = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (payments is List ? payments : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Payment Methods
  static Future<List<Map<String, dynamic>>> getPaymentMethods() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/tenant/payment-methods'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final methods = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (methods is List ? methods : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Payment Stats
  static Future<Map<String, dynamic>> getPaymentStats() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/tenant/payment-stats'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Error: $e');
    }
    return {};
  }

  // Get Notifications
  static Future<List<Map<String, dynamic>>> getNotifications() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/tenant/notifications'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final notifications = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (notifications is List ? notifications : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Messages
  static Future<List<Map<String, dynamic>>> getMessages() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/tenant/messages'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final messages = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (messages is List ? messages : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Analytics
  static Future<Map<String, dynamic>> getAnalytics() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/tenant/analytics'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Error: $e');
    }
    return {};
  }
}
