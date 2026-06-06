// ============================================================
// TENANT DASHBOARD — Advanced Homepage (drop-in replacement)
// ============================================================
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../shared/widgets/logout_button.dart';
import '../../../shared/services/user_service.dart';
import '../../../shared/services/tenant_api_service.dart';
import 'applications_page.dart';
import 'saved_properties_page.dart';
import 'payments_page.dart';
import 'payment_history_page.dart';
import 'contracts_page.dart';
import 'messages_page.dart';
import 'notifications_page.dart';
import 'analytics_page.dart';
import 'application_status_page.dart';
import 'properties_page.dart';
import 'tenant_theme.dart';

// ── Animated counter tween ────────────────────────────────
class _CounterTween extends Tween<double> {
  _CounterTween({required double begin, required double end})
      : super(begin: begin, end: end);
}

class TenantDashboard extends StatefulWidget {
  const TenantDashboard({super.key});
  @override
  State<TenantDashboard> createState() => _TenantDashboardState();
}

class _TenantDashboardState extends State<TenantDashboard>
    with TickerProviderStateMixin {

  int _selectedIndex = 0;
  final _userService = UserService();
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  // Page transition
  late AnimationController _fadeCtrl;
  late Animation<double>    _fadeAnim;

  // Stats counter animation
  late AnimationController _counterCtrl;
  late Animation<double>    _counterAnim;

  // Banner pulse
  late AnimationController _pulseCtrl;
  late Animation<double>    _pulseAnim;

  // Dashboard data
  Map<String, dynamic> _stats     = {};
  final List<Map<String, dynamic>> _properties = [];
  List<Map<String, dynamic>> _contracts = [];
  bool   _isLoading = true;
  String _error     = '';

  // ── Greeting based on hour ──────────────────────────────
  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';    
    return 'Good evening';
  }

  static const _bottomNavItems = [
    {'label': 'Home',         'icon': Icons.grid_view_rounded},
    {'label': 'Browse',       'icon': Icons.search_rounded},
    {'label': 'Applications', 'icon': Icons.description_rounded},
    {'label': 'Payments',     'icon': Icons.account_balance_wallet_rounded},
    {'label': 'More',         'icon': Icons.menu_rounded},
  ];

  static const _drawerItems = [
    {'label': 'Saved',             'icon': Icons.favorite_rounded,             'index': 5},
    {'label': 'History',           'icon': Icons.history_rounded,              'index': 6},
    {'label': 'Contracts',         'icon': Icons.gavel_rounded,                'index': 7},
    {'label': 'Messages',          'icon': Icons.chat_bubble_outline_rounded,  'index': 8},
    {'label': 'Application Status','icon': Icons.assignment_turned_in_rounded, 'index': 9},
    {'label': 'Analytics',         'icon': Icons.analytics_rounded,            'index': 10},
    {'label': 'Settings',          'icon': Icons.tune_rounded,                 'index': 11},
  ];

  @override
  void initState() {
    super.initState();

    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);

    _counterCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));
    _counterAnim = CurvedAnimation(parent: _counterCtrl, curve: Curves.easeOutCubic);

    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 2000))
      ..repeat(reverse: true);
    _pulseAnim = CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut);

    _fadeCtrl.forward();
    _loadDashboardData();
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    _counterCtrl.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadDashboardData() async {
    setState(() { _isLoading = true; _error = ''; });
    try {
      final results = await Future.wait([
        TenantApiService.getDashboard(),
        TenantApiService.getDigitalContracts()
            .catchError((_) => Future.value(<Map<String, dynamic>>[])),
      ]);

      final statsData     = results[0];
      final contractsData = results[1];

      if (!mounted) return;
      setState(() {
        if (statsData is Map<String, dynamic>) {
          _stats = (statsData['data'] as Map<String, dynamic>?) ?? {};
        }
        if (contractsData is List) {
          _contracts = contractsData.cast<Map<String, dynamic>>();
        }
        _isLoading = false;
      });
      // Kick off counter animation after data loads
      _counterCtrl.forward(from: 0);
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = 'Failed to load dashboard data'; _isLoading = false; });
    }
  }

  void _navigate(int idx) {
    if (_selectedIndex == idx) return;
    HapticFeedback.selectionClick();
    _fadeCtrl.reverse().then((_) {
      if (!mounted) return;
      setState(() => _selectedIndex = idx);
      _fadeCtrl.forward();
    });
  }

  int get _bottomNavIndex => _selectedIndex < 4 ? _selectedIndex : 4;

  // ── Scaffold ────────────────────────────────────────────
  @override
  Widget build(BuildContext context) => Scaffold(
    key: _scaffoldKey,
    backgroundColor: kBg,
    extendBodyBehindAppBar: true,
    appBar: _appBar(),
    drawer: _drawer(),
    endDrawer: _profileDrawer(),
    body: FadeTransition(
      opacity: _fadeAnim,
      child: _content(),
    ),
    bottomNavigationBar: _bottomNav(),
  );

  // ── AppBar ──────────────────────────────────────────────
  PreferredSizeWidget _appBar() => AppBar(
    backgroundColor: Colors.transparent,
    elevation: 0,
    automaticallyImplyLeading: false,
    titleSpacing: 16,
    flexibleSpace: Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [kBg2.withValues(alpha: 0.98), kBg2.withValues(alpha: 0)],
        ),
      ),
    ),
    title: Row(children: [
      const Text('Oweru',
          style: TextStyle(color: kGold, fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: 0.3)),
      const SizedBox(width: 8),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
            color: kGoldDim,
            borderRadius: BorderRadius.circular(5),
            border: Border.all(color: kGoldBorder)),
        child: const Text('TENANT', style: kLabelStyle),
      ),
    ]),
    actions: [
      // Notification bell with animated badge
      Stack(children: [
        IconButton(
          onPressed: () => Navigator.push(
              context, MaterialPageRoute(builder: (_) => const NotificationsPage())),
          icon: const Icon(Icons.notifications_none_rounded, color: kSlate, size: 22),
        ),
        Positioned(
          top: 10, right: 10,
          child: AnimatedBuilder(
            animation: _pulseAnim,
            builder: (_, _) => Container(
              width: 7, height: 7,
              decoration: BoxDecoration(
                color: kDanger,
                shape: BoxShape.circle,
                border: Border.all(color: kBg2, width: 1.5),
                boxShadow: [BoxShadow(color: kDanger.withValues(alpha: 0.5 * _pulseAnim.value), blurRadius: 6)],
              ),
            ),
          ),
        ),
      ]),
      // Avatar
      GestureDetector(
        onTap: () => _scaffoldKey.currentState?.openEndDrawer(),
        child: Container(
          width: 34, height: 34,
          margin: const EdgeInsets.only(right: 14),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF334155),
            border: Border.all(color: Colors.white24, width: 1.5),
            boxShadow: const [BoxShadow(color: Color(0x30000000), blurRadius: 8, offset: Offset(0, 2))],
          ),
          child: Center(child: Text(
            _userService.userName?.isNotEmpty == true
                ? _userService.userName![0].toUpperCase() : 'T',
            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800),
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
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white12)),
        child: Column(children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF334155),
              border: Border.all(color: Colors.white24, width: 2),
            ),
            child: Center(child: Text(
              _userService.userName?.isNotEmpty == true
                  ? _userService.userName![0].toUpperCase() : 'T',
              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
            )),
          ),
          const SizedBox(height: 12),
          Text(_userService.userName ?? 'Tenant',
              style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          const TStatusBadge(label: 'Active Tenant', color: kSuccess),
        ]),
      ),
      Divider(color: Colors.white12),
      _drawerTile(Icons.tune_rounded, 'Settings', () { Navigator.pop(context); _navigate(11); }),
      _drawerTile(Icons.analytics_rounded, 'Analytics', () { Navigator.pop(context); _navigate(10); }),
      const Spacer(),
      Divider(color: Colors.white12),
      const Padding(padding: EdgeInsets.all(16), child: LogoutButton()),
    ])),
  );

  Widget _drawerTile(IconData icon, String label, VoidCallback onTap) =>
      ListTile(
        leading: Icon(icon, color: kSlate, size: 20),
        title: Text(label, style: const TextStyle(color: kCream, fontSize: 14)),
        onTap: onTap,
      );

  // ── Side Drawer ─────────────────────────────────────────
  Widget _drawer() => Drawer(
    backgroundColor: kBg2,
    child: SafeArea(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Padding(
        padding: EdgeInsets.fromLTRB(20, 22, 20, 8),
        child: Text('More', style: TextStyle(color: kCream, fontSize: 22, fontWeight: FontWeight.w800)),
      ),
      Divider(color: Colors.white12),
      ..._drawerItems.map((item) {
        final active = _selectedIndex == (item['index'] as int);
        return AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
          decoration: BoxDecoration(
            color: active ? Colors.white.withValues(alpha: 0.08) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: ListTile(
            leading: Icon(item['icon'] as IconData, color: active ? Colors.white : kSlate, size: 20),
            title: Text(item['label'] as String,
                style: TextStyle(
                    color: active ? Colors.white : kCream,
                    fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                    fontSize: 14)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            onTap: () { Navigator.pop(context); _navigate(item['index'] as int); },
          ),
        );
      }),
    ])),
  );

  // ── Bottom Nav ──────────────────────────────────────────
  Widget _bottomNav() => Container(
    decoration: BoxDecoration(
      color: kBg2,
      border: Border(top: BorderSide(color: Colors.white10, width: 0.5)),
      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, -4))],
    ),
    child: SafeArea(child: SizedBox(
      height: 64,
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
            duration: const Duration(milliseconds: 220),
            margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            decoration: BoxDecoration(
              color: sel ? Colors.white.withValues(alpha: 0.08) : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              AnimatedScale(
                scale: sel ? 1.1 : 1.0,
                duration: const Duration(milliseconds: 200),
                child: Icon(item['icon'] as IconData, color: sel ? Colors.white : kSlate, size: 20),
              ),
              const SizedBox(height: 3),
              Text(item['label'] as String,
                  style: TextStyle(
                      color: sel ? Colors.white : kSlate,
                      fontSize: 10,
                      fontWeight: sel ? FontWeight.w700 : FontWeight.w400)),
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
      case 9:  return const ApplicationStatusPage();
      case 10: return const TenantAnalyticsPage();
      case 11: return _settings();
      default: return _dashboard();
    }
  }

  // ── Dashboard Main ──────────────────────────────────────
  Widget _dashboard() {
    if (_isLoading) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        SizedBox(width: 40, height: 40,
            child: CircularProgressIndicator(color: Colors.white54, strokeWidth: 2)),
        const SizedBox(height: 14),
        const Text('Loading your dashboard…', style: TextStyle(color: kSlate, fontSize: 13)),
      ]));
    }

    if (_error.isNotEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.cloud_off_rounded, color: kDanger, size: 40),
        const SizedBox(height: 12),
        Text(_error, style: const TextStyle(color: kDanger, fontSize: 14)),
        const SizedBox(height: 14),
        TextButton(
          onPressed: _loadDashboardData,
          child: const Text('Retry', style: TextStyle(color: Colors.white70)),
        ),
      ]));
    }

    final totalProperties   = _stats['total_properties']   ?? 0;
    final savedProperties   = _stats['saved_properties']   ?? 0;
    final totalApplications = _stats['total_applications'] ?? 0;
    final contracts         = _stats['contracts']          ?? _contracts.length;
    final messages          = _stats['messages']           ?? 0;

    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        // Top padding for AppBar overlap
        const SliverToBoxAdapter(child: SizedBox(height: 100)),

        // ── Hero Banner ──────────────────────────────────
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
          child: _heroBanner(),
        )),


        // ── Stats ────────────────────────────────────────
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
          child: _sectionLabel('Overview'),    
        )),
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
          child: _statsRow(
            totalProperties: totalProperties,
            savedProperties: savedProperties,
            totalApplications: totalApplications,
            contracts: contracts,
            messages: messages,
          ),
        )),

        // ── Quick Actions ────────────────────────────────
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
          child: _sectionLabel('Quick Actions'),
        )),
        SliverToBoxAdapter(child: Padding(  
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
          child: _quickActionChips(),
        )),

        // ── Action List ──────────────────────────────────
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: TCard(child: Column(children: [
            _ActionRow(icon: Icons.search_rounded,      label: 'Browse Properties', sublabel: 'Find your next home', color: const Color(0xFF94A3B8), onTap: () => _navigate(1)),
            _ActionRow(icon: Icons.favorite_rounded,    label: 'Saved Properties',  sublabel: 'Your shortlist',      color: const Color(0xFFF87171), onTap: () => _navigate(5)),
            _ActionRow(icon: Icons.description_rounded, label: 'My Applications',   sublabel: 'Track your status',   color: const Color(0xFF60A5FA), onTap: () => _navigate(2)),
            _ActionRow(icon: Icons.gavel_rounded,       label: 'Digital Contracts', sublabel: 'View agreements',     color: const Color(0xFF34D399), onTap: () => _navigate(7)),
            _ActionRow(icon: Icons.chat_bubble_rounded, label: 'Messages',          sublabel: 'Chat with landlord',  color: const Color(0xFFFBBF24), onTap: () => _navigate(8), last: true),
          ])),
        )),

        // ── Featured Properties ──────────────────────────
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            _sectionLabel('Featured Picks'),
            GestureDetector(
              onTap: () => _navigate(1),
              child: const Text('See all', style: TextStyle(color: Colors.white60, fontSize: 13, fontWeight: FontWeight.w500)),
            ),
          ]),
        )),

        if (_properties.isEmpty)
          SliverToBoxAdapter(child: Padding( 
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: _emptyState(Icons.home_work_rounded, 'No featured properties yet'),
          ))
        else
          SliverList(delegate: SliverChildBuilderDelegate(
            (_, i) => Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: _PropertyCard(property: _properties[i], onTap: () {}),
            ),
            childCount: _properties.take(4).length,
          )),

        
        const SliverToBoxAdapter(child: SizedBox(height: 32)),
      ],
    );
  }

  // ── Hero Banner ─────────────────────────────────────────
  Widget _heroBanner() => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: const Color(0xFF1E293B),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: Colors.white10, width: 1),
      boxShadow: const [BoxShadow(color: Color(0x28000000), blurRadius: 24, offset: Offset(0, 8))],
    ),
    child: Row(children: [
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(_greeting, style: const TextStyle(color: Colors.white38, fontSize: 12, letterSpacing: 0.5)),
        const SizedBox(height: 4),
        Text('${_userService.userName ?? 'Tenant'} 👋',
          style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.3),
          maxLines: 1, overflow: TextOverflow.ellipsis),
        const SizedBox(height: 6),
        const Text('Your rental summary is ready.',
          style: TextStyle(color: Colors.white54, fontSize: 12), maxLines: 2, overflow: TextOverflow.ellipsis),
        const SizedBox(height: 16),
        Row(children: [
          GestureDetector(
            onTap: () => _navigate(3),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
              child: const Text('Pay Now', style: TextStyle(color: Color(0xFF0F172A), fontSize: 12, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: () => _navigate(2),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(border: Border.all(color: Colors.white24), borderRadius: BorderRadius.circular(8)),
              child: const Text('My Apps', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ),
        ]),
      ])),
      const SizedBox(width: 12),
      // Decorative icon block
      Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 56, height: 56,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white12),
          ),
          child: const Icon(Icons.apartment_rounded, color: Colors.white70, size: 28),
        ),
        const SizedBox(height: 8),
        AnimatedBuilder(
          animation: _pulseAnim,
          builder: (_, _) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            decoration: BoxDecoration(
              color: kSuccess.withValues(alpha: 0.15 + 0.08 * _pulseAnim.value),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: kSuccess.withValues(alpha: 0.4)),
            ),
            child: const Text('LIVE', style: TextStyle(color: kSuccess, fontSize: 8, fontWeight: FontWeight.w800, letterSpacing: 1)),
          ),
        ),
      ]),
    ]),
  );

  // ── Payment Alert ────────────────────────────────────────
  Widget _paymentAlert() => Container(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    decoration: BoxDecoration(
      color: const Color(0xFF1A0A00),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: kDanger.withValues(alpha: 0.4)),
    ),
   
  );

  // ── Stats Row ───────────────────────────────────────────
  Widget _statsRow({
    required dynamic totalProperties,
    required dynamic savedProperties,
    required dynamic totalApplications,
    required dynamic contracts,
    required dynamic messages,
  }) {
    final cards = [
      _StatCard(label: 'Listings',     value: int.tryParse('$totalProperties')   ?? 0, icon: Icons.home_work_rounded,   color: const Color(0xFF94A3B8), hint: 'Available',  ctrlAnim: _counterAnim, onTap: () => _navigate(1)),
      _StatCard(label: 'Saved',        value: int.tryParse('$savedProperties')   ?? 0, icon: Icons.favorite_rounded,    color: const Color(0xFFF87171), hint: 'Favourites', ctrlAnim: _counterAnim, onTap: () => _navigate(5)),
      _StatCard(label: 'Applications', value: int.tryParse('$totalApplications') ?? 0, icon: Icons.description_rounded, color: const Color(0xFF60A5FA), hint: 'Pending',    ctrlAnim: _counterAnim, onTap: () => _navigate(2)),
      _StatCard(label: 'Contracts',    value: int.tryParse('$contracts')         ?? 0, icon: Icons.gavel_rounded,       color: const Color(0xFF34D399), hint: 'Active',     ctrlAnim: _counterAnim, onTap: () => _navigate(7)),
      _StatCard(label: 'Messages',     value: int.tryParse('$messages')          ?? 0, icon: Icons.chat_bubble_rounded, color: const Color(0xFFFBBF24), hint: 'Unread',     ctrlAnim: _counterAnim, onTap: () => _navigate(8)),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (int i = 0; i < cards.length; i++) ...[
              SizedBox(width: 116, child: cards[i]),
              if (i < cards.length - 1) const SizedBox(width: 10),
            ],
          ],
        ),
      ),
    );
  }

  // ── Quick Action Chips ───────────────────────────────────
  Widget _quickActionChips() {
    final chips = [
      _ChipData('Search',    Icons.search_rounded,                 const Color(0xFF94A3B8), () => _navigate(1)),
      _ChipData('Payments',  Icons.account_balance_wallet_rounded, const Color(0xFF60A5FA), () => _navigate(3)),
      _ChipData('Analytics', Icons.analytics_rounded,              const Color(0xFF34D399), () => _navigate(10)),
      _ChipData('History',   Icons.history_rounded,                const Color(0xFF94A3B8), () => _navigate(6)),
    ];

    return Row(children: chips.map((c) => Expanded(
      child: GestureDetector(
        onTap: c.onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: kBg2,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: kBorder),
          ),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(c.icon, color: c.color, size: 20),
            const SizedBox(height: 5),
            Text(c.label, style: TextStyle(color: c.color, fontSize: 10, fontWeight: FontWeight.w600)),
          ]),
        ),
      ),
    )).toList());
  }

  // ── Helpers ─────────────────────────────────────────────
  Widget _sectionLabel(String label) => Text(label,
      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: -0.2));

  Widget _emptyState(IconData icon, String msg) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(color: kBg2, borderRadius: BorderRadius.circular(14), border: Border.all(color: kBorder)),
    child: Row(children: [
      Icon(icon, color: kSlateDim, size: 24),
      const SizedBox(width: 12),
      Text(msg, style: const TextStyle(color: kSlate, fontSize: 13)),
    ]),
  );

  // ── Settings ────────────────────────────────────────────
  Widget _settings() => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      const _SettingsSection('Account'),
      TCard(child: Column(children: [
        _SettingsRow(title: 'Full Name', value: _userService.userName ?? 'Tenant', icon: Icons.person_rounded),
        const _SettingsRow(title: 'Email',  value: 'Not set', icon: Icons.email_rounded),
        const _SettingsRow(title: 'Phone',  value: 'Not set', icon: Icons.phone_rounded, last: true),
      ])),
      const SizedBox(height: 12),
      const _SettingsSection('Preferences'),
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

