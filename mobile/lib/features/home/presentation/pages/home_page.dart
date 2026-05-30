import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../shared/widgets/app_navbar.dart';
import '../../../shared/pages/public_property_detail_page.dart';

// ── Constants ────────────────────────────────────────────────────────────────
const String kApiBase     = 'https://rental.oweru.com/api';
const String kStorageBase = 'https://rental.oweru.com';

// Palette: white + slate-800
const Color kWhite      = Color(0xFFFFFFFF);
const Color kBg         = Color(0xFFF8FAFC); // off-white page bg
const Color kSurface    = Color(0xFFFFFFFF); // card bg
const Color kSlate800   = Color(0xFF1E293B); // primary text / hero bg
const Color kSlate600   = Color(0xFF475569); // secondary text
const Color kSlate400   = Color(0xFF94A3B8); // muted / hints
const Color kSlate200   = Color(0xFFE2E8F0); // borders / dividers
const Color kSlate100   = Color(0xFFF1F5F9); // subtle surface
const Color kAccent     = Color(0xFF1E293B); // same as slate-800, used for buttons
const Color kGreen      = Color(0xFF10B981); // available dot

const List<String> kCommercialTypes = [
  'office', 'retail', 'warehouse', 'commercial', 'industrial'
];

// ── Helpers ───────────────────────────────────────────────────────────────────
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

