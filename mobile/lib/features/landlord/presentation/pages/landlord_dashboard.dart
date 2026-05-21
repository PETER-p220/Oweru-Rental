// ============================================================
// landlord_dashboard.dart — dark navy/gold + tenant_theme
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

  // Dashboard data
  Map<String, dynamic> _stats = {};
  List<Map<String, dynamic>> _properties = [];
  List<Map<String, dynamic>> _contracts = [];
  int _applicationCount = 0;
  bool _isLoading = true;
  String _error = '';

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
    _loadDashboardData();
  }

  @override
  void dispose() { _fadeCtrl.dispose(); super.dispose(); }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final results = await Future.wait([
        LandlordApiService.getDashboard(),
        LandlordApiService.getMyProperties(),
        LandlordApiService.getApplications(),
        LandlordApiService.getContracts().catchError((_) => Future.value(<Map<String, dynamic>>[])),
      ]);

      final statsData = results[0];
      final propertiesData = results[1] as List<Map<String, dynamic>>;
      final applicationsData = results[2];
      final contractsData = results[3];

      debugPrint('Dashboard loaded ${propertiesData.length} properties');

      setState(() {
        if (statsData is Map<String, dynamic>) {
          _stats = (statsData['data'] as Map<String, dynamic>?) ?? {};
        }
        _properties = propertiesData.take(5).toList();
        debugPrint('Dashboard displaying ${_properties.length} properties');
        if (applicationsData is List) {
          _applicationCount = applicationsData.length;
        }
        if (contractsData is List) {
          _contracts = contractsData.cast<Map<String, dynamic>>();
        }
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading dashboard: $e');
      setState(() {
        _error = 'Failed to load dashboard data';
        _isLoading = false;
      });
    }
  }

  String _formatCurrency(dynamic value) {
    if (value == null) return 'TZS 0';
    final double numericValue = value is double ? value : (double.tryParse(value.toString()) ?? 0);
    if (numericValue >= 1000000) {
      return 'TZS ${(numericValue / 1000000).toStringAsFixed(1)}M';
    } else if (numericValue >= 1000) {
      return 'TZS ${(numericValue / 1000).toStringAsFixed(1)}K';
    }
    return 'TZS ${numericValue.toStringAsFixed(0)}';
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
  Widget _dashboard() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: kGold));
    }

    if (_error.isNotEmpty) {
      return Center(child: Text(_error, style: const TextStyle(color: kDanger)));
    }

    final totalProperties = _stats['total_properties'] ?? 0;
    final activeTenants = _stats['active_tenants'] ?? 0;
    final monthlyRevenue = _stats['monthly_revenue'] ?? 0;
    final occupancyRate = _stats['occupancy_rate'] ?? 0;
    final pendingContracts = _stats['pending_contracts'] ?? _contracts.where((c) => c['status'] == 'pending_signature').length;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      children: [
        _banner(),
        const SizedBox(height: 20),
        LSectionHeader('Overview'),
        // FIX: Use a Wrap or custom grid instead of GridView with fixed childAspectRatio
        // to prevent bottom overflow in stat cards
        _buildStatsGrid(
          totalProperties: totalProperties,
          applicationCount: _applicationCount,
          activeTenants: activeTenants,
          monthlyRevenue: monthlyRevenue,
          occupancyRate: occupancyRate,
          pendingContracts: pendingContracts,
        ),
        const SizedBox(height: 20),
        LSectionHeader('Quick Actions'),
        LCard(child: Column(children: [
          _ActionRow(icon: Icons.add_home_rounded, label: 'Add Property', color: kGold, onTap: () => _navigate(1)),
          _ActionRow(icon: Icons.home_work_rounded, label: 'My Properties', color: kInfo, onTap: () => _navigate(1)),
          _ActionRow(icon: Icons.description_rounded, label: 'Applications', color: kSuccess, onTap: () => _navigate(4)),
          _ActionRow(icon: Icons.description_rounded, label: 'Digital Contracts', color: kWarning, onTap: () => _navigate(8)),
          _ActionRow(icon: Icons.bar_chart_rounded, label: 'Analytics', color: kSlate, onTap: () => _navigate(6), last: true),
        ])),
        const SizedBox(height: 20),
        LSectionHeader('Recent Properties'),
        ..._properties.map((property) => _PropertyCard(
          property: property,
          onTap: () {},
        )),
        if (_properties.isEmpty)
          const Padding(padding: EdgeInsets.all(16), child: Text('No properties yet.', style: TextStyle(color: kSlate))),
        if (_properties.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 18),
            child: Align(
              alignment: Alignment.centerRight,
              child: GestureDetector(
                onTap: () => _navigate(1),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Text('View all properties', style: TextStyle(color: kGold, fontSize: 13)),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward, size: 14, color: kGold),
                ]),
              ),
            ),
          ),
      ],
    );
  }

  // FIX: Replace GridView with a manual 2-column layout using IntrinsicHeight
  // to avoid the childAspectRatio overflow on smaller screens / larger text
  Widget _buildStatsGrid({
    required dynamic totalProperties,
    required int applicationCount,
    required dynamic activeTenants,
    required dynamic monthlyRevenue,
    required dynamic occupancyRate,
    required dynamic pendingContracts,
  }) {
    final cards = [
      _StatCard(label: 'Total Properties', value: '$totalProperties', icon: Icons.home_work_rounded, color: kGold, hint: 'Live owner portfolio'),
      _StatCard(label: 'Applications', value: '$applicationCount', icon: Icons.description_rounded, color: kInfo, hint: 'Current submissions'),
      _StatCard(label: 'Active Tenants', value: '$activeTenants', icon: Icons.people_alt_rounded, color: kSuccess, hint: 'Active contracts'),
      _StatCard(label: 'Monthly Revenue', value: _formatCurrency(monthlyRevenue), icon: Icons.account_balance_wallet_rounded, color: kWarning, hint: '${(occupancyRate is num ? occupancyRate.toStringAsFixed(1) : '0.0')}% occupancy'),
      _StatCard(label: 'Pending Contracts', value: '$pendingContracts', icon: Icons.receipt_long_rounded, color: kDanger, hint: 'Awaiting signature'),
    ];

    final rows = <Widget>[];
    for (int i = 0; i < cards.length; i += 2) {
      rows.add(
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: cards[i]),
              const SizedBox(width: 10),
              // If odd number of cards, fill last slot with empty space
              if (i + 1 < cards.length)
                Expanded(child: cards[i + 1])
              else
                const Expanded(child: SizedBox()),
            ],
          ),
        ),
      );
      if (i + 2 < cards.length) rows.add(const SizedBox(height: 10));
    }

    return Column(children: rows);
  }

  Widget _banner() => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      gradient: kBannerGradient, borderRadius: BorderRadius.circular(16),
      border: Border.all(color: kGoldBorder),
      boxShadow: const [BoxShadow(color: Color(0x20C89128), blurRadius: 20, offset: Offset(0, 6))]),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // FIX: Allow text to wrap instead of overflow on right
            Text('Good morning, ${_userService.userName ?? 'Landlord'} 👋',
              style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w700),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            const Text('2 rent payments are due this week.',
              style: TextStyle(color: kSlate, fontSize: 12), maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 14),
            LGoldButton(label: 'Collect Rent →', onTap: () => _navigate(3), fullWidth: false),
          ]),
        ),
        const SizedBox(width: 12),
        Container(width: 54, height: 54,
          decoration: BoxDecoration(color: kGoldDim, borderRadius: BorderRadius.circular(14),
            border: Border.all(color: kGoldBorder)),
          child: const Icon(Icons.home_work_rounded, color: kGold, size: 26)),
      ],
    ),
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
class _PropertyCard extends StatelessWidget {
  final Map<String, dynamic> property;
  final VoidCallback onTap;

