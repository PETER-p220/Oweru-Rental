import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../shared/widgets/app_navbar.dart';

// ── Constants ────────────────────────────────────────────────────────────────
const String kApiBase     = 'https://rental.oweru.com/api';
const String kStorageBase = 'https://rental.oweru.com/api';

const Color kGold       = Color(0xFFC89128);
const Color kGoldLight  = Color(0xFFE6A830);
const Color kBg         = Color(0xFF0A0F1E);
const Color kBg2        = Color(0xFF0F172A);
const Color kBg3        = Color(0xFF162035);
const Color kCream      = Color(0xFFF1F5F9);
const Color kSlate      = Color(0xFF94A3B8);
const Color kSlateDim   = Color(0xFF64748B);
const Color kBorder     = Color(0x26C89128);
const Color kGoldBorder = Color(0x33C89128);
const Color kGoldDim    = Color(0x1AC89128);

const List<String> kCommercialTypes = [
  'office', 'retail', 'warehouse', 'commercial', 'industrial'
];

// ── Helpers ──────────────────────────────────────────────────────────────────
String fmtPrice(num price) => 'TZS ${price
    .toStringAsFixed(0)
    .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

String commercialTypeLabel(String? type) {
  const map = {
    'office': 'Office', 'retail': 'Retail', 'warehouse': 'Warehouse',
    'commercial': 'Commercial', 'industrial': 'Industrial',
  };
  return map[type?.toLowerCase()] ?? type ?? 'Commercial';
}

String resolveStoragePath(String? path) {
  if (path == null || path.trim().isEmpty) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  final clean = path.replaceFirst(RegExp(r'^/+'), '');
  if (clean.startsWith('storage/')) return '$kStorageBase/$clean';
  return '$kStorageBase/storage/$clean';
}

String getImage(Map<String, dynamic> p) {
  // Shape C — propertyImages relation
  for (final key in ['propertyImages', 'property_images']) {
    final ci = p[key];
    if (ci is List && ci.isNotEmpty) {
      final img = ci.firstWhere(
          (i) => i['is_primary'] == 1 || i['is_primary'] == true,
          orElse: () => ci[0]);
      final path = img['image_path'] ?? img['path'] ?? '';
      if (path.toString().isNotEmpty) return resolveStoragePath(path.toString());
    }
  }
  // Shape A/B — images column
  var imgs = p['images'];
  if (imgs is String) {
    try { imgs = jsonDecode(imgs); } catch (_) { imgs = null; }
  }
  if (imgs is List && imgs.isNotEmpty) {
    final first = imgs[0];
    if (first is String && first.trim().isNotEmpty) return resolveStoragePath(first);
    final path = first['path'] ?? first['image_path'] ?? first['url'] ?? first['src'] ?? '';
    if (path.toString().isNotEmpty) return resolveStoragePath(path.toString());
  }
  return '';
}

// ── Data fetching ────────────────────────────────────────────────────────────
Future<List<Map<String, dynamic>>> fetchResidential() async {
  try {
    final r = await http.get(
        Uri.parse('$kApiBase/api/public/properties?per_page=12'),
        headers: {'Accept': 'application/json'});
    if (r.statusCode == 200) {
      final d = jsonDecode(r.body);
      final raw = (d['data']?['data'] ?? d['data'] ?? (d is List ? d : [])) as List;
      return raw.cast<Map<String, dynamic>>()
          .where((p) => !kCommercialTypes.contains(p['type']?.toString().toLowerCase()))
          .toList();
    }
  } catch (_) {}
  return [];
}

Future<List<Map<String, dynamic>>> fetchBnb() async {
  try {
    final r = await http.get(Uri.parse('$kApiBase/api/public/bnb'),
        headers: {'Accept': 'application/json'});
    if (r.statusCode == 200) {
      final d = jsonDecode(r.body);
      if (d is List) return d.cast<Map<String, dynamic>>();
      if (d['data'] is List) return (d['data'] as List).cast<Map<String, dynamic>>();
    }
  } catch (_) {}
  return [];
}

Future<List<Map<String, dynamic>>> fetchOweru() async {
  try {
    final r = await http.get(
        Uri.parse('$kApiBase/api/public/properties?type=oweru_rental&per_page=8'),
        headers: {'Accept': 'application/json'});
    if (r.statusCode == 200) {
      final d = jsonDecode(r.body);
      final raw = d['data'] is List ? d['data'] : (d['data']?['data'] ?? []);
      return (raw as List).cast<Map<String, dynamic>>();
    }
  } catch (_) {}
  return [];
}

Future<List<Map<String, dynamic>>> fetchCommercial() async {
  try {
    final r = await http.get(
        Uri.parse('$kApiBase/api/public/properties?per_page=12'),
        headers: {'Accept': 'application/json'});
    if (r.statusCode == 200) {
      final d = jsonDecode(r.body);
      final raw = (d['data']?['data'] ?? d['data'] ?? (d is List ? d : [])) as List;
      return raw.cast<Map<String, dynamic>>()
          .where((p) => kCommercialTypes.contains(p['type']?.toString().toLowerCase()))
          .toList();
    }
  } catch (_) {}
  return [];
}

// ════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ════════════════════════════════════════════════════════════════════════════
class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with TickerProviderStateMixin {
  List<Map<String, dynamic>> _residential = [];
  List<Map<String, dynamic>> _bnb         = [];
  List<Map<String, dynamic>> _oweru       = [];
  List<Map<String, dynamic>> _commercial  = [];

  bool _loadingResidential = true;
  bool _loadingBnb         = true;
  bool _loadingOweru       = true;
  bool _loadingCommercial  = true;

  final _searchCtrl    = TextEditingController();
  String _searchSection = 'all';
  String _priceRange    = '';
  bool   _searchActive  = false;

  late AnimationController _heroAnim;
  late Animation<double>   _heroScale;

