import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../shared/services/auth_service.dart';
import '../../../shared/services/user_service.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _showPassword = false;
  bool _isLoading = false;
  String _error = '';
  String _userType = 'tenant';
  final _userService = UserService();
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  final List<Map<String, String>> userTypes = [
    {'value': 'tenant', 'label': 'Tenant'},
    {'value': 'landlord', 'label': 'Landlord'},
    {'value': 'agent', 'label': 'Agent'},
    {'value': 'bnb_owner', 'label': 'BNB Owner'},
    {'value': 'commercial', 'label': 'Commercial'},
  ];

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _googleSignIn.disconnect();                 
    super.dispose();
  }

  Future<void> _handleGoogleLogin() async {
    setState(() => _isLoading = true);
    _error = '';

    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        setState(() => _isLoading = false);
        return;
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;

      if (idToken == null) {
        setState(() {
          _error = 'Failed to get Google ID token';
          _isLoading = false;
        });
        return;
      }

      // Google OAuth not yet implemented
      setState(() {
        _error = 'Google login coming soon';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Google login error: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleLogin() async {
    if (_emailCtrl.text.isEmpty || _passwordCtrl.text.isEmpty) {
      setState(() => _error = 'Please fill in all fields');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final result = await AuthService.login(
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text,
        userType: _userType,
      );

      if (result['success']) {
        if (mounted) {
          // Store user data (now async with SharedPreferences)
          await _userService.setUserData(
            userType: _userType,
            token: result['data']?['data']?['token'],
            userName: result['data']?['data']?['user']?['first_name'],
            userEmail: _emailCtrl.text.trim(),
          );

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Login successful!')),
          );
          // Navigate to appropriate dashboard based on user type
          String route = '/tenant-dashboard';
          switch (_userType) {
            case 'agent':
              route = '/agent-dashboard';
              break;
            case 'landlord':
              route = '/landlord-dashboard';
              break;
            case 'tenant':
              route = '/tenant-dashboard';
              break;
            case 'bnb_owner':
              route = '/bnb-dashboard';
              break;
            case 'commercial':
              route = '/commercial-dashboard';
              break;
          }
          Navigator.pushNamedAndRemoveUntil(context, route, (route) => false);
        }
      } else {
        print('Login Failed: ${result['message']}');
        setState(() => _error = result['message'] ?? 'Login failed');
      }
    } catch (e) {
      print('Login Catch Error: $e');
      setState(() => _error = 'An error occurred: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const kGold = Color(0xFFC89128);
    const kBg = Color(0xFF0A0F1E);
    const kBg2 = Color(0xFF0F172A);
    const kBg3 = Color(0xFF162035);
    const kCream = Color(0xFFF1F5F9);
    const kSlate = Color(0xFF94A3B8);
    const kBorder = Color(0x26C89128);

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: kCream),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title
              Text(
                'Welcome Back',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: kCream,
                      fontWeight: FontWeight.w600,
                      fontSize: 32,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Sign in to your account',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: kSlate,
                      fontSize: 16,
                    ),
              ),
              const SizedBox(height: 32),

              // User Type Selection
              Text(
                'Login as',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: kCream,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: kBorder),
                  borderRadius: BorderRadius.circular(8),
                  color: kBg2,
                ),
                child: DropdownButton<String>(
                  value: _userType,
                  isExpanded: true,
                  underline: const SizedBox(),
                  dropdownColor: kBg3,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: kCream,
                      ),
                  items: userTypes
                      .map((type) => DropdownMenuItem(
                            value: type['value'],
                            child: Text(type['label']!),
                          ))
                      .toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _userType = value);
                    }
                  },
                ),
              ),
              const SizedBox(height: 24),

              // Email Field
              Text(
                'Email',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: kCream,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                style: const TextStyle(color: kCream),
                decoration: InputDecoration(
                  hintText: 'Enter your email',
                  hintStyle: const TextStyle(color: kSlate),
                  prefixIcon: const Icon(Icons.mail_outline, color: kGold),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: kBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: kBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: kGold, width: 2),
                  ),
                  filled: true,
                  fillColor: kBg2,
                ),
              ),
              const SizedBox(height: 20),

              // Password Field
              Text(
                'Password',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: kCream,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _passwordCtrl,
                obscureText: !_showPassword,
                style: const TextStyle(color: kCream),
                decoration: InputDecoration(
                  hintText: 'Enter your password',
                  hintStyle: const TextStyle(color: kSlate),
                  prefixIcon: const Icon(Icons.lock_outline, color: kGold),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _showPassword ? Icons.visibility : Icons.visibility_off,
                      color: kGold,
                    ),
                    onPressed: () => setState(() => _showPassword = !_showPassword),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: kBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: kBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: kGold, width: 2),
                  ),
                  filled: true,
                  fillColor: kBg2,
                ),
              ),
              const SizedBox(height: 12),

              // Error Message
              if (_error.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFe07070).withOpacity(0.1),
                    border: Border.all(color: const Color(0xFFe07070).withOpacity(0.3)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Color(0xFFe07070)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _error,
                          style: const TextStyle(
                            color: Color(0xFFe07070),
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 24),

              // Login Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kGold,
                    disabledBackgroundColor: kGold.withOpacity(0.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Color(0xFF0A0F1E)),
                          ),
                        )
                      : const Text(
                          'Sign In',
                          style: TextStyle(
                            color: Color(0xFF0A0F1E),
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 16),

              // Google Sign-In Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: _isLoading ? null : _handleGoogleLogin,
                  icon: const Icon(Icons.login, color: kGold, size: 20),
                  label: const Text(
                    'Sign in with Google',
                    style: TextStyle(
                      color: kCream,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: kBorder),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Sign Up Link
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Don't have an account? ",
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: kSlate,
                          ),
                    ),
                    GestureDetector(
                      onTap: () =>
                          Navigator.pushNamed(context, '/register'),
                      child: Text(
                        'Sign Up',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: kGold,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
