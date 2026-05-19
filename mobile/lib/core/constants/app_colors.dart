import 'package:flutter/material.dart';

/// App Color Palette - White and Slate Theme
class AppColors {
  // Primary Colors - Whites
  static const Color white = Color(0xFFFFFFFF);
  static const Color offWhite = Color(0xFFF8FAFC);
  static const Color lightGray = Color(0xFFF1F5F9);

  // Secondary Colors - Slate
  static const Color slate50 = Color(0xFFF8FAFC);
  static const Color slate100 = Color(0xFFE2E8F0);
  static const Color slate200 = Color(0xFFCBD5E1);
  static const Color slate300 = Color(0xFFB0BEC5);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate500 = Color(0xFF78909C);
  static const Color slate600 = Color(0xFF607D8B);
  static const Color slate700 = Color(0xFF455A64);
  static const Color slate800 = Color(0xFF37474F);
  static const Color slate900 = Color(0xFF263238);

  // Semantic Colors
  static const Color primary = slate700;
  static const Color secondary = slate400;
  static const Color accent = slate600;

  // Text Colors
  static const Color textPrimary = slate900;
  static const Color textSecondary = slate600;
  static const Color textTertiary = slate400;
  static const Color textLight = slate200;

  // Background Colors
  static const Color bgPrimary = white;
  static const Color bgSecondary = slate50;
  static const Color bgTertiary = slate100;

  // Border Colors
  static const Color border = slate200;
  static const Color borderLight = slate100;
  static const Color borderDark = slate400;

  // Status Colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Shadow/Divider
  static const Color divider = slate200;
  static const Color shadow = slate400;
}
