import 'package:flutter/material.dart';
import '../../../shared/widgets/logout_button.dart';
import '../../../shared/services/user_service.dart';
import '../../../shared/services/agent_api_service.dart';
import 'agent_analytics_page.dart';
import 'agent_applications_page.dart';
import 'agent_add_listing_page.dart';
import 'agent_commissions_page.dart';
import 'agent_messages_page.dart';
import 'agent_linked_owners_page.dart';
import 'agent_payout_history_page.dart';
import 'agent_qr_codes_page.dart';
import 'agent_rent_payments_page.dart';
import 'agent_share_track_page.dart';
import 'agent_theme.dart';
import 'leads_page.dart';
import 'my_listings_page.dart';

class AgentDashboard extends StatefulWidget {
  const AgentDashboard({super.key});

  @override
  State<AgentDashboard> createState() => _AgentDashboardState();
}

class _AgentDashboardState extends State<AgentDashboard> {      
  int _selectedIndex = 0;
  final _userService = UserService();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  List<Map<String, dynamic>> _listings = [];
  List<Map<String, dynamic>> _leads = [];
  Map<String, dynamic> _dashboardData = {};

  bool _loadingListings = false;
  bool _loadingLeads = false;

  final List<Map<String, dynamic>> _bottomNavItems = [
    {'label': 'Home', 'icon': Icons.dashboard},
    {'label': 'Listings', 'icon': Icons.home},
    {'label': 'Leads', 'icon': Icons.people},
    {'label': 'Earnings', 'icon': Icons.attach_money},
    {'label': 'More', 'icon': Icons.menu_rounded},
  ];

  final List<Map<String, dynamic>> _drawerItems = [
    {'label': 'Analytics', 'icon': Icons.analytics, 'index': 4},
    {'label': 'Applications', 'icon': Icons.assignment, 'index': 5},
    {'label': 'Linked Owners', 'icon': Icons.people_alt, 'index': 6},
    {'label': 'Share & Track', 'icon': Icons.share, 'index': 7},
    {'label': 'QR Codes', 'icon': Icons.qr_code, 'index': 8},
    {'label': 'Rent Payments', 'icon': Icons.payments_outlined, 'index': 9},
    {'label': 'Payout History', 'icon': Icons.account_balance_wallet, 'index': 10},
    {'label': 'Messages', 'icon': Icons.mail, 'index': 11},
    {'label': 'Settings', 'icon': Icons.settings, 'index': 12},
  ];

  final Map<int, int> _bottomToPage = {0: 0, 1: 1, 2: 2, 3: 3};