// ── Chip Data Helper ──────────────────────────────────────
class _ChipData {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _ChipData(this.label, this.icon, this.color, this.onTap);
}

// ── Sub-widgets ───────────────────────────────────────────

class _PropertyCard extends StatelessWidget {
  final Map<String, dynamic> property;
  final VoidCallback onTap;
  const _PropertyCard({required this.property, required this.onTap});

  String _fmt(dynamic price) {
    if (price == null) return 'TZS 0';
    final v = price is double ? price : (double.tryParse(price.toString()) ?? 0);
    if (v >= 1000000) return 'TZS ${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000)    return 'TZS ${(v / 1000).toStringAsFixed(1)}K';
    return 'TZS ${v.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final images   = property['images'] as List?;
    final imageUrl = images?.isNotEmpty == true ? images![0] as String? : null;
    final title    = property['title']    as String? ?? 'Untitled property';
    final location = property['location'] as String? ?? 'No location';
    final bedrooms  = property['bedrooms']  ?? 0;
    final bathrooms = property['bathrooms'] ?? 0;
    final area      = property['area']      ?? 0;
    final price     = property['price'];

    return TCard(
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Thumbnail with badge
        Stack(children: [
          Container(
            width: 90, height: 72,
            decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(14)),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: imageUrl != null && imageUrl.isNotEmpty
                  ? Image.network(
                      imageUrl.startsWith('http') ? imageUrl : 'https://rental.oweru.com/storage/$imageUrl',
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const Icon(Icons.home, color: Colors.white38, size: 24))
                  : const Icon(Icons.home, color: Colors.white38, size: 24),
            ),
          ),
          Positioned(top: 6, left: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(color: kSuccess.withValues(alpha: 0.9), borderRadius: BorderRadius.circular(4)),
              child: const Text('Available', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w700)),
            ),
          ),
        ]),
        const SizedBox(width: 12),
        // Details
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title,
              style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600),
              maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 3),
          Row(children: [
            const Icon(Icons.location_on_rounded, color: kSlate, size: 11),
            const SizedBox(width: 2),
            Expanded(child: Text(location,
                style: const TextStyle(color: kSlate, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis)),
          ]),
          const SizedBox(height: 4),
          Row(children: [
            _propChip(Icons.bed_rounded, '$bedrooms bd'),
            const SizedBox(width: 6),
            _propChip(Icons.bathtub_rounded, '$bathrooms ba'),
            const SizedBox(width: 6),
            _propChip(Icons.square_foot_rounded, '$area m²'),
          ]),
        ])),
        const SizedBox(width: 6),
        Text(_fmt(price),
            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
            textAlign: TextAlign.right),
      ]),
    );
  }

  Widget _propChip(IconData icon, String text) => Row(mainAxisSize: MainAxisSize.min, children: [
    Icon(icon, color: kSlateDim, size: 10),
    const SizedBox(width: 2),
    Text(text, style: const TextStyle(color: kSlateDim, fontSize: 10)),
  ]);
}

