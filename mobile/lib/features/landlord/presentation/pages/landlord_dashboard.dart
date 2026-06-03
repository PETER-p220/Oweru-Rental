// ============================================================
// landlord_dashboard.dart — redesigned layout, white + slate
// ============================================================
import 'package:flutter/material.dart';
import '../../../shared/widgets/logout_button.dart';
import '../../../shared/services/user_service.dart';
import '../../../shared/services/landlord_api_service.dart';
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

// ── Color System ──────────────────────────────────────────────
const Color kWhite      = Color(0xFFFFFFFF);
const Color kSlate50    = Color(0xFFF8FAFC);
const Color kSlate100   = Color(0xFFF1F5F9);
const Color kSlate200   = Color(0xFFE2E8F0);
const Color kSlate300   = Color(0xFFCBD5E1);
const Color kSlate400   = Color(0xFF94A3B8);
const Color kSlate500   = Color(0xFF64748B);
const Color kSlate600   = Color(0xFF475569);
const Color kSlate700   = Color(0xFF334155);
const Color kSlate800   = Color(0xFF1E293B);
const Color kSlate900   = Color(0xFF0F172A);

// Semantic
const Color kSuccess    = Color(0xFF16A34A);
const Color kSuccessBg  = Color(0xFFDCFCE7);
const Color kWarning    = Color(0xFFD97706);
const Color kWarningBg  = Color(0xFFFEF3C7);
const Color kDanger     = Color(0xFFDC2626);
const Color kDangerBg   = Color(0xFFFFE4E6);
const Color kInfo       = Color(0xFF2563EB);
const Color kInfoBg     = Color(0xFFDBEAFE);

// Layout surfaces
const Color kPageBg     = kSlate100;   // page background
const Color kHeaderBg   = kSlate800;   // appbar + banner header area
const Color kCardBg     = kWhite;      // card white surface
const Color kBorder     = kSlate200;

class LandlordDashboard extends StatefulWidget {
  const LandlordDashboard({super.key});
  @override
  State<LandlordDashboard> createState() => _LandlordDashboardState();
}

