import 'package:flutter/material.dart';
import '../../../shared/widgets/logout_button.dart';
import '../../../shared/services/user_service.dart';
import '../../../shared/services/bnb_api_service.dart';
import 'bnb_bookings_page.dart';
import 'bnb_properties_page.dart';
import 'bnb_reviews_page.dart';

const Color kGold = Color(0xFFC89128);
const Color kBg = Color(0xFF0A0F1E);
const Color kBg2 = Color(0xFF0F172A);
const Color kBg3 = Color(0xFF162035);
const Color kCream = Color(0xFFF1F5F9);
const Color kSlate = Color(0xFF94A3B8);
const Color kBorder = Color(0x26C89128);

class BnbDashboard extends StatefulWidget {
  const BnbDashboard({super.key});

  @override
  State<BnbDashboard> createState() => _BnbDashboardState();
}

class _BnbDashboardState extends State<BnbDashboard> {
  int _selectedIndex = 0;
  final _userService = UserService();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Dashboard data
  Map<String, dynamic> _stats = {};
  List<Map<String, dynamic>> _bookings = [];
  List<Map<String, dynamic>> _properties = [];
  bool _isLoading = true;
  String _error = '';

  final List<Map<String, dynamic>> _bottomNavItems = [
    {'label': 'Home', 'icon': Icons.dashboard},
    {'label': 'Properties', 'icon': Icons.home},
    {'label': 'Bookings', 'icon': Icons.calendar_today},
    {'label': 'Earnings', 'icon': Icons.attach_money},
    {'label': 'More', 'icon': Icons.menu_rounded},
  ];

