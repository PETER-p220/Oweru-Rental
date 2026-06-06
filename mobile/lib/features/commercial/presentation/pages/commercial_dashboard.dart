// ============================================================
// commercial_dashboard.dart — mirrors landlord_dashboard layout
// ============================================================
import 'package:flutter/material.dart';
import '../../../shared/widgets/logout_button.dart';
import '../../../shared/services/user_service.dart';
import '../../../shared/services/commercial_api_service.dart';
import 'commercial_applications_page.dart';
import 'commercial_properties_page.dart';

// ── Color System ──────────────────────────────────────────────
const Color kWhite     = Color(0xFFFFFFFF);
const Color kSlate50   = Color(0xFFF8FAFC);
const Color kSlate100  = Color(0xFFF1F5F9);
const Color kSlate200  = Color(0xFFE2E8F0);
const Color kSlate300  = Color(0xFFCBD5E1);
const Color kSlate400  = Color(0xFF94A3B8);
const Color kSlate500  = Color(0xFF64748B);
const Color kSlate600  = Color(0xFF475569);
const Color kSlate700  = Color(0xFF334155);
const Color kSlate800  = Color(0xFF1E293B);
const Color kSlate900  = Color(0xFF0F172A);

// Semantic
const Color kSuccess   = Color(0xFF16A34A);
const Color kSuccessBg = Color(0xFFDCFCE7);
const Color kWarning   = Color(0xFFD97706);
const Color kWarningBg = Color(0xFFFEF3C7);
const Color kDanger    = Color(0xFFDC2626);
const Color kDangerBg  = Color(0xFFFFE4E6);
const Color kInfo      = Color(0xFF2563EB);
const Color kInfoBg    = Color(0xFFDBEAFE);

// Layout surfaces
const Color kPageBg    = kSlate100;
const Color kCardBg    = kWhite;
const Color kBorder    = kSlate200;

class CommercialDashboard extends StatefulWidget {
  const CommercialDashboard({super.key});
  @override
  State<CommercialDashboard> createState() => _CommercialDashboardState();
}

