import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/auth_service.dart';
import '../services/user_service.dart';
import '../../core/constants/api_config.dart';

class LandlordApiService {
  static const String _baseUrl = ApiConfig.apiPath;
  static Map<String, String> get _headers => {
    'Accept': 'application/json',
    'Authorization': 'Bearer ${UserService().token ?? AuthService.token}',
    'Content-Type': 'application/json',
  };

  static List<Map<String, dynamic>> _asList(dynamic payload) {
    final data = payload is Map<String, dynamic> ? (payload['data'] ?? payload) : payload;
    if (data is List) {
      return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return [];
  }

  // Get Landlord Dashboard
  static Future<Map<String, dynamic>> getDashboard() async {
    try {
      await UserService().ensureLoaded();
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/dashboard'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Error: $e');
    }
    return {};
  }

  // Get My Properties
  static Future<List<Map<String, dynamic>>> getMyProperties() async {
    try {
      // Ensure UserService is loaded to get the proper token
      await UserService().ensureLoaded();
      
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/my-properties'),
        headers: _headers,
      );

      print('getMyProperties response status: ${response.statusCode}');
      print('getMyProperties response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = _asList(jsonDecode(response.body));
        print('getMyProperties parsed data: $data');
        return data;
      }
    } catch (e) {
      print('Error in getMyProperties: $e');
    }
    return [];
  }

  // Get My Tenants
  static Future<List<Map<String, dynamic>>> getMyTenants() async {
    try {
      await UserService().ensureLoaded();
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/tenants'),
        headers: _headers,
      );

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
      await UserService().ensureLoaded();
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/applications'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body));
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Rent Collection
  static Future<Map<String, dynamic>> getRentCollection() async {
    try {
      await UserService().ensureLoaded();
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/rent-collection'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Error: $e');
    }
    return {};
  }

  // Get Rent Collection Stats
  static Future<Map<String, dynamic>> getRentCollectionStats() async {
    try {
      await UserService().ensureLoaded();
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/rent-collection-stats'),
        headers: _headers,
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
      await UserService().ensureLoaded();
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/receipts'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body));
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Digital Contracts
  static Future<List<Map<String, dynamic>>> getDigitalContracts() async {
    try {
      await UserService().ensureLoaded();
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/digital-contracts'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body));
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get rental contracts
  static Future<List<Map<String, dynamic>>> getContracts() async {
    try {
      await UserService().ensureLoaded();
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/contracts'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body));
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  // Get Analytics
  static Future<Map<String, dynamic>> getAnalytics() async {
    try {
      await UserService().ensureLoaded();
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/analytics'),
        headers: _headers,
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
      await UserService().ensureLoaded();
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/messages'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body));
      }
    } catch (e) {
      print('Error: $e');
    }
    return [];
  }

  static Future<List<Map<String, dynamic>>> getCommissionReports() async {
    try {
      await UserService().ensureLoaded();
      final response = await http.get(Uri.parse('$_baseUrl/owner/commission-reports'), headers: _headers);
      if (response.statusCode == 200) return _asList(jsonDecode(response.body));
    } catch (_) {}
    return [];
  }

  static Future<bool> createProperty(Map<String, dynamic> payload) async {
    try {
      await UserService().ensureLoaded();
      final response = await http.post(
        Uri.parse('$_baseUrl/owner/properties'),
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
      await UserService().ensureLoaded();
      final response = await http.post(
        Uri.parse('$_baseUrl/owner/applications/$applicationId/approve'),
        headers: _headers,
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> rejectApplication(int applicationId, String reason) async {
    try {
      await UserService().ensureLoaded();
      final response = await http.post(
        Uri.parse('$_baseUrl/owner/applications/$applicationId/reject'),
        headers: _headers,
        body: jsonEncode({'reason': reason}),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> sendContractToTenant(int contractId) async {
    try {
      await UserService().ensureLoaded();
      final response = await http.put(
        Uri.parse('$_baseUrl/owner/digital-contracts/$contractId/send'),
        headers: _headers,
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> approveSignedContract(int contractId) async {
    try {
      await UserService().ensureLoaded();
      final response = await http.put(
        Uri.parse('$_baseUrl/owner/digital-contracts/$contractId/approve'),
        headers: _headers,
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<Map<String, dynamic>?> uploadContractFile(String filePath) async {
    try {
      await UserService().ensureLoaded();
      final token = UserService().token ?? AuthService.token;
      final request = http.MultipartRequest(
        'POST',
        Uri.parse(ApiConfig.landlordUploadContractFile),
      );
      request.headers['Authorization'] = 'Bearer $token';
      request.headers['Accept'] = 'application/json';
      request.files.add(await http.MultipartFile.fromPath('file', filePath));
      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        return data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data as Map);
      }
    } catch (_) {}
    return null;
  }

  static Future<bool> createDigitalContract(Map<String, dynamic> payload) async {
    try {
      await UserService().ensureLoaded();
      final response = await http.post(
        Uri.parse('$_baseUrl/owner/digital-contracts'),
        headers: _headers,
        body: jsonEncode(payload),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> downloadOwnerReceipt(int receiptId) async {
    try {
      await UserService().ensureLoaded();
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/receipts/$receiptId/download'),
        headers: _headers,
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  static Future<Map<String, dynamic>> createTenantFromApprovedApplication() async {
    try {
      await UserService().ensureLoaded();
      final response = await http.post(
        Uri.parse('$_baseUrl/owner/tenants/create-from-approved'),
        headers: _headers,
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      }
    } catch (_) {}
    return {};
  }

  // Update Property
  static Future<bool> updateProperty(int propertyId, Map<String, dynamic> payload) async {
    try {
      await UserService().ensureLoaded();
      final response = await http.put(
        Uri.parse('$_baseUrl/owner/properties/$propertyId'),
        headers: _headers,
        body: jsonEncode(payload),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  // Delete Property
  static Future<bool> deleteProperty(int propertyId) async {
    try {
      await UserService().ensureLoaded();
      final response = await http.delete(
        Uri.parse('$_baseUrl/owner/properties/$propertyId'),
        headers: _headers,
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  // Download Digital Contract
  static Future<String?> downloadDigitalContract(int contractId) async {
    try {
      await UserService().ensureLoaded();
      final response = await http.get(
        Uri.parse('$_baseUrl/owner/digital-contracts/$contractId/download'),
        headers: _headers,
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        return data['file_url'] as String?;
      }
    } catch (_) {}
    return null;
  }

  // Generate Digital Contract
  static Future<bool> generateDigitalContract(Map<String, dynamic> payload) async {
    try {
      await UserService().ensureLoaded();
      final response = await http.post(
        Uri.parse('$_baseUrl/owner/digital-contracts/generate'),
        headers: _headers,
        body: jsonEncode(payload),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  // Upload Property Images
  static Future<List<String>?> uploadPropertyImages(List<String> imagePaths) async {
    try {
      await UserService().ensureLoaded();
      final token = UserService().token ?? AuthService.token;
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/owner/properties/upload-images'),
      );
      request.headers['Authorization'] = 'Bearer $token';
      request.headers['Accept'] = 'application/json';
      
      for (final path in imagePaths) {
        request.files.add(await http.MultipartFile.fromPath('images[]', path));
      }
      
      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        if (data['images'] is List) {
          return List<String>.from(data['images']);
        }
      }
    } catch (_) {}
    return null;
  }
}