class _LandlordDashboardState extends State<LandlordDashboard>
    with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  final _userService = UserService();
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;

  Map<String, dynamic> _stats = {};
  List<Map<String, dynamic>> _properties = [];
  List<Map<String, dynamic>> _contracts = [];
  int _applicationCount = 0;
  bool _isLoading = true;
  String _error = '';

  final _bottomNavItems = const [
    {'label': 'Home',       'icon': Icons.grid_view_rounded},
    {'label': 'Properties', 'icon': Icons.home_work_outlined},
    {'label': 'Tenants',    'icon': Icons.people_alt_outlined},
    {'label': 'Payments',   'icon': Icons.account_balance_wallet_outlined},
    {'label': 'More',       'icon': Icons.menu_rounded},
  ];

  final _drawerItems = const [
    {'label': 'Applications', 'icon': Icons.person_add_outlined,        'index': 4},
    {'label': 'Receipts',     'icon': Icons.receipt_long_outlined,       'index': 5},
    {'label': 'Analytics',    'icon': Icons.bar_chart_outlined,          'index': 6},
    {'label': 'Messages',     'icon': Icons.chat_bubble_outline_rounded, 'index': 7},
    {'label': 'Contracts',    'icon': Icons.description_outlined,        'index': 8},
    {'label': 'Commissions',  'icon': Icons.monetization_on_outlined,    'index': 9},
    {'label': 'Settings',     'icon': Icons.tune_outlined,               'index': 10},
  ];

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 220));
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _fadeCtrl.forward();
    _loadDashboardData();
  }

  @override
  void dispose() { _fadeCtrl.dispose(); super.dispose(); }

  Future<void> _loadDashboardData() async {
    setState(() { _isLoading = true; _error = ''; });
    try {
      final results = await Future.wait([
        LandlordApiService.getDashboard(),
        LandlordApiService.getMyProperties(),
        LandlordApiService.getApplications(),
        LandlordApiService.getContracts().catchError((_) => Future.value(<Map<String, dynamic>>[])),
      ]);
      final statsData        = results[0];
      final propertiesData   = results[1] as List<Map<String, dynamic>>;
      final applicationsData = results[2];
      final contractsData    = results[3];
      setState(() {
        if (statsData is Map<String, dynamic>) {
          _stats = (statsData['data'] as Map<String, dynamic>?) ?? {};
        }
        _properties = propertiesData.take(5).toList();
        if (applicationsData is List) _applicationCount = applicationsData.length;
        if (contractsData is List)    _contracts = contractsData.cast<Map<String, dynamic>>();
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = 'Failed to load dashboard data'; _isLoading = false; });
    }
  }

  String _formatCurrency(dynamic value) {
    if (value == null) return 'TZS 0';
    final double v = value is double ? value : (double.tryParse(value.toString()) ?? 0);
    if (v >= 1000000) return 'TZS ${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000)    return 'TZS ${(v / 1000).toStringAsFixed(1)}K';
    return 'TZS ${v.toStringAsFixed(0)}';
  }

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
    backgroundColor: kPageBg,
    // No appbar — we paint a custom header inside the body for a
    // full-bleed slate header that merges with the banner
    extendBodyBehindAppBar: true,
    drawer: _drawer(),
    endDrawer: _profileDrawer(),
    body: FadeTransition(opacity: _fadeAnim, child: _content()),
    bottomNavigationBar: _bottomNav(),
  );

  // ── Side Drawer ──────────────────────────────────────────
  Widget _drawer() => Drawer(
    backgroundColor: kSlate900,
    child: SafeArea(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 6),
        child: Row(children: [
          const Text('Oweru',
            style: TextStyle(color: kWhite, fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(
              color: kSlate700, borderRadius: BorderRadius.circular(4)),
            child: const Text('LANDLORD',
              style: TextStyle(color: kSlate300, fontSize: 9,
                fontWeight: FontWeight.w700, letterSpacing: 0.8)),
          ),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: Text(_userService.userName ?? 'Landlord',
          style: const TextStyle(color: kSlate400, fontSize: 12)),
      ),
      const Divider(color: kSlate700, height: 1),
      const SizedBox(height: 8),
      ..._drawerItems.map((item) {
        final active = _selectedIndex == (item['index'] as int);
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 1),
          child: ListTile(
            leading: Icon(item['icon'] as IconData,
              color: active ? kWhite : kSlate400, size: 19),
            title: Text(item['label'] as String,
              style: TextStyle(
                color: active ? kWhite : kSlate300,
                fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                fontSize: 13)),
            tileColor: active ? kSlate700 : null,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            dense: true,
            onTap: () { Navigator.pop(context); _navigate(item['index'] as int); },
          ),
        );
      }),
      const Spacer(),
      const Divider(color: kSlate700, height: 1),
      const Padding(padding: EdgeInsets.all(16), child: LogoutButton()),
    ])),
  );

  // ── Profile Drawer ───────────────────────────────────────
  Widget _profileDrawer() => Drawer(
    backgroundColor: kSlate900,
    child: SafeArea(child: Column(children: [
      Padding(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: kSlate700,
              border: Border.all(color: kSlate500, width: 2)),
            child: Center(child: Text(
              _userService.userName?.isNotEmpty == true
                  ? _userService.userName![0].toUpperCase() : 'L',
              style: const TextStyle(color: kWhite, fontSize: 24, fontWeight: FontWeight.w700))),
          ),
          const SizedBox(height: 12),
          Text(_userService.userName ?? 'Landlord',
            style: const TextStyle(color: kWhite, fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
            decoration: BoxDecoration(
              color: kSlate700, borderRadius: BorderRadius.circular(20)),
            child: const Text('Property Owner',
              style: TextStyle(color: kSlate300, fontSize: 11, fontWeight: FontWeight.w500)),
          ),
        ]),
      ),
      const Divider(color: kSlate700, height: 1),
      ListTile(
        leading: const Icon(Icons.tune_outlined, color: kSlate400, size: 20),
        title: const Text('Settings',
          style: TextStyle(color: kSlate200, fontSize: 13)),
        onTap: () { Navigator.pop(context); _navigate(10); },
      ),
      const Spacer(),
      const Divider(color: kSlate700, height: 1),
      const Padding(padding: EdgeInsets.all(16), child: LogoutButton()),
    ])),
  );

  // ── Bottom Nav ───────────────────────────────────────────
  Widget _bottomNav() => Container(
    decoration: const BoxDecoration(
      color: kWhite,
      border: Border(top: BorderSide(color: kBorder, width: 1))),
    child: SafeArea(child: SizedBox(
      height: 58,
      child: Row(children: List.generate(_bottomNavItems.length, (i) {
        final item = _bottomNavItems[i];
        final sel  = _bottomNavIndex == i;
        return Expanded(child: GestureDetector(
          onTap: () {
            if (i == 4) { _scaffoldKey.currentState?.openDrawer(); return; }
            _navigate(i);
          },
          behavior: HitTestBehavior.opaque,
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: sel ? 36 : 0, height: 3,
              decoration: BoxDecoration(
                color: kSlate800,
                borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 6),
            Icon(item['icon'] as IconData,
              color: sel ? kSlate800 : kSlate400, size: 20),
            const SizedBox(height: 3),
            Text(item['label'] as String,
              style: TextStyle(
                color: sel ? kSlate800 : kSlate400,
                fontSize: 10,
                fontWeight: sel ? FontWeight.w700 : FontWeight.w400)),
          ]),
        ));
      })),
    )),
  );

  // ── Content Router ───────────────────────────────────────
  Widget _content() {
    switch (_selectedIndex) {
      case 0:  return _dashboard();
      case 1:  return const LandlordPropertiesPage();
      case 2:  return const LandlordTenantsPage();
      case 3:  return const LandlordRentCollectionPage();
      case 4:  return const LandlordApplicationsPage();
      case 5:  return const LandlordReceiptsPage();
      case 6:  return const LandlordAnalyticsPage();
      case 7:  return const LandlordMessagesPage();
      case 8:  return const LandlordDigitalContractPage();
      case 9:  return const LandlordCommissionReportsPage();
      case 10: return _settings();
      default: return _dashboard();
    }
  }

  // ═══════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════
  Widget _dashboard() {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: kPageBg,
        body: Center(child: CircularProgressIndicator(
          color: kSlate800, strokeWidth: 2)));
    }
    if (_error.isNotEmpty) {
      return Scaffold(
        backgroundColor: kPageBg,
        body: Center(child: Text(_error,
          style: const TextStyle(color: kDanger))));
    }

    final totalProperties  = _stats['total_properties']  ?? 0;
    final activeTenants    = _stats['active_tenants']    ?? 0;
    final monthlyRevenue   = _stats['monthly_revenue']   ?? 0;
    final occupancyRate    = _stats['occupancy_rate']    ?? 0;
    final pendingContracts = _stats['pending_contracts'] ??
        _contracts.where((c) => c['status'] == 'pending_signature').length;

    return CustomScrollView(
      slivers: [
        // ── Slate header (replaces appbar + banner) ──────
        SliverToBoxAdapter(child: _slatHeader()),

        // ── Stats row ────────────────────────────────────
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          sliver: SliverToBoxAdapter(child: _statsRow(
            totalProperties:  totalProperties,
            applicationCount: _applicationCount,
            activeTenants:    activeTenants,
            monthlyRevenue:   monthlyRevenue,
            occupancyRate:    occupancyRate,
            pendingContracts: pendingContracts,
          )),
        ),

        // ── Quick Actions ─────────────────────────────────
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
          sliver: SliverToBoxAdapter(child: _quickActionsSection()),
        ),

        // ── Recent Properties ─────────────────────────────
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
          sliver: SliverToBoxAdapter(child: _sectionLabel('Recent Properties')),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
          sliver: SliverList(delegate: SliverChildBuilderDelegate(
            (_, i) => _PropertyCard(property: _properties[i], onTap: () {}),
            childCount: _properties.length,
          )),
        ),
        if (_properties.isEmpty)
          SliverToBoxAdapter(child: _emptyProperties()),
        if (_properties.isNotEmpty)
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
            sliver: SliverToBoxAdapter(child: _viewAllRow()),
          )
        else
          const SliverToBoxAdapter(child: SizedBox(height: 28)),
      ],
    );
  }

  // ── Slate header block ───────────────────────────────────
  Widget _slatHeader() {
    final name = _userService.userName ?? 'Landlord';
    return Container(
      color: kSlate800,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 12,
        left: 18, right: 18, bottom: 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Top bar
        Row(children: [
          // Logo
          const Text('Oweru',
            style: TextStyle(color: kWhite, fontSize: 20,
              fontWeight: FontWeight.w800, letterSpacing: -0.3)),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(
              color: kSlate600, borderRadius: BorderRadius.circular(4)),
            child: const Text('LANDLORD',
              style: TextStyle(color: kSlate200, fontSize: 9,
                fontWeight: FontWeight.w700, letterSpacing: 0.8)),
          ),
          const Spacer(),
          // Notification
          Stack(children: [
            IconButton(
              onPressed: () {},
              icon: const Icon(Icons.notifications_none_rounded,
                color: kSlate300, size: 22),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            ),
            Positioned(top: 6, right: 6,
              child: Container(width: 7, height: 7,
                decoration: BoxDecoration(
                  color: kDanger, shape: BoxShape.circle,
                  border: Border.all(color: kSlate800, width: 1.5)))),
          ]),
          const SizedBox(width: 4),
          // Avatar
          GestureDetector(
            onTap: () => _scaffoldKey.currentState?.openEndDrawer(),
            child: Container(
              width: 34, height: 34,
              decoration: BoxDecoration(
                shape: BoxShape.circle, color: kSlate700,
                border: Border.all(color: kSlate500, width: 1.5)),
              child: Center(child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : 'L',
                style: const TextStyle(
                  color: kWhite, fontSize: 13, fontWeight: FontWeight.w700))),
            ),
          ),
        ]),

        const SizedBox(height: 24),

        // Greeting + CTA
        Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Hello, $name 👋',
              style: const TextStyle(
                color: kWhite, fontSize: 22, fontWeight: FontWeight.w800,
                letterSpacing: -0.4),
              maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            const Text('2 rent payments are due this week.',
              style: TextStyle(color: kSlate400, fontSize: 13),
              maxLines: 1, overflow: TextOverflow.ellipsis),
          ])),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () => _navigate(3),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: kWhite,
                borderRadius: BorderRadius.circular(8)),
              child: const Text('Collect Rent',
                style: TextStyle(
                  color: kSlate900, fontSize: 12, fontWeight: FontWeight.w700)),
            ),
          ),
        ]),

        const SizedBox(height: 20),

        // Mini quick-links row inside header
        Row(children: [
          Expanded(child: _HeaderChip(icon: Icons.home_work_outlined,   label: 'Properties', onTap: () => _navigate(1))),
          const SizedBox(width: 6),
          Expanded(child: _HeaderChip(icon: Icons.people_alt_outlined,  label: 'Tenants',    onTap: () => _navigate(2))),
          const SizedBox(width: 6),
          Expanded(child: _HeaderChip(icon: Icons.description_outlined, label: 'Contracts',  onTap: () => _navigate(8))),
          const SizedBox(width: 6),
          Expanded(child: _HeaderChip(icon: Icons.bar_chart_outlined,   label: 'Analytics',  onTap: () => _navigate(6))),
        ]),
      ]),
    );
  }

  // ── Horizontal stats row (cards pulled up from header) ──
  Widget _statsRow({
    required dynamic totalProperties,
    required int applicationCount,
    required dynamic activeTenants,
    required dynamic monthlyRevenue,
    required dynamic occupancyRate,
    required dynamic pendingContracts,
  }) {
    final items = [
      _StatItem(value: '$totalProperties',          label: 'Properties',       icon: Icons.home_work_outlined,              accent: kSlate800, bg: kSlate100),
      _StatItem(value: '$applicationCount',         label: 'Applications',     icon: Icons.description_outlined,            accent: kInfo,     bg: kInfoBg),
      _StatItem(value: '$activeTenants',            label: 'Tenants',          icon: Icons.people_alt_outlined,             accent: kSuccess,  bg: kSuccessBg),
      _StatItem(value: _formatCurrency(monthlyRevenue), label: 'Revenue',      icon: Icons.account_balance_wallet_outlined, accent: kWarning,  bg: kWarningBg),
      _StatItem(value: '$pendingContracts',         label: 'Pending',          icon: Icons.receipt_long_outlined,           accent: kDanger,   bg: kDangerBg),
    ];

    return SizedBox(
      height: 96,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) => _StatCard2(item: items[i]),
      ),
    );
  }

  // ── Quick Actions Section ────────────────────────────────
  Widget _quickActionsSection() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _sectionLabel('Quick Actions'),
      const SizedBox(height: 12),
      // 2-column grid of action tiles
      Row(children: [
        Expanded(child: _ActionTile(
          icon: Icons.add_home_outlined,
          label: 'Add Property',
          sublabel: 'List a new unit',
          color: kSlate800,
          onTap: () => _navigate(1))),
        const SizedBox(width: 10),
        Expanded(child: _ActionTile(
          icon: Icons.person_add_outlined,
          label: 'Applications',
          sublabel: '$_applicationCount pending',
          color: kInfo,
          onTap: () => _navigate(4))),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(child: _ActionTile(
          icon: Icons.description_outlined,
          label: 'Contracts',
          sublabel: 'Digital signing',
          color: kWarning,
          onTap: () => _navigate(8))),
        const SizedBox(width: 10),
        Expanded(child: _ActionTile(
          icon: Icons.account_balance_wallet_outlined,
          label: 'Rent Collection',
          sublabel: 'Track payments',
          color: kSuccess,
          onTap: () => _navigate(3))),
      ]),
    ],
  );

  Widget _sectionLabel(String text) => Text(text,
    style: const TextStyle(
      color: kSlate800, fontSize: 14,
      fontWeight: FontWeight.w700, letterSpacing: 0.1));

  Widget _emptyProperties() => Padding(
    padding: const EdgeInsets.symmetric(vertical: 32),
    child: Center(child: Column(children: [
      Container(
        width: 56, height: 56,
        decoration: BoxDecoration(
          color: kSlate200, borderRadius: BorderRadius.circular(14)),
        child: const Icon(Icons.home_work_outlined, color: kSlate400, size: 26)),
      const SizedBox(height: 10),
      const Text('No properties yet.',
        style: TextStyle(color: kSlate500, fontSize: 13)),
    ])),
  );

  Widget _viewAllRow() => Row(
    mainAxisAlignment: MainAxisAlignment.end,
    children: [
      GestureDetector(
        onTap: () => _navigate(1),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Text('View all properties',
            style: TextStyle(color: kSlate700, fontSize: 12,
              fontWeight: FontWeight.w600)),
          const SizedBox(width: 4),
          const Icon(Icons.arrow_forward_rounded, size: 13, color: kSlate700),
        ]),
      ),
    ],
  );

  // ── Settings ─────────────────────────────────────────────
  Widget _settings() => Scaffold(
    backgroundColor: kPageBg,
    body: SafeArea(child: ListView(
      padding: const EdgeInsets.all(0),
      children: [
        // Settings header
        Container(
          color: kSlate800,
          padding: const EdgeInsets.fromLTRB(18, 20, 18, 24),
          child: Row(children: [
            const Text('Settings',
              style: TextStyle(color: kWhite, fontSize: 20,
                fontWeight: FontWeight.w800)),
            const Spacer(),
            GestureDetector(
              onTap: () => _scaffoldKey.currentState?.openEndDrawer(),
              child: Container(
                width: 34, height: 34,
                decoration: BoxDecoration(
                  shape: BoxShape.circle, color: kSlate700,
                  border: Border.all(color: kSlate500, width: 1.5)),
                child: Center(child: Text(
                  _userService.userName?.isNotEmpty == true
                      ? _userService.userName![0].toUpperCase() : 'L',
                  style: const TextStyle(color: kWhite, fontSize: 13,
                    fontWeight: FontWeight.w700))),
              ),
            ),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Account',
              style: TextStyle(color: kSlate500, fontSize: 11,
                fontWeight: FontWeight.w700, letterSpacing: 0.8)),
            const SizedBox(height: 8),
            _SettingsGroup(children: [
              _SettingsRow(title: 'Full Name', value: _userService.userName ?? 'Landlord', icon: Icons.person_outlined),
              _SettingsRow(title: 'Email',     value: 'Not set',                           icon: Icons.email_outlined),
              _SettingsRow(title: 'Phone',     value: 'Not set',                           icon: Icons.phone_outlined, last: true),
            ]),
            const SizedBox(height: 20),
            const Text('PREFERENCES',
              style: TextStyle(color: kSlate500, fontSize: 11,
                fontWeight: FontWeight.w700, letterSpacing: 0.8)),
            const SizedBox(height: 8),
            _SettingsGroup(children: [
              _SettingsRow(title: 'Notifications', value: 'Manage',  icon: Icons.notifications_outlined),
              _SettingsRow(title: 'Language',      value: 'English', icon: Icons.language_outlined),
              _SettingsRow(title: 'Currency',      value: 'TZS',     icon: Icons.currency_exchange_outlined, last: true),
            ]),
            const SizedBox(height: 28),
            const LogoutButton(),
          ]),
        ),
      ],
    )),
  );
}

