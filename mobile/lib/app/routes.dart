import 'package:flutter/material.dart';
import '../features/agent/presentation/pages/agent_dashboard.dart';
import '../features/auth/presentation/pages/login_page.dart';
import '../features/auth/presentation/pages/register_page.dart';
import '../features/bnb/presentation/pages/bnb_dashboard.dart';
import '../features/commercial/presentation/pages/commercial_dashboard.dart';
import '../features/home/presentation/pages/home_page.dart';
import '../features/landlord/presentation/pages/landlord_dashboard.dart';
import '../features/tenant/presentation/pages/tenant_dashboard.dart';

class AppRoutes {
  static const home = '/';
  static const login = '/login';
  static const register = '/register';
  static const agentDashboard = '/agent-dashboard';
  static const landlordDashboard = '/landlord-dashboard';
  static const tenantDashboard = '/tenant-dashboard';
  static const bnbDashboard = '/bnb-dashboard';
  static const commercialDashboard = '/commercial-dashboard';

  static Map<String, WidgetBuilder> get routes => {
        home: (context) => const HomePage(),
        login: (context) => const LoginPage(),
        register: (context) => const RegisterPage(),
        agentDashboard: (context) => const AgentDashboard(),
        landlordDashboard: (context) => const LandlordDashboard(),
        tenantDashboard: (context) => const TenantDashboard(),
        bnbDashboard: (context) => const BnbDashboard(),
        commercialDashboard: (context) => const CommercialDashboard(),
      };
}