  int get _bottomNavIndex {
    for (var e in _bottomToPage.entries) {
      if (e.value == _selectedIndex) return e.key;
    }
    return 4;
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final dashboardData = await AgentApiService.getDashboard();
    setState(() => _dashboardData = dashboardData);

    setState(() => _loadingListings = true);
    final listings = await AgentApiService.getMyListings();
    setState(() { _listings = listings; _loadingListings = false; });

    setState(() => _loadingLeads = true);
    final leads = await AgentApiService.getLeads();
    setState(() { _leads = leads; _loadingLeads = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: kPageBg,
      appBar: _buildAppBar(),
      drawer: _buildDrawer(),
      endDrawer: _buildProfileDrawer(),
      body: _buildContent(),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: kWhite,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      automaticallyImplyLeading: false,
      title: Row(children: [
        const Text('Oweru', style: TextStyle(color: kSlate800, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: 0.3)),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(color: kGold.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(4), border: Border.all(color: kGold.withValues(alpha: 0.3))),
          child: const Text('AGENT', style: TextStyle(color: kGold, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.8)),
        ),
      ]),
      actions: [
        IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_none_rounded, color: kSlate, size: 22)),
        GestureDetector(
          onTap: () => _scaffoldKey.currentState?.openEndDrawer(),
          child: Container(
            width: 32, height: 32,
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: kGold)),
            child: Center(
              child: Text(
                _userService.userName?.isNotEmpty == true ? _userService.userName![0].toUpperCase() : 'A',
                style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileDrawer() {
    return Drawer(
      backgroundColor: kSlate900,
      child: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(children: [
              Container(width: 48, height: 48, decoration: BoxDecoration(shape: BoxShape.circle, color: kSlate700, border: Border.all(color: kSlate500, width: 2)),
                child: Center(child: Text(
                  _userService.userName?.isNotEmpty == true ? _userService.userName![0].toUpperCase() : 'A',
                  style: const TextStyle(color: kWhite, fontSize: 20, fontWeight: FontWeight.w700),
                ))),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_userService.userName ?? 'Agent', style: const TextStyle(color: kWhite, fontSize: 15, fontWeight: FontWeight.w600)),
                const Text('Real Estate Agent', style: TextStyle(color: kSlate400, fontSize: 12)),
              ])),
            ]),
          ),
          const Divider(color: kSlate700),
          ListTile(
            leading: const Icon(Icons.settings, color: kSlate400, size: 20),
            title: const Text('Settings', style: TextStyle(color: kSlate200, fontSize: 14)),
            onTap: () { Navigator.pop(context); setState(() => _selectedIndex = 12); },
          ),
          const Spacer(),
          const Divider(color: kSlate700),
          Padding(padding: const EdgeInsets.all(16), child: LogoutButton()),
        ]),
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: kSlate900,
      child: SafeArea(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
            child: const Text('More', style: TextStyle(color: kWhite, fontSize: 18, fontWeight: FontWeight.w700)),
          ),
          const Divider(color: kSlate700),
          ..._drawerItems.map((item) => ListTile(
            leading: Icon(item['icon'], color: _selectedIndex == item['index'] ? kWhite : kSlate400, size: 20),
            title: Text(item['label'], style: TextStyle(
              color: _selectedIndex == item['index'] ? kWhite : kSlate300,
              fontWeight: _selectedIndex == item['index'] ? FontWeight.w600 : FontWeight.normal,
              fontSize: 14,
            )),
            tileColor: _selectedIndex == item['index'] ? kSlate700 : null,
            onTap: () { Navigator.pop(context); setState(() => _selectedIndex = item['index']); },
          )),
        ]),
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: const BoxDecoration(color: kWhite, border: Border(top: BorderSide(color: kBorder, width: 1))),
      child: SafeArea(
        child: SizedBox(
          height: 60,
          child: Row(
            children: List.generate(_bottomNavItems.length, (index) {
              final item = _bottomNavItems[index];
              final isSelected = _bottomNavIndex == index;
              return Expanded(
                child: GestureDetector(
                  onTap: () {
                    if (index == 4) {
                      _scaffoldKey.currentState?.openDrawer();
                    } else {
                      setState(() => _selectedIndex = _bottomToPage[index]!);
                    }
                  },
                  behavior: HitTestBehavior.opaque,
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(item['icon'], color: isSelected ? kSlate800 : kSlate400, size: 22),
                    const SizedBox(height: 3),
                    Text(item['label'], style: TextStyle(color: isSelected ? kSlate800 : kSlate400, fontSize: 10, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400)),
                  ]),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    switch (_selectedIndex) {
      case 0: return _buildDashboardContent();
      case 1: return _buildListingsContent();
      case 2: return _buildLeadsContent();
      case 3: return _buildCommissionsContent();
      case 4: return _buildAnalyticsContent();
      case 5: return const AgentApplicationsPage();
      case 6: return const AgentLinkedOwnersPage();
      case 7: return const AgentShareTrackPage();
      case 8: return const AgentQrCodesPage();
      case 9: return const AgentRentPaymentsPage();
      case 10: return const AgentPayoutHistoryPage();
      case 11: return _buildMessagesContent();
      case 12: return _buildSettingsContent();
      default: return _buildDashboardContent();
    }
  }

  Widget _buildDashboardContent() {
    final stats = _dashboardData['data'] as Map<String, dynamic>? ?? {};
    final totalListings = stats['total_listings'] ?? 0;
    final activeListings = stats['active_listings'] ?? 0;
    final totalLeads = stats['total_leads'] ?? 0;
    final totalCommissions = stats['total_commissions'] ?? 0;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: [
        _buildWelcomeBanner(),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 1.8,
          children: [
            _buildStatCard('Listings', '$totalListings', Icons.home, const Color(0xFF2563EB)),
            _buildStatCard('Active Listings', '$activeListings', Icons.home_work, const Color(0xFF16A34A)),
            _buildStatCard('Leads', '$totalLeads', Icons.people, const Color(0xFFD97706)),
            _buildStatCard('Commissions', _formatCurrency(totalCommissions), Icons.attach_money, const Color(0xFF7C3AED)),
          ],
        ),
        const SizedBox(height: 16),
        _buildSectionCard('Quick Actions', Column(children: [
          _buildActionRow(Icons.add_home_rounded, 'Add New Listing', kGold, () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const AgentAddListingPage()),
            ).then((_) => _loadData());
          }),
          _buildActionRow(Icons.people_rounded, 'View All Leads', const Color(0xFF3B82F6), () {
            setState(() => _selectedIndex = 2);
          }),
          _buildActionRow(Icons.analytics_rounded, 'Performance Report', const Color(0xFF10B981), () {
            setState(() => _selectedIndex = 4);
          }),
        ])),
        const SizedBox(height: 16),
        _buildSectionCard('Recent Listings', Column(children: [
          if (_listings.isEmpty)
            const Padding(padding: EdgeInsets.all(16), child: Text('No listings yet.', style: TextStyle(color: kSlate)))
          else
            ..._listings.take(5).map((listing) => _buildListingRow(listing)),
          if (_listings.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: GestureDetector(
                onTap: () => setState(() => _selectedIndex = 1),
                child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                  const Text('View all listings', style: TextStyle(color: kGold, fontSize: 13)),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_forward, size: 14, color: kGold),
                ]),
              ),
            ),
        ])),
        const SizedBox(height: 16),
        _buildSectionCard('Recent Leads', Column(children: [
          if (_leads.isEmpty)
            const Padding(padding: EdgeInsets.all(16), child: Text('No leads yet.', style: TextStyle(color: kSlate)))
          else
            ..._leads.take(5).map((lead) => _buildLeadRow(lead)),
          if (_leads.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: GestureDetector(
                onTap: () => setState(() => _selectedIndex = 2),
                child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                  const Text('View all leads', style: TextStyle(color: kGold, fontSize: 13)),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_forward, size: 14, color: kGold),
                ]),
              ),
            ),
        ])),
      ],
    );
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

  Widget _buildListingRow(Map<String, dynamic> listing) {
    final title = listing['title'] as String? ?? 'Untitled';
    final location = listing['location'] as String? ?? 'No location';
    final owner = listing['owner'] as Map<String, dynamic>?;
    final ownerName = owner != null ? '${owner['first_name'] ?? ''} ${owner['last_name'] ?? ''}'.trim() : 'Unknown';
    final price = listing['price'];

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 2),
          Text(location, style: const TextStyle(color: kSlate, fontSize: 11)),
        ])),
        const SizedBox(width: 8),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(ownerName, style: const TextStyle(color: kSlate, fontSize: 11)),
          const SizedBox(height: 2),
          Text(_formatCurrency(price), style: const TextStyle(color: Color(0xFF2563EB), fontSize: 12, fontWeight: FontWeight.w600)),
        ]),
      ]),
    );
  }

  Widget _buildLeadRow(Map<String, dynamic> lead) {
    final name = lead['name'] as String? ?? lead['user']?['first_name'] as String? ?? 'Lead';
    final email = lead['email'] as String? ?? '';
    final source = lead['source'] as String? ?? 'website';
    final status = lead['status'] as String? ?? 'new';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 2),
          Text(email, style: const TextStyle(color: kSlate, fontSize: 11)),
        ])),
        const SizedBox(width: 8),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(source, style: const TextStyle(color: kSlate, fontSize: 11)),
          const SizedBox(height: 2),
          _buildStatusBadge(status),
        ]),
      ]),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;

    switch (status.toLowerCase()) {
      case 'new':
      case 'active':
      case 'approved':
      case 'completed':
        bgColor = const Color(0xFFF0FDF4);
        textColor = const Color(0xFF16A34A);
        break;
      case 'pending':
      case 'processing':
        bgColor = const Color(0xFFFFFBEB);
        textColor = const Color(0xFFD97706);
        break;
      case 'rejected':
      case 'cancelled':
      case 'failed':
        bgColor = const Color(0xFFFEF2F2);
        textColor = const Color(0xFFDC2626);
        break;
      default:
        bgColor = const Color(0xFFF1F5F9);
        textColor = const Color(0xFF64748B);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: textColor, fontSize: 10, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _buildWelcomeBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [kGold.withValues(alpha: 0.15), kGold.withValues(alpha: 0.05)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kGold.withValues(alpha: 0.3)),
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Hello, ${_userService.userName ?? 'Agent'} 👋', style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('You have 5 new leads this week.', style: TextStyle(color: kSlate, fontSize: 12)),
        ])),
        const Icon(Icons.home_work_rounded, color: kGold, size: 36),
      ]),
    );
  }

  Widget _buildActionRow(IconData icon, String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(children: [
          Container(width: 34, height: 34, decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)), child: Icon(icon, color: color, size: 16)),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w500))),
          const Icon(Icons.chevron_right_rounded, color: kSlate, size: 18),
        ]),
      ),
    );
  }

  Widget _buildListingsContent() => const MyListingsPage();
  Widget _buildLeadsContent() => const LeadsPage();
  Widget _buildCommissionsContent() => const AgentCommissionsPage();
  Widget _buildAnalyticsContent() => const AgentAnalyticsPage();
  Widget _buildMessagesContent() => const AgentMessagesPage();
  Widget _buildSettingsContent() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSectionCard('Account', Column(children: [
          _settingsTileDark('Full Name', _userService.userName ?? 'Agent', Icons.person),
          _settingsTileDark('Email Address', 'Not set', Icons.email),
          _settingsTileDark('License Number', 'Not set', Icons.badge),
        ])),
        const SizedBox(height: 20),
        SizedBox(width: double.infinity, child: LogoutButton()),
      ],
    );
  }

  Widget _settingsTileDark(String title, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(children: [
        Container(width: 32, height: 32, decoration: BoxDecoration(color: kGold.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: Icon(icon, color: kGold, size: 16)),
        const SizedBox(width: 10),
        Expanded(child: Text(title, style: const TextStyle(color: kCream, fontSize: 13))),
        Text(value, style: const TextStyle(color: kSlate, fontSize: 12)),
        const SizedBox(width: 4),
        const Icon(Icons.chevron_right_rounded, color: kSlate, size: 16),
      ]),
    );
  }

  Widget _emptyDark(String title, IconData icon, String emptyTitle, String emptySubtitle) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(title, style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 52),
          decoration: BoxDecoration(color: kCardBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
          child: Column(children: [
            Container(width: 52, height: 52, decoration: BoxDecoration(color: kSlate100, borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: kSlate400, size: 24)),
            const SizedBox(height: 12),
            Text(emptyTitle, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Padding(padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Text(emptySubtitle, style: const TextStyle(color: kSlate, fontSize: 12), textAlign: TextAlign.center)),
          ]),
        ),
      ],
    );
  }

  Widget _buildSectionCard(String title, Widget child) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: kCardBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
        const Divider(color: kBorder, height: 14),
        child,
      ]),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: kBg2, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(12)),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(color: kCream, fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: kSlate, fontSize: 10), textAlign: TextAlign.center),
      ]),
    );
  }
}