class _ContractCard extends StatelessWidget {
  final Map<String, dynamic> contract;
  const _ContractCard({required this.contract});

  String _fmtStatus(String? s) => s == null ? 'Unknown' : s.replaceAll('_', ' ');
  String _fmtDate(String? d) {
    if (d == null) return '—';
    try {
      final dt = DateTime.parse(d);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) { return '—'; }
  }
  String _fmtCurrency(dynamic v) {
    if (v == null) return 'TZS 0';
    final n = v is double ? v : (double.tryParse(v.toString()) ?? 0);
    if (n >= 1000000) return 'TZS ${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000)    return 'TZS ${(n / 1000).toStringAsFixed(1)}K';
    return 'TZS ${n.toStringAsFixed(0)}';
  }
  Color _statusColor(String? s) {
    if (s == null) return kSlate;
    final l = s.toLowerCase();
    if (l.contains('pending')) return const Color(0xFFFBBF24);
    if (l.contains('active'))  return kSuccess;
    if (l.contains('signed'))  return kInfo;
    return kSlate;
  }

  @override
  Widget build(BuildContext context) {
    final title         = contract['property_title'] as String? ?? 'Property #${contract['property_id'] ?? ''}';
    final status        = contract['status']         as String?;
    final startDate     = contract['start_date']     as String?;
    final endDate       = contract['end_date']       as String?;
    final paymentStatus = contract['payment_status'] as String?;
    final rentAmount    = contract['rent_amount'];
    final color         = _statusColor(status);

    return TCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(width: 4, height: 36,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title,
              style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600),
              maxLines: 1, overflow: TextOverflow.ellipsis),
          Text('${_fmtDate(startDate)} → ${_fmtDate(endDate)}',
              style: const TextStyle(color: kSlate, fontSize: 11)),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8)),
            child: Text(_fmtStatus(status),
                style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 4),
          Text('${_fmtCurrency(rentAmount)}/mo',
              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
        ]),
      ]),
      if (paymentStatus != null) ...[
        const SizedBox(height: 10),
        Divider(color: Colors.white10, height: 1),
        const SizedBox(height: 10),
        Row(children: [
          const Icon(Icons.receipt_long_rounded, color: kSlateDim, size: 13),
          const SizedBox(width: 6),
          Text('Payment: ${_fmtStatus(paymentStatus)}',
              style: const TextStyle(color: kSlate, fontSize: 12)),
        ]),
      ],
    ]));
  }
}

