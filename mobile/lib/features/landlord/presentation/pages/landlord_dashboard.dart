// ============================================================
// landlord_dashboard.dart — dark navy/gold + tenant_theme
// ============================================================
import 'package:flutter/material.dart';
import '../../../shared/widgets/logout_button.dart';
import '../../../shared/services/user_service.dart';
import 'landlord_theme.dart';
import 'landlord_properties.dart';
import 'landlord_tenants.dart';
import 'landlord_messages.dart';
import 'landlord_analytics.dart';
import 'landlord_receipts.dart';
import 'landlord_applications.dart';
import 'landlord_rent_collection.dart';
import 'landlord_digital_contract.dart';
import 'landlord_commission_reports.dart';

class LandlordDashboard extends StatefulWidget {
  const LandlordDashboard({super.key});
  @override
  State<LandlordDashboard> createState() => _LandlordDashboardState();
}

class _LandlordDashboardState extends State<LandlordDashboard>
    with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  final _userService  = UserService();
  final _scaffoldKey  = GlobalKey<ScaffoldState>();
  late AnimationController _fadeCtrl;
  late Animation<double>   _fadeAnim;

  final _bottomNavItems = const [
    {'label': 'Home',       'icon': Icons.grid_view_rounded},
    {'label': 'Properties', 'icon': Icons.home_work_rounded},
    {'label': 'Tenants',    'icon': Icons.people_alt_rounded},
    {'label': 'Payments',   'icon': Icons.account_balance_wallet_rounded},
    {'label': 'More',       'icon': Icons.menu_rounded},
  ];

  final _drawerItems = const [
    {'label': 'Applications',   'icon': Icons.person_add_rounded,          'index': 4},
    {'label': 'Receipts',        'icon': Icons.receipt_long_rounded,          'index': 5},
    {'label': 'Analytics',       'icon': Icons.bar_chart_rounded,             'index': 6},
    {'label': 'Messages',        'icon': Icons.chat_bubble_outline_rounded,   'index': 7},
    {'label': 'Contracts',       'icon': Icons.description_rounded,            'index': 8},
    {'label': 'Commissions',     'icon': Icons.monetization_on_rounded,       'index': 9},
    {'label': 'Settings',        'icon': Icons.tune_rounded,                  'index': 10},
  ];

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 250));
    _fadeAnim  = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _fadeCtrl.forward();
  }

  @override
  void dispose() { _fadeCtrl.dispose(); super.dispose(); }

  void _navigate(int idx) {
    if (_selectedIndex == idx) return;
    _fadeCtrl.reverse().then((_) {
      if (!mounted) return;
      setState(() => _selectedIndex = idx);
      _fadeCtrl.forward();
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
    body: FadeTransition(opacity: _fadeAnim, child: _content()),
    bottomNavigationBar: _bottomNav(),
  );

  // ── AppBar ───────────────────────────────────────────────
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
        child: const Text('LANDLORD', style: kLabelStyle),
      ),
    ]),
    actions: [
      Stack(children: [
        IconButton(
          onPressed: () {},
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
          decoration: BoxDecoration(shape: BoxShape.circle,
            border: Border.all(color: kGold)),
          child: Center(child: Text(
            _userService.userName?.isNotEmpty == true
                ? _userService.userName![0].toUpperCase() : 'L',
            style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w700),
          )),
        ),
      ),
    ],
  );

  // ── Profile drawer ───────────────────────────────────────
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
                  ? _userService.userName![0].toUpperCase() : 'L',
              style: const TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700),
            ))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(_userService.userName ?? 'Landlord',
              style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            LStatusBadge(label: 'Property Owner', color: kGold),
          ])),
        ]),
      ),
      Divider(color: kGold.withOpacity(0.15)),
      ListTile(
        leading: const Icon(Icons.tune_rounded, color: kSlate, size: 20),
        title: const Text('Settings', style: TextStyle(color: kCream, fontSize: 14)),
        onTap: () { Navigator.pop(context); _navigate(10); },
      ),
      const Spacer(),
      Divider(color: kGold.withOpacity(0.15)),
      const Padding(padding: EdgeInsets.all(16), child: LogoutButton()),
    ])),
  );

  // ── Side drawer ──────────────────────────────────────────
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

  // ── Bottom nav ───────────────────────────────────────────
  Widget _bottomNav() => Container(
    decoration: BoxDecoration(color: kBg2,
      border: Border(top: BorderSide(color: kGold.withOpacity(0.2)))),
    child: SafeArea(child: SizedBox(height: 62,
      child: Row(children: List.generate(_bottomNavItems.length, (i) {
        final item = _bottomNavItems[i];
        final sel  = _bottomNavIndex == i;
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

  // ── Content router ───────────────────────────────────────
  Widget _content() {
    switch (_selectedIndex) {
      case 0: return _dashboard();
      case 1: return const LandlordPropertiesPage();
      case 2: return const LandlordTenantsPage();
      case 3: return const LandlordRentCollectionPage();
      case 4: return const LandlordApplicationsPage();
      case 5: return const LandlordReceiptsPage();
      case 6: return const LandlordAnalyticsPage();
      case 7: return const LandlordMessagesPage();
      case 8: return const LandlordDigitalContractPage();
      case 9: return const LandlordCommissionReportsPage();
      case 10: return _settings();
      default: return _dashboard();
    }
  }

  // ── Dashboard ────────────────────────────────────────────
  Widget _dashboard() => ListView(
    padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
    children: [
      _banner(),
      const SizedBox(height: 20),
      LSectionHeader('Overview'),
      GridView.count(
        crossAxisCount: 2, shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 10, mainAxisSpacing: 10,
        childAspectRatio: 1.9,
        children: const [
          _StatCard(label: 'Properties', value: '8',        icon: Icons.home_work_rounded,              color: kGold,    hint: '+2 this month'),
          _StatCard(label: 'Tenants',    value: '12',       icon: Icons.people_alt_rounded,             color: kSuccess, hint: 'All occupied'),
          _StatCard(label: 'Monthly',    value: 'TZS 5.2M', icon: Icons.account_balance_wallet_rounded, color: kWarning, hint: '+8% vs last month'),
          _StatCard(label: 'Pending',    value: '3',        icon: Icons.receipt_long_rounded,           color: kDanger,  hint: 'Needs attention'),
        ],
      ),
      const SizedBox(height: 20),
      LSectionHeader('Quick Actions'),
      LCard(child: Column(children: [
        _ActionRow(icon: Icons.add_home_rounded,    label: 'Add Property',    color: kGold,    onTap: () => _navigate(1)),
        _ActionRow(icon: Icons.payments_rounded,    label: 'Record Payment',  color: kSuccess, onTap: () => _navigate(3)),
        _ActionRow(icon: Icons.chat_bubble_rounded, label: 'Send Message',    color: kInfo,    onTap: () => _navigate(6)),
        _ActionRow(icon: Icons.summarize_rounded,   label: 'Generate Report', color: kSlate,   onTap: () => _navigate(5), last: true),
      ])),
      const SizedBox(height: 20),
      LSectionHeader('Recent Activity'),
      LCard(child: Column(children: [
        _ActivityRow(icon: Icons.payments_rounded,    title: 'Rent received — Unit 3B',  sub: 'TZS 450,000',          color: kSuccess, time: '2h ago'),
        _ActivityRow(icon: Icons.person_add_rounded,  title: 'New tenant — James Osei', sub: 'Unit 5A, Mikocheni',   color: kInfo,    time: 'Yesterday'),
        _ActivityRow(icon: Icons.build_rounded,       title: 'Maintenance request',      sub: 'Unit 2 — Plumbing',    color: kWarning, time: '2d ago'),
        _ActivityRow(icon: Icons.receipt_rounded,     title: 'Receipt issued — Unit 1A', sub: 'TZS 380,000',          color: kSlate,   time: '3d ago', last: true),
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
        Text('Good morning, ${_userService.userName ?? 'Landlord'} 👋',
          style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        const Text('2 rent payments are due this week.',
          style: TextStyle(color: kSlate, fontSize: 12)),
        const SizedBox(height: 14),
        LGoldButton(label: 'Collect Rent →', onTap: () => _navigate(3), fullWidth: false),
      ])),
      const SizedBox(width: 12),
      Container(width: 54, height: 54,
        decoration: BoxDecoration(color: kGoldDim, borderRadius: BorderRadius.circular(14),
          border: Border.all(color: kGoldBorder)),
        child: const Icon(Icons.home_work_rounded, color: kGold, size: 26)),
    ]),
  );

  // ── Settings ─────────────────────────────────────────────
  Widget _settings() => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      LSectionHeader('Account Settings'),
      LCard(child: Column(children: [
        _SettingsRow(title: 'Full Name', value: _userService.userName ?? 'Landlord', icon: Icons.person_rounded),
        const _SettingsRow(title: 'Email',  value: 'Not set', icon: Icons.email_rounded),
        const _SettingsRow(title: 'Phone',  value: 'Not set', icon: Icons.phone_rounded),
      ])),
      const SizedBox(height: 12),
      LCard(child: const Column(children: [
        _SettingsRow(title: 'Notifications', value: 'Manage',  icon: Icons.notifications_rounded),
        _SettingsRow(title: 'Language',      value: 'English', icon: Icons.language_rounded),
        _SettingsRow(title: 'Currency',      value: 'TZS',     icon: Icons.currency_exchange_rounded, last: true),
      ])),
      const SizedBox(height: 24),
      const LogoutButton(),
    ],
  );

}

// ── Shared sub-widgets ────────────────────────────────────────
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
    child: Column(crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(width: 28, height: 28,
          decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(7)),
          child: Icon(icon, color: color, size: 14)),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(color: kCream, fontSize: 15,
          fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        const SizedBox(height: 1),
        Text(label, style: const TextStyle(color: kSlate, fontSize: 9)),
        Text(hint, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w600)),
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
      child: Padding(padding: const EdgeInsets.symmetric(vertical: 11),
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
    Padding(padding: const EdgeInsets.symmetric(vertical: 10),
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
    Padding(padding: const EdgeInsets.symmetric(vertical: 11),
      child: Row(children: [
        Container(width: 32, height: 32,
          decoration: BoxDecoration(color: kGoldDim, borderRadius: BorderRadius.circular(8)),
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