List<Map<String, dynamic>> _extractPropertyList(dynamic payload) {
  if (payload is List) {
    return payload.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }
  if (payload is Map<String, dynamic>) {
    final data = payload['data'];
    if (data is List) {
      return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    if (data is Map<String, dynamic>) {
      final nested = data['data'];
      if (nested is List) {
        return nested.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      }
    }
  }
  return [];
}

// ── Data fetching ─────────────────────────────────────────────────────────────
Future<List<Map<String, dynamic>>> fetchResidential() async {
  try {
    final r = await http.get(
        Uri.parse('$kApiBase/public/properties?per_page=12'),
        headers: {'Accept': 'application/json'});
    if (r.statusCode == 200) {
      final d = jsonDecode(r.body);
      final raw = _extractPropertyList(d);
      return raw
          .where((p) => !kCommercialTypes.contains(p['type']?.toString().toLowerCase()))
          .toList();
    }
  } catch (e) { debugPrint('fetchResidential error: $e'); }
  return [];
}

Future<List<Map<String, dynamic>>> fetchBnb() async {
  try {
    final r = await http.get(Uri.parse('$kApiBase/public/bnb'),
        headers: {'Accept': 'application/json'});
    if (r.statusCode == 200) return _extractPropertyList(jsonDecode(r.body));
  } catch (e) { debugPrint('fetchBnb error: $e'); }
  return [];
}

Future<List<Map<String, dynamic>>> fetchOweru() async {
  try {
    final r = await http.get(
        Uri.parse('$kApiBase/public/properties?type=oweru_rental&per_page=8'),
        headers: {'Accept': 'application/json'});
    if (r.statusCode == 200) return _extractPropertyList(jsonDecode(r.body));
  } catch (e) { debugPrint('fetchOweru error: $e'); }
  return [];
}

Future<List<Map<String, dynamic>>> fetchCommercial() async {
  try {
    final r = await http.get(
        Uri.parse('$kApiBase/public/properties?per_page=12'),
        headers: {'Accept': 'application/json'});
    if (r.statusCode == 200) {
      final raw = _extractPropertyList(jsonDecode(r.body));
      return raw
          .where((p) => kCommercialTypes.contains(p['type']?.toString().toLowerCase()))
          .toList();
    }
  } catch (e) { debugPrint('fetchCommercial error: $e'); }
  return [];
}

// ═════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ═════════════════════════════════════════════════════════════════════════════
class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override State<HomePage> createState() => _HomePageState();
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

  final _searchCtrl     = TextEditingController();
  String _searchSection = 'all';
  String _priceRange    = '';
  bool   _searchActive  = false;

  final ScrollController _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final res = await fetchResidential();
    if (mounted) setState(() { _residential = res; _loadingResidential = false; });
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
              _buildCategoryBar(),
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

  // ── HERO ───────────────────────────────────────────────────────────────────
  Widget _buildHero() {
    return Container(
      color: kSlate800,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 48, 24, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Eyebrow
              Row(children: [
                _LiveDot(),
                const SizedBox(width: 8),
                const Text(
                  "Africa's Premier Rental Platform",
                  style: TextStyle(
                    fontSize: 11, letterSpacing: 1.6,
                    fontWeight: FontWeight.w500, color: kSlate400),
                ),
              ]),
              const SizedBox(height: 28),
              // Headline
             
              const SizedBox(height: 16),
              const Text(
                'Residential, commercial, and short-stay\nlistings across Africa — all in one place.',
                style: TextStyle(
                    fontSize: 14, height: 1.65,
                    color: kSlate400, fontWeight: FontWeight.w400),
              ),
              const SizedBox(height: 32),
              // CTA buttons
             
              const SizedBox(height: 40),
              // Trust chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
               
              ),
              const SizedBox(height: 40),
              // Search card
              _buildSearchCard(),
              const SizedBox(height: 0),
            ],
          ),
        ),
      ),
    );
  }

  // ── SEARCH CARD ─────────────────────────────────────────────────────────────
  Widget _buildSearchCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 24, offset: const Offset(0, -4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Search Properties',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: kSlate800)),
          const SizedBox(height: 4),
          const Text('Filter by location, category, or budget',
              style: TextStyle(fontSize: 12, color: kSlate400)),
          const SizedBox(height: 16),
          _CleanSearchInput(
            controller: _searchCtrl,
            hint: 'Location or property name…',
            onSubmit: _doSearch,
          ),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _CleanDropdown(
              value: _searchSection,
              items: const {
                'all': 'All Categories',
                'residential': 'Residential',
                'bnb': 'Short Stay',
                'commercial': 'Commercial',
                'oweru': 'Oweru Special',
              },
              onChanged: (v) => setState(() => _searchSection = v!),
            )),
            const SizedBox(width: 10),
            Expanded(child: _CleanDropdown(
              value: _priceRange.isEmpty ? '' : _priceRange,
              items: const {
                '': 'Any Price',
                '0-500': 'Under 500K',
                '500-1000': '500K – 1M',
                '1000+': 'Above 1M',
              },
              onChanged: (v) => setState(() => _priceRange = v ?? ''),
            )),
          ]),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: GestureDetector(
              onTap: _doSearch,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: kSlate800,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.search, size: 15, color: kWhite),
                    SizedBox(width: 8),
                    Text('Search',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                            letterSpacing: 0.8, color: kWhite)),
                  ],
                ),
              ),
            ),
          ),
          if (_searchCtrl.text.isNotEmpty || _searchSection != 'all' || _priceRange.isNotEmpty)
            Center(
              child: TextButton(
                onPressed: _clearSearch,
                child: const Text('Clear filters',
                    style: TextStyle(fontSize: 12, color: kSlate400)),
              ),
            ),
        ],
      ),
    );
  }

  // ── STATS BAR ──────────────────────────────────────────────────────────────
  Widget _buildStatsBar() {
    const stats = [
      
    ];
    return Container(
      color: kSlate800,
      child: Row(
        children: stats.asMap().entries.map((e) {
          final isLast = e.key == stats.length - 1;
          return Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
              decoration: BoxDecoration(
                border: Border(
                  right: isLast ? BorderSide.none : const BorderSide(color: Color(0xFF2D3748), width: 1),
                ),
              ),
              child: Column(children: [
                Text(e.value.$1,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700,
                        color: kWhite, letterSpacing: -0.5)),
                const SizedBox(height: 3),
                Text(e.value.$2,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 9, letterSpacing: 0.8,
                        fontWeight: FontWeight.w500, color: kSlate400)),
              ]),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ── CATEGORY QUICK-LINKS ──────────────────────────────────────────────────
  Widget _buildCategoryBar() {
    const cats = [
      ];
    return Container(
      color: kWhite,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      child: Row(
        children: cats.map((c) => Expanded(
          child: Column(children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: kSlate100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(c.$1, size: 20, color: kSlate800),
            ),
            const SizedBox(height: 6),
            Text(c.$2,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600,
                    color: kSlate600, letterSpacing: 0.3)),
          ]),
        )).toList(),
      ),
    );
  }

  // ── SEARCH RESULTS ─────────────────────────────────────────────────────────
  Widget _buildSearchResults() {
    final results = _filtered;
    return Container(
      color: kBg,
      padding: const EdgeInsets.fromLTRB(20, 32, 20, 48),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('RESULTS',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                    letterSpacing: 2.5, color: kSlate400)),
            const SizedBox(height: 4),
            Text('${results.length} propert${results.length != 1 ? 'ies' : 'y'} found',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700,
                    color: kSlate800, letterSpacing: -0.5)),
          ])),
          GestureDetector(
            onTap: _clearSearch,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                border: Border.all(color: kSlate200),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(children: [
                Icon(Icons.close, size: 12, color: kSlate600),
                SizedBox(width: 5),
                Text('Clear', style: TextStyle(fontSize: 12, color: kSlate600)),
              ]),
            ),
          ),
        ]),
        const SizedBox(height: 24),
        results.isEmpty ? _buildEmptySearch() : _buildPropGrid(results),
      ]),
    );
  }

  Widget _buildEmptySearch() => Center(
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 56),
      child: Column(children: [
        Container(
          width: 72, height: 72,
          decoration: BoxDecoration(color: kSlate100, shape: BoxShape.circle),
          child: const Icon(Icons.search_off, size: 32, color: kSlate400),
        ),
        const SizedBox(height: 16),
        const Text('No properties found',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: kSlate800)),
        const SizedBox(height: 6),
        const Text('Try a different location or adjust filters.',
            style: TextStyle(fontSize: 13, color: kSlate400)),
        const SizedBox(height: 20),
        GestureDetector(
          onTap: _clearSearch,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              border: Border.all(color: kSlate200),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text('Clear filters',
                style: TextStyle(fontSize: 13, color: kSlate800, fontWeight: FontWeight.w500)),
          ),
        ),
      ]),
    ),
  );

  // ── SECTIONS ───────────────────────────────────────────────────────────────
  Widget _buildResidentialSection() => _Section(
    tag: 'Residential',
    title: 'Popular Properties',
    sub: 'Apartments, houses and studios across Africa.',
    actionLabel: 'View All', onAction: () {},
    child: _loadingResidential
        ? const _SkeletonGrid()
        : _residential.isEmpty
            ? const _EmptyState(icon: Icons.home_outlined, text: 'No residential listings yet')
            : _buildPropGrid(_residential.take(6).toList(), onAction: (p) => _navigateToProperty(p)),
  );

  Widget _buildBnbSection() => _Section(
    bgColor: kSlate800,
    dark: true,
    tag: 'Short Stay',
    title: 'Vacation Rentals',
    sub: 'Book by the night — fully furnished and ready.',
    child: _loadingBnb
        ? const _SkeletonGrid(dark: true)
        : _bnb.isEmpty
            ? const _EmptyState(icon: Icons.king_bed_outlined, text: 'No short-stay listings yet', dark: true)
            : _buildPropGrid(_bnb, priceSuffix: '/night',
                onAction: (p) => _showBooking(p)),
  );

  Widget _buildOweruSection() => _Section(
    tag: 'Oweru Special',
    title: 'Exclusive Packages',
    sub: 'Curated deals managed directly by Oweru.',
    child: _loadingOweru
        ? const _SkeletonGrid()
        : _oweru.isEmpty
            ? const _EmptyState(icon: Icons.star_border, text: 'No Oweru packages yet')
            : _buildPropGrid(_oweru, badge: 'OWERU', onAction: (p) => _navigateToProperty(p)),
  );

  Widget _buildCommercialSection() => _Section(
    bgColor: kSlate800,
    dark: true,
    tag: 'Commercial',
    title: 'Business Spaces',
    sub: 'Offices, retail, warehouses and industrial units.',
    actionLabel: 'All Commercial', onAction: () {},
    child: _loadingCommercial
        ? const _SkeletonGrid(count: 4, dark: true)
        : _commercial.isEmpty
            ? const _EmptyState(icon: Icons.business_outlined, text: 'No commercial listings yet', dark: true)
            : _buildPropGrid(_commercial.take(8).toList(), isCommercial: true),
  );

  // ── CTA ────────────────────────────────────────────────────────────────────
  Widget _buildCta() {
    return Container(
      color: kBg,
      padding: const EdgeInsets.fromLTRB(24, 56, 24, 56),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('READY?',
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                letterSpacing: 3.0, color: kSlate400)),
        const SizedBox(height: 12),
        const Text(
          'Find Your\nNext Home.',
          style: TextStyle(
              fontSize: 38, fontWeight: FontWeight.w700, height: 1.1,
              letterSpacing: -1.2, color: kSlate800),
        ),
        const SizedBox(height: 12),
        const Text(
          'Join thousands of Africans who found their perfect rental through Oweru.',
          style: TextStyle(fontSize: 14, color: kSlate600, height: 1.65),
        ),
        const SizedBox(height: 28),
        _SolidButton(label: 'Browse All Properties', onTap: () {}),
        const SizedBox(height: 32),
        const Divider(color: kSlate200),
        const SizedBox(height: 24),
        ...const [
          'Verified landlords & agents',
          'Secure payment processing',
          'Dedicated tenant support',
          'Digital contract management',
        ].map((item) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(children: [
            const Icon(Icons.check_circle_outline, size: 16, color: kSlate800),
            const SizedBox(width: 12),
            Text(item, style: const TextStyle(fontSize: 14, color: kSlate700)),
          ]),
        )),
      ]),
    );
  }

  // ── Property Grid ──────────────────────────────────────────────────────────
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
      final itemW = (constraints.maxWidth - (cols - 1) * 14) / cols;
      return Wrap(
        spacing: 14,
        runSpacing: 14,
        children: items.map((p) {
          return SizedBox(
            width: itemW,
            child: isCommercial
                ? _CommCard(property: p, onTap: () => _navigateToProperty(p))
                : _PropCard(
                    property: p,
                    priceSuffix: priceSuffix,
                    badge: badge,
                    onTap: () => _navigateToProperty(p),
                    actionLabel: actionLabel,
                    onAction: () => onAction?.call(p),
                  ),
          );
        }).toList(),
      );
    });
  }

  void _navigateToProperty(Map<String, dynamic> property) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => PublicPropertyDetailPage(property: property)),
    );
  }

  void _showBooking(Map<String, dynamic> property) {
    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.5),
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 560),
          decoration: BoxDecoration(
            color: kWhite,
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

// ═════════════════════════════════════════════════════════════════════════════
// SECTION WRAPPER
// ═════════════════════════════════════════════════════════════════════════════
class _Section extends StatelessWidget {
  final Color? bgColor;
  final bool dark;
  final String tag, title;
  final String? sub, actionLabel;
  final VoidCallback? onAction;
  final Widget child;

  const _Section({
    this.bgColor,
    this.dark = false,
    required this.tag,
    required this.title,
    this.sub,
    this.actionLabel,
    this.onAction,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final bg       = bgColor ?? kWhite;
    final textClr  = dark ? kWhite  : kSlate800;
    final subClr   = dark ? kSlate400 : kSlate600;
    final tagClr   = dark ? kSlate400 : kSlate400;

    return Container(
      color: bg,
      padding: const EdgeInsets.fromLTRB(20, 48, 20, 48),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(tag.toUpperCase(),
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                    letterSpacing: 2.5, color: tagClr)),
            const SizedBox(height: 8),
            Text(title,
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700,
                    letterSpacing: -0.8, height: 1.1, color: textClr)),
            if (sub != null) ...[
              const SizedBox(height: 6),
              Text(sub!, style: TextStyle(fontSize: 13, color: subClr, height: 1.6)),
            ],
          ])),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(width: 12),
            GestureDetector(
              onTap: onAction,
              child: Row(children: [
                Text(actionLabel!,
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                        color: dark ? kWhite : kSlate800)),
                const SizedBox(width: 4),
                Icon(Icons.arrow_forward, size: 13,
                    color: dark ? kWhite : kSlate800),
              ]),
            ),
          ],
        ]),
        const SizedBox(height: 28),
        child,
      ]),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// PROPERTY CARD