class _CommercialDashboardState extends State<CommercialDashboard>
    with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  final _userService = UserService();
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;

  Map<String, dynamic> _stats = {};
  List<Map<String, dynamic>> _properties = [];
  List<Map<String, dynamic>> _applications = [];
  bool _isLoading = true;
  String _error = '';

  final List<Map<String, dynamic>> _bottomNavItems = [
    {'label': 'Home',         'icon': Icons.grid_view_rounded},
    {'label': 'Properties',   'icon': Icons.domain_outlined},
    {'label': 'Applications', 'icon': Icons.description_outlined},
    {'label': 'Analytics',    'icon': Icons.bar_chart_outlined},
    {'label': 'More',         'icon': Icons.menu_rounded},
  ];

  final List<Map<String, dynamic>> _drawerItems = [
    {'label': 'Reports',  'icon': Icons.summarize_outlined,         'index': 4},
    {'label': 'Messages', 'icon': Icons.chat_bubble_outline_rounded, 'index': 5},
    {'label': 'Profile',  'icon': Icons.person_outline,             'index': 6},
    {'label': 'Settings', 'icon': Icons.tune_outlined,              'index': 7},
  ];

  final Map<int, int> _bottomToPage = {0: 0, 1: 1, 2: 2, 3: 3};

  int get _bottomNavIndex => _selectedIndex < 4 ? _selectedIndex : 4;

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
        CommercialApiService.getDashboard(),
        CommercialApiService.getProperties(),
        CommercialApiService.getApplications(),
      ]);
      setState(() {
        if (results[0] is Map<String, dynamic>) {
          final statsData = results[0] as Map<String, dynamic>;
          _stats = (statsData['data'] as Map<String, dynamic>?) ?? {};
        }
        if (results[1] is List) _properties = (results[1] as List).cast<Map<String, dynamic>>().take(5).toList();
        if (results[2] is List) _applications = (results[2] as List).cast();
        _isLoading = false;
      });
    } catch (_) {
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

  // ── Scaffold ──────────────────────────────────────────────
  @override
  Widget build(BuildContext context) => Scaffold(
    key: _scaffoldKey,
    backgroundColor: kPageBg,
    extendBodyBehindAppBar: true,
    drawer: _drawer(),
    endDrawer: _profileDrawer(),
    body: FadeTransition(opacity: _fadeAnim, child: _content()),
    bottomNavigationBar: _bottomNav(),
  );

  // ── Side Drawer ───────────────────────────────────────────
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
            decoration: BoxDecoration(color: kSlate700, borderRadius: BorderRadius.circular(4)),
            child: const Text('COMMERCIAL',
              style: TextStyle(color: kSlate300, fontSize: 9,
                fontWeight: FontWeight.w700, letterSpacing: 0.8)),
          ),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: Text(_userService.userName ?? 'Commercial',
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

  // ── Profile Drawer ────────────────────────────────────────
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
                  ? _userService.userName![0].toUpperCase() : 'C',
              style: const TextStyle(color: kWhite, fontSize: 24, fontWeight: FontWeight.w700))),
          ),
          const SizedBox(height: 12),
          Text(_userService.userName ?? 'Commercial',
            style: const TextStyle(color: kWhite, fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
            decoration: BoxDecoration(color: kSlate700, borderRadius: BorderRadius.circular(20)),
            child: const Text('Commercial Owner',
              style: TextStyle(color: kSlate300, fontSize: 11, fontWeight: FontWeight.w500)),
          ),
        ]),
      ),
      const Divider(color: kSlate700, height: 1),
      ListTile(
        leading: const Icon(Icons.tune_outlined, color: kSlate400, size: 20),
        title: const Text('Settings', style: TextStyle(color: kSlate200, fontSize: 13)),
        onTap: () { Navigator.pop(context); _navigate(7); },
      ),
      const Spacer(),
      const Divider(color: kSlate700, height: 1),
      const Padding(padding: EdgeInsets.all(16), child: LogoutButton()),
    ])),
  );

  // ── Bottom Nav ────────────────────────────────────────────
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
            _navigate(_bottomToPage[i]!);
          },
          behavior: HitTestBehavior.opaque,
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: sel ? 36 : 0, height: 3,
              decoration: BoxDecoration(
                color: kSlate800, borderRadius: BorderRadius.circular(2)),
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

  // ── Content Router ────────────────────────────────────────
  Widget _content() {
    switch (_selectedIndex) {
      case 0:  return _dashboard();
      case 1:  return const CommercialPropertiesPage();
      case 2:  return const CommercialApplicationsPage();
      case 3:  return _emptyPage('Analytics',  Icons.bar_chart_outlined,   'Analytics coming soon',   'Occupancy rates, revenue trends, and portfolio insights.');
      case 4:  return _emptyPage('Reports',    Icons.summarize_outlined,   'No reports yet',          'Generated reports and documents will appear here.');
      case 5:  return _emptyPage('Messages',   Icons.chat_bubble_outline_rounded, 'No messages yet', 'Conversations with tenants and agents will appear here.');
      case 6:  return _emptyPage('Profile',    Icons.person_outline,       'Profile coming soon',     'Your business profile and credentials.');
      case 7:  return _settings();
      default: return _dashboard();
    }
  }

  // ════════════════════════════════════════════════════════
  // DASHBOARD
  // ════════════════════════════════════════════════════════
  Widget _dashboard() {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: kPageBg,
        body: const Center(child: CircularProgressIndicator(color: kSlate800, strokeWidth: 2)));
    }
    if (_error.isNotEmpty) {
      return Scaffold(
        backgroundColor: kPageBg,
        body: Center(child: Text(_error, style: const TextStyle(color: kDanger))));
    }

    final totalProperties     = _stats['total_properties'] ?? _properties.length;
    final activeLeases        = _stats['active_leases']    ?? 0;
    final totalRevenue        = _stats['total_revenue']    ?? 0;
    final occupancyRate       = _stats['occupancy_rate']   ?? 0;
    final pendingApplications = _applications.length;

    return CustomScrollView(
      slivers: [
        // ── Slate header (no AppBar — full bleed) ──────────
        SliverToBoxAdapter(child: _slateHeader()),

        // ── Stats horizontal scroll ────────────────────────
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          sliver: SliverToBoxAdapter(child: _statsRow(
            totalProperties:     totalProperties,
            activeLeases:        activeLeases,
            totalRevenue:        totalRevenue,
            occupancyRate:       occupancyRate,
            pendingApplications: pendingApplications,
          )),
        ),

        // ── Quick Actions ──────────────────────────────────
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
          sliver: SliverToBoxAdapter(child: _quickActionsSection(pendingApplications)),
        ),

        // ── Recent Properties label ────────────────────────
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
          sliver: SliverToBoxAdapter(child: _sectionLabel('Recent Properties')),
        ),

        // ── Property cards list ────────────────────────────
        if (_properties.isNotEmpty)
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            sliver: SliverList(delegate: SliverChildBuilderDelegate(
              (_, i) => _CommercialPropertyCard(
                property: _properties[i], onTap: () => _navigate(1)),
              childCount: _properties.length,
            )),
          )
        else
          SliverToBoxAdapter(child: _emptyBlock(Icons.domain_outlined, 'No properties added yet')),

        // ── Recent Applications label ─────────────────────
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
          sliver: SliverToBoxAdapter(child: _sectionLabel('Recent Applications')),
        ),

        // ── Application rows ───────────────────────────────
        if (_applications.isNotEmpty)
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            sliver: SliverList(delegate: SliverChildBuilderDelegate(
              (_, i) => _ApplicationRow(application: _applications[i]),
              childCount: _applications.take(4).length,
            )),
          )
        else
          SliverToBoxAdapter(child: _emptyBlock(Icons.description_outlined, 'No applications received yet')),

        // ── View all applications ──────────────────────────
        if (_applications.isNotEmpty)
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            sliver: SliverToBoxAdapter(child: _viewAllRow(
              'View all applications', () => _navigate(2))),
          ),

        const SliverToBoxAdapter(child: SizedBox(height: 32)),
      ],
    );
  }

  // ── Slate header block ─────────────────────────────────
  Widget _slateHeader() {
    final name = _userService.userName ?? 'Commercial';
    return Container(
      color: kSlate800,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 12,
        left: 18, right: 18, bottom: 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Top bar: logo + notif + avatar
        Row(children: [
          const Text('Oweru',
            style: TextStyle(color: kWhite, fontSize: 20,
              fontWeight: FontWeight.w800, letterSpacing: -0.3)),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(
              color: kSlate600, borderRadius: BorderRadius.circular(4)),
            child: const Text('COMMERCIAL',
              style: TextStyle(color: kSlate200, fontSize: 9,
                fontWeight: FontWeight.w700, letterSpacing: 0.8)),
          ),
          const Spacer(),
          Stack(children: [
            IconButton(
              onPressed: () {},
              icon: const Icon(Icons.notifications_none_rounded, color: kSlate300, size: 22),
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
          GestureDetector(
            onTap: () => _scaffoldKey.currentState?.openEndDrawer(),
            child: Container(
              width: 34, height: 34,
              decoration: BoxDecoration(
                shape: BoxShape.circle, color: kSlate700,
                border: Border.all(color: kSlate500, width: 1.5)),
              child: Center(child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : 'C',
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
              style: const TextStyle(color: kWhite, fontSize: 22,
                fontWeight: FontWeight.w800, letterSpacing: -0.4),
              maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(
              _applications.isEmpty
                  ? 'Your portfolio is up to date.'
                  : '${_applications.length} application${_applications.length > 1 ? 's' : ''} awaiting review.',
              style: const TextStyle(color: kSlate400, fontSize: 13),
              maxLines: 1, overflow: TextOverflow.ellipsis),
          ])),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () => _navigate(2),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: kWhite, borderRadius: BorderRadius.circular(8)),
              child: const Text('View Applications',
                style: TextStyle(color: kSlate900, fontSize: 12, fontWeight: FontWeight.w700)),
            ),
          ),
        ]),

        const SizedBox(height: 20),

        // Quick-link chips row inside header
        Row(children: [
          Expanded(child: _HeaderChip(icon: Icons.domain_outlined,      label: 'Properties',   onTap: () => _navigate(1))),
          const SizedBox(width: 6),
          Expanded(child: _HeaderChip(icon: Icons.description_outlined, label: 'Applications', onTap: () => _navigate(2))),
          const SizedBox(width: 6),
          Expanded(child: _HeaderChip(icon: Icons.bar_chart_outlined,   label: 'Analytics',   onTap: () => _navigate(3))),
          const SizedBox(width: 6),
          Expanded(child: _HeaderChip(icon: Icons.summarize_outlined,   label: 'Reports',     onTap: () => _navigate(4))),
        ]),
      ]),
    );
  }

  // ── Horizontal stats row ───────────────────────────────
  Widget _statsRow({
    required dynamic totalProperties,
    required dynamic activeLeases,
    required dynamic totalRevenue,
    required dynamic occupancyRate,
    required int pendingApplications,
  }) {
    final items = [
      _CStatItem(value: '$totalProperties',           label: 'Properties',   icon: Icons.domain_outlined,                accent: kSlate800, bg: kSlate100),
      _CStatItem(value: '$pendingApplications',       label: 'Applications', icon: Icons.description_outlined,           accent: kInfo,     bg: kInfoBg),
      _CStatItem(value: '$activeLeases',              label: 'Leases',       icon: Icons.handshake_outlined,             accent: kSuccess,  bg: kSuccessBg),
      _CStatItem(value: _formatCurrency(totalRevenue),label: 'Revenue',      icon: Icons.account_balance_wallet_outlined,accent: kWarning,  bg: kWarningBg),
      _CStatItem(value: '$occupancyRate%',            label: 'Occupancy',    icon: Icons.pie_chart_outline_rounded,      accent: kDanger,   bg: kDangerBg),
    ];

    return SizedBox(
      height: 96,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (_, i) => _StatCard(item: items[i]),
      ),
    );
  }

  // ── Quick Actions section ──────────────────────────────
  Widget _quickActionsSection(int pendingApplications) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _sectionLabel('Quick Actions'),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: _ActionTile(
          icon: Icons.add_business_outlined,
          label: 'Add Property',
          sublabel: 'List a new space',
          color: kSlate800,
          onTap: () => _navigate(1))),
        const SizedBox(width: 10),
        Expanded(child: _ActionTile(
          icon: Icons.person_add_outlined,
          label: 'Applications',
          sublabel: '$pendingApplications pending',
          color: kInfo,
          onTap: () => _navigate(2))),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(child: _ActionTile(
          icon: Icons.bar_chart_outlined,
          label: 'Analytics',
          sublabel: 'Performance data',
          color: kWarning,
          onTap: () => _navigate(3))),
        const SizedBox(width: 10),
        Expanded(child: _ActionTile(
          icon: Icons.summarize_outlined,
          label: 'Reports',
          sublabel: 'Generate reports',
          color: kSuccess,
          onTap: () => _navigate(4))),
      ]),
    ],
  );

  Widget _sectionLabel(String text) => Text(text,
    style: const TextStyle(
      color: kSlate800, fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 0.1));

  Widget _emptyBlock(IconData icon, String message) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
    child: Center(child: Column(children: [
      Container(
        width: 56, height: 56,
        decoration: BoxDecoration(color: kSlate200, borderRadius: BorderRadius.circular(14)),
        child: Icon(icon, color: kSlate400, size: 26)),
      const SizedBox(height: 10),
      Text(message, style: const TextStyle(color: kSlate500, fontSize: 13)),
    ])),
  );

  Widget _viewAllRow(String label, VoidCallback onTap) => Row(
    mainAxisAlignment: MainAxisAlignment.end,
    children: [
      GestureDetector(
        onTap: onTap,
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text(label, style: const TextStyle(
            color: kSlate700, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(width: 4),
          const Icon(Icons.arrow_forward_rounded, size: 13, color: kSlate700),
        ]),
      ),
    ],
  );

  // ── Settings ───────────────────────────────────────────
  Widget _settings() => Scaffold(
    backgroundColor: kPageBg,
    body: SafeArea(child: ListView(
      padding: EdgeInsets.zero,
      children: [
        Container(
          color: kSlate800,
          padding: const EdgeInsets.fromLTRB(18, 20, 18, 24),
          child: Row(children: [
            const Text('Settings',
              style: TextStyle(color: kWhite, fontSize: 20, fontWeight: FontWeight.w800)),
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
                      ? _userService.userName![0].toUpperCase() : 'C',
                  style: const TextStyle(color: kWhite, fontSize: 13, fontWeight: FontWeight.w700))),
              ),
            ),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('ACCOUNT',
              style: TextStyle(color: kSlate500, fontSize: 11,
                fontWeight: FontWeight.w700, letterSpacing: 0.8)),
            const SizedBox(height: 8),
            _SettingsGroup(children: [
              _SettingsRow(title: 'Full Name', value: _userService.userName ?? '—', icon: Icons.person_outlined),
              _SettingsRow(title: 'Email',     value: 'Not set',                    icon: Icons.email_outlined),
              _SettingsRow(title: 'Phone',     value: 'Not set',                    icon: Icons.phone_outlined, last: true),
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

  // ── Empty pages ────────────────────────────────────────
  Widget _emptyPage(String title, IconData icon, String heading, String body) =>
    Scaffold(
      backgroundColor: kPageBg,
      body: SafeArea(child: Column(children: [
        Container(
          color: kSlate800,
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(18, 20, 18, 24),
          child: Text(title, style: const TextStyle(
            color: kWhite, fontSize: 20, fontWeight: FontWeight.w800)),
        ),
        Expanded(child: Center(child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 60, height: 60,
              decoration: BoxDecoration(color: kSlate200, borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, color: kSlate400, size: 28)),
            const SizedBox(height: 14),
            Text(heading, style: const TextStyle(
              color: kSlate800, fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text(body, style: const TextStyle(
              color: kSlate500, fontSize: 12, height: 1.6),
              textAlign: TextAlign.center),
          ]),
        ))),
      ])),
    );
}

// ════════════════════════════════════════════════════════════
// Sub-widgets
// ════════════════════════════════════════════════════════════

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
      decoration: BoxDecoration(color: kSlate700, borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: kSlate300, size: 13),
        const SizedBox(width: 4),
        Flexible(child: Text(label,
          style: const TextStyle(color: kSlate200, fontSize: 11, fontWeight: FontWeight.w500),
          overflow: TextOverflow.ellipsis, maxLines: 1)),
      ]),
    ),
  );
}