// ════════════════════════════════════════════════════════════
// Sub-widgets
// ════════════════════════════════════════════════════════════

// Header quick-link chip
class _HeaderChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _HeaderChip({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 7),
      decoration: BoxDecoration(
        color: kSlate700, borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: kSlate300, size: 13),
        const SizedBox(width: 4),
        Flexible(child: Text(label,
          style: const TextStyle(color: kSlate200, fontSize: 11,
            fontWeight: FontWeight.w500),
          overflow: TextOverflow.ellipsis, maxLines: 1)),
      ]),
    ),
  );
}

// Stat data holder
class _StatItem {
  final String value, label;
  final IconData icon;
  final Color accent, bg;
  const _StatItem({
    required this.value, required this.label,
    required this.icon,  required this.accent, required this.bg});
}

// Stat card — horizontal scrollable
class _StatCard2 extends StatelessWidget {
  final _StatItem item;
  const _StatCard2({required this.item});

  @override
  Widget build(BuildContext context) => Container(
    width: 110,
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(
      color: kWhite,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: kBorder)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Container(
        width: 28, height: 28,
        decoration: BoxDecoration(
          color: item.bg, borderRadius: BorderRadius.circular(7)),
        child: Icon(item.icon, color: item.accent, size: 14)),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(item.value,
          style: const TextStyle(color: kSlate900, fontSize: 16,
            fontWeight: FontWeight.w800, letterSpacing: -0.3),
          maxLines: 1, overflow: TextOverflow.ellipsis),
        const SizedBox(height: 1),
        Text(item.label,
          style: const TextStyle(color: kSlate500, fontSize: 10)),
      ]),
    ]),
  );
}

