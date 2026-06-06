import 'package:shared_preferences/shared_preferences.dart';

class UserService {
  static final UserService _instance = UserService._internal();
  
  factory UserService() {
    return _instance;
  }
  
  UserService._internal();

  String? _userType;
  String? _token;
  String? _userName;
  String? _userEmail;
  bool _isLoaded = false;

  // SharedPreferences keys
  static const String _keyUserType = 'user_type';
  static const String _keyToken = 'auth_token';
  static const String _keyUserName = 'user_name';
  static const String _keyUserEmail = 'user_email';

  // Getters
  String? get userType => _userType;
  String? get token => _token;
  String? get userName => _userName;
  String? get userEmail => _userEmail;

  // Load data from SharedPreferences (called on first access)
  Future<void> _loadFromPreferences() async {
    if (_isLoaded) return;
    final prefs = await SharedPreferences.getInstance();
    _userType = prefs.getString(_keyUserType);
    _token = prefs.getString(_keyToken);
    _userName = prefs.getString(_keyUserName);
    _userEmail = prefs.getString(_keyUserEmail);
    _isLoaded = true;
  }

  // Ensure data is loaded before accessing
  Future<void> ensureLoaded() async {
    await _loadFromPreferences();
  }

  // Setters
  Future<void> setUserData({
    String? userType,
    String? token,
    String? userName,
    String? userEmail,
  }) async {
    _userType = userType;
    _token = token;
    _userName = userName;
    _userEmail = userEmail;
    _isLoaded = true;

    // Save to SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    if (userType != null) {
      await prefs.setString(_keyUserType, userType);
    } else {
      await prefs.remove(_keyUserType);
    }
    if (token != null) {
      await prefs.setString(_keyToken, token);
    } else {
      await prefs.remove(_keyToken);
    }
    if (userName != null) {
      await prefs.setString(_keyUserName, userName);
    } else {
      await prefs.remove(_keyUserName);
    }
    if (userEmail != null) {
      await prefs.setString(_keyUserEmail, userEmail);
    } else {
      await prefs.remove(_keyUserEmail);
    }
  }

  Future<void> clear() async {
    _userType = null;
    _token = null;
    _userName = null;
    _userEmail = null;
    _isLoaded = true;

    // Clear from SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyUserType);
    await prefs.remove(_keyToken);
    await prefs.remove(_keyUserName);
    await prefs.remove(_keyUserEmail);
  }

  bool get isLoggedIn => _token != null && _userType != null;

  String getDashboardRoute() {
    switch (_userType) {
      case 'agent':
        return '/agent-dashboard';
      case 'landlord':
        return '/landlord-dashboard';
      case 'tenant':
        return '/tenant-dashboard';
      case 'bnb_owner':
        return '/bnb-dashboard';
      case 'commercial':
        return '/commercial-dashboard';
      default:
        return '/';
    }
  }
}