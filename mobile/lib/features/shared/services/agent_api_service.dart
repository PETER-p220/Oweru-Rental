import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/constants/api_config.dart';
import '../services/auth_service.dart';

class AgentApiService {
  static String get _baseUrl => ApiConfig.apiPath;

  // Get Agent Dashboard
  static Future<Map<String, dynamic>> getDashboard() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/agent/dashboard'),
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

  // Get My Listings
  static Future<List<Map<String, dynamic>>> getMyListings() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/agent/my-listings'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final listings = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (listings is List ? listings : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Leads
  static Future<List<Map<String, dynamic>>> getLeads() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/agent/leads'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final leads = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (leads is List ? leads : []).cast<Map<String, dynamic>>(),
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
        Uri.parse('$_baseUrl/agent/applications'),
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

  // Get My Commissions
  static Future<List<Map<String, dynamic>>> getMyCommissions() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/agent/my-commissions'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final commissions = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (commissions is List ? commissions : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Commission Stats
  static Future<Map<String, dynamic>> getCommissionStats() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/agent/commission-stats'),
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

  // Get Analytics
  static Future<Map<String, dynamic>> getAnalytics() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/agent/analytics'),
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

  // Get Messages
  static Future<List<Map<String, dynamic>>> getMessages() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/agent/messages'),
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

  static Future<List<Map<String, dynamic>>> getLinkedOwners() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/agent/linked-owners'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final owners = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (owners is List ? owners : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (_) {}
    return [];
  }

  static Future<List<Map<String, dynamic>>> getTrackingLinks() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/agent/tracking'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final links = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (links is List ? links : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (_) {}
    return [];
  }

  static Future<List<Map<String, dynamic>>> getPayoutHistory() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/agent/payouts'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final payouts = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (payouts is List ? payouts : []).cast<Map<String, dynamic>>(),
        );
      }
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
        final response = await http.get(
          Uri.parse('$_baseUrl/agent/qr-codes/$id'),
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ${AuthService.token}',
          },
        );
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
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
          'Content-Type': 'application/json',
        },
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      }
    } catch (_) {}
    return {};
  }
}