  final ScrollController _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _heroAnim = AnimationController(vsync: this, duration: const Duration(seconds: 20))
      ..repeat(reverse: true);
    _heroScale = Tween(begin: 1.02, end: 1.08)
        .animate(CurvedAnimation(parent: _heroAnim, curve: Curves.easeInOut));
    _loadData();
  }

  @override
  void dispose() {
    _heroAnim.dispose();
    _searchCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    // Residential first (priority)
    final res = await fetchResidential();
    if (mounted) setState(() { _residential = res; _loadingResidential = false; });

    // Remaining in parallel
    final results = await Future.wait([fetchBnb(), fetchOweru(), fetchCommercial()]);
    if (mounted) {
      setState(() {
        _bnb        = results[0]; _loadingBnb        = false;
        _oweru      = results[1]; _loadingOweru      = false;
        _commercial = results[2]; _loadingCommercial = false;
      });
    }
  }

  List<Map<String, dynamic>> get _searchPool {
    switch (_searchSection) {
      case 'residential': return _residential;
      case 'bnb':         return _bnb;
      case 'oweru':       return _oweru;
      case 'commercial':  return _commercial;
      default:            return [..._residential, ..._bnb, ..._oweru, ..._commercial];
    }
  }

  List<Map<String, dynamic>> get _filtered {
    final term = _searchCtrl.text.toLowerCase();
    return _searchPool.where((p) {
      final matchText = term.isEmpty ||
          (p['title'] ?? '').toString().toLowerCase().contains(term) ||
          (p['location'] ?? '').toString().toLowerCase().contains(term) ||
          (p['address'] ?? '').toString().toLowerCase().contains(term);
      final price = num.tryParse(p['price']?.toString() ?? '0') ?? 0;
      bool matchPrice = true;
      if (_priceRange == '0-500')    matchPrice = price <= 500000;
      if (_priceRange == '500-1000') matchPrice = price > 500000 && price <= 1000000;
      if (_priceRange == '1000+')    matchPrice = price > 1000000;
      return matchText && matchPrice;
    }).toList();
  }

  void _clearSearch() => setState(() {
    _searchCtrl.clear(); _searchSection = 'all'; _priceRange = ''; _searchActive = false;
  });

  void _doSearch() {
    setState(() => _searchActive = true);
    // Scroll to top so results are visible
    _scrollCtrl.animateTo(0, duration: const Duration(milliseconds: 400), curve: Curves.easeOut);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppNavBar(
        isLoggedIn: false,
        onLoginPressed:    () => Navigator.pushNamed(context, '/login'),
        onRegisterPressed: () => Navigator.pushNamed(context, '/register'),
      ),
      body: SingleChildScrollView(
        controller: _scrollCtrl,
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildHero(),
            if (_searchActive) _buildSearchResults(),
            if (!_searchActive) ...[
              _buildStatsBar(),
              _buildResidentialSection(),
              _buildBnbSection(),
              _buildOweruSection(),
              _buildCommercialSection(),
              _buildCta(),
            ],
          ],
        ),
      ),
    );
  }

  // ── HERO ──────────────────────────────────────────────────────────────────
  Widget _buildHero() {
    return LayoutBuilder(builder: (context, constraints) {
      return SizedBox(
        width: double.infinity,
        child: Stack(
          children: [
            // ── Full-height background ──────────────────────────────────────
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _heroScale,
                builder: (_, _) => Transform.scale(
                  scale: _heroScale.value,
                  child: Image.network(
                    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1800&q=80',
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => Container(color: kBg2),
                  ),
                ),
              ),
            ),
            // ── Dark overlay ────────────────────────────────────────────────
            Positioned.fill(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xF50A0F1E), Color(0xD10A0F1E), Color(0xA5162035)],
                  ),
                ),
              ),
            ),
            // ── Grid pattern ────────────────────────────────────────────────
            Positioned.fill(child: CustomPaint(painter: _GridPainter())),

            // ── Foreground content (drives the Stack's height) ───────────────
            SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 36, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildHeroContent(),
                    const SizedBox(height: 24),
                    _buildSearchCard(),
                    _buildScrollHintBar(),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    });
  }

  Widget _buildHeroContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Eyebrow badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: kGoldDim,
            border: Border.all(color: kGoldBorder),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _BlinkDot(),
              const SizedBox(width: 8),
              const Text("Tanzania's Premier Rental Platform",
                  style: TextStyle(
                      fontSize: 10, fontWeight: FontWeight.w600,
                      letterSpacing: 2.0, color: kGold, fontFamily: 'Outfit')),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Hero title
        RichText(
          text: const TextSpan(
            style: TextStyle(
                fontFamily: 'Georgia', fontSize: 38,
                fontWeight: FontWeight.w300, height: 1.08,
                color: kCream, letterSpacing: -0.5),
            children: [
              TextSpan(text: 'Find Your\n'),
              TextSpan(
                text: 'Perfect Rental',
                style: TextStyle(
                    fontWeight: FontWeight.w600, color: kGold, fontStyle: FontStyle.italic),
              ),
              TextSpan(text: '\nProperty'),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Subtitle
        const Text(
          'Connect with trusted landlords and agents across Tanzania. Residential, commercial, and short-stay all in one place.',
          style: TextStyle(
              fontSize: 14, fontWeight: FontWeight.w300,
              height: 1.7, color: Color(0x8CF1F5F9), fontFamily: 'Outfit'),
        ),
        const SizedBox(height: 24),

        // CTA buttons
        Wrap(spacing: 12, runSpacing: 12, children: [
          _GoldButton(label: 'Browse All', icon: Icons.arrow_forward, onTap: () {}),
          _GhostButton(label: 'Create Account', icon: Icons.chevron_right, onTap: () {}),
        ]),
        const SizedBox(height: 24),

        // Trust badges
        Wrap(spacing: 16, runSpacing: 8, children: [
          _TrustBadge(icon: Icons.shield_outlined, label: 'Verified landlords'),
          _TrustBadge(icon: Icons.access_time,     label: '24hr response'),
          _TrustBadge(icon: Icons.trending_up,     label: '1,200+ listings'),
        ]),
        const SizedBox(height: 28),
      ],
    );
  }

  // ── SEARCH CARD ───────────────────────────────────────────────────────────
  Widget _buildSearchCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xED0F172A),
        border: Border.all(color: kBorder),
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(color: Color(0x800A0F1E), blurRadius: 60, offset: Offset(0, 30))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(children: [
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [kGold, kGoldLight]),
                borderRadius: BorderRadius.circular(10),
                boxShadow: const [BoxShadow(color: Color(0x4DC89128), blurRadius: 14)],
              ),
              child: const Icon(Icons.search, color: kBg, size: 17),
            ),
            const SizedBox(width: 12),
            const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Search Properties',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700,
                      color: kCream, fontFamily: 'Outfit')),
              Text('Find residential, commercial & more',
                  style: TextStyle(fontSize: 11, color: kSlate, fontFamily: 'Outfit')),
            ]),
          ]),
          const SizedBox(height: 18),

          // Text input
          _SearchInput(
            controller: _searchCtrl,
            hint: 'Location, neighbourhood, property name…',
            onSubmit: _doSearch,
          ),
          const SizedBox(height: 10),

          // Category dropdown
          _DropdownField(
            value: _searchSection,
            items: const {
              'all': 'All Categories',
              'residential': '🏠 Residential',
              'bnb': '🏝️ Short Stay',
              'commercial': '🏢 Commercial',
              'oweru': '👑 Oweru Special',
            },
            onChanged: (v) => setState(() => _searchSection = v!),
          ),
          const SizedBox(height: 10),

          // Price dropdown
          _DropdownField(
            value: _priceRange.isEmpty ? '' : _priceRange,
            items: const {
              '': 'All Prices',
              '0-500': 'Under TZS 500K',
              '500-1000': 'TZS 500K – 1M',
              '1000+': 'Above TZS 1M',
            },
            onChanged: (v) => setState(() => _priceRange = v ?? ''),
          ),
          const SizedBox(height: 14),

          // Search button
          GestureDetector(
            onTap: _doSearch,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [kGold, kGoldLight]),
                borderRadius: BorderRadius.circular(10),
                boxShadow: const [
                  BoxShadow(color: Color(0x40C89128), blurRadius: 14, offset: Offset(0, 4))
                ],
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.search, size: 15, color: kBg),
                  SizedBox(width: 8),
                  Text('Search Properties',
                      style: TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w700,
                          letterSpacing: 1.1, color: kBg, fontFamily: 'Outfit')),
                ],
              ),
            ),
          ),

          if (_searchCtrl.text.isNotEmpty || _searchSection != 'all' || _priceRange.isNotEmpty)
            Center(
              child: TextButton.icon(
                onPressed: _clearSearch,
                icon: const Icon(Icons.close, size: 11, color: kSlate),
                label: const Text('Clear filters',
                    style: TextStyle(fontSize: 12, color: kSlate, fontFamily: 'Outfit')),
              ),
            ),
        ],
      ),
    );
  }

  // ── SCROLL HINT BAR ───────────────────────────────────────────────────────
  Widget _buildScrollHintBar() {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFA0F172A),
        border: Border(top: BorderSide(color: kBorder)),
      ),
      height: 50,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(children: [
          const Text('BROWSE',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
                  letterSpacing: 3.0, color: kSlateDim, fontFamily: 'Outfit')),
          Container(width: 1, height: 50, color: kBorder, margin: const EdgeInsets.symmetric(horizontal: 14)),
          _ScrollChip(label: '🏠 Residential', onTap: () {}),
          _ScrollChip(label: '🏝️ Short Stay',  onTap: () {}),
          _ScrollChip(label: '🏢 Commercial',  onTap: () {}),
          _ScrollChip(label: '👑 Oweru',       onTap: () {}),
          const SizedBox(width: 12),
          Container(width: 1, height: 50, color: kBorder),
          const SizedBox(width: 14),
          GestureDetector(
            onTap: () {},
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [kGold, kGoldLight]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(children: [
                Text('All Listings',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                        letterSpacing: 0.8, color: kBg, fontFamily: 'Outfit')),
                SizedBox(width: 5),
                Icon(Icons.arrow_forward, size: 11, color: kBg),
              ]),
            ),
          ),
          const SizedBox(width: 16),
        ]),
      ),
    );
  }

  // ── SEARCH RESULTS ────────────────────────────────────────────────────────
  Widget _buildSearchResults() {
    final results = _filtered;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Gold top border (matches JSX borderTop: '2px solid var(--gold)')
        Container(height: 2, color: kGold),
        Container(
          width: double.infinity,
          color: kBg2,
          padding: const EdgeInsets.fromLTRB(20, 36, 20, 48),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('SEARCH RESULTS',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
                        letterSpacing: 3.0, color: kGold, fontFamily: 'Outfit')),
                const SizedBox(height: 6),
                Text(
                  '${results.length} propert${results.length != 1 ? 'ies' : 'y'} found',
                  style: const TextStyle(fontFamily: 'Georgia', fontSize: 24,
                      fontWeight: FontWeight.w300, color: kCream),
                ),
              ])),
              GestureDetector(
                onTap: _clearSearch,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                      border: Border.all(color: kBorder),
                      borderRadius: BorderRadius.circular(8)),
                  child: const Row(children: [
                    Icon(Icons.close, size: 12, color: kSlate),
                    SizedBox(width: 5),
                    Text('Clear', style: TextStyle(fontSize: 12, color: kSlate, fontFamily: 'Outfit')),
                  ]),
                ),
              ),
            ]),
            const SizedBox(height: 28),
            results.isEmpty ? _buildEmptySearch() : _buildPropGrid(results),
          ]),
        ),
      ],
    );
  }

  Widget _buildEmptySearch() => Center(
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(children: [
        const Icon(Icons.search, size: 36, color: Color(0x66C89128)),
        const SizedBox(height: 14),
        const Text('No properties found',
            style: TextStyle(fontSize: 18, color: kCream, fontFamily: 'Outfit')),
        const SizedBox(height: 8),
        const Text('Try a different location or adjust your filters.',
            style: TextStyle(fontSize: 13, color: kSlate, fontFamily: 'Outfit')),
        const SizedBox(height: 18),
        _GhostButtonSmall(label: 'Clear filters', onTap: _clearSearch),
      ]),
    ),
  );

  // ── STATS BAR ─────────────────────────────────────────────────────────────
  Widget _buildStatsBar() {
    const stats = [
      ('1,247', 'Active Listings'), ('3,842', 'Registered Users'),
      ('892',   'Available Now'),   ('24 hr', 'Avg. Response'),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(height: 1, color: kBorder),
        Container(
          color: kBg2,
          child: Wrap(
            children: stats.map((s) => SizedBox(
              width: MediaQuery.of(context).size.width / 2,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 12),
                decoration: const BoxDecoration(
                    border: Border(
                        right: BorderSide(color: kBorder),
                        bottom: BorderSide(color: kBorder))),
                child: Column(children: [
                  Text(s.$1,
                      style: const TextStyle(fontFamily: 'Georgia', fontSize: 30,
                          fontWeight: FontWeight.w300, color: kGold)),
                  const SizedBox(height: 5),
                  Text(s.$2.toUpperCase(),
                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600,
                          letterSpacing: 2.0, color: kSlate, fontFamily: 'Outfit')),
                ]),
              ),
            )).toList(),
          ),
        ),
      ],
    );
  }

  // ── SECTIONS ──────────────────────────────────────────────────────────────
  Widget _buildResidentialSection() => _Section(
    bgColor: kBg, tag: '🏠 Residential',
    title: 'Popular ', titleEm: 'Properties',
    sub: 'Apartments, houses, studios and more across Tanzania.',
    actionLabel: 'View All', onAction: () {},
    child: _loadingResidential
        ? const _SkeletonGrid()
        : _residential.isEmpty
            ? const _EmptyState(text: 'No residential properties yet')
            : _buildPropGrid(_residential.take(6).toList()),
  );

  Widget _buildBnbSection() => _Section(
    bgColor: kBg2, tag: '⭐ Vacation Rentals',
    title: 'Premium ', titleEm: 'Short Stay',
    child: _loadingBnb
        ? const _SkeletonGrid()
        : _bnb.isEmpty
            ? const _EmptyState(text: 'No BnB properties yet')
            : _buildPropGrid(_bnb, priceSuffix: '/night',
                actionLabel: 'Book Now', onAction: (p) => _showBooking(p)),
  );

  Widget _buildOweruSection() => _Section(
    bgColor: kBg, tag: '🛡️ Exclusive Offers',
    title: 'Oweru ', titleEm: 'Special Packages',
    child: _loadingOweru
        ? const _SkeletonGrid()
        : _oweru.isEmpty
            ? const _EmptyState(text: 'No Oweru packages yet')
            : _buildPropGrid(_oweru, badge: 'OWERU'),
  );

  Widget _buildCommercialSection() => _Section(
    bgColor: kBg2, tag: '💼 Business Spaces',
    title: 'Commercial ', titleEm: 'Properties',
    sub: 'Offices, retail spaces, warehouses, and industrial properties.',
    actionLabel: 'All Commercial', onAction: () {},
    child: _loadingCommercial
        ? const _SkeletonGrid(count: 4)
        : _commercial.isEmpty
            ? const _EmptyState(text: 'No commercial properties yet')
            : _buildPropGrid(_commercial.take(8).toList(), isCommercial: true),
  );

  // ── CTA ───────────────────────────────────────────────────────────────────
  Widget _buildCta() {
    const items = [
      'Verified landlords & agents', 'Secure payment processing',
      'Dedicated tenant support',    'Digital contract management',
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(height: 1, color: kBorder),
        Container(
          width: double.infinity,
          color: kBg,
          padding: const EdgeInsets.fromLTRB(20, 56, 20, 56),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                  color: kGoldDim, border: Border.all(color: kGoldBorder),
                  borderRadius: BorderRadius.circular(4)),
              child: const Text('GET STARTED',
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
                      letterSpacing: 2.5, color: kGold, fontFamily: 'Outfit')),
            ),
            const SizedBox(height: 14),
            RichText(text: const TextSpan(
              style: TextStyle(fontFamily: 'Georgia', fontSize: 32,
                  fontWeight: FontWeight.w300, height: 1.1, color: kCream),
              children: [
                TextSpan(text: 'Ready to Find Your\n'),
                TextSpan(text: 'Next Home?',
                    style: TextStyle(fontStyle: FontStyle.italic, color: kGold)),
              ],
            )),
            const SizedBox(height: 14),
            const Text(
              'Join thousands of Tanzanians who found their perfect rental through Oweru.',
              style: TextStyle(fontSize: 14, color: kSlate, height: 1.7, fontFamily: 'Outfit'),
            ),
            const SizedBox(height: 28),
            _GoldButton(label: 'Browse All Properties', icon: Icons.arrow_forward, onTap: () {}),
            const SizedBox(height: 28),
            ...items.map((item) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
              decoration: BoxDecoration(
                  color: kBg3, border: Border.all(color: kBorder),
                  borderRadius: BorderRadius.circular(10)),
              child: Row(children: [
                Container(width: 8, height: 8,
                    decoration: const BoxDecoration(color: kGold, shape: BoxShape.circle)),
                const SizedBox(width: 12),
                Expanded(child: Text(item,
                    style: const TextStyle(fontSize: 13, color: kCream, fontFamily: 'Outfit'))),
              ]),
            )),
          ]),
        ),
      ],
    );
  }

  // ── Property Grid (single column on mobile, 2-col on wider screens) ───────
  Widget _buildPropGrid(
    List<Map<String, dynamic>> items, {
    bool isCommercial = false,
    String? badge,
    String priceSuffix = '/mo',
    String actionLabel = 'View Details',
    void Function(Map<String, dynamic>)? onAction,
  }) {
    return LayoutBuilder(builder: (ctx, constraints) {
      final cols = constraints.maxWidth > 560 ? 2 : 1;
      final itemW = (constraints.maxWidth - (cols - 1) * 16) / cols;
      return Wrap(
        spacing: 16,
        runSpacing: 16,
        children: items.map((p) {
          return SizedBox(
            width: itemW,
            child: isCommercial
                ? _CommCard(property: p, onTap: () {})
                : _PropCard(
                    property: p,
                    priceSuffix: priceSuffix,
                    badge: badge,
                    onTap: () {},
                    actionLabel: actionLabel,
                    onAction: () => onAction?.call(p),
                  ),
          );
        }).toList(),
      );
    });
  }

  // ── Booking modal ─────────────────────────────────────────────────────────
  void _showBooking(Map<String, dynamic> property) {
    showDialog(
      context: context,
      barrierColor: const Color(0xE50A0F1E),
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 560),
          decoration: BoxDecoration(
            color: kBg3, border: Border.all(color: kBorder),
            borderRadius: BorderRadius.circular(20),
          ),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: _BookingForm(property: property, onClose: () => Navigator.pop(context)),
          ),
        ),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION WRAPPER