// ═════════════════════════════════════════════════════════════════════════════
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
          color: kSurface,
          border: Border.all(color: kSlate200),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Image
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
            child: Stack(children: [
              SizedBox(
                height: 175,
                width: double.infinity,
                child: imgUrl.isNotEmpty
                    ? Image.network(imgUrl, fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => _ImgPlaceholder(Icons.home_outlined))
                    : _ImgPlaceholder(Icons.home_outlined),
              ),
              if (p['featured'] == true || p['featured'] == 1)
                Positioned(top: 10, left: 10,
                    child: _Chip(label: 'Featured', bg: kSlate800, fg: kWhite)),
              if (badge != null)
                Positioned(top: 10, right: 10,
                    child: _Chip(label: badge!, bg: kWhite, fg: kSlate800)),
            ]),
          ),
          // Body
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (p['type'] != null)
                Text((p['type'] ?? '').toString().toUpperCase(),
                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
                        letterSpacing: 1.5, color: kSlate400)),
              const SizedBox(height: 4),
              Text(p['title'] ?? 'Untitled',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: kSlate800),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 4),
              Row(children: [
                const Icon(Icons.location_on_outlined, size: 11, color: kSlate400),
                const SizedBox(width: 3),
                Expanded(child: Text(p['location'] ?? p['address'] ?? 'Africa',
                    style: const TextStyle(fontSize: 11, color: kSlate400),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
              ]),
              const SizedBox(height: 12),
              const Divider(color: kSlate200, height: 1),
              const SizedBox(height: 12),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(fmtPrice(price),
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: kSlate800)),
                  Text(priceSuffix,
                      style: const TextStyle(fontSize: 10, color: kSlate400)),
                ]),
                GestureDetector(
                  onTap: onAction,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                    decoration: BoxDecoration(
                      color: kSlate800,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(actionLabel,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
                            color: kWhite, letterSpacing: 0.3)),
                  ),
                ),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// COMMERCIAL CARD
