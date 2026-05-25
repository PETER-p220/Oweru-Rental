import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../shared/services/auth_service.dart';
import '../../../shared/services/user_service.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  int _currentStep = 1;

  // Step 1
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();

  // Step 2
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _showPassword = false;
  bool _showConfirmPassword = false;
  bool _agreeToTerms = false;

  String _userType = 'tenant';
  bool _isLoading = false;
  List<String> _errors = [];
  final _userService = UserService();
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  final List<Map<String, String>> userTypes = [
    {'value': 'tenant', 'label': 'Tenant', 'desc': 'Looking to rent'},
    {'value': 'landlord', 'label': 'Landlord', 'desc': 'I own property'},
    {'value': 'agent', 'label': 'Agent', 'desc': 'Real estate professional'},
    {'value': 'bnb_owner', 'label': 'BNB Owner', 'desc': 'I host BNB properties'},
    {'value': 'commercial', 'label': 'Commercial', 'desc': 'Commercial property owner'},
  ];

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    _googleSignIn.disconnect();
    super.dispose();
  }

  bool _validateStep1() {
    final errs = <String>[];
    if (_firstNameCtrl.text.trim().isEmpty) errs.add('First name is required');
    if (_lastNameCtrl.text.trim().isEmpty) errs.add('Last name is required');
    if (_emailCtrl.text.trim().isEmpty) errs.add('Email is required');
    if (_phoneCtrl.text.trim().isEmpty) errs.add('Phone number is required');

    setState(() => _errors = errs);
    return errs.isEmpty;
  }

  bool _validateStep2() {
    final errs = <String>[];
    if (_passwordCtrl.text.isEmpty) errs.add('Password is required');
    if (_passwordCtrl.text.length < 8) {
      errs.add('Password must be at least 8 characters');
    }
    if (_passwordCtrl.text != _confirmPasswordCtrl.text) {
      errs.add('Passwords do not match');
    }
    if (!_agreeToTerms) {
      errs.add('You must agree to the Terms & Privacy Policy');
    }

    setState(() => _errors = errs);
    return errs.isEmpty;
  }

  Future<void> _handleGoogleRegister() async {
    setState(() => _isLoading = true);
    _errors.clear();

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
          _errors = ['Failed to get Google ID token'];
          _isLoading = false;
        });
        return;
      }

      // Google OAuth not yet implemented
      setState(() {
        _errors = ['Google registration coming soon'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errors = ['Google registration error: $e'];
        _isLoading = false;
      });
    }
  }

  Future<void> _handleRegister() async {
    if (!_validateStep2()) return;

    setState(() => _isLoading = true);

    try {
      final result = await AuthService.register(
        firstName: _firstNameCtrl.text.trim(),
        lastName: _lastNameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        password: _passwordCtrl.text,
        passwordConfirmation: _confirmPasswordCtrl.text,
        userType: _userType,
      );

      if (result['success']) {
        if (mounted) {
          // Store user data
          final userData = result['data']?['data']?['user'] ?? {};
          _userService.setUserData(
            userType: _userType,
            token: result['data']?['data']?['token'],
            userName: '${_firstNameCtrl.text} ${_lastNameCtrl.text}',
            userEmail: _emailCtrl.text.trim(),
          );

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Registration successful!')),
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
        print('Register Failed: ${result['message']}');
        setState(() => _errors = [result['message'] ?? 'Registration failed']);
      }
    } catch (e) {
      print('Register Catch Error: $e');
      setState(() => _errors = ['An error occurred: $e']);
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
        title: Text(
          'Step $_currentStep of 2',
          style: const TextStyle(color: kCream, fontSize: 14),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Progress indicator
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 4,
                      decoration: BoxDecoration(
                        color: _currentStep >= 1 ? kGold : kBorder,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      height: 4,
                      decoration: BoxDecoration(
                        color: _currentStep >= 2 ? kGold : kBorder,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              if (_currentStep == 1) ...[
                // Step 1: Personal Info
                Text(
                  'Create Your Account',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        color: kCream,
                        fontWeight: FontWeight.w600,
                        fontSize: 32,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Let\'s start with your basic information',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: kSlate,
                        fontSize: 16,
                      ),
                ),
                const SizedBox(height: 32),

                // User Type Selection
                Text(
                  'I am a',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: kCream,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 12),
                ...userTypes.map((type) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () => setState(() => _userType = type['value']!),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: _userType == type['value'] ? kGold : kBorder,
                                width: _userType == type['value'] ? 2 : 1,
                              ),
                              borderRadius: BorderRadius.circular(8),
                              color: _userType == type['value']
                                  ? kGold.withOpacity(0.1)
                                  : Colors.transparent,
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 20,
                                  height: 20,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: _userType == type['value']
                                          ? kGold
                                          : kBorder,
                                    ),
                                  ),
                                  child: _userType == type['value']
                                      ? Center(
                                          child: Container(
                                            width: 10,
                                            height: 10,
                                            decoration: const BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: kGold,
                                            ),
                                          ),
                                        )
                                      : null,
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      type['label']!,
                                      style:
                                          Theme.of(context).textTheme.labelMedium?.copyWith(
                                                color: kCream,
                                                fontWeight: FontWeight.w600,
                                              ),
                                    ),
                                    Text(
                                      type['desc']!,
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: kSlate,
                                          ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    )),
                const SizedBox(height: 24),

                // First Name
                _buildTextField(
                  label: 'First Name',
                  controller: _firstNameCtrl,
                  hint: 'Enter your first name',
                  icon: Icons.person_outline,
                ),
                const SizedBox(height: 16),

                // Last Name
                _buildTextField(
                  label: 'Last Name',
                  controller: _lastNameCtrl,
                  hint: 'Enter your last name',
                  icon: Icons.person_outline,
                ),
                const SizedBox(height: 16),

                // Email
                _buildTextField(
                  label: 'Email',
                  controller: _emailCtrl,
                  hint: 'Enter your email',
                  icon: Icons.mail_outline,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 16),

                // Phone
                _buildTextField(
                  label: 'Phone Number',
                  controller: _phoneCtrl,
                  hint: 'Enter your phone number',
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 24),

                // Error Messages
                if (_errors.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFe07070).withOpacity(0.1),
                        border: Border.all(
                            color: const Color(0xFFe07070).withOpacity(0.3)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: _errors
                            .map((e) => Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.error_outline,
                                          color: Color(0xFFe07070), size: 16),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          e,
                                          style: const TextStyle(
                                            color: Color(0xFFe07070),
                                            fontSize: 13,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ))
                            .toList(),
                      ),
                    ),
                  ),

                // Next Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {
                      if (_validateStep1()) {
                        setState(() => _currentStep = 2);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kGold,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'Continue',
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
                    onPressed: _isLoading ? null : _handleGoogleRegister,
                    icon: const Icon(Icons.login, color: kGold, size: 20),
                    label: const Text(
                      'Sign up with Google',
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
              ] else ...[
                // Step 2: Password & Terms
                Text(
                  'Secure Your Account',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        color: kCream,
                        fontWeight: FontWeight.w600,
                        fontSize: 32,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Create a strong password to protect your account',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: kSlate,
                        fontSize: 16,
                      ),
                ),
                const SizedBox(height: 32),

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
                  onChanged: (_) => setState(() {}),
                  style: const TextStyle(color: kCream),
                  decoration: InputDecoration(
                    hintText: 'Enter a strong password',
                    hintStyle: const TextStyle(color: kSlate),
                    prefixIcon: const Icon(Icons.lock_outline, color: kGold),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _showPassword ? Icons.visibility : Icons.visibility_off,
                        color: kGold,
                      ),
                      onPressed: () =>
                          setState(() => _showPassword = !_showPassword),
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
                const SizedBox(height: 16),

                // Password Requirements
                _buildPasswordRequirement(
                  'At least 8 characters',
                  _passwordCtrl.text.length >= 8,
                ),
                _buildPasswordRequirement(
                  'Uppercase letter',
                  RegExp(r'[A-Z]').hasMatch(_passwordCtrl.text),
                ),
                _buildPasswordRequirement(
                  'Lowercase letter',
                  RegExp(r'[a-z]').hasMatch(_passwordCtrl.text),
                ),
                _buildPasswordRequirement(
                  'Contains a number',
                  RegExp(r'\d').hasMatch(_passwordCtrl.text),
                ),
                const SizedBox(height: 20),

                // Confirm Password Field
                Text(
                  'Confirm Password',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: kCream,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _confirmPasswordCtrl,
                  obscureText: !_showConfirmPassword,
                  style: const TextStyle(color: kCream),
                  decoration: InputDecoration(
                    hintText: 'Confirm your password',
                    hintStyle: const TextStyle(color: kSlate),
                    prefixIcon: const Icon(Icons.lock_outline, color: kGold),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _showConfirmPassword
                            ? Icons.visibility
                            : Icons.visibility_off,
                        color: kGold,
                      ),
                      onPressed: () => setState(
                          () => _showConfirmPassword = !_showConfirmPassword),
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
                const SizedBox(height: 20),

                // Terms Checkbox
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Checkbox(
                      value: _agreeToTerms,
                      onChanged: (v) =>
                          setState(() => _agreeToTerms = v ?? false),
                      activeColor: kGold,
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          'I agree to the Terms & Conditions and Privacy Policy',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: kCream,
                                    fontSize: 13,
                                  ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Error Messages
                if (_errors.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFe07070).withOpacity(0.1),
                        border: Border.all(
                            color: const Color(0xFFe07070).withOpacity(0.3)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: _errors
                            .map((e) => Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.error_outline,
                                          color: Color(0xFFe07070), size: 16),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          e,
                                          style: const TextStyle(
                                            color: Color(0xFFe07070),
                                            fontSize: 13,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ))
                            .toList(),
                      ),
                    ),
                  ),

                // Register Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleRegister,
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
                              valueColor: AlwaysStoppedAnimation<Color>(
                                  Color(0xFF0A0F1E)),
                            ),
                          )
                        : const Text(
                            'Create Account',
                            style: TextStyle(
                              color: Color(0xFF0A0F1E),
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 16),

                // Back Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    onPressed: () => setState(() => _currentStep = 1),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: kBorder),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'Back',
                      style: TextStyle(
                        color: kCream,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    const kGold = Color(0xFFC89128);
    const kBg2 = Color(0xFF0F172A);
    const kCream = Color(0xFFF1F5F9);
    const kSlate = Color(0xFF94A3B8);
    const kBorder = Color(0x26C89128);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: kCream,
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(color: kCream),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: kSlate),
            prefixIcon: Icon(icon, color: kGold),
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
      ],
    );
  }

  Widget _buildPasswordRequirement(String text, bool met) {
    const kGold = Color(0xFFC89128);
    const kSlate = Color(0xFF94A3B8);
    const kCream = Color(0xFFF1F5F9);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(
            met ? Icons.check_circle : Icons.radio_button_unchecked,
            color: met ? kGold : kSlate,
            size: 16,
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              color: met ? kCream : kSlate,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
