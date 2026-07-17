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
}