// ═════════════════════════════════════════════════════════════════════════════
class _CommCard extends StatelessWidget {
  final Map<String, dynamic> property;
  final VoidCallback onTap;
  const _CommCard({required this.property, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p      = property;
    final imgUrl = getImage(p);
    final status = p['status']?.toString() ?? 'active';
    final price  = num.tryParse(p['price']?.toString() ?? '0') ?? 0;
    final pt     = p['price_type']?.toString() ?? '';
    final sfx    = pt == 'yearly' ? '/yr' : pt == 'sale' ? '' : '/mo';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: kWhite.withOpacity(0.08),
          border: Border.all(color: kWhite.withOpacity(0.12)),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
            child: Stack(children: [
              SizedBox(
                height: 175, width: double.infinity,
                child: imgUrl.isNotEmpty
                    ? Image.network(imgUrl, fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => _ImgPlaceholder(Icons.business_outlined, dark: true))
                    : _ImgPlaceholder(Icons.business_outlined, dark: true),
              ),
              Positioned(top: 10, left: 10,
                  child: _StatusDot(status: status)),
              Positioned(top: 10, right: 10,
                  child: _Chip(
                    label: commercialTypeLabel(p['type']).toUpperCase(),
                    bg: kWhite.withOpacity(0.12),
                    fg: kWhite,
                    bordered: true,
                  )),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(commercialTypeLabel(p['type']).toUpperCase(),
                  style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
                      letterSpacing: 1.5, color: kSlate400)),
              const SizedBox(height: 4),
              Text(p['title'] ?? 'Untitled',
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: kWhite)),
              const SizedBox(height: 4),
              Row(children: [
                const Icon(Icons.location_on_outlined, size: 11, color: kSlate400),
                const SizedBox(width: 3),
                Expanded(child: Text(p['location'] ?? p['address'] ?? 'Africa',
                    maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: kSlate400))),
              ]),
              if (p['area'] != null || (p['parking_spaces'] ?? 0) > 0 || p['furnished'] == true) ...[
                const SizedBox(height: 8),
                Wrap(spacing: 5, runSpacing: 5, children: [
                  if (p['area'] != null) _Tag(label: '${p['area']} m²'),
                  if ((p['parking_spaces'] ?? 0) > 0) _Tag(label: '${p['parking_spaces']} Parking'),
                  if (p['furnished'] == true) _Tag(label: 'Furnished'),
                ]),
              ],
              const SizedBox(height: 12),
              const Divider(color: Color(0x1FFFFFFF), height: 1),
              const SizedBox(height: 12),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(fmtPrice(price),
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: kWhite)),
                  Text(sfx.isEmpty ? 'For Sale' : sfx,
                      style: const TextStyle(fontSize: 10, color: kSlate400)),
                ]),
                GestureDetector(
                  onTap: onTap,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                    decoration: BoxDecoration(
                      color: kWhite,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('Details',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: kSlate800)),
                  ),
                ),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// REUSABLE SMALL WIDGETS
