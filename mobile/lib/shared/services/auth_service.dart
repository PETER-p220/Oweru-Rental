import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_config.dart';
import 'user_service.dart';

class AuthService {
  static const String _baseUrl = ApiConfig.apiPath;
  static String? _token;

  static String? get token => _token;

  static void setToken(String? token) {
    _token = token;
  }

  // ── Login ────────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    String userType = 'tenant',
  }) async {
    try {
      print('🔵 LOGIN STARTING - Email: $email, UserType: $userType');
      print('🔵 API Base URL: $_baseUrl');
      print('🔵 Full URL: $_baseUrl/login');
      
      final response = await http.post(
        Uri.parse('$_baseUrl/login'),
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'user_type': userType,
        }),
      );

      print('🔵 Login Response Status: ${response.statusCode}');
      print('🔵 Login Response Headers: ${response.headers}');
      print('🔵 Login Response Body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('🟢 Login Success - Data: $data');
        _token = data['data']['token'];
        print('🟢 Token Set: $_token');
        return {'success': true, 'data': data};
      } else {
        print('🔴 Login Failed - Status Code: ${response.statusCode}');
        try {
          final error = jsonDecode(response.body);
          print('🔴 Error Response: $error');
          return {
            'success': false,
            'message': error['message'] ?? 'Login failed (status: ${response.statusCode})',
          };
        } catch (e) {
          print('🔴 Error parsing response: $e');
          return {
            'success': false,
            'message': 'Server error (${response.statusCode}): ${response.body}',
          };
        }
      }
    } catch (e) {
      print('🔴 Login Exception: $e');
      return {
        'success': false,
        'message': 'Connection error: $e',
      };
    }
  }

  // ── Register ────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
    required String passwordConfirmation,
    String userType = 'tenant',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/register'),
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'first_name': firstName,
          'last_name': lastName,
          'email': email,
          'phone': phone,
          'password': password,
          'password_confirmation': passwordConfirmation,
          'user_type': userType,
        }),
      );

      print('Register Response Status: ${response.statusCode}');
      print('Register Response Body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('Register Response Decoded: $data');
        _token = data['data']['token'];
        print('Token Set: $_token');
        return {'success': true, 'data': data};
      } else {
        final error = jsonDecode(response.body);
        print('Register Error: $error');
        if (error['errors'] is Map) {
          final errors = error['errors'] as Map<String, dynamic>;
          final messages = <String>[];
          errors.forEach((key, value) {
            if (value is List) {
              messages.addAll(value.cast<String>());
            }
          });
          return {
            'success': false,
            'message': messages.join(', '),
            'errors': messages,
          };
        }
        return {
          'success': false,
          'message': error['message'] ?? 'Registration failed',
        };
      }
    } catch (e) {
      print('Register Exception: $e');
      return {
        'success': false,
        'message': 'Connection error: $e',
      };
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────
  static Future<void> logout() async {
    try {
      if (_token != null) {
        await http.post(
          Uri.parse('$_baseUrl/logout'),
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer $_token',
          },
        );
      }
    } catch (_) {}
    _token = null;
  }

  // ── Get Current User ────────────────────────────────────────────────────
  static Future<Map<String, dynamic>?> getCurrentUser() async {
    // Use UserService token since login page stores it there
    final token = UserService().token ?? _token;
    if (token == null) return null;
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/user'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body is Map<String, dynamic> && body['data'] is Map) {
          return Map<String, dynamic>.from(body['data'] as Map);
        }
        if (body is Map<String, dynamic>) return body;
        if (body is Map) return Map<String, dynamic>.from(body);
      }
    } catch (_) {}
    return null;
  }

  // ── Google Auth ───────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> loginWithGoogle({
    required String idToken,
    String userType = 'tenant',
  }) async {
    try {
      print('🔵 Google Login STARTING - UserType: $userType');
      print('🔵 API Base URL: $_baseUrl');
      
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/google'),
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'token': idToken,
          'user_type': userType,
        }),
      );

      print('🔵 Google Login Response Status: ${response.statusCode}');
      print('🔵 Google Login Response Body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('🟢 Google Login Success - Data: $data');
        _token = data['data']['token'];
        print('🟢 Token Set: $_token');
        return {'success': true, 'data': data};
      } else {
        print('🔴 Google Login Failed - Status Code: ${response.statusCode}');
        try {
          final error = jsonDecode(response.body);
          print('🔴 Error Response: $error');
          return {
            'success': false,
            'message': error['message'] ?? 'Google login failed (status: ${response.statusCode})',
          };
        } catch (e) {
          print('🔴 Error parsing response: $e');
          return {
            'success': false,
            'message': 'Server error (${response.statusCode}): ${response.body}',
          };
        }
      }
    } catch (e) {
      print('🔴 Google Login Exception: $e');
      return {
        'success': false,
        'message': 'Connection error: $e',
      };
    }
  }

  static Future<Map<String, dynamic>> registerWithGoogle({
    required String idToken,
    String userType = 'tenant',
    String? phone,
  }) async {
    try {
      print('🔵 Google Register STARTING - UserType: $userType');
      
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/google/register'),
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'token': idToken,
          'user_type': userType,
          if (phone != null) 'phone': phone,
        }),
      );

      print('🔵 Google Register Response Status: ${response.statusCode}');
      print('🔵 Google Register Response Body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('🟢 Google Register Success - Data: $data');
        _token = data['data']['token'];
        print('🟢 Token Set: $_token');
        return {'success': true, 'data': data};
      } else {
        print('🔴 Google Register Failed - Status Code: ${response.statusCode}');
        try {
          final error = jsonDecode(response.body);
          print('🔴 Error Response: $error');
          if (error['errors'] is Map) {
            final errors = error['errors'] as Map<String, dynamic>;
            final messages = <String>[];
            errors.forEach((key, value) {
              if (value is List) {
                messages.addAll(value.cast<String>());
              }
            });
            return {
              'success': false,
              'message': messages.join(', '),
              'errors': messages,
            };
          }
          return {
            'success': false,
            'message': error['message'] ?? 'Google registration failed',
          };
        } catch (e) {
          print('🔴 Error parsing response: $e');
          return {
            'success': false,
            'message': 'Server error (${response.statusCode}): ${response.body}',
          };
        }
      }
    } catch (e) {
      print('🔴 Google Register Exception: $e');
      return {
        'success': false,
        'message': 'Connection error: $e',
      };
    }
  }
}