class _CStatItem {
  final String value, label;
  final IconData icon;
  final Color accent, bg;
  const _CStatItem({
    required this.value, required this.label,
    required this.icon, required this.accent, required this.bg});
}

class _StatCard extends StatelessWidget {
  final _CStatItem item;
  const _StatCard({required this.item});

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
        decoration: BoxDecoration(color: item.bg, borderRadius: BorderRadius.circular(7)),
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
          decoration: BoxDecoration(color: kSlate100, borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 18)),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
            style: const TextStyle(color: kSlate800, fontSize: 12, fontWeight: FontWeight.w700),
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

class _CommercialPropertyCard extends StatelessWidget {
  final Map<String, dynamic> property;
  final VoidCallback onTap;
  const _CommercialPropertyCard({required this.property, required this.onTap});

  String _fmt(dynamic price) {
    if (price == null) return 'TZS 0';
    final double v = price is double ? price : (double.tryParse(price.toString()) ?? 0);
    if (v >= 1000000) return 'TZS ${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000)    return 'TZS ${(v / 1000).toStringAsFixed(1)}K';
    return 'TZS ${v.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final images       = property['images'] as List?;
    final imageUrl     = images != null && images.isNotEmpty ? images[0] as String? : null;
    final title        = property['title']         as String? ?? 'Untitled';
    final location     = property['location']      as String? ?? 'No location';
    final propertyType = property['property_type'] as String? ?? 'Office';
    final area         = property['area']          ?? 0;
    final price        = property['price'];
    final available    = property['available']     as bool? ?? true;

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
                            ? imageUrl
                            : 'https://rental.oweru.com/storage/$imageUrl',
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) =>
                            const Icon(Icons.domain_outlined, color: kSlate300, size: 28))
                    : const Icon(Icons.domain_outlined, color: kSlate300, size: 28),
              ),
            ),
            const SizedBox(width: 12),
            // Info
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(title,
                  style: const TextStyle(color: kSlate900, fontSize: 13,
                    fontWeight: FontWeight.w700),
                  overflow: TextOverflow.ellipsis, maxLines: 1)),
                const SizedBox(width: 8),
                Text(_fmt(price),
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
              Row(children: [
                _MetaChip(label: propertyType),
                const SizedBox(width: 5),
                _MetaChip(label: '${area}m²'),
              ]),
              const SizedBox(height: 8),
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
                _SmallButton(label: 'Edit', onTap: () {}),
                const SizedBox(width: 6),
                _SmallButton(label: 'View', onTap: onTap, filled: true),
              ]),
            ])),
          ]),
        ),
      ),
    );
  }
}