// ═════════════════════════════════════════════════════════════════════════════
class _ImgPlaceholder extends StatelessWidget {
  final IconData icon;
  final bool dark;
  const _ImgPlaceholder(this.icon, {this.dark = false});

  @override
  Widget build(BuildContext context) => Container(
    color: dark ? const Color(0xFF2D3748) : kSlate100,
    child: Center(child: Icon(icon, size: 36,
        color: dark ? kSlate400 : kSlate200)),
  );
}

class _Chip extends StatelessWidget {
  final String label;
  final Color bg, fg;
  final bool bordered;
  const _Chip({required this.label, required this.bg, required this.fg, this.bordered = false});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
    decoration: BoxDecoration(
      color: bg,
      border: bordered ? Border.all(color: fg.withOpacity(0.3)) : null,
      borderRadius: BorderRadius.circular(6),
    ),
    child: Text(label,
        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: fg)),
  );
}

class _Tag extends StatelessWidget {
  final String label;
  const _Tag({required this.label});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
    decoration: BoxDecoration(
      color: kWhite.withOpacity(0.08),
      borderRadius: BorderRadius.circular(4),
    ),
    child: Text(label,
        style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w500, color: kSlate400)),
  );
}

class _StatusDot extends StatelessWidget {
  final String status;
  const _StatusDot({required this.status});

