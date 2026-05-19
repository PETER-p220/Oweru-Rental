// ============================================================
// TENANT DASHBOARD — homepage color scheme
// ============================================================
import 'package:flutter/material.dart';
import '../../../shared/widgets/logout_button.dart';
import '../../../shared/services/user_service.dart';
import 'applications_page.dart';
import 'saved_properties_page.dart';
import 'payments_page.dart';
import 'payment_history_page.dart';
import 'contracts_page.dart';
import 'messages_page.dart';
import 'notifications_page.dart';
import 'properties_page.dart';
import 'tenant_theme.dart';

class TenantDashboard extends StatefulWidget {
  const TenantDashboard({super.key});
  @override
  State<TenantDashboard> createState() => _TenantDashboardState();
}

class _TenantDashboardState extends State<TenantDashboard>
    with SingleTickerProviderStateMixin {

  int _selectedIndex = 0;
  final _userService = UserService();
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  AnimationController? _fadeCtrl;
  Animation<double>? _fadeAnim;

  static const _bottomNavItems = [
    {'label': 'Home',         'icon': Icons.grid_view_rounded},
    {'label': 'Browse',       'icon': Icons.search_rounded},
    {'label': 'Applications', 'icon': Icons.description_rounded},
    {'label': 'Payments',     'icon': Icons.account_balance_wallet_rounded},
    {'label': 'More',         'icon': Icons.menu_rounded},
  ];

  static const _drawerItems = [
    {'label': 'Saved',      'icon': Icons.favorite_rounded,             'index': 5},
    {'label': 'History',    'icon': Icons.history_rounded,              'index': 6},
    {'label': 'Contracts',  'icon': Icons.gavel_rounded,                'index': 7},
    {'label': 'Messages',   'icon': Icons.chat_bubble_outline_rounded,  'index': 8},
    {'label': 'Settings',   'icon': Icons.tune_rounded,                 'index': 9},
  ];

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 250));
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl!, curve: Curves.easeOut);
    _fadeCtrl!.forward();
  }

  @override
  void dispose() {
    _fadeCtrl?.dispose();
    super.dispose();
  }

  void _navigate(int idx) {
    if (_selectedIndex == idx) return;
    _fadeCtrl?.reverse().then((_) {
      if (!mounted) return;
      setState(() => _selectedIndex = idx);
      _fadeCtrl?.forward();
    });
  }

  int get _bottomNavIndex => _selectedIndex < 4 ? _selectedIndex : 4;

  @override
  Widget build(BuildContext context) => Scaffold(
    key: _scaffoldKey,
    backgroundColor: kBg,
    appBar: _appBar(),
    drawer: _drawer(),
    endDrawer: _profileDrawer(),
    body: FadeTransition(
      opacity: _fadeAnim ?? const AlwaysStoppedAnimation(1.0),
      child: _content(),
    ),
    bottomNavigationBar: _bottomNav(),
  );

  // ── AppBar ──────────────────────────────────────────────
  PreferredSizeWidget _appBar() => AppBar(
    backgroundColor: kBg2,
    elevation: 0,
    automaticallyImplyLeading: false,
    titleSpacing: 16,
    title: Row(children: [
      const Text('Oweru',
        style: TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
      const SizedBox(width: 8),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(color: kGoldDim, borderRadius: BorderRadius.circular(4),
          border: Border.all(color: kGoldBorder)),
        child: const Text('TENANT', style: kLabelStyle),
      ),
    ]),
    actions: [
      Stack(children: [
        IconButton(
          onPressed: () => Navigator.push(context,
            MaterialPageRoute(builder: (_) => const NotificationsPage())),
          icon: const Icon(Icons.notifications_none_rounded, color: kSlate, size: 22)),
        Positioned(top: 10, right: 10,
          child: Container(width: 7, height: 7,
            decoration: BoxDecoration(color: kDanger, shape: BoxShape.circle,
              border: Border.all(color: kBg2, width: 1.5)))),
      ]),
      GestureDetector(
        onTap: () => _scaffoldKey.currentState?.openEndDrawer(),
        child: Container(
          width: 32, height: 32,
          margin: const EdgeInsets.only(right: 14),
          decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: kGold)),
          child: Center(child: Text(
            _userService.userName?.isNotEmpty == true
                ? _userService.userName![0].toUpperCase() : 'T',
            style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w700),
          )),
        ),
      ),
    ],
  );

  // ── Profile Drawer ──────────────────────────────────────
  Widget _profileDrawer() => Drawer(
    backgroundColor: kBg2,
    child: SafeArea(child: Column(children: [
      Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: kBannerGradient, borderRadius: BorderRadius.circular(14),
          border: Border.all(color: kGoldBorder)),
        child: Row(children: [
          Container(width: 50, height: 50,
            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: kGold, width: 2)),
            child: Center(child: Text(
              _userService.userName?.isNotEmpty == true
                  ? _userService.userName![0].toUpperCase() : 'T',
              style: const TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700),
            ))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(_userService.userName ?? 'Tenant',
              style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            const TStatusBadge(label: 'Active Tenant', color: kSuccess),
          ])),
        ]),
      ),
      Divider(color: kGold.withOpacity(0.15)),
      ListTile(
        leading: const Icon(Icons.tune_rounded, color: kSlate, size: 20),
        title: const Text('Settings', style: TextStyle(color: kCream, fontSize: 14)),
        onTap: () { Navigator.pop(context); _navigate(9); },
      ),
      const Spacer(),
      Divider(color: kGold.withOpacity(0.15)),
      const Padding(padding: EdgeInsets.all(16), child: LogoutButton()),
    ])),
  );

  // ── Side Drawer ─────────────────────────────────────────
  Widget _drawer() => Drawer(
    backgroundColor: kBg2,
    child: SafeArea(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Padding(padding: EdgeInsets.fromLTRB(20, 22, 20, 8),
        child: Text('More', style: TextStyle(color: kCream, fontSize: 20, fontWeight: FontWeight.w800))),
      Divider(color: kGold.withOpacity(0.15)),
      ..._drawerItems.map((item) {
        final active = _selectedIndex == (item['index'] as int);
        return ListTile(
          leading: Icon(item['icon'] as IconData, color: active ? kGold : kSlate, size: 20),
          title: Text(item['label'] as String,
            style: TextStyle(color: active ? kGold : kCream,
              fontWeight: active ? FontWeight.w600 : FontWeight.w400, fontSize: 14)),
          tileColor: active ? kGold.withOpacity(0.08) : null,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          onTap: () { Navigator.pop(context); _navigate(item['index'] as int); },
        );
      }),
    ])),
  );

  // ── Bottom Nav ──────────────────────────────────────────
  Widget _bottomNav() => Container(
    decoration: BoxDecoration(color: kBg2,
      border: Border(top: BorderSide(color: kGold.withOpacity(0.2), width: 1))),
    child: SafeArea(child: SizedBox(height: 62,
      child: Row(children: List.generate(_bottomNavItems.length, (i) {
        final item = _bottomNavItems[i];
        final sel = _bottomNavIndex == i;
        return Expanded(child: GestureDetector(
          onTap: () {
            if (i == 4) { _scaffoldKey.currentState?.openDrawer(); return; }
            _navigate(i);
          },
          behavior: HitTestBehavior.opaque,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            decoration: BoxDecoration(
              color: sel ? kGold.withOpacity(0.12) : Colors.transparent,
              borderRadius: BorderRadius.circular(10)),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(item['icon'] as IconData, color: sel ? kGold : kSlate, size: 21),
              const SizedBox(height: 2),
              Text(item['label'] as String,
                style: TextStyle(color: sel ? kGold : kSlate,
                  fontSize: 10, fontWeight: sel ? FontWeight.w700 : FontWeight.w400)),
            ]),
          ),
        ));
      })),
    )),
  );

  // ── Content Router ──────────────────────────────────────
  Widget _content() {
    switch (_selectedIndex) {
      case 0:  return _dashboard();
      case 1:  return const PropertiesPage();
      case 2:  return const ApplicationsPage();
      case 3:  return const PaymentsPage();
      case 5:  return const SavedPropertiesPage();
      case 6:  return const PaymentHistoryPage();
      case 7:  return const ContractsPage();
      case 8:  return const MessagesPage();
      case 9:  return _settings();
      default: return _dashboard();
    }
  }

  // ── Dashboard ───────────────────────────────────────────
  Widget _dashboard() => ListView(
    padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
    children: [
      _banner(),
      const SizedBox(height: 20),
      const TSectionHeader('Overview'),
      GridView.count(
        crossAxisCount: 2, shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.85,
        children: const [
          _StatCard(label: 'Applications', value: '2',         icon: Icons.description_rounded,            color: kInfo,    hint: 'Under review'),
          _StatCard(label: 'Saved',        value: '5',         icon: Icons.favorite_rounded,               color: kDanger,  hint: 'Browse more'),
          _StatCard(label: 'Due Payment',  value: 'TZS 1.5M',  icon: Icons.account_balance_wallet_rounded, color: kWarning, hint: 'In 5 days'),
          _StatCard(label: 'Contracts',    value: '1',         icon: Icons.gavel_rounded,                  color: kSuccess, hint: 'Active'),
        ],
      ),
      const SizedBox(height: 20),
      const TSectionHeader('Quick Actions'),
      TCard(child: Column(children: [
        _ActionRow(icon: Icons.search_rounded,                 label: 'Browse Properties', color: kGold,    onTap: () => _navigate(1)),
        _ActionRow(icon: Icons.account_balance_wallet_rounded, label: 'Make a Payment',    color: kSuccess, onTap: () => _navigate(3)),
        _ActionRow(icon: Icons.description_rounded,            label: 'My Applications',   color: kWarning, onTap: () => _navigate(2)),
        _ActionRow(icon: Icons.download_rounded,               label: 'Download Contract', color: kSlate,   onTap: () => _navigate(7), last: true),
      ])),
      const SizedBox(height: 20),
      const TSectionHeader('Recent Activity'),
      TCard(child: const Column(children: [
        _ActivityRow(icon: Icons.check_circle_rounded, title: 'Application approved',
          sub: 'Masaki Apartments — Unit 3B', color: kSuccess, time: '1h ago'),
        _ActivityRow(icon: Icons.payments_rounded, title: 'Payment received',
          sub: 'November rent — TZS 850,000',  color: kGold,    time: 'Yesterday'),
        _ActivityRow(icon: Icons.favorite_rounded, title: 'Property saved',
          sub: 'Oyster Bay Villa — 4 bed',     color: kDanger,  time: '3 days ago', last: true),
      ])),
    ],
  );

  Widget _banner() => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      gradient: kBannerGradient, borderRadius: BorderRadius.circular(16),
      border: Border.all(color: kGoldBorder),
      boxShadow: const [BoxShadow(color: Color(0x20C89128), blurRadius: 20, offset: Offset(0, 6))]),
    child: Row(children: [
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Hello, ${_userService.userName ?? 'Tenant'} 👋',
          style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        const Text('You have a payment due in 5 days.',
          style: TextStyle(color: kSlate, fontSize: 12)),
        const SizedBox(height: 14),
        TGoldButton(label: 'Pay Now →', onTap: () => _navigate(3), fullWidth: false),
      ])),
      const SizedBox(width: 12),
      Container(width: 54, height: 54,
        decoration: BoxDecoration(color: kGold.withOpacity(0.12),
          borderRadius: BorderRadius.circular(14), border: Border.all(color: kGoldBorder)),
        child: const Icon(Icons.apartment_rounded, color: kGold, size: 26)),
    ]),
  );

  // ── Settings ────────────────────────────────────────────
  Widget _settings() => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      const TSectionHeader('Account Settings'),
      TCard(child: Column(children: [
        _SettingsRow(title: 'Full Name', value: _userService.userName ?? 'Tenant', icon: Icons.person_rounded),
        const _SettingsRow(title: 'Email',  value: 'Not set', icon: Icons.email_rounded),
        const _SettingsRow(title: 'Phone',  value: 'Not set', icon: Icons.phone_rounded, last: true),
      ])),
      const SizedBox(height: 12),
      TCard(child: const Column(children: [
        _SettingsRow(title: 'Notifications', value: 'Manage',  icon: Icons.notifications_rounded),
        _SettingsRow(title: 'Language',      value: 'English', icon: Icons.language_rounded),
        _SettingsRow(title: 'Currency',      value: 'TZS',     icon: Icons.currency_exchange_rounded, last: true),
      ])),
      const SizedBox(height: 24),
      const LogoutButton(),
    ],
  );
}

