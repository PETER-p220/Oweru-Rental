import 'package:flutter/material.dart';
import '../../../shared/widgets/logout_button.dart';
import '../../../shared/services/user_service.dart';

const Color kGold = Color(0xFFC89128);
const Color kBg = Color(0xFF0A0F1E);
const Color kBg2 = Color(0xFF0F172A);
const Color kBg3 = Color(0xFF162035);
const Color kCream = Color(0xFFF1F5F9);
const Color kSlate = Color(0xFF94A3B8);
const Color kBorder = Color(0x26C89128);

class CommercialDashboard extends StatefulWidget {
  const CommercialDashboard({super.key});

  @override
  State<CommercialDashboard> createState() => _CommercialDashboardState();
}

class _CommercialDashboardState extends State<CommercialDashboard> {
  int _selectedIndex = 0;
  final _userService = UserService();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<Map<String, dynamic>> _bottomNavItems = [
    {'label': 'Home', 'icon': Icons.dashboard},
    {'label': 'Properties', 'icon': Icons.domain},
    {'label': 'Applications', 'icon': Icons.description},
    {'label': 'Analytics', 'icon': Icons.analytics},
    {'label': 'More', 'icon': Icons.menu_rounded},
  ];

  final List<Map<String, dynamic>> _drawerItems = [
    {'label': 'Reports', 'icon': Icons.file_present, 'index': 4},
    {'label': 'Messages', 'icon': Icons.mail, 'index': 5},
    {'label': 'Profile', 'icon': Icons.person, 'index': 6},
    {'label': 'Settings', 'icon': Icons.settings, 'index': 7},
  ];

  final Map<int, int> _bottomToPage = {0: 0, 1: 1, 2: 2, 3: 3};