  @override
  Widget build(BuildContext context) {
    final isActive = status == 'active';
    final dotColor = isActive ? kGreen : kSlate400;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 6, height: 6,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
        const SizedBox(width: 5),
        Text(isActive ? 'AVAILABLE' : status.toUpperCase(),
            style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
                color: kWhite, letterSpacing: 0.5)),
      ]),
    );
  }
}

class _LiveDot extends StatefulWidget {
  @override State<_LiveDot> createState() => _LiveDotState();
}
class _LiveDotState extends State<_LiveDot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
  }
  @override void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: Tween(begin: 0.3, end: 1.0).animate(_ctrl),
    child: Container(width: 6, height: 6,
        decoration: const BoxDecoration(color: kGreen, shape: BoxShape.circle)),
  );
}

class _TrustChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _TrustChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
    decoration: BoxDecoration(
      color: kWhite.withOpacity(0.06),
      border: Border.all(color: kWhite.withOpacity(0.1)),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 12, color: kSlate400),
      const SizedBox(width: 6),
      Text(label, style: const TextStyle(fontSize: 11, color: kSlate400, fontWeight: FontWeight.w500)),
    ]),
  );
}

class _SolidButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _SolidButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(label,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
              color: kSlate800, letterSpacing: 0.3)),
    ),
  );
}