  final List<Map<String, dynamic>> _drawerItems = [
    {'label': 'Reviews', 'icon': Icons.star, 'index': 4},
    {'label': 'Analytics', 'icon': Icons.analytics, 'index': 5},
    {'label': 'Messages', 'icon': Icons.mail, 'index': 6},
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
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final results = await Future.wait([
        BnbApiService.getDashboard(),
        BnbApiService.getBookings(),
        BnbApiService.getProperties(),
      ]);

      final statsData = results[0];
      final bookingsData = results[1];
      final propertiesData = results[2];

      setState(() {
        if (statsData is Map<String, dynamic>) {
          _stats = (statsData['data'] as Map<String, dynamic>?) ?? {};
        }
        if (bookingsData is List) {
          _bookings = bookingsData.cast<Map<String, dynamic>>().take(5).toList();
        }
        if (propertiesData is List) {
          _properties = propertiesData.cast<Map<String, dynamic>>().take(3).toList();
        }
        _isLoading = false;
      });
    } catch (e) {
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

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '—';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '—';
    }
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
          child: const Text('BNB', style: TextStyle(color: kGold, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.8)),
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
                _userService.userName?.isNotEmpty == true ? _userService.userName![0].toUpperCase() : 'B',
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
                  _userService.userName?.isNotEmpty == true ? _userService.userName![0].toUpperCase() : 'B',
                  style: const TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700),
                ))),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_userService.userName ?? 'BNB Owner', style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600)),
                const Text('BNB Host', style: TextStyle(color: kSlate, fontSize: 12)),
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
      case 2: return _buildBookingsContent();
      case 3: return _buildEarningsContent();
      case 4: return _buildReviewsContent();
      case 5: return _buildAnalyticsContent();
      case 6: return _buildMessagesContent();
      case 7: return _buildSettingsContent();
      default: return _buildDashboardContent();
    }
  }

  Widget _buildDashboardContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: kGold));
    }

    if (_error.isNotEmpty) {
      return Center(child: Text(_error, style: const TextStyle(color: Colors.red)));
    }

    final totalProperties = _stats['total_properties'] ?? 0;
    final totalBookings = _stats['total_bookings'] ?? 0;
    final totalRevenue = _stats['total_revenue'] ?? 0;
    final occupancyRate = _stats['occupancy_rate'] ?? 0;
    final averageRating = _stats['average_rating'] ?? 0;
    final activeListings = _stats['active_listings'] ?? 0;

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
            _buildStatCard('Total Properties', '$totalProperties', Icons.home, kGold),
            _buildStatCard('Total Bookings', '$totalBookings', Icons.calendar_today, const Color(0xFF38BDF8)),
            _buildStatCard('Total Revenue', _formatCurrency(totalRevenue), Icons.attach_money, const Color(0xFF10B981)),
            _buildStatCard('Occupancy Rate', '${occupancyRate}%', Icons.trending_up, const Color(0xFFA78BFA)),
            _buildStatCard('Average Rating', averageRating.toString(), Icons.star, const Color(0xFFF59E0B)),
            _buildStatCard('Active Listings', '$activeListings', Icons.check_circle, const Color(0xFF10B981)),
          ],
        ),
        const SizedBox(height: 16),
        _buildSectionCard('Recent Bookings', Column(children: [
          if (_bookings.isEmpty)
            const Padding(padding: EdgeInsets.all(16), child: Text('No recent bookings.', style: TextStyle(color: kSlate)))
          else
            ..._bookings.map((booking) => _buildBookingRow(booking)).toList(),
          if (_bookings.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: GestureDetector(
                onTap: () => setState(() => _selectedIndex = 2),
                child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                  const Text('View all bookings', style: TextStyle(color: kGold, fontSize: 13)),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_forward, size: 14, color: kGold),
                ]),
              ),
            ),
        ])),
        const SizedBox(height: 16),
        _buildSectionCard('Top Properties', Column(children: [
          if (_properties.isEmpty)
            const Padding(padding: EdgeInsets.all(16), child: Text('No properties yet.', style: TextStyle(color: kSlate)))
          else
            ..._properties.map((property) => _buildPropertyRow(property)).toList(),
          if (_properties.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: GestureDetector(
                onTap: () => setState(() => _selectedIndex = 1),
                child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                  const Text('View all properties', style: TextStyle(color: kGold, fontSize: 13)),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_forward, size: 14, color: kGold),
                ]),
              ),
            ),
        ])),
      ],
    );
  }

  Widget _buildBookingRow(Map<String, dynamic> booking) {
    final propertyTitle = booking['property']?['title'] as String? ?? 'Property #${booking['property_id'] ?? ''}';
    final guest = booking['guest'] as String? ?? 'Guest';
    final checkIn = booking['check_in'] as String?;
    final checkOut = booking['check_out'] as String?;
    final totalPrice = booking['total_price'];
    final status = booking['status'] as String? ?? 'pending';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 9),
      child: Row(children: [
        Container(width: 36, height: 36, decoration: BoxDecoration(color: kGold.withOpacity(0.1), borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.bed_rounded, color: kGold, size: 18)),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(propertyTitle, style: const TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600)),
          Text('$guest · ${_formatDate(checkIn)} → ${_formatDate(checkOut)}', style: const TextStyle(color: kSlate, fontSize: 11)),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(_formatCurrency(totalPrice), style: const TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          _buildStatusBadge(status),
        ]),
      ]),
    );
  }

  Widget _buildPropertyRow(Map<String, dynamic> property) {
    final title = property['title'] as String? ?? 'Untitled';
    final location = property['location'] as String? ?? 'No location';
    final bedrooms = property['bedrooms'] ?? 1;
    final bathrooms = property['bathrooms'] ?? 1;
    final maxGuests = property['max_guests'] ?? 2;
    final price = property['price'];
    final averageRating = property['average_rating'] ?? 4.5;
    final reviewsCount = property['reviews_count'] ?? 0;
    final images = property['images'] as List?;
    final imageUrl = images != null && images.isNotEmpty ? images[0] as String? : null;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: kBg3,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: kBorder),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: imageUrl != null && imageUrl.isNotEmpty
                ? Image.network(
                    imageUrl.startsWith('http') ? imageUrl : 'https://rental.oweru.com/storage/$imageUrl',
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(Icons.home, color: kGold, size: 20),
                  )
                : const Icon(Icons.home, color: kGold, size: 20),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(location, style: const TextStyle(color: kSlate, fontSize: 11)),
          const SizedBox(height: 4),
          Row(children: [
            const Icon(Icons.bed, size: 11, color: kSlate),
            const SizedBox(width: 2),
            Text('$bedrooms', style: const TextStyle(color: kSlate, fontSize: 11)),
            const SizedBox(width: 8),
            const Icon(Icons.bathtub, size: 11, color: kSlate),
            const SizedBox(width: 2),
            Text('$bathrooms', style: const TextStyle(color: kSlate, fontSize: 11)),
            const SizedBox(width: 8),
            const Icon(Icons.people, size: 11, color: kSlate),
            const SizedBox(width: 2),
            Text('$maxGuests', style: const TextStyle(color: kSlate, fontSize: 11)),
          ]),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(_formatCurrency(price), style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Row(children: [
            const Icon(Icons.star, size: 11, color: const Color(0xFF10B981)),
            const SizedBox(width: 2),
            Text('$averageRating ($reviewsCount)', style: const TextStyle(color: const Color(0xFF10B981), fontSize: 11)),
          ]),
        ]),
      ]),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;

    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        bgColor = const Color(0xFFF0FDF4);
        textColor = const Color(0xFF10B981);
        break;
      case 'pending':
        bgColor = const Color(0xFFFFFBEB);
        textColor = const Color(0xFFF59E0B);
        break;
      case 'cancelled':
        bgColor = const Color(0xFFFEF2F2);
        textColor = const Color(0xFFEF4444);
        break;
      default:
        bgColor = const Color(0xFFF1F5F9);
        textColor = const Color(0xFF94A3B8);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: textColor, fontSize: 9, fontWeight: FontWeight.w600),
      ),
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
          Text('Welcome, ${_userService.userName ?? 'Host'} 👋', style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('${_bookings.length} upcoming bookings this week.', style: TextStyle(color: kSlate, fontSize: 12)),
        ])),
        const Icon(Icons.bed_rounded, color: kGold, size: 36),
      ]),
    );
  }

  Widget _buildPropertiesContent() => const BnbPropertiesPage();
  Widget _buildBookingsContent() => const BnbBookingsPage();
  Widget _buildEarningsContent() => _emptyDark('Earnings', Icons.attach_money, 'No earnings data', 'Your payout history and earnings breakdown will show here.');
  Widget _buildReviewsContent() => const BnbReviewsPage();
  Widget _buildAnalyticsContent() => _emptyDark('Analytics', Icons.analytics, 'Analytics coming soon', 'Occupancy rates, booking trends, and revenue insights.');
  Widget _buildMessagesContent() => _emptyDark('Messages', Icons.mail, 'No messages yet', 'Guest conversations and notifications will appear here.');
  Widget _buildSettingsContent() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSectionCard('Account', Column(children: [
          _settingsTileDark('Full Name', _userService.userName ?? 'BNB Owner', Icons.person),
          _settingsTileDark('Email Address', 'Not set', Icons.email),
          _settingsTileDark('Phone Number', 'Not set', Icons.phone),
        ])),
        const SizedBox(height: 12),
        _buildSectionCard('Preferences', Column(children: [
          _settingsTileDark('Language', 'English', Icons.language),
          _settingsTileDark('Currency', 'TZS', Icons.currency_exchange),
          _settingsTileDark('Notifications', 'Manage', Icons.notifications),
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

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: kBg2, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(12)),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(color: kCream, fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: kSlate, fontSize: 10), textAlign: TextAlign.center),
      ]),
    );
  }
}