// Action tile — 2-column grid
class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label, sublabel;
  final Color color;
  final VoidCallback onTap;
  const _ActionTile({
    required this.icon, required this.label, required this.sublabel,
    required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder)),
      child: Row(children: [
        Container(
          width: 38, height: 38,
          decoration: BoxDecoration(
            color: kSlate100, borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 18)),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
            style: const TextStyle(color: kSlate800, fontSize: 12,
              fontWeight: FontWeight.w700),
            maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 2),
          Text(sublabel,
            style: const TextStyle(color: kSlate400, fontSize: 10),
            maxLines: 1, overflow: TextOverflow.ellipsis),
        ])),
      ]),
    ),
  );
}

// Property card — redesigned as a horizontal list item
class _PropertyCard extends StatelessWidget {
  final Map<String, dynamic> property;
  final VoidCallback onTap;
  const _PropertyCard({required this.property, required this.onTap});

  String _formatPrice(dynamic price) {
    if (price == null) return 'TZS 0';
    final double v = price is double ? price : (double.tryParse(price.toString()) ?? 0);
    if (v >= 1000000) return 'TZS ${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000)    return 'TZS ${(v / 1000).toStringAsFixed(1)}K';
    return 'TZS ${v.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final images    = property['images'] as List?;
    final imageUrl  = images != null && images.isNotEmpty ? images[0] as String? : null;
    final title     = property['title']     as String? ?? 'Untitled property';
    final location  = property['location']  as String? ?? 'No location';
    final bedrooms  = property['bedrooms']  ?? 0;
    final bathrooms = property['bathrooms'] ?? 0;
    final area      = property['area']      ?? 0;
    final price     = property['price'];
    final available = property['available'] as bool? ?? true;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Container(
                width: 76, height: 76, color: kSlate100,
                child: imageUrl != null && imageUrl.isNotEmpty
                    ? Image.network(
                        imageUrl.startsWith('http')
                            ? imageUrl : 'https://rental.oweru.com/storage/$imageUrl',
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) =>
                            const Icon(Icons.home_outlined, color: kSlate300, size: 28))
                    : const Icon(Icons.home_outlined, color: kSlate300, size: 28),
              ),
            ),
            const SizedBox(width: 12),
            // Info
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(title,
                  style: const TextStyle(color: kSlate900, fontSize: 13,
                    fontWeight: FontWeight.w700),
                  overflow: TextOverflow.ellipsis, maxLines: 1)),
                const SizedBox(width: 8),
                Text(_formatPrice(price),
                  style: const TextStyle(color: kSlate800, fontSize: 13,
                    fontWeight: FontWeight.w800),
                  overflow: TextOverflow.ellipsis),
              ]),
              const SizedBox(height: 4),
              Row(children: [
                const Icon(Icons.location_on_outlined, size: 11, color: kSlate400),
                const SizedBox(width: 2),
                Expanded(child: Text(location,
                  style: const TextStyle(color: kSlate500, fontSize: 11),
                  overflow: TextOverflow.ellipsis, maxLines: 1)),
              ]),
              const SizedBox(height: 6),
              // Meta chips row
              Row(children: [
                _MetaChip(label: '$bedrooms bd'),
                const SizedBox(width: 5),
                _MetaChip(label: '$bathrooms ba'),
                const SizedBox(width: 5),
                _MetaChip(label: '${area}m²'),
              ]),
              const SizedBox(height: 8),
              // Bottom row: status + actions
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: available ? kSuccessBg : kInfoBg,
                    borderRadius: BorderRadius.circular(20)),
                  child: Text(available ? 'Available' : 'Occupied',
                    style: TextStyle(
                      color: available ? kSuccess : kInfo,
                      fontSize: 10, fontWeight: FontWeight.w700)),
                ),
                const Spacer(),
                _SmallButton(label: 'Edit',  onTap: () {}),
                const SizedBox(width: 6),
                _SmallButton(label: 'View',  onTap: onTap, filled: true),
              ]),
            ])),
          ]),
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final String label;
  const _MetaChip({required this.label});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
    decoration: BoxDecoration(
      color: kSlate100, borderRadius: BorderRadius.circular(5)),
    child: Text(label, style: const TextStyle(color: kSlate600, fontSize: 10)));
}

