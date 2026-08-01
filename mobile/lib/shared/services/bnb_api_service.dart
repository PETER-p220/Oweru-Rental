import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/network/authenticated_http.dart';
import '../services/auth_service.dart';
import 'user_service.dart';
import '../../core/constants/api_config.dart';

class BnbApiService {
  static const String _baseUrl = ApiConfig.apiPath;

  static Future<http.Response> _authGet(String path) =>
      AuthenticatedHttp.get(Uri.parse('$_baseUrl$path'));

  static Future<http.Response> _authPost(String path, {Object? body}) =>
      AuthenticatedHttp.post(Uri.parse('$_baseUrl$path'), body: body);

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
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          return (decoded['data'] as Map<String, dynamic>?) ?? decoded;
        }
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

  // ── Public / guest BnB (any authenticated user) ─────────────────────────

  static List<Map<String, dynamic>> _parsePublicList(dynamic payload) {
    if (payload is List) {
      return payload
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
    if (payload is Map) {
      final data = payload['data'];
      if (data is List) {
        return data
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
      if (data is Map) {
        final nested = data['data'];
        if (nested is List) {
          return nested
              .whereType<Map>()
              .map((e) => Map<String, dynamic>.from(e))
              .toList();
        }
      }
    }
    return [];
  }

  /// Homepage + tenant browse — try `/public/bnb`, then `/public/bnb/search`.
  static Future<List<Map<String, dynamic>>> getPublicList({String? search}) async {
    final params = <String, String>{'per_page': '100'};
    if (search != null && search.trim().isNotEmpty) {
      params['search'] = search.trim();
    }
    final query = params.entries
        .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
        .join('&');

    List<Map<String, dynamic>> filterDemo(List<Map<String, dynamic>> list) =>
        list.where((p) => p['id']?.toString() != '999').toList();

    try {
      final primary = await http.get(
        Uri.parse('$_baseUrl/public/bnb?$query'),
        headers: {'Accept': 'application/json'},
      );
      if (primary.statusCode == 200) {
        final list = filterDemo(_parsePublicList(jsonDecode(primary.body)));
        if (list.isNotEmpty) return list;
      }

      final fallback = await http.get(
        Uri.parse('$_baseUrl/public/bnb/search?$query'),
        headers: {'Accept': 'application/json'},
      );
      if (fallback.statusCode == 200) {
        return filterDemo(_parsePublicList(jsonDecode(fallback.body)));
      }
    } catch (e) {
      print('BnbApiService.getPublicList error: $e');
    }
    return [];
  }

  static Future<List<Map<String, dynamic>>> searchPublicProperties({String? search}) async {
    return getPublicList(search: search);
  }

  static Future<Map<String, dynamic>> getPublicProperty(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/public/bnb/properties/$id'),
        headers: {'Accept': 'application/json'},
      );
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map) {
          final data = decoded['data'];
          if (data is Map) return Map<String, dynamic>.from(data);
          return Map<String, dynamic>.from(decoded);
        }
      }
    } catch (e) {
      print('Error: $e');
    }
    return {};
  }

  static Future<List<Map<String, dynamic>>> getMyBookings({String? status}) async {
    try {
      final q = (status != null && status != 'all') ? '?status=$status&per_page=100' : '?per_page=100';
      final response = await _authGet('/my/bnb/bookings$q');
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

  static Future<List<Map<String, dynamic>>> getMyReviews() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/my/bnb/reviews?per_page=100'),
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

  static Future<Map<String, dynamic>> createGuestBooking(Map<String, dynamic> payload) async {
    try {
      await UserService().ensureLoaded();
      final token = AuthService.token ?? UserService().token;
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'Please sign in to book this stay.'};
      }
      AuthService.setToken(token);

      final response = await http.post(
        Uri.parse('$_baseUrl/my/bnb/bookings'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      );
      final body = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': body['data'] ?? body};
      }
      var message = body['message']?.toString() ?? 'Booking failed';
      if (body['errors'] is Map) {
        for (final v in (body['errors'] as Map).values) {
          if (v is List && v.isNotEmpty) {
            message = v.first.toString();
            break;
          }
        }
      }
      return {'success': false, 'message': message};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  static Future<String?> _resolveToken() async {
    await UserService().ensureLoaded();
    final token = AuthService.token ?? UserService().token;
    if (token == null || token.isEmpty) return null;
    AuthService.setToken(token);
    return token;
  }

  static Future<Map<String, dynamic>> initiateBookingPayment(
    int bookingId, {
    required String paymentMode,
    String? phoneNumber,
    String? provider,
  }) async {
    try {
      final token = await _resolveToken();
      if (token == null) {
        return {'success': false, 'message': 'Please sign in to complete payment.'};
      }
      final response = await http.post(
        Uri.parse('$_baseUrl/my/bnb/bookings/$bookingId/pay'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'payment_mode': paymentMode,
          if (phoneNumber != null && phoneNumber.isNotEmpty) 'phone_number': phoneNumber,
          if (provider != null && provider.isNotEmpty) 'provider': provider,
        }),
      );
      final body = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': body['message']?.toString(),
          'data': body['data'] ?? body,
        };
      }
      var message = body['message']?.toString() ?? 'Payment initiation failed';
      if (body['errors'] is Map) {
        for (final v in (body['errors'] as Map).values) {
          if (v is List && v.isNotEmpty) {
            message = v.first.toString();
            break;
          }
        }
      }
      return {'success': false, 'message': message};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  static Future<Map<String, dynamic>> checkBookingPaymentStatus(String orderId) async {
    try {
      final token = await _resolveToken();
      if (token == null) {
        return {'success': false, 'message': 'Please sign in to check payment status.'};
      }
      final response = await http.get(
        Uri.parse('$_baseUrl/my/bnb/bookings/payment/status/${Uri.encodeComponent(orderId)}'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      final body = jsonDecode(response.body);
      if (response.statusCode == 200) {
        final data = body['data'] ?? body;
        return {
          'success': true,
          'message': body['message']?.toString(),
          'payment_status': data is Map ? data['payment_status'] : null,
          'booking_id': data is Map ? data['booking_id'] : null,
        };
      }
      return {'success': false, 'message': body['message']?.toString() ?? 'Unable to check payment status'};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  static Future<Map<String, dynamic>> cancelMyBooking(int bookingId, {String? reason}) async {
    try {
      final response = await http.patch(
        Uri.parse('$_baseUrl/my/bnb/bookings/$bookingId/cancel'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
        body: jsonEncode({'cancellation_reason': reason ?? 'Cancelled by guest'}),
      );
      if (response.statusCode == 200) return {'success': true};
      final body = jsonDecode(response.body);
      return {'success': false, 'message': body['message']?.toString() ?? 'Cancel failed'};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  static Future<Map<String, dynamic>> submitMyReview({
    required int propertyId,
    required int bookingId,
    required int rating,
    required String comment,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/my/bnb/reviews'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
        body: jsonEncode({
          'property_id': propertyId,
          'booking_id': bookingId,
          'rating': rating,
          'comment': comment,
        }),
      );
      final body = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true};
      }
      return {'success': false, 'message': body['message']?.toString() ?? 'Review failed'};
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }
}