// ════════════════════════════════════════════════════════════════════════════
class _Section extends StatelessWidget {
  final Color bgColor;
  final String tag, title, titleEm;
  final String? sub, actionLabel;
  final VoidCallback? onAction;
  final Widget child;

  const _Section({
    required this.bgColor,
    required this.tag,
    required this.title,
    required this.titleEm,
    this.sub,
    this.actionLabel,
    this.onAction,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Full-width gold divider line
        Container(height: 1, color: kBorder),
        // Section body
        Container(
          width: double.infinity,
          color: bgColor,
          padding: const EdgeInsets.fromLTRB(20, 52, 20, 52),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                        color: kGoldDim,
                        border: Border.all(color: kGoldBorder),
                        borderRadius: BorderRadius.circular(4)),
                    child: Text(tag.toUpperCase(),
                        style: const TextStyle(
                            fontSize: 9, fontWeight: FontWeight.w700,
                            letterSpacing: 2.0, color: kGold, fontFamily: 'Outfit')),
                  ),
                  const SizedBox(height: 10),
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(
                          fontFamily: 'Georgia', fontSize: 34,
                          fontWeight: FontWeight.w300, color: kCream, height: 1.1),
                      children: [
                        TextSpan(text: title),
                        TextSpan(
                            text: titleEm,
                            style: const TextStyle(
                                fontStyle: FontStyle.italic, color: kGold)),
                      ],
                    ),
                  ),
                  if (sub != null) ...[
                    const SizedBox(height: 8),
                    Text(sub!,
                        style: const TextStyle(
                            fontSize: 13, color: kSlate,
                            height: 1.6, fontFamily: 'Outfit')),
                  ],
                ]),
              ),
              if (actionLabel != null && onAction != null) ...[
                const SizedBox(width: 12),
                _GhostButtonSmall(label: actionLabel!, onTap: onAction!),
              ],
            ]),
            const SizedBox(height: 36),
            child,
          ]),
        ),
      ],
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PROPERTY CARD
// ════════════════════════════════════════════════════════════════════════════
class _PropCard extends StatelessWidget {
  final Map<String, dynamic> property;
  final String priceSuffix;
  final String? badge;
  final VoidCallback onTap, onAction;
  final String actionLabel;