// ── Const sub-widgets ─────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final String label, value, hint;
  final IconData icon;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.hint,
    required this.icon, required this.color});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: kBg2, borderRadius: BorderRadius.circular(12),
      border: Border.all(color: kBorder)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(width: 28, height: 28,
          decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(7)),
          child: Icon(icon, color: color, size: 14)),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
        const SizedBox(height: 1),
        Text(label, style: const TextStyle(color: kSlate, fontSize: 9)),
        Text(hint,  style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w600)),
      ]),
  );
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  final bool last;
  const _ActionRow({required this.icon, required this.label, required this.color,
    required this.onTap, this.last = false});
  @override
  Widget build(BuildContext context) => Column(children: [
    InkWell(
      onTap: onTap, borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 11),
        child: Row(children: [
          Container(width: 36, height: 36,
            decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(9)),
            child: Icon(icon, color: color, size: 17)),
          const SizedBox(width: 12),
          Expanded(child: Text(label,
            style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w500))),
          const Icon(Icons.chevron_right_rounded, color: kSlateDim, size: 18),
        ]),
      ),
    ),
    if (!last) Divider(color: kGold.withOpacity(0.1), height: 1),
  ]);
}

class _ActivityRow extends StatelessWidget {
  final IconData icon;
  final String title, sub, time;
  final Color color;
  final bool last;
  const _ActivityRow({required this.icon, required this.title, required this.sub,
    required this.color, required this.time, this.last = false});
  @override
  Widget build(BuildContext context) => Column(children: [
    Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(children: [
        Container(width: 36, height: 36,
          decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(9)),
          child: Icon(icon, color: color, size: 17)),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600)),
          Text(sub,   style: const TextStyle(color: kSlate, fontSize: 11)),
        ])),
        Text(time, style: const TextStyle(color: kSlateDim, fontSize: 10)),
      ]),
    ),
    if (!last) Divider(color: kGold.withOpacity(0.1), height: 1),
  ]);
}

class _SettingsRow extends StatelessWidget {
  final String title, value;
  final IconData icon;
  final bool last;
  const _SettingsRow({required this.title, required this.value, required this.icon, this.last = false});
  @override
  Widget build(BuildContext context) => Column(children: [
    Padding(
      padding: const EdgeInsets.symmetric(vertical: 11),
      child: Row(children: [
        Container(width: 32, height: 32,
          decoration: BoxDecoration(color: kGold.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: kGold, size: 16)),
        const SizedBox(width: 10),
        Expanded(child: Text(title, style: const TextStyle(color: kCream, fontSize: 13))),
        Text(value, style: const TextStyle(color: kSlate, fontSize: 12)),
        const SizedBox(width: 4),
        const Icon(Icons.chevron_right_rounded, color: kSlateDim, size: 16),
      ]),
    ),
    if (!last) Divider(color: kGold.withOpacity(0.1), height: 1),
  ]);
}