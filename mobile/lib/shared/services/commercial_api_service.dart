import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/auth_service.dart';
import '../../core/constants/api_config.dart';

class CommercialApiService {
  static const String _baseUrl = ApiConfig.apiPath;

  // Get Dashboard
  static Future<Map<String, dynamic>> getDashboard() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/commercial/dashboard'),
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

  // Get Properties
  static Future<List<Map<String, dynamic>>> getProperties() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/commercial/properties'),
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
        Uri.parse('$_baseUrl/commercial/applications'),
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

  // Get Analytics
  static Future<Map<String, dynamic>> getAnalytics() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/commercial/analytics'),
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

  // Get Reports
  static Future<List<Map<String, dynamic>>> getReports() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/commercial/reports'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final reports = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (reports is List ? reports : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Profile
  static Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/commercial/profile'),
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

  // Get Settings
  static Future<Map<String, dynamic>> getSettings() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/commercial/settings'),
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

  static Future<List<Map<String, dynamic>>> getAmenities() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/commercial/amenities'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final amenities = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (amenities is List ? amenities : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>> createProperty(Map<String, dynamic> propertyData) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/commercial/properties'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
        body: jsonEncode(propertyData),
      );
      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      final body = jsonDecode(response.body);
      return {
        'success': false,
        'message': body['message']?.toString() ?? 'Failed to create property',
      };
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  static Future<Map<String, dynamic>> updateProperty(int propertyId, Map<String, dynamic> propertyData) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/commercial/properties/$propertyId'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
        body: jsonEncode(propertyData),
      );
      if (response.statusCode == 200) return jsonDecode(response.body);
      return {'success': false, 'message': 'Failed to update property'};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  static Future<Map<String, dynamic>> deleteProperty(int propertyId) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/commercial/properties/$propertyId'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );
      if (response.statusCode == 200) return jsonDecode(response.body);
      return {'success': false, 'message': 'Failed to delete property'};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  static Future<Map<String, dynamic>> approveApplication(int applicationId) async {
    try {
      final response = await http.patch(
        Uri.parse('$_baseUrl/commercial/applications/$applicationId/approve'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );
      if (response.statusCode == 200) return jsonDecode(response.body);
      return {'success': false, 'message': 'Failed to approve application'};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  static Future<Map<String, dynamic>> rejectApplication(int applicationId) async {
    try {
      final response = await http.patch(
        Uri.parse('$_baseUrl/commercial/applications/$applicationId/reject'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );
      if (response.statusCode == 200) return jsonDecode(response.body);
      return {'success': false, 'message': 'Failed to reject application'};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  static Future<Map<String, dynamic>> getPayments({String? status, String? search}) async {
    try {
      final params = <String, String>{'per_page': '50'};
      if (status != null && status != 'all') params['status'] = status;
      if (search != null && search.trim().isNotEmpty) params['search'] = search.trim();
      final uri = Uri.parse('$_baseUrl/commercial/payments').replace(queryParameters: params);
      final response = await http.get(uri, headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ${AuthService.token}',
      });
      if (response.statusCode == 200) return jsonDecode(response.body);
    } catch (e) {
      print('Error: $e');
    }
    return {};
  }

  static Future<List<Map<String, dynamic>>> getNotifications() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/commercial/notifications'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (list is List ? list : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>> getNotificationStats() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/commercial/notification-stats'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['data'] as Map<String, dynamic>?) ?? data;
      }
    } catch (e) {
      print('Error: $e');
    }
    return {};
  }

  static Future<bool> markNotificationRead(int id) async {
    try {
      final response = await http.patch(
        Uri.parse('$_baseUrl/commercial/notifications/$id/read'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> markAllNotificationsRead() async {
    try {
      final response = await http.patch(
        Uri.parse('$_baseUrl/commercial/notifications/read-all'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> payload) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/commercial/profile'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
        body: jsonEncode(payload),
      );
      final body = jsonDecode(response.body);
      if (response.statusCode == 200) return {'success': true, 'user': body['user'] ?? body['data']};
      return {'success': false, 'message': body['message']?.toString() ?? 'Update failed'};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  static Future<Map<String, dynamic>> generateReport({
    required String type,
    required String period,
    int? propertyId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/commercial/reports'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
        body: jsonEncode({
          'type': type,
          'period': period,
          if (propertyId != null) 'property_id': propertyId,
        }),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      final body = jsonDecode(response.body);
      return {'success': false, 'message': body['message']?.toString() ?? 'Failed'};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }
}
