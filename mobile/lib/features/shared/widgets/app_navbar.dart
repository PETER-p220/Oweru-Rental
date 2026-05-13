import 'package:flutter/material.dart';

const Color kGold = Color(0xFFC89128);
const Color kGoldLight = Color(0xFFE6A830);
const Color kBg = Color(0xFF0A0F1E);
const Color kBg2 = Color(0xFF0F172A);
const Color kBg3 = Color(0xFF162035);
const Color kCream = Color(0xFFF1F5F9);
const Color kSlate = Color(0xFF94A3B8);
const Color kSlateDim = Color(0xFF64748B);
const Color kBorder = Color(0x26C89128);
const Color kGoldBorder = Color(0x33C89128);

class AppNavBar extends StatelessWidget implements PreferredSizeWidget {
  final bool isLoggedIn;
  final VoidCallback? onLoginPressed;
  final VoidCallback? onRegisterPressed;
  final VoidCallback? onLogoutPressed;
  final String? userName;

  const AppNavBar({
    Key? key,
    required this.isLoggedIn,
    this.onLoginPressed,
    this.onRegisterPressed,
    this.onLogoutPressed,
    this.userName,
  }) : super(key: key);

  @override
  Size get preferredSize => const Size.fromHeight(64.0);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: kBg2,
      elevation: 1,
      shadowColor: kGoldBorder,
      title: const Padding(
        padding: EdgeInsets.only(left: 8.0),
        child: Text(
          'Oweru',
          style: TextStyle(
            color: kGold,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      actions: [
        if (!isLoggedIn) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: TextButton(
              onPressed: onLoginPressed,
              style: TextButton.styleFrom(
                foregroundColor: kCream,
                padding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              child: const Text(
                'Login',
                style: TextStyle(fontSize: 16),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: ElevatedButton(
              onPressed: onRegisterPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: kGold,
                foregroundColor: kBg,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Register',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ] else ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              children: [
                Text(
                  userName ?? 'User',
                  style: const TextStyle(
                    color: kCream,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(width: 16),
                GestureDetector(
                  onTap: onLogoutPressed,
                  child: const Icon(Icons.logout, color: kGold),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(width: 8),
      ],
    );
  }
}
