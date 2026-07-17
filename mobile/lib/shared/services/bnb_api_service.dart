import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/auth_service.dart';
import '../../core/constants/api_config.dart';

class BnbApiService {
  static const String _baseUrl = ApiConfig.apiPath;

  // Get My Properties
  static Future<List<Map<String, dynamic>>> getProperties() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/bnb/properties'),
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

  // Get Bookings
  static Future<List<Map<String, dynamic>>> getBookings() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/bnb/bookings'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final bookings = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (bookings is List ? bookings : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Reviews
  static Future<List<Map<String, dynamic>>> getReviews() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/bnb/reviews'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final reviews = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (reviews is List ? reviews : []).cast<Map<String, dynamic>>(),
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
        Uri.parse('$_baseUrl/bnb/analytics'),
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

  /// Dashboard stats (same endpoint as analytics).
  static Future<Map<String, dynamic>> getDashboard() => getAnalytics();

  static Future<Map<String, dynamic>> createProperty(Map<String, dynamic> propertyData) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/bnb/properties'),
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
      return {'success': false, 'message': 'Failed to create property'};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  static Future<Map<String, dynamic>> updateProperty(int propertyId, Map<String, dynamic> propertyData) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/bnb/properties/$propertyId'),
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
        Uri.parse('$_baseUrl/bnb/properties/$propertyId'),
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

  static Future<Map<String, dynamic>> respondToReview(int reviewId, String reviewResponse) async {
    try {
      final httpResponse = await http.post(
        Uri.parse('$_baseUrl/bnb/reviews/$reviewId/respond'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
        body: jsonEncode({'response': reviewResponse}),
      );
      if (httpResponse.statusCode == 200) return jsonDecode(httpResponse.body);
      return {'success': false, 'message': 'Failed to respond to review'};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }
}