  const _PropCard({
    required this.property,
    required this.priceSuffix,
    required this.onTap,
    required this.actionLabel,
    required this.onAction,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    final p      = property;
    final imgUrl = getImage(p);
    final price  = num.tryParse(p['price']?.toString() ?? '0') ?? 0;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
            color: kBg3, border: Border.all(color: kBorder),
            borderRadius: BorderRadius.circular(14)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Image
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            child: Stack(children: [
              SizedBox(
                height: 180,
                width: double.infinity,
                child: Image.network(imgUrl, fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => Container(
                        color: kBg2,
                        child: Center(child: Icon(Icons.home, color: kGold.withOpacity(0.4), size: 36)))),
              ),
              Positioned.fill(child: Container(
                  decoration: BoxDecoration(
                      gradient: LinearGradient(
                          begin: Alignment.topCenter, end: Alignment.bottomCenter,
                          colors: [Colors.transparent, kBg.withOpacity(0.6)])))),
              if (p['featured'] == true || p['featured'] == 1)
                Positioned(top: 10, left: 10,
                    child: _Badge(label: 'Featured', bg: kGold, fg: kBg)),
              if (badge != null)
                Positioned(top: 10, right: 10,
                    child: _Badge(label: badge!, bg: kGoldDim, fg: kGold, bordered: true)),
            ]),
          ),
          // Body
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (p['type'] != null)
                Text((p['type'] ?? '').toString().toUpperCase(),
                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
                        letterSpacing: 0.2, color: kGold, fontFamily: 'Outfit')),
              const SizedBox(height: 5),
              Text(p['title'] ?? 'Untitled',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
                      color: kCream, fontFamily: 'Outfit'),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 5),
              Row(children: [
                Icon(Icons.location_on, size: 10, color: kGold),
                const SizedBox(width: 4),
                Expanded(child: Text(p['location'] ?? p['address'] ?? 'Tanzania',
                    style: const TextStyle(fontSize: 11, color: kSlate, fontFamily: 'Outfit'),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
              ]),
              const SizedBox(height: 10),
              Row(children: [
                Text(fmtPrice(price),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600,
                        color: kGold, fontFamily: 'Georgia')),
                const SizedBox(width: 4),
                Text(priceSuffix,
                    style: const TextStyle(fontSize: 10, color: kSlate, fontFamily: 'Outfit')),
              ]),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: onAction,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 11),
                  decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [kGold, kGoldLight]),
                      borderRadius: BorderRadius.circular(8)),
                  child: Center(child: Text(actionLabel.toUpperCase(),
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                          letterSpacing: 0.08, color: kBg, fontFamily: 'Outfit'))),
                ),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMMERCIAL CARD
