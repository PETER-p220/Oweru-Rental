import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../constants/api_config.dart';
import '../../shared/services/auth_service.dart';
import '../../shared/services/user_service.dart';

/// Shared HTTP helper: attaches auth headers and clears session on 401.
class AuthenticatedHttp {
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  static bool _handlingUnauthorized = false;

  static Future<Map<String, String>> authHeaders() async {
    await UserService().ensureLoaded();
    final token = UserService().token ?? AuthService.token ?? '';
    return {
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    };
  }

  static Future<http.Response> get(Uri uri, {Map<String, String>? headers}) async {
    final response = await http.get(
      uri,
      headers: {...await authHeaders(), ...?headers},
    );
    await _maybeHandleUnauthorized(response);
    return response;
  }

  static Future<http.Response> post(
    Uri uri, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    final response = await http.post(
      uri,
      headers: {...await authHeaders(), ...?headers},
      body: body,
    );
    await _maybeHandleUnauthorized(response);
    return response;
  }

  static Future<http.Response> put(
    Uri uri, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    final response = await http.put(
      uri,
      headers: {...await authHeaders(), ...?headers},
      body: body,
    );
    await _maybeHandleUnauthorized(response);
    return response;
  }

  static Future<http.Response> delete(Uri uri, {Map<String, String>? headers}) async {
    final response = await http.delete(
      uri,
      headers: {...await authHeaders(), ...?headers},
    );
    await _maybeHandleUnauthorized(response);
    return response;
  }

  static Future<void> _maybeHandleUnauthorized(http.Response response) async {
    if (response.statusCode != 401 || _handlingUnauthorized) return;

    _handlingUnauthorized = true;
    try {
      await UserService().clear();
      AuthService.setToken(null);

      final navigator = navigatorKey.currentState;
      if (navigator != null) {
        navigator.pushNamedAndRemoveUntil('/login', (route) => false);
      }
    } finally {
      _handlingUnauthorized = false;
    }
  }

  /// Validate stored token against GET /user (e.g. on app resume).
  static Future<bool> validateSession() async {
    await UserService().ensureLoaded();
    if (!UserService().isLoggedIn) return false;

    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiPath}/user'),
        headers: await authHeaders(),
      );

      if (response.statusCode == 200) {
        return true;
      }

      if (response.statusCode == 401) {
        await _maybeHandleUnauthorized(response);
      }
    } catch (_) {}

    return false;
  }
}
