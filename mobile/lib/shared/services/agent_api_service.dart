import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/auth_service.dart';
import '../../core/constants/api_config.dart';

class AgentApiService {
  static const String _baseUrl = ApiConfig.apiPath;
  static Map<String, String> get _headers => {
    'Accept': 'application/json',
    'Authorization': 'Bearer ${AuthService.token}',
    'Content-Type': 'application/json',
  };

  static List<Map<String, dynamic>> _asList(dynamic payload) {
    final data = payload is Map<String, dynamic> ? (payload['data'] ?? payload) : payload;
    if (data is List) {
      return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return [];
  }

  // Get Agent Dashboard
  static Future<Map<String, dynamic>> getDashboard() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/agent/dashboard'), headers: _headers);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {'success': false, 'message': 'Failed to fetch dashboard'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  // Get My Listings
  static Future<List<Map<String, dynamic>>> getMyListings() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/agent/my-listings'), headers: _headers);

      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body));
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Leads
  static Future<List<Map<String, dynamic>>> getLeads() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/agent/leads'), headers: _headers);

      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body));
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Applications
  static Future<List<Map<String, dynamic>>> getApplications() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/agent/applications'), headers: _headers);

      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body));
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get My Commissions
  static Future<List<Map<String, dynamic>>> getMyCommissions() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/agent/my-commissions'), headers: _headers);

      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body));
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Commission Stats
  static Future<Map<String, dynamic>> getCommissionStats() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/agent/commission-stats'), headers: _headers);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Error: $e');
    }
    return {};
  }

  // Get Analytics
  static Future<Map<String, dynamic>> getAnalytics() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/agent/analytics'), headers: _headers);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Error: $e');
    }
    return {};
  }

  // Get Messages
  static Future<List<Map<String, dynamic>>> getMessages() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/agent/messages'), headers: _headers);

      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body));
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  static Future<List<Map<String, dynamic>>> getLinkedOwners() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/agent/linked-owners'), headers: _headers);
      print('Linked Owners Response Status: ${response.statusCode}');
      print('Linked Owners Response Body: ${response.body}');
      if (response.statusCode == 200) return _asList(jsonDecode(response.body));
    } catch (e) {
      print('Error fetching linked owners: $e');
    }
    return [];
  }

  static Future<List<Map<String, dynamic>>> getTrackingLinks() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/agent/tracking'), headers: _headers);
      if (response.statusCode == 200) return _asList(jsonDecode(response.body));
    } catch (_) {}
    return [];
  }

  static Future<List<Map<String, dynamic>>> getPayoutHistory() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/agent/payouts'), headers: _headers);
      if (response.statusCode == 200) return _asList(jsonDecode(response.body));
    } catch (_) {}
    return [];
  }

  static Future<List<Map<String, dynamic>>> getQrCodes() async {
    final listings = await getMyListings();
    final results = <Map<String, dynamic>>[];
    for (final listing in listings) {
      final id = listing['id'];
      if (id == null) continue;
      try {
        final response = await http.get(Uri.parse('$_baseUrl/agent/qr-codes/$id'), headers: _headers);
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          results.add({
            'id': id,
            'property_name': listing['title'] ?? 'Listing $id',
            'tracking_code': data['tracking_code'] ?? data['code'] ?? '',
            'url': data['url'] ?? '',
          });
        }
      } catch (_) {}
    }
    return results;
  }

  static Future<bool> createListing(Map<String, dynamic> payload) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/agent/listings'),
        headers: _headers,
        body: jsonEncode(payload),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> approveApplication(int applicationId) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/agent/applications/$applicationId/approve'),
        headers: _headers,
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> rejectApplication(int applicationId, String reason) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/agent/applications/$applicationId/reject'),
        headers: _headers,
        body: jsonEncode({'reason': reason}),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<Map<String, dynamic>> generateQRCode(int propertyId) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/agent/qr-codes/$propertyId'),
        headers: _headers,
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      }
    } catch (_) {}
    return {};
  }
}