// ════════════════════════════════════════════════════════════════════════════
class _CommCard extends StatelessWidget {
  final Map<String, dynamic> property;
  final VoidCallback onTap;
  const _CommCard({required this.property, required this.onTap});

  static const _typeColors = {
    'office': Color(0xFF22D3EE), 'retail': Color(0xFFF472B6),
    'warehouse': Color(0xFFFB923C), 'commercial': Color(0xFFA78BFA),
    'industrial': Color(0xFF818CF8),
  };
  static const _statusDots = {
    'active': Color(0xFF10B981), 'pending': Color(0xFFF59E0B),
    'inactive': Color(0xFF64748B),
  };

  @override
  Widget build(BuildContext context) {
    final p        = property;
    final imgUrl   = getImage(p);
    final type     = p['type']?.toString().toLowerCase() ?? '';
    final tc       = _typeColors[type] ?? kGold;
    final status   = p['status']?.toString() ?? 'active';
    final dotColor = _statusDots[status] ?? _statusDots['inactive']!;
    final price    = num.tryParse(p['price']?.toString() ?? '0') ?? 0;
    final pt       = p['price_type']?.toString() ?? '';
    final sfx      = pt == 'yearly' ? '/yr' : pt == 'sale' ? '' : '/mo';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
            color: kBg3, border: Border.all(color: kBorder),
            borderRadius: BorderRadius.circular(14)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            child: Stack(children: [
              SizedBox(
                height: 180, width: double.infinity,
                child: Image.network(imgUrl, fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => Container(
                        color: kBg2,
                        child: const Center(child: Icon(Icons.business, color: kGold, size: 36)))),
              ),
              Positioned.fill(child: Container(
                  decoration: BoxDecoration(
                      gradient: LinearGradient(
                          begin: Alignment.topCenter, end: Alignment.bottomCenter,
                          colors: [Colors.transparent, kBg.withOpacity(0.6)])))),
              // Type badge
              Positioned(top: 10, right: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                        color: tc.withOpacity(0.13),
                        border: Border.all(color: tc.withOpacity(0.33)),
                        borderRadius: BorderRadius.circular(6)),
                    child: Text(commercialTypeLabel(p['type']).toUpperCase(),
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
                            letterSpacing: 0.1, color: tc, fontFamily: 'Outfit')),
                  )),
              // Status badge
              Positioned(top: 10, left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                        color: const Color(0xB8080E1A),
                        border: Border.all(color: Colors.white.withOpacity(0.07)),
                        borderRadius: BorderRadius.circular(20)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(width: 6, height: 6,
                          decoration: BoxDecoration(
                              color: dotColor, shape: BoxShape.circle,
                              boxShadow: [BoxShadow(color: dotColor, blurRadius: 5)])),
                      const SizedBox(width: 5),
                      Text(
                        status == 'active' ? 'AVAILABLE'
                            : status == 'pending' ? 'PENDING'
                            : status.toUpperCase(),
                        style: const TextStyle(color: Color(0xFFE2E8F0),
                            fontSize: 9, fontWeight: FontWeight.w700,
                            letterSpacing: 0.1, fontFamily: 'Outfit'),
                      ),
                    ]),
                  )),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(commercialTypeLabel(p['type']).toUpperCase(),
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
                      letterSpacing: 0.2, color: tc, fontFamily: 'Outfit')),
              const SizedBox(height: 5),
              Text(p['title'] ?? 'Untitled',
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
                      color: kCream, fontFamily: 'Outfit')),
              const SizedBox(height: 5),
              Row(children: [
                Icon(Icons.location_on, size: 10, color: kGold),
                const SizedBox(width: 4),
                Expanded(child: Text(p['location'] ?? p['address'] ?? 'Tanzania',
                    maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: kSlate, fontFamily: 'Outfit'))),
              ]),
              if (p['area'] != null || (p['parking_spaces'] ?? 0) > 0 || p['furnished'] == true) ...[
                const SizedBox(height: 8),
                Wrap(spacing: 5, runSpacing: 5, children: [
                  if (p['area'] != null) _FeatTag(label: '${p['area']} m²'),
                  if ((p['parking_spaces'] ?? 0) > 0) _FeatTag(label: '${p['parking_spaces']} Parking'),
                  if (p['furnished'] == true) _FeatTag(label: 'Furnished', color: const Color(0xFF10B981)),
                ]),
              ],
              const SizedBox(height: 10),
              Row(children: [
                Text(fmtPrice(price),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600,
                        color: kGold, fontFamily: 'Georgia')),
                const SizedBox(width: 4),
                Text(sfx, style: const TextStyle(fontSize: 10, color: kSlate, fontFamily: 'Outfit')),
              ]),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: onTap,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 11),
                  decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [kGold, kGoldLight]),
                      borderRadius: BorderRadius.circular(8)),
                  child: const Center(child: Text('VIEW DETAILS',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                          letterSpacing: 0.08, color: kBg, fontFamily: 'Outfit'))),
                ),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SMALL REUSABLE WIDGETS
