import 'dart:io';
import 'package:flutter/material.dart';

import 'features/home/presentation/pages/home_page.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/auth/presentation/pages/register_page.dart';
import 'features/agent/presentation/pages/agent_dashboard.dart';
import 'features/landlord/presentation/pages/landlord_dashboard.dart';
import 'features/tenant/presentation/pages/tenant_dashboard.dart';
import 'features/bnb/presentation/pages/bnb_dashboard.dart';
import 'features/commercial/presentation/pages/commercial_dashboard.dart';

void main() {
  HttpOverrides.global = MyHttpOverrides(); // 👈 ADD THIS
  runApp(const MyApp());
}

/// SSL override (DEV ONLY)
class MyHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback =
          (X509Certificate cert, String host, int port) => true;
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Oweru Rental',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFC89128)),
        useMaterial3: true,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const HomePage(),
        '/login': (context) => const LoginPage(),
        '/register': (context) => const RegisterPage(),
        '/agent-dashboard': (context) => const AgentDashboard(),
        '/landlord-dashboard': (context) => const LandlordDashboard(),
        '/tenant-dashboard': (context) => const TenantDashboard(),
        '/bnb-dashboard': (context) => const BnbDashboard(),
        '/commercial-dashboard': (context) => const CommercialDashboard(),
      },
    );
  }
}