class _SmallButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool filled;
  const _SmallButton({required this.label, required this.onTap, this.filled = false});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: filled ? kSlate800 : kWhite,
        border: Border.all(color: filled ? kSlate800 : kBorder),
        borderRadius: BorderRadius.circular(6)),
      child: Text(label,
        style: TextStyle(
          color: filled ? kWhite : kSlate600,
          fontSize: 11, fontWeight: FontWeight.w600)),
    ),
  );
}

// Settings group wrapper
class _SettingsGroup extends StatelessWidget {
  final List<Widget> children;
  const _SettingsGroup({required this.children});
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: kWhite,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: kBorder)),
    child: Column(children: children),
  );
}

class _SettingsRow extends StatelessWidget {
  final String title, value;
  final IconData icon;
  final bool last;
  const _SettingsRow({
    required this.title, required this.value,
    required this.icon,  this.last = false});

  @override
  Widget build(BuildContext context) => Column(children: [
    Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      child: Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            color: kSlate100, borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: kSlate500, size: 16)),
        const SizedBox(width: 12),
        Expanded(child: Text(title,
          style: const TextStyle(color: kSlate700, fontSize: 13),
          overflow: TextOverflow.ellipsis)),
        Text(value,
          style: const TextStyle(color: kSlate400, fontSize: 12),
          overflow: TextOverflow.ellipsis),
        const SizedBox(width: 4),
        const Icon(Icons.chevron_right_rounded, color: kSlate300, size: 16),
      ]),
    ),
    if (!last) const Divider(color: kBorder, height: 1, indent: 58),
  ]);
}