// ════════════════════════════════════════════════════════════════════════════
class _Badge extends StatelessWidget {
  final String label;
  final Color bg, fg;
  final bool bordered;
  const _Badge({required this.label, required this.bg, required this.fg, this.bordered = false});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
    decoration: BoxDecoration(
        color: bg,
        border: bordered ? Border.all(color: kGoldBorder) : null,
        borderRadius: BorderRadius.circular(6)),
    child: Text(label,
        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: fg, fontFamily: 'Outfit')),
  );
}

class _FeatTag extends StatelessWidget {
  final String label;
  final Color? color;
  const _FeatTag({required this.label, this.color});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
    decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        border: Border.all(
            color: color != null ? color!.withOpacity(0.3) : Colors.white.withOpacity(0.07)),
        borderRadius: BorderRadius.circular(5)),
    child: Text(label,
        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600,
            color: color ?? kSlate, fontFamily: 'Outfit')),
  );
}

class _BlinkDot extends StatefulWidget {
  @override
  State<_BlinkDot> createState() => _BlinkDotState();
}
class _BlinkDotState extends State<_BlinkDot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
  }
  @override void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: Tween(begin: 0.3, end: 1.0).animate(_ctrl),
    child: Container(width: 6, height: 6,
        decoration: const BoxDecoration(color: Color(0xFF4ADE80), shape: BoxShape.circle)),
  );
}