class _ApplicationRow extends StatelessWidget {
  final Map<String, dynamic> application;
  const _ApplicationRow({required this.application});

  @override
  Widget build(BuildContext context) {
    final propertyTitle = application['property']?['title'] as String?
        ?? 'Property #${application['property_id'] ?? ''}';
    final applicantName = application['applicant']?['name'] as String? ?? 'Applicant';
    final status        = application['status'] as String? ?? 'pending';

    Color bg, fg;
    switch (status.toLowerCase()) {
      case 'approved': bg = kSuccessBg; fg = kSuccess; break;
      case 'rejected': bg = kDangerBg;  fg = kDanger;  break;
      default:         bg = kWarningBg; fg = kWarning;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder)),
      child: Row(children: [
        Container(
          width: 38, height: 38,
          decoration: BoxDecoration(color: kInfoBg, borderRadius: BorderRadius.circular(9)),
          child: const Icon(Icons.description_outlined, color: kInfo, size: 18)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(propertyTitle,
            style: const TextStyle(color: kSlate900, fontSize: 13, fontWeight: FontWeight.w700),
            overflow: TextOverflow.ellipsis, maxLines: 1),
          const SizedBox(height: 2),
          Text(applicantName,
            style: const TextStyle(color: kSlate500, fontSize: 11)),
        ])),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(5)),
          child: Text(status.toUpperCase(),
            style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.4)),
        ),
      ]),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final String label;
  const _MetaChip({required this.label});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
    decoration: BoxDecoration(color: kSlate100, borderRadius: BorderRadius.circular(5)),
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
    required this.icon, this.last = false});

  @override
  Widget build(BuildContext context) => Column(children: [
    Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      child: Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(color: kSlate100, borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: kSlate500, size: 16)),
        const SizedBox(width: 12),
        Expanded(child: Text(title,
          style: const TextStyle(color: kSlate700, fontSize: 13),
          overflow: TextOverflow.ellipsis)),
        Text(value, style: const TextStyle(color: kSlate400, fontSize: 12)),
        const SizedBox(width: 4),
        const Icon(Icons.chevron_right_rounded, color: kSlate300, size: 16),
      ]),
    ),
    if (!last) const Divider(color: kBorder, height: 1, indent: 58),
  ]);
}