  const _PropertyCard({required this.property, required this.onTap});

  String _formatPrice(dynamic price) {
    if (price == null) return 'TZS 0';
    final double numericPrice = price is double ? price : (double.tryParse(price.toString()) ?? 0);
    if (numericPrice >= 1000000) {
      return 'TZS ${(numericPrice / 1000000).toStringAsFixed(1)}M';
    } else if (numericPrice >= 1000) {
      return 'TZS ${(numericPrice / 1000).toStringAsFixed(1)}K';
    }
    return 'TZS ${numericPrice.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final images = property['images'] as List?;
    final imageUrl = images != null && images.isNotEmpty ? images[0] as String? : null;
    final title = property['title'] as String? ?? 'Untitled property';
    final location = property['location'] as String? ?? 'No location';
    final bedrooms = property['bedrooms'] ?? 0;
    final bathrooms = property['bathrooms'] ?? 0;
    final area = property['area'] ?? 0;
    final price = property['price'];
    final available = property['available'] as bool? ?? true;

    return LCard(
      child: Column(children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Thumbnail
          Container(
            width: 88,
            height: 68,
            decoration: BoxDecoration(
              color: kBg3,
              borderRadius: BorderRadius.circular(16),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: imageUrl != null && imageUrl.isNotEmpty
                  ? Image.network(
                      imageUrl.startsWith('http') ? imageUrl : 'https://rental.oweru.com/storage/$imageUrl',
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const Icon(Icons.home, color: kGold, size: 24),
                    )
                  : const Icon(Icons.home, color: kGold, size: 24),
            ),
          ),
          const SizedBox(width: 12),
          // Details — FIX: Expanded prevents right overflow
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                title,
                style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600),
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
              const SizedBox(height: 4),
              Text(
                location,
                style: const TextStyle(color: kSlate, fontSize: 13, height: 1.5),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                '$bedrooms bd • $bathrooms ba • $area m²',
                style: const TextStyle(color: kSlate, fontSize: 12, height: 1.5),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              // FIX: Status badge instead of inline text to avoid overflow
              Container(
                margin: const EdgeInsets.only(top: 4),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: (available ? const Color(0xFF10B981) : const Color(0xFF3B82F6)).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  available ? 'Available' : 'Occupied',
                  style: TextStyle(
                    color: available ? const Color(0xFF10B981) : const Color(0xFF3B82F6),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ]),
          ),
          const SizedBox(width: 8),
          // FIX: Constrain price column width to prevent right overflow
          SizedBox(
            width: 90,
            child: Text(
              _formatPrice(price),
              style: const TextStyle(color: kGold, fontSize: 14, fontWeight: FontWeight.w700),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
              textAlign: TextAlign.right,
            ),
          ),
        ]),
        const SizedBox(height: 12),
        // Action buttons
        Row(mainAxisAlignment: MainAxisAlignment.end, children: [
          _ActionButton(label: 'Edit', onTap: () {}),
          const SizedBox(width: 8),
          _ActionButton(label: 'View', onTap: onTap),
        ]),
      ]),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _ActionButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        border: Border.all(color: kBorder),
        borderRadius: BorderRadius.circular(999),
        color: kBg2.withOpacity(0.5),
      ),
      child: Text(label, style: const TextStyle(color: kCream, fontSize: 13)),
    ),
  );
}