class _GoldButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  const _GoldButton({required this.label, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
      decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [kGold, kGoldLight]),
          borderRadius: BorderRadius.circular(10),
          boxShadow: const [BoxShadow(color: Color(0x4DC89128), blurRadius: 24, offset: Offset(0, 6))]),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
            letterSpacing: 0.8, color: kBg, fontFamily: 'Outfit')),
        const SizedBox(width: 8),
        Icon(icon, size: 14, color: kBg),
      ]),
    ),
  );
}

class _GhostButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  const _GhostButton({required this.label, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
      decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          border: Border.all(color: Colors.white.withOpacity(0.12)),
          borderRadius: BorderRadius.circular(10)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
            color: kCream, fontFamily: 'Outfit')),
        const SizedBox(width: 8),
        Icon(icon, size: 14, color: kCream),
      ]),
    ),
  );
}

class _GhostButtonSmall extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _GhostButtonSmall({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
      decoration: BoxDecoration(
          border: Border.all(color: kGoldBorder), borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
          color: kGold, letterSpacing: 0.8, fontFamily: 'Outfit')),
    ),
  );
}

class _TrustBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  const _TrustBadge({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Icon(icon, size: 12, color: kGold),
    const SizedBox(width: 6),
    Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500,
        color: Color(0x80F1F5F9), fontFamily: 'Outfit')),
  ]);
}

class _ScrollChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _ScrollChip({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 9),
      child: Text(label, style: const TextStyle(fontSize: 12, color: kSlate,
          fontWeight: FontWeight.w500, fontFamily: 'Outfit')),
    ),
  );
}

class _SearchInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final VoidCallback onSubmit;
  const _SearchInput({required this.controller, required this.hint, required this.onSubmit});

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    style: const TextStyle(color: kCream, fontSize: 13, fontFamily: 'Outfit'),
    onSubmitted: (_) => onSubmit(),
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: kSlateDim, fontSize: 13),
      filled: true, fillColor: const Color(0xCC0A0F1E),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      border:        OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kBorder)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kBorder)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kGold)),
      suffixIcon: ValueListenableBuilder(
        valueListenable: controller,
        builder: (_, val, _) => val.text.isNotEmpty
            ? IconButton(icon: const Icon(Icons.close, size: 13, color: kSlate), onPressed: () => controller.clear())
            : const SizedBox.shrink(),
      ),
    ),
  );
}

class _DropdownField extends StatelessWidget {
  final String value;
  final Map<String, String> items;
  final ValueChanged<String?> onChanged;
  const _DropdownField({required this.value, required this.items, required this.onChanged});

  @override
  Widget build(BuildContext context) => DropdownButtonFormField<String>(
    initialValue: value,
    dropdownColor: kBg2,
    style: const TextStyle(color: kCream, fontSize: 13, fontFamily: 'Outfit'),
    decoration: InputDecoration(
      filled: true, fillColor: const Color(0xCC0A0F1E),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      border:        OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kBorder)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kBorder)),
    ),
    icon: const Icon(Icons.keyboard_arrow_down, color: kSlate),
    items: items.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
    onChanged: onChanged,
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SKELETON GRID
// ════════════════════════════════════════════════════════════════════════════
class _SkeletonGrid extends StatefulWidget {
  final int count;
  const _SkeletonGrid({this.count = 3});
  @override State<_SkeletonGrid> createState() => _SkeletonGridState();
}
class _SkeletonGridState extends State<_SkeletonGrid> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))..repeat(reverse: true);
  }
  @override void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (ctx, constraints) {
    final cols  = constraints.maxWidth > 560 ? 2 : 1;
    final itemW = (constraints.maxWidth - (cols - 1) * 16) / cols;
    return FadeTransition(
      opacity: Tween(begin: 0.4, end: 0.85).animate(_ctrl),
      child: Wrap(
        spacing: 16, runSpacing: 16,
        children: List.generate(widget.count, (i) => Container(
          width: itemW, height: 300,
          decoration: BoxDecoration(
              color: kBg3, border: Border.all(color: kBorder),
              borderRadius: BorderRadius.circular(14)),
        )),
      ),
    );
  });
}

// ════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ════════════════════════════════════════════════════════════════════════════
class _EmptyState extends StatelessWidget {
  final String text;
  const _EmptyState({required this.text});

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(children: [
        const Icon(Icons.business, size: 36, color: Color(0x59C89128)),
        const SizedBox(height: 14),
        Text(text, style: const TextStyle(fontSize: 16, color: kCream, fontFamily: 'Outfit')),
      ]),
    ),
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BOOKING FORM
// ════════════════════════════════════════════════════════════════════════════
class _BookingForm extends StatefulWidget {
  final Map<String, dynamic> property;
  final VoidCallback onClose;
  const _BookingForm({required this.property, required this.onClose});
  @override State<_BookingForm> createState() => _BookingFormState();
}
class _BookingFormState extends State<_BookingForm> {
  final _nameCtrl  = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _reqCtrl   = TextEditingController();
  DateTime? _checkIn, _checkOut;
  bool _loading = false;

