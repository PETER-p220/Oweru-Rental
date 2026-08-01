import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/user_service.dart';

class LogoutButton extends StatelessWidget {
  final VoidCallback? onLogout;

  const LogoutButton({super.key, this.onLogout});

  Future<void> _handleLogout(BuildContext context) async {
    await AuthService.logout();
    await UserService().clear();
    AuthService.setToken(null);

    onLogout?.call();

    if (context.mounted) {
      Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const kGold = Color(0xFFC89128);
    
    return IconButton(
      icon: const Icon(Icons.logout, color: kGold),
      onPressed: () {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: const Color(0xFF0F172A),
            title: const Text(
              'Logout',
              style: TextStyle(color: Color(0xFFF1F5F9)),
            ),
            content: const Text(
              'Are you sure you want to logout?',
              style: TextStyle(color: Color(0xFF94A3B8)),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text(
                  'Cancel',
                  style: TextStyle(color: Color(0xFF94A3B8)),
                ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  _handleLogout(context);
                },
                child: const Text(
                  'Logout',
                  style: TextStyle(color: kGold),
                ),
              ),
            ],
          ),
        );
      },
      tooltip: 'Logout',
    );
  }
}
