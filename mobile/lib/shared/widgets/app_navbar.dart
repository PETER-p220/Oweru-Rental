import 'package:flutter/material.dart';

class AppNavBar extends StatelessWidget implements PreferredSizeWidget {
  final VoidCallback? onLoginPressed;
  final VoidCallback? onRegisterPressed;
  final VoidCallback? onProfilePressed;
  final String? userDisplayName;
  final bool isLoggedIn;

  const AppNavBar({
    super.key,
    this.onLoginPressed,
    this.onRegisterPressed,
    this.onProfilePressed,
    this.userDisplayName,
    this.isLoggedIn = false,
  });

  @override
  Widget build(BuildContext context) {
    const kGold = Color(0xFFC89128);
    const kBg = Color(0xFF0A0F1E);
    const kBg2 = Color(0xFF0F172A);
    const kCream = Color(0xFFF1F5F9);
    const kSlate = Color(0xFF94A3B8);
    const kBorder = Color(0x26C89128);

    return AppBar(
      backgroundColor: kBg2,
      elevation: 1,
      shadowColor: Colors.black.withValues(alpha: 0.3),
      title: Row(
        children: [
          // Logo/Branding
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: const Text(
              'Oweru',
              style: TextStyle(
                color: kGold,
                fontSize: 20,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
      actions: [
        if (!isLoggedIn) ...[
          // Login Button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: ElevatedButton(
              onPressed: onLoginPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                side: const BorderSide(color: kGold),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
              ),
              child: const Text(
                'Login',
                style: TextStyle(
                  color: kGold,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          // Register Button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: ElevatedButton(
              onPressed: onRegisterPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: kGold,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
              ),
              child: const Text(
                'Sign Up',
                style: TextStyle(
                  color: kBg,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ] else ...[
          // User Profile / Logout
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Center(
              child: PopupMenuButton<String>(
                offset: const Offset(0, 48),
                color: kBg2,
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: kGold),
                      ),
                      child: Center(
                        child: Text(
                          userDisplayName?.isNotEmpty == true
                              ? userDisplayName![0].toUpperCase()
                              : 'U',
                          style: const TextStyle(
                            color: kGold,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      userDisplayName ?? 'User',
                      style: const TextStyle(
                        color: kCream,
                        fontSize: 12,
                        overflow: TextOverflow.ellipsis,
                      ),
                      maxLines: 1,
                    ),
                  ],
                ),
                itemBuilder: (BuildContext context) => [
                  PopupMenuItem<String>(
                    value: 'profile',
                    onTap: onProfilePressed,
                    child: Row(
                      children: const [
                        Icon(Icons.person, color: kGold, size: 18),
                        SizedBox(width: 10),
                        Text('Profile', style: TextStyle(color: kCream)),
                      ],
                    ),
                  ),
                  const PopupMenuDivider(height: 8),
                  PopupMenuItem<String>(
                    value: 'logout',
                    child: Row(
                      children: const [
                        Icon(Icons.logout, color: Color(0xFFe07070), size: 18),
                        SizedBox(width: 10),
                        Text('Logout', style: TextStyle(color: Color(0xFFe07070))),
                      ],
                    ),
                  ),
                ],
                onSelected: (String value) {
                  if (value == 'logout') {
                    // Handle logout
                  }
                },
              ),
            ),
          ),
        ],
        const SizedBox(width: 8),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