  @override void dispose() {
    _nameCtrl.dispose(); _emailCtrl.dispose();
    _phoneCtrl.dispose(); _reqCtrl.dispose();
    super.dispose();
  }

  int get _nights {
    if (_checkIn == null || _checkOut == null) return 0;
    return _checkOut!.difference(_checkIn!).inDays;
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      final price = num.tryParse(widget.property['price']?.toString() ?? '0') ?? 0;
      final res = await http.post(
        Uri.parse('$kApiBase/api/public/bnb/book'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'property_id': widget.property['id'],
          'customer_name': _nameCtrl.text,
          'customer_email': _emailCtrl.text,
          'customer_phone': _phoneCtrl.text,
          'check_in':  _checkIn?.toIso8601String(),
          'check_out': _checkOut?.toIso8601String(),
          'special_requests': _reqCtrl.text,
          'total_amount': _nights * price,
          'status': 'pending',
        }),
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        widget.onClose();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Booking submitted! The owner will contact you soon.')));
        }
      } else {
        final d = jsonDecode(res.body);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(d['message'] ?? 'Booking failed')));
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Network error.')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  InputDecoration _inp(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: kSlateDim, fontSize: 13),
    filled: true, fillColor: kBg,
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    border:        OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGoldBorder)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGoldBorder)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGold)),
  );

  Widget _datePicker(String label, DateTime? value, VoidCallback onTap) =>
      GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
          decoration: BoxDecoration(
              color: kBg, border: Border.all(color: kGoldBorder),
              borderRadius: BorderRadius.circular(8)),
          child: Text(
            value == null ? label : '${value.day}/${value.month}/${value.year}',
            style: TextStyle(fontSize: 13, fontFamily: 'Outfit',
                color: value == null ? kSlateDim : kCream),
          ),
        ),
      );

  Future<DateTime?> _pickDate(DateTime first) => showDatePicker(
    context: context,
    initialDate: first,
    firstDate: first,
    lastDate: DateTime.now().add(const Duration(days: 365)),
    builder: (ctx, child) => Theme(
      data: ThemeData.dark().copyWith(
          colorScheme: const ColorScheme.dark(primary: kGold, surface: kBg2)),
      child: child!,
    ),
  );

  @override
  Widget build(BuildContext context) {
    final price = num.tryParse(widget.property['price']?.toString() ?? '0') ?? 0;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Book ${widget.property['title'] ?? ''}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700,
                  color: kCream, fontFamily: 'Outfit')),
          const SizedBox(height: 4),
          Text(widget.property['location'] ?? '',
              style: const TextStyle(fontSize: 12, color: kSlate, fontFamily: 'Outfit')),
        ])),
        IconButton(onPressed: widget.onClose, icon: const Icon(Icons.close, color: kSlate)),
      ]),
      const SizedBox(height: 16),
      TextField(controller: _nameCtrl,
          style: const TextStyle(color: kCream, fontSize: 13, fontFamily: 'Outfit'),
          decoration: _inp('Your name')),
      const SizedBox(height: 10),
      TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: kCream, fontSize: 13, fontFamily: 'Outfit'),
          decoration: _inp('Email')),
      const SizedBox(height: 10),
      TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone,
          style: const TextStyle(color: kCream, fontSize: 13, fontFamily: 'Outfit'),
          decoration: _inp('Phone')),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(child: _datePicker('Check-in', _checkIn, () async {
          final d = await _pickDate(DateTime.now());
          if (d != null) setState(() => _checkIn = d);
        })),
        const SizedBox(width: 8),
        Expanded(child: _datePicker('Check-out', _checkOut, () async {
          final d = await _pickDate(_checkIn ?? DateTime.now());
          if (d != null) setState(() => _checkOut = d);
        })),
      ]),
      const SizedBox(height: 10),
      TextField(controller: _reqCtrl, maxLines: 3,
          style: const TextStyle(color: kCream, fontSize: 13, fontFamily: 'Outfit'),
          decoration: _inp('Special requests (optional)')),
      if (_nights > 0) ...[
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
              color: const Color(0x14C89128),
              border: Border.all(color: kGoldBorder),
              borderRadius: BorderRadius.circular(8)),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(fmtPrice(_nights * price),
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700,
                    color: kGold, fontFamily: 'Outfit')),
            Text('$_nights nights',
                style: const TextStyle(fontSize: 12, color: kSlate, fontFamily: 'Outfit')),
          ]),
        ),
      ],
      const SizedBox(height: 14),
      Row(children: [
        Expanded(child: GestureDetector(
          onTap: widget.onClose,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
                border: Border.all(color: kGoldBorder), borderRadius: BorderRadius.circular(8)),
            child: const Text('Cancel', textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: kSlate, fontFamily: 'Outfit')),
          ),
        )),
        const SizedBox(width: 8),
        Expanded(flex: 2, child: GestureDetector(
          onTap: _loading ? null : _submit,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [kGold, kGoldLight]),
                borderRadius: BorderRadius.circular(8)),
            child: Text(_loading ? 'Submitting…' : 'Book Now',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                    color: kBg, fontFamily: 'Outfit')),
          ),
        )),
      ]),
    ]);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GRID PAINTER
// ════════════════════════════════════════════════════════════════════════════
class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0x08C89128)..strokeWidth = 1;
    const step = 60.0;
    for (double x = 0; x < size.width;  x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }
  @override bool shouldRepaint(_) => false;
}