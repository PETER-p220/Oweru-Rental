import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/constants/api_config.dart';
import '../services/auth_service.dart';

class LandlordApiService {
  // Get Landlord Dashboard
  static Future<Map<String, dynamic>> getDashboard() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/owner/dashboard'),
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

  // Get My Properties
  static Future<List<Map<String, dynamic>>> getMyProperties() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/owner/my-properties'),
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
        Uri.parse('${ApiConfig.apiPath}/owner/applications'),
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

  // Get Contracts
  static Future<List<Map<String, dynamic>>> getContracts() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/owner/contracts'),
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

  // Get Digital Contracts
  static Future<List<Map<String, dynamic>>> getDigitalContracts() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/owner/digital-contracts'),
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

  // Get Tenants
  static Future<List<Map<String, dynamic>>> getTenants() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/owner/tenants'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final tenants = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (tenants is List ? tenants : []).cast<Map<String, dynamic>>(),
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
        Uri.parse('${ApiConfig.apiPath}/owner/analytics'),
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
        Uri.parse('${ApiConfig.apiPath}/owner/messages'),
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

  // Get Rent Collection
  static Future<Map<String, dynamic>> getRentCollection() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/owner/rent-collection'),
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

  // Get Receipts
  static Future<List<Map<String, dynamic>>> getReceipts() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/owner/receipts'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final receipts = data['data'] ?? data;
        return List<Map<String, dynamic>>.from(
          (receipts is List ? receipts : []).cast<Map<String, dynamic>>(),
        );
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Commission Reports
  static Future<List<Map<String, dynamic>>> getCommissionReports() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/owner/commission-reports'),
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
}