  int get _bottomNavIndex {
    for (var e in _bottomToPage.entries) {
      if (e.value == _selectedIndex) return e.key;
    }
    return 4;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: kBg,
      appBar: _buildAppBar(),
      drawer: _buildDrawer(),
      endDrawer: _buildProfileDrawer(),
      body: _buildContent(),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: kBg2,
      elevation: 0,
      automaticallyImplyLeading: false,
      title: Row(children: [
        const Text('Oweru', style: TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(color: kGold.withOpacity(0.15), borderRadius: BorderRadius.circular(4), border: Border.all(color: kGold.withOpacity(0.3))),
          child: const Text('COMMERCIAL', style: TextStyle(color: kGold, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.8)),
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
                _userService.userName?.isNotEmpty == true ? _userService.userName![0].toUpperCase() : 'C',
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
      backgroundColor: kBg2,
      child: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(children: [
              Container(width: 48, height: 48, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: kGold, width: 2)),
                child: Center(child: Text(
                  _userService.userName?.isNotEmpty == true ? _userService.userName![0].toUpperCase() : 'C',
                  style: const TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700),
                ))),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_userService.userName ?? 'Commercial', style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600)),
                const Text('Commercial Owner', style: TextStyle(color: kSlate, fontSize: 12)),
              ])),
            ]),
          ),
          Divider(color: kGold.withOpacity(0.2)),
          ListTile(
            leading: const Icon(Icons.settings, color: kSlate, size: 20),
            title: const Text('Settings', style: TextStyle(color: kCream, fontSize: 14)),
            onTap: () { Navigator.pop(context); setState(() => _selectedIndex = 7); },
          ),
          const Spacer(),
          Divider(color: kGold.withOpacity(0.2)),
          Padding(padding: const EdgeInsets.all(16), child: LogoutButton()),
        ]),
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: kBg2,
      child: SafeArea(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
            child: const Text('More', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
          ),
          Divider(color: kGold.withOpacity(0.2)),
          ..._drawerItems.map((item) => ListTile(
            leading: Icon(item['icon'], color: _selectedIndex == item['index'] ? kGold : kSlate, size: 20),
            title: Text(item['label'], style: TextStyle(
              color: _selectedIndex == item['index'] ? kGold : kCream,
              fontWeight: _selectedIndex == item['index'] ? FontWeight.bold : FontWeight.normal,
              fontSize: 14,
            )),
            tileColor: _selectedIndex == item['index'] ? kGold.withOpacity(0.08) : null,
            onTap: () { Navigator.pop(context); setState(() => _selectedIndex = item['index']); },
          )),
        ]),
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(color: kBg2, border: Border(top: BorderSide(color: kGold.withOpacity(0.2), width: 1))),
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
                    Icon(item['icon'], color: isSelected ? kGold : kSlate, size: 22),
                    const SizedBox(height: 3),
                    Text(item['label'], style: TextStyle(color: isSelected ? kGold : kSlate, fontSize: 10, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400)),
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
      case 1: return _buildPropertiesContent();
      case 2: return _buildApplicationsContent();
      case 3: return _buildAnalyticsContent();
      case 4: return _buildReportsContent();
      case 5: return _buildMessagesContent();
      case 6: return _buildProfileContent();
      case 7: return _buildSettingsContent();
      default: return _buildDashboardContent();
    }
  }

  Widget _buildDashboardContent() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: [
        _buildWelcomeBanner(),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 0.95,
          children: [
            _buildStatCard('Properties', '6', Icons.domain),
            _buildStatCard('Active Leases', '4', Icons.description),
            _buildStatCard('Revenue', 'TZS 4.2M', Icons.attach_money),
          ],
        ),
        const SizedBox(height: 16),
        _buildSectionCard('Quick Actions', Column(children: [
          _buildActionRow(Icons.add_business_rounded, 'Add Commercial Property', kGold, () {}),
          _buildActionRow(Icons.description_rounded, 'Review Applications', const Color(0xFF3B82F6), () {}),
          _buildActionRow(Icons.file_present_rounded, 'Generate Report', const Color(0xFF10B981), () {}),
        ])),
        const SizedBox(height: 16),
        _buildSectionCard('Portfolio Summary', Column(children: [
          _summaryRow('Office Spaces', '3 units', '2 leased'),
          _summaryRow('Retail Shops', '2 units', '2 leased'),
          _summaryRow('Warehouses', '1 unit', 'Vacant'),
        ])),
      ],
    );
  }

  Widget _buildWelcomeBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [kGold.withOpacity(0.15), kGold.withOpacity(0.05)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kGold.withOpacity(0.3)),
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Welcome, ${_userService.userName ?? 'Commercial'} 👋', style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('1 lease renewal due this month.', style: TextStyle(color: kSlate, fontSize: 12)),
        ])),
        const Icon(Icons.domain_rounded, color: kGold, size: 36),
      ]),
    );
  }

  Widget _summaryRow(String type, String total, String status) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 9),
      child: Row(children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: kGold, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 10),
        Expanded(child: Text(type, style: const TextStyle(color: kCream, fontSize: 13))),
        Text(total, style: const TextStyle(color: kSlate, fontSize: 12)),
        const SizedBox(width: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: kGold.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
          child: Text(status, style: const TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.w500)),
        ),
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
          Container(width: 34, height: 34, decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)), child: Icon(icon, color: color, size: 16)),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w500))),
          const Icon(Icons.chevron_right_rounded, color: kSlate, size: 18),
        ]),
      ),
    );
  }

  Widget _buildPropertiesContent() => _emptyDark('My Properties', Icons.domain, 'No properties yet', 'Add your first commercial property to manage leases.');
  Widget _buildApplicationsContent() => _emptyDark('Applications', Icons.description, 'No applications yet', 'Lease applications from prospective tenants will appear here.');
  Widget _buildAnalyticsContent() => _emptyDark('Analytics', Icons.analytics, 'Analytics coming soon', 'Occupancy rates, revenue trends, and portfolio insights.');
  Widget _buildReportsContent() => _emptyDark('Reports', Icons.file_present, 'No reports yet', 'Generated reports and documents will be listed here.');
  Widget _buildMessagesContent() => _emptyDark('Messages', Icons.mail, 'No messages yet', 'Conversations with tenants and agents will appear here.');
  Widget _buildProfileContent() => _emptyDark('Profile', Icons.person, 'Profile coming soon', 'Your business profile and credentials.');
  Widget _buildSettingsContent() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSectionCard('Account', Column(children: [
          _settingsTileDark('Full Name', _userService.userName ?? 'Commercial', Icons.person),
          _settingsTileDark('Email Address', 'Not set', Icons.email),
          _settingsTileDark('Phone Number', 'Not set', Icons.phone),
        ])),
        const SizedBox(height: 12),
        _buildSectionCard('Preferences', Column(children: [
          _settingsTileDark('Language', 'English', Icons.language),
          _settingsTileDark('Currency', 'TZS', Icons.currency_exchange),
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
        Container(width: 32, height: 32, decoration: BoxDecoration(color: kGold.withOpacity(0.1), borderRadius: BorderRadius.circular(8)), child: Icon(icon, color: kGold, size: 16)),
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
          decoration: BoxDecoration(color: kBg2, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
          child: Column(children: [
            Container(width: 52, height: 52, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(12), border: Border.all(color: kGold.withOpacity(0.2))), child: Icon(icon, color: kGold.withOpacity(0.5), size: 24)),
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
      decoration: BoxDecoration(color: kBg2, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
        Divider(color: kGold.withOpacity(0.15), height: 14),
        child,
      ]),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: kBg2, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(12)),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: kGold, size: 22),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(color: kCream, fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: kSlate, fontSize: 10), textAlign: TextAlign.center),
      ]),
    );
  }
}