class _OutlineButtonLight extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _OutlineButtonLight({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
      decoration: BoxDecoration(
        border: Border.all(color: kWhite.withOpacity(0.2)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
              color: kWhite.withOpacity(0.8))),
    ),
  );
}

class _CleanSearchInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final VoidCallback onSubmit;
  const _CleanSearchInput({required this.controller, required this.hint, required this.onSubmit});

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    style: const TextStyle(color: kSlate800, fontSize: 13),
    onSubmitted: (_) => onSubmit(),
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: kSlate400, fontSize: 13),
      filled: true, fillColor: kSlate100,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border:        OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kSlate200)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kSlate200)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kSlate800)),
      prefixIcon: const Icon(Icons.search, size: 16, color: kSlate400),
      suffixIcon: ValueListenableBuilder(
        valueListenable: controller,
        builder: (_, val, _) => val.text.isNotEmpty
            ? IconButton(icon: const Icon(Icons.close, size: 13, color: kSlate400),
                onPressed: () => controller.clear())
            : const SizedBox.shrink(),
      ),
    ),
  );
}

class _CleanDropdown extends StatelessWidget {
  final String value;
  final Map<String, String> items;
  final ValueChanged<String?> onChanged;
  const _CleanDropdown({required this.value, required this.items, required this.onChanged});