class _StatCard extends StatelessWidget {
  final String label, value, hint;
  final IconData icon;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.hint,
    required this.icon, required this.color});

  @override
  Widget build(BuildContext context) => Container(
    // FIX: Remove fixed aspect ratio; use padding only and let IntrinsicHeight in parent handle sizing
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: kBg2, borderRadius: BorderRadius.circular(12),
      border: Border.all(color: kBorder)),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min, // FIX: don't force expansion
      children: [
        Container(width: 28, height: 28,
          decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(7)),
          child: Icon(icon, color: color, size: 14)),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: -0.5),
          overflow: TextOverflow.ellipsis,
          maxLines: 1,
        ),
        const SizedBox(height: 1),
        Text(label, style: const TextStyle(color: kSlate, fontSize: 9), overflow: TextOverflow.ellipsis, maxLines: 1),
        Text(hint, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis, maxLines: 1),
      ],
    ),
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
  // AFTER (fixed)
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
    Padding(padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(children: [
        Container(width: 32, height: 32,
          decoration: BoxDecoration(color: kGoldDim, borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: kGold, size: 16)),
        const SizedBox(width: 10),
        Expanded(child: Text(title, style: const TextStyle(color: kCream, fontSize: 13), overflow: TextOverflow.ellipsis)),
        Flexible(child: Text(value, style: const TextStyle(color: kSlate, fontSize: 12), overflow: TextOverflow.ellipsis)),
        const SizedBox(width: 4),
        const Icon(Icons.chevron_right_rounded, color: kSlateDim, size: 16),
      ]),
    ),
    if (!last) Divider(color: kGold.withOpacity(0.1), height: 1),
  ]);
}