// ── Animated Stat Card ────────────────────────────────────
class _StatCard extends StatelessWidget {
  final String label, hint;
  final int value;
  final IconData icon;
  final Color color;
  final Animation<double> ctrlAnim;
  final VoidCallback onTap;

  const _StatCard({
    required this.label,
    required this.value,
    required this.hint,
    required this.icon,
    required this.color,
    required this.ctrlAnim,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: kBg2,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder),
        boxShadow: [BoxShadow(color: color.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Container(
            width: 30, height: 30,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: color, size: 15),
          ),
          const Icon(Icons.arrow_forward_ios_rounded, color: kSlateDim, size: 10),
        ]),
        const SizedBox(height: 8),
        AnimatedBuilder(
          animation: ctrlAnim,
          builder: (_, _) => Text(
            '${(value * ctrlAnim.value).round()}',
            style: const TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.5),
          ),
        ),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: kSlate, fontSize: 10), maxLines: 1, overflow: TextOverflow.ellipsis),
        Text(hint, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w600), maxLines: 1),
      ]),
    ),
  );
}

// ── Action Row (with sublabel) ────────────────────────────
class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String label, sublabel;
  final Color color;
  final VoidCallback onTap;
  final bool last;

  const _ActionRow({
    required this.icon,
    required this.label,
    required this.sublabel,
    required this.color,
    required this.onTap,
    this.last = false,
  });

  @override
  Widget build(BuildContext context) => Column(children: [
    InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 18)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
            Text(sublabel, style: const TextStyle(color: Colors.white54, fontSize: 11)),
          ])),
          const Icon(Icons.chevron_right_rounded, color: Colors.white24, size: 18),
        ]),
      ),
    ),
    if (!last) Divider(color: Colors.white10, height: 1),
  ]);
}