  @override
  Widget build(BuildContext context) => DropdownButtonFormField<String>(
    initialValue: value,
    dropdownColor: kWhite,
    style: const TextStyle(color: kSlate800, fontSize: 13),
    decoration: InputDecoration(
      filled: true, fillColor: kSlate100,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      border:        OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kSlate200)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kSlate200)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kSlate800)),
    ),
    icon: const Icon(Icons.keyboard_arrow_down, color: kSlate400, size: 18),
    items: items.entries.map((e) => DropdownMenuItem(
      value: e.key,
      child: Text(e.value, style: const TextStyle(color: kSlate800)),
    )).toList(),
    onChanged: onChanged,
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SKELETON GRID
// ═════════════════════════════════════════════════════════════════════════════
class _SkeletonGrid extends StatefulWidget {
  final int count;
  final bool dark;
  const _SkeletonGrid({this.count = 3, this.dark = false});
  @override State<_SkeletonGrid> createState() => _SkeletonGridState();
}
class _SkeletonGridState extends State<_SkeletonGrid> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))
      ..repeat(reverse: true);
  }
  @override void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (ctx, constraints) {
    final cols  = constraints.maxWidth > 560 ? 2 : 1;
    final itemW = (constraints.maxWidth - (cols - 1) * 14) / cols;
    return FadeTransition(
      opacity: Tween(begin: 0.3, end: 0.7).animate(_ctrl),
      child: Wrap(
        spacing: 14, runSpacing: 14,
        children: List.generate(widget.count, (i) => Container(
          width: itemW, height: 280,
          decoration: BoxDecoration(
            color: widget.dark ? kWhite.withOpacity(0.06) : kSlate100,
            border: Border.all(color: widget.dark ? kWhite.withOpacity(0.08) : kSlate200),
            borderRadius: BorderRadius.circular(14),
          ),
        )),
      ),
    );
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═════════════════════════════════════════════════════════════════════════════
class _EmptyState extends StatelessWidget {
  final String text;
  final IconData icon;
  final bool dark;
  const _EmptyState({required this.text, required this.icon, this.dark = false});

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(children: [
        Container(
          width: 64, height: 64,
          decoration: BoxDecoration(
            color: dark ? kWhite.withOpacity(0.06) : kSlate100,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 28, color: kSlate400),
        ),
        const SizedBox(height: 14),
        Text(text, style: TextStyle(fontSize: 15, color: dark ? kSlate400 : kSlate600)),
      ]),
    ),
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BOOKING FORM
// ═════════════════════════════════════════════════════════════════════════════
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
        Uri.parse('$kApiBase/public/bnb/book'),
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
    } catch (e) {
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
    hintStyle: const TextStyle(color: kSlate400, fontSize: 13),
    filled: true, fillColor: kSlate100,
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    border:        OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kSlate200)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kSlate200)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kSlate800)),
  );

  Widget _datePicker(String label, DateTime? value, VoidCallback onTap) =>
      GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: kSlate100,
            border: Border.all(color: kSlate200),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(children: [
            Icon(Icons.calendar_today_outlined, size: 13, color: kSlate400),
            const SizedBox(width: 8),
            Text(
              value == null ? label : '${value.day}/${value.month}/${value.year}',
              style: TextStyle(fontSize: 13,
                  color: value == null ? kSlate400 : kSlate800),
            ),
          ]),
        ),
      );

  Future<DateTime?> _pickDate(DateTime first) => showDatePicker(
    context: context,
    initialDate: first,
    firstDate: first,
    lastDate: DateTime.now().add(const Duration(days: 365)),
  );

  @override
  Widget build(BuildContext context) {
    final price = num.tryParse(widget.property['price']?.toString() ?? '0') ?? 0;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Book Stay',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: kSlate800)),
          const SizedBox(height: 2),
          Text(widget.property['title'] ?? '',
              style: const TextStyle(fontSize: 13, color: kSlate600)),
        ])),
        IconButton(onPressed: widget.onClose,
            icon: const Icon(Icons.close, color: kSlate600, size: 20)),
      ]),
      const SizedBox(height: 20),
      const Divider(color: kSlate200, height: 1),
      const SizedBox(height: 20),
      TextField(controller: _nameCtrl, style: const TextStyle(color: kSlate800, fontSize: 13),
          decoration: _inp('Your name')),
      const SizedBox(height: 10),
      TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: kSlate800, fontSize: 13),
          decoration: _inp('Email address')),
      const SizedBox(height: 10),
      TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone,
          style: const TextStyle(color: kSlate800, fontSize: 13),
          decoration: _inp('Phone number')),
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
          style: const TextStyle(color: kSlate800, fontSize: 13),
          decoration: _inp('Special requests (optional)')),
      if (_nights > 0) ...[
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: kSlate100,
            border: Border.all(color: kSlate200),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(fmtPrice(_nights * price),
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: kSlate800)),
            Text('$_nights night${_nights != 1 ? 's' : ''}',
                style: const TextStyle(fontSize: 12, color: kSlate600)),
          ]),
        ),
      ],
      const SizedBox(height: 20),
      Row(children: [
        Expanded(child: GestureDetector(
          onTap: widget.onClose,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 13),
            decoration: BoxDecoration(
              border: Border.all(color: kSlate200),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text('Cancel', textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: kSlate600)),
          ),
        )),
        const SizedBox(width: 10),
        Expanded(flex: 2, child: GestureDetector(
          onTap: _loading ? null : _submit,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 13),
            decoration: BoxDecoration(
              color: kSlate800,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(_loading ? 'Submitting…' : 'Book Now',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: kWhite)),
          ),
        )),
      ]),
    ]);
  }
}

// ═════════════════════════════════════════════════════════════════════════
// MISSING COLOUR — kSlate700 used in CTA list
// ═════════════════════════════════════════════════════════════════════════════
const Color kSlate700 = Color(0xFF334155);