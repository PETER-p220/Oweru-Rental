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

  // Getters
  String? get userType => _userType;
  String? get token => _token;
  String? get userName => _userName;
  String? get userEmail => _userEmail;

  // Setters
  void setUserData({
    String? userType,
    String? token,
    String? userName,
    String? userEmail,
  }) {
    _userType = userType;
    _token = token;
    _userName = userName;
    _userEmail = userEmail;
  }

  void clear() {
    _userType = null;
    _token = null;
    _userName = null;
    _userEmail = null;
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