// ── Settings helpers ──────────────────────────────────────
class _SettingsSection extends StatelessWidget {
  final String title;
  const _SettingsSection(this.title);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8, left: 2),
    child: Text(title, style: const TextStyle(color: kSlate, fontSize: 11, letterSpacing: 0.8, fontWeight: FontWeight.w600)),
  );
}

class _SettingsRow extends StatelessWidget {
  final String title, value;
  final IconData icon;
  final bool last;

  const _SettingsRow({
    required this.title,
    required this.value,
    required this.icon,
    this.last = false,
  });

  @override
  Widget build(BuildContext context) => Column(children: [
    Padding(
      padding: const EdgeInsets.symmetric(vertical: 11),
      child: Row(children: [
        Container(
          width: 34, height: 34,
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.07), borderRadius: BorderRadius.circular(9)),
          child: Icon(icon, color: Colors.white60, size: 16),
        ),
        const SizedBox(width: 10),
        Expanded(child: Text(title,
            style: const TextStyle(color: kCream, fontSize: 13), overflow: TextOverflow.ellipsis)),
        Flexible(child: Text(value,
            style: const TextStyle(color: kSlate, fontSize: 12), overflow: TextOverflow.ellipsis)),
        const SizedBox(width: 4),
        const Icon(Icons.chevron_right_rounded, color: kSlateDim, size: 16),
      ]),
    ),
    if (!last) Divider(color: Colors.white10, height: 1),
  ]);
}