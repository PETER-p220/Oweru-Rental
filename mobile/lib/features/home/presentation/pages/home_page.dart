import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../shared/widgets/app_navbar.dart';
import '../../../shared/pages/public_property_detail_page.dart';
import '../../../../core/utils/payment_duration.dart';
import '../../../../core/utils/property_images.dart';

// ── Constants ────────────────────────────────────────────────────────────────
const String kApiBase     = 'https://rental.oweru.com/api';
const String kStorageBase = 'https://rental.oweru.com';

// Palette: slate + brass gold accent
const Color kWhite      = Color(0xFFFFFFFF);
const Color kBg         = Color(0xFFF8FAFC); // off-white page bg
const Color kSurface    = Color(0xFFFFFFFF); // card bg
const Color kSlate800   = Color(0xFF1E293B); // primary text / hero bg
const Color kSlate700   = Color(0xFF334155);
const Color kSlate600   = Color(0xFF475569); // secondary text
const Color kSlate400   = Color(0xFF94A3B8); // muted / hints
const Color kSlate200   = Color(0xFFE2E8F0); // borders / dividers
const Color kSlate100   = Color(0xFFF1F5F9); // subtle surface
const Color kAccent     = Color(0xFF1E293B); // same as slate-800, used for buttons
const Color kGold       = Color(0xFFC89128); // CTA / brand accent
const Color kGoldSoft   = Color(0xFFFBF0D9); // tinted backgrounds for gold accents
const Color kGreen      = Color(0xFF10B981); // available dot

// Smart price-filter bounds (TZS)
const double kPriceFloor = 0;
const double kPriceCeil  = 3000000;

const List<String> kCommercialTypes = [
  'office', 'retail', 'warehouse', 'commercial', 'industrial'
];

// ── Helpers ───────────────────────────────────────────────────────────────────
String fmtPrice(num price) => 'TZS ${price
    .toStringAsFixed(0)
    .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

String _commas(int n) =>
    n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');

String commercialTypeLabel(String? type) {
  const map = {
    'office': 'Office', 'retail': 'Retail', 'warehouse': 'Warehouse',
    'commercial': 'Commercial', 'industrial': 'Industrial',
  };
  return map[type?.toLowerCase()] ?? type ?? 'Commercial';
}

String resolveStoragePath(String? path) => resolvePropertyImageUrl(path);

String getImage(Map<String, dynamic> p) => getPropertyImageUrl(p);

String _favKey(Map<String, dynamic> p) =>
    (p['id'] ?? p['title'] ?? p.hashCode).toString();

String _greeting() {
  final h = DateTime.now().hour;
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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

  final _searchCtrl       = TextEditingController();
  String _searchSection   = 'all';
  bool   _searchActive    = false;
  bool   _showPriceFilter = false;
  double _priceMin = kPriceFloor;
  double _priceMax = kPriceCeil;
  Timer? _searchDebounce;

  // Smart touches: favorites, scroll-spy nav, scroll-to-top affordance
  final Set<String> _favorites = {};
  bool   _showScrollTop = false;
  String _activeSection = 'residential';

  final ScrollController _scrollCtrl = ScrollController();

  // Section anchors — lets the category bar act as a smart quick-nav
  final GlobalKey _residentialKey = GlobalKey();
  final GlobalKey _bnbKey         = GlobalKey();
  final GlobalKey _oweruKey       = GlobalKey();
  final GlobalKey _commercialKey  = GlobalKey();

  @override
  void initState() {
    super.initState();
    _loadData();
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _scrollCtrl.removeListener(_onScroll);
    _scrollCtrl.dispose();
    _searchDebounce?.cancel();
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

  // ── Scroll-spy + scroll-to-top ─────────────────────────────────────────────
  void _onScroll() {
    final showTop = _scrollCtrl.offset > 480;
    if (showTop != _showScrollTop) setState(() => _showScrollTop = showTop);

    if (_searchActive) return;
    final sections = {
      'residential': _residentialKey,
      'bnb': _bnbKey,
      'oweru': _oweruKey,
      'commercial': _commercialKey,
    };
    String? closest;
    double bestDelta = double.infinity;
    sections.forEach((name, key) {
      final ctx = key.currentContext;
      if (ctx == null) return;
      final box = ctx.findRenderObject() as RenderBox?;
      if (box == null || !box.attached) return;
      final top = box.localToGlobal(Offset.zero).dy;
      if (top <= 170) {
        final delta = (top - 170).abs();
        if (delta < bestDelta) { bestDelta = delta; closest = name; }
      }
    });
    if (closest != null && closest != _activeSection) {
      setState(() => _activeSection = closest!);
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

  bool get _priceFilterActive => _priceMin != kPriceFloor || _priceMax != kPriceCeil;

  List<Map<String, dynamic>> get _filtered {
    final term = _searchCtrl.text.toLowerCase();
    return _searchPool.where((p) {
      final matchText = term.isEmpty ||
          (p['title'] ?? '').toString().toLowerCase().contains(term) ||
          (p['location'] ?? '').toString().toLowerCase().contains(term) ||
          (p['address'] ?? '').toString().toLowerCase().contains(term);
      if (!_priceFilterActive) return matchText;
      final price = num.tryParse(p['price']?.toString() ?? '0') ?? 0;
      final matchPrice = price >= _priceMin && price <= _priceMax;
      return matchText && matchPrice;
    }).toList();
  }

  void _clearSearch() => setState(() {
    _searchCtrl.clear();
    _searchSection = 'all';
    _priceMin = kPriceFloor;
    _priceMax = kPriceCeil;
    _showPriceFilter = false;
    _searchActive = false;
  });

  void _doSearch() {
    _searchDebounce?.cancel();
    setState(() => _searchActive = true);
    _scrollCtrl.animateTo(0, duration: const Duration(milliseconds: 400), curve: Curves.easeOut);
  }

  // Smart, incremental search: once results are showing, typing re-filters
  // instantly (lightly debounced); typing 2+ characters from the hero
  // auto-activates results.
  void _onSearchChanged(String value) {
    if (_searchActive) {
      _searchDebounce?.cancel();
      _searchDebounce = Timer(const Duration(milliseconds: 180), () {
        if (mounted) setState(() {});
      });
    } else if (value.trim().length >= 2) {
      _doSearch();
    } else {
      setState(() {}); // keep the live "matches so far" preview fresh
    }
  }

  void _scrollToSection(String tag, GlobalKey key) {
    setState(() => _activeSection = tag);
    final ctx = key.currentContext;
    if (ctx != null) {
      Scrollable.ensureVisible(
        ctx,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOutCubic,
        alignment: 0.02,
      );
    }
  }

  void _toggleFavorite(Map<String, dynamic> p) {
    final key = _favKey(p);
    setState(() {
      if (_favorites.contains(key)) {
        _favorites.remove(key);
      } else {
        _favorites.add(key);
      }
    });
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
      body: Stack(
        children: [
          SingleChildScrollView(
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
                  KeyedSubtree(key: _residentialKey, child: _buildResidentialSection()),
                  KeyedSubtree(key: _bnbKey,         child: _buildBnbSection()),
                  KeyedSubtree(key: _oweruKey,       child: _buildOweruSection()),
                  KeyedSubtree(key: _commercialKey,  child: _buildCommercialSection()),
                  _buildCta(),
                ],
              ],
            ),
          ),
          _buildScrollTopFab(),
        ],
      ),
    );
  }

  // ── SCROLL-TO-TOP (appears once you've travelled a screen or so) ──────────
  Widget _buildScrollTopFab() {
    return Positioned(
      right: 16,
      bottom: 24,
      child: IgnorePointer(
        ignoring: !_showScrollTop,
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 220),
          opacity: _showScrollTop ? 1 : 0,
          child: AnimatedSlide(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOut,
            offset: _showScrollTop ? Offset.zero : const Offset(0, 0.3),
            child: _Tappable(
              onTap: () => _scrollCtrl.animateTo(0,
                  duration: const Duration(milliseconds: 550), curve: Curves.easeOutCubic),
              borderRadius: BorderRadius.circular(28),
              child: Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  color: kSlate800,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 16, offset: const Offset(0, 6)),
                  ],
                ),
                child: const Icon(Icons.arrow_upward_rounded, color: kWhite, size: 20),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── HERO ───────────────────────────────────────────────────────────────────
  Widget _buildHero() {
    return Container(
      decoration: const BoxDecoration(color: kSlate800),
      clipBehavior: Clip.hardEdge,
      child: Stack(
        children: [
          // Ambient warmth — the one deliberate decorative flourish on the page
          Positioned(
            top: -70, right: -60,
            child: _glow(220, kGold.withValues(alpha: 0.22)),
          ),
          Positioned(
            bottom: -50, left: -40,
            child: _glow(160, kGold.withValues(alpha: 0.10)),
          ),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 48, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Eyebrow
                  _Reveal(child: Row(children: [
                    _LiveDot(),
                    const SizedBox(width: 8),
                    const Text(
                      "Africa's Premier Rental Platform",
                      style: TextStyle(
                        fontSize: 11, letterSpacing: 1.6,
                        fontWeight: FontWeight.w500, color: kSlate400),
                    ),
                  ])),
                  const SizedBox(height: 20),
                  // Personalized greeting — a small, human touch of "smart"
                  _Reveal(delayMs: 60, child: Text(
                    '${_greeting()}. Let\'s find your next home.',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: kGold, letterSpacing: 0.2),
                  )),
                  const SizedBox(height: 12),
                  // Headline
                  _Reveal(delayMs: 120, child: RichText(
                    text: const TextSpan(
                      style: TextStyle(fontSize: 32, fontWeight: FontWeight.w300, color: kWhite, height: 1.15),
                      children: [
                        TextSpan(text: 'Find Your\n'),
                        TextSpan(text: 'Perfect Rental', style: TextStyle(fontWeight: FontWeight.w800)),
                        TextSpan(text: '\nProperty'),
                      ],
                    ),
                  )),
                  const SizedBox(height: 14),
                  _Reveal(delayMs: 160, child: Container(
                    width: 46, height: 3,
                    decoration: BoxDecoration(color: kGold, borderRadius: BorderRadius.circular(2)),
                  )),
                  const SizedBox(height: 16),
                  _Reveal(delayMs: 200, child: const Text(
                    'Connect with trusted landlords and professional agents across Africa. Residential, commercial, and short-stay all in one place.',
                    style: TextStyle(
                        fontSize: 14, height: 1.65,
                        color: kSlate400, fontWeight: FontWeight.w400),
                  )),
                  const SizedBox(height: 24),
                  // CTA buttons
                  _Reveal(delayMs: 240, child: Row(children: [
                    Expanded(child: _Tappable(
                      onTap: _doSearch,
                      borderRadius: BorderRadius.circular(8),
                      splashColor: kSlate800.withValues(alpha: 0.15),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        decoration: BoxDecoration(
                          color: kGold,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: [
                            BoxShadow(color: kGold.withValues(alpha: 0.35), blurRadius: 18, offset: const Offset(0, 8)),
                          ],
                        ),
                        child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Text('Browse All', style: TextStyle(color: kWhite, fontSize: 13, fontWeight: FontWeight.w700)),
                          SizedBox(width: 6),
                          Icon(Icons.arrow_forward_rounded, size: 15, color: kWhite),
                        ]),
                      ),
                    )),
                    const SizedBox(width: 10),
                    Expanded(child: _Tappable(
                      onTap: () => Navigator.pushNamed(context, '/register'),
                      borderRadius: BorderRadius.circular(8),
                      splashColor: kWhite.withValues(alpha: 0.08),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.white24),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Text('Create Account', style: TextStyle(color: kWhite, fontSize: 13, fontWeight: FontWeight.w600)),
                          SizedBox(width: 4),
                          Icon(Icons.chevron_right_rounded, size: 16, color: Colors.white70),
                        ]),
                      ),
                    )),
                  ])),
                  const SizedBox(height: 28),
                  // Trust chips
                  _Reveal(delayMs: 280, child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(children: [
                      _trustChip(Icons.verified_user_outlined, 'Verified landlords'),
                      const SizedBox(width: 16),
                      _trustChip(Icons.schedule_rounded, '24hr response'),
                      const SizedBox(width: 16),
                      _trustChip(Icons.trending_up_rounded, '1,200+ listings'),
                    ]),
                  )),
                  const SizedBox(height: 40),
                  // Search card
                  _Reveal(delayMs: 320, child: _buildSearchCard()),
                  const SizedBox(height: 0),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _glow(double size, Color color) => IgnorePointer(
    child: Container(
      width: size, height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(colors: [color, color.withValues(alpha: 0.0)]),
      ),
    ),
  );

  Widget _trustChip(IconData icon, String label) => Row(mainAxisSize: MainAxisSize.min, children: [
    Icon(icon, size: 13, color: kWhite),
    const SizedBox(width: 6),
    Text(label, style: TextStyle(fontSize: 12, color: kWhite.withValues(alpha: 0.7), fontWeight: FontWeight.w500)),
  ]);

  // ── SEARCH CARD ─────────────────────────────────────────────────────────────
  Widget _buildSearchCard() {
    final liveCount = _filtered.length;
    final showLiveCount = !_searchActive &&
        (_searchCtrl.text.isNotEmpty || _searchSection != 'all' || _priceFilterActive);

    return Container(
      margin: const EdgeInsets.only(bottom: 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 24, offset: const Offset(0, -4)),
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
            onChanged: _onSearchChanged,
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
            Expanded(child: _FilterToggleChip(
              expanded: _showPriceFilter,
              label: _priceFilterActive
                  ? '${fmtPrice(_priceMin)} – ${fmtPrice(_priceMax)}'
                  : 'Any Price',
              active: _priceFilterActive,
              onTap: () => setState(() => _showPriceFilter = !_showPriceFilter),
            )),
          ]),
          // Progressive disclosure: the range slider only appears once asked for
          AnimatedSize(
            duration: const Duration(milliseconds: 240),
            curve: Curves.easeOut,
            alignment: Alignment.topCenter,
            child: !_showPriceFilter
                ? const SizedBox(width: double.infinity)
                : Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Column(children: [
                      SliderTheme(
                        data: SliderTheme.of(context).copyWith(
                          activeTrackColor: kGold,
                          inactiveTrackColor: kSlate200,
                          thumbColor: kGold,
                          overlayColor: kGold.withValues(alpha: 0.15),
                          valueIndicatorColor: kSlate800,
                          rangeThumbShape: const RoundRangeSliderThumbShape(enabledThumbRadius: 8),
                        ),
                        child: RangeSlider(
                          values: RangeValues(_priceMin, _priceMax),
                          min: kPriceFloor,
                          max: kPriceCeil,
                          divisions: 30,
                          labels: RangeLabels(fmtPrice(_priceMin), fmtPrice(_priceMax)),
                          onChanged: (v) => setState(() {
                            _priceMin = v.start;
                            _priceMax = v.end;
                          }),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text(fmtPrice(_priceMin), style: const TextStyle(fontSize: 11, color: kSlate600, fontWeight: FontWeight.w600)),
                          Text(fmtPrice(_priceMax), style: const TextStyle(fontSize: 11, color: kSlate600, fontWeight: FontWeight.w600)),
                        ]),
                      ),
                    ]),
                  ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: _Tappable(
              onTap: _doSearch,
              borderRadius: BorderRadius.circular(10),
              splashColor: kWhite.withValues(alpha: 0.15),
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
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: !showLiveCount
                ? const SizedBox.shrink(key: ValueKey('no-live'))
                : Padding(
                    key: const ValueKey('live'),
                    padding: const EdgeInsets.only(top: 8),
                    child: Center(
                      child: Text(
                        '$liveCount propert${liveCount == 1 ? 'y' : 'ies'} match so far',
                        style: const TextStyle(fontSize: 11, color: kSlate400),
                      ),
                    ),
                  ),
          ),
          if (_searchCtrl.text.isNotEmpty || _searchSection != 'all' || _priceFilterActive)
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

  // ── STATS BAR (numbers count up into place) ────────────────────────────────
  Widget _buildStatsBar() {
    const stats = [
      (1200, '+',  'LISTINGS',     Icons.home_work_outlined),
      (500,  '+',  'LANDLORDS',    Icons.groups_outlined),
      (98,   '%',  'SATISFACTION', Icons.emoji_events_outlined),
      (24,   'hr', 'RESPONSE',     Icons.bolt_outlined),
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
                Icon(e.value.$4, size: 16, color: kGold),
                const SizedBox(height: 8),
                _CountUp(
                  target: e.value.$1,
                  suffix: e.value.$2,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700,
                      color: kWhite, letterSpacing: -0.5),
                ),
                const SizedBox(height: 3),
                Text(e.value.$3,
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

  // ── CATEGORY QUICK-LINKS (tap to jump; highlights as you scroll) ───────────
  Widget _buildCategoryBar() {
    final cats = [
      (Icons.apartment_outlined,  'Residential', _residentialKey, 'residential'),
      (Icons.storefront_outlined, 'Commercial',  _commercialKey,  'commercial'),
      (Icons.hotel_outlined,      'Short Stay',  _bnbKey,         'bnb'),
      (Icons.verified_outlined,   'Oweru',       _oweruKey,       'oweru'),
    ];
    return Container(
      color: kWhite,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
      child: Row(
        children: cats.map((c) {
          final isActive = _activeSection == c.$4;
          return Expanded(
            child: _Tappable(
              onTap: () => _scrollToSection(c.$4, c.$3),
              borderRadius: BorderRadius.circular(14),
              splashColor: kGold.withValues(alpha: 0.12),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                child: Column(children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    curve: Curves.easeOut,
                    width: 48, height: 48,
                    decoration: BoxDecoration(
                      color: isActive ? kSlate800 : kSlate100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(c.$1, size: 20, color: isActive ? kGold : kSlate800),
                  ),
                  const SizedBox(height: 6),
                  Text(c.$2,
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 10,
                          fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                          color: isActive ? kSlate800 : kSlate600, letterSpacing: 0.3)),
                  const SizedBox(height: 4),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    width: isActive ? 16 : 0,
                    height: 2.5,
                    decoration: BoxDecoration(color: kGold, borderRadius: BorderRadius.circular(2)),
                  ),
                ]),
              ),
            ),
          );
        }).toList(),
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
          _Tappable(
            onTap: _clearSearch,
            borderRadius: BorderRadius.circular(8),
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
          decoration: const BoxDecoration(color: kSlate100, shape: BoxShape.circle),
          child: const Icon(Icons.search_off, size: 32, color: kSlate400),
        ),
        const SizedBox(height: 16),
        const Text('No properties found',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: kSlate800)),
        const SizedBox(height: 6),
        const Text('Try a different location or adjust filters.',
            style: TextStyle(fontSize: 13, color: kSlate400)),
        const SizedBox(height: 20),
        _Tappable(
          onTap: _clearSearch,
          borderRadius: BorderRadius.circular(8),
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
            : _buildPropGrid(_bnb, priceSuffix: '/night', dark: true,
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
            const Icon(Icons.check_circle_outline, size: 16, color: kGold),
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
    bool dark = false,
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
          final favKey = _favKey(p);
          return SizedBox(
            width: itemW,
            child: isCommercial
                ? _CommCard(
                    property: p,
                    onTap: () => _navigateToProperty(p),
                    isFavorite: _favorites.contains(favKey),
                    onToggleFavorite: () => _toggleFavorite(p),
                  )
                : _PropCard(
                    property: p,
                    priceSuffix: priceSuffix,
                    badge: badge,
                    dark: dark,
                    onTap: () => _navigateToProperty(p),
                    actionLabel: actionLabel,
                    onAction: () => onAction?.call(p),
                    isFavorite: _favorites.contains(favKey),
                    onToggleFavorite: () => _toggleFavorite(p),
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
      barrierColor: Colors.black.withValues(alpha: 0.5),
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
// SHARED TAP-FEEDBACK WRAPPER — ripple + a subtle press-down scale
// ═════════════════════════════════════════════════════════════════════════════
class _Tappable extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final BorderRadius borderRadius;
  final Color splashColor;
  const _Tappable({
    required this.child,
    required this.onTap,
    this.borderRadius = const BorderRadius.all(Radius.circular(10)),
    this.splashColor = const Color(0x14000000),
  });

  @override
  State<_Tappable> createState() => _TappableState();
}

class _TappableState extends State<_Tappable> {
  bool _pressed = false;

  void _setPressed(bool v) {
    if (widget.onTap == null) return;
    setState(() => _pressed = v);
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
    behavior: HitTestBehavior.opaque,
    onTapDown: (_) => _setPressed(true),
    onTapCancel: () => _setPressed(false),
    onTapUp: (_) => _setPressed(false),
    child: AnimatedScale(
      scale: _pressed ? 0.97 : 1.0,
      duration: const Duration(milliseconds: 110),
      curve: Curves.easeOut,
      child: Material(
        color: Colors.transparent,
        borderRadius: widget.borderRadius,
        child: InkWell(
          onTap: widget.onTap,
          borderRadius: widget.borderRadius,
          splashColor: widget.splashColor,
          highlightColor: widget.splashColor,
          child: widget.child,
        ),
      ),
    ),
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STAGGERED ENTRANCE — small, deliberate fade + rise; used once per hero load
// ═════════════════════════════════════════════════════════════════════════════
class _Reveal extends StatefulWidget {
  final Widget child;
  final int delayMs;
  const _Reveal({required this.child, this.delayMs = 0});

  @override
  State<_Reveal> createState() => _RevealState();
}

class _RevealState extends State<_Reveal> {
  bool _shown = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: widget.delayMs), () {
      if (mounted) setState(() => _shown = true);
    });
  }

  @override
  Widget build(BuildContext context) => AnimatedOpacity(
    opacity: _shown ? 1 : 0,
    duration: const Duration(milliseconds: 480),
    curve: Curves.easeOut,
    child: AnimatedSlide(
      offset: _shown ? Offset.zero : const Offset(0, 0.08),
      duration: const Duration(milliseconds: 480),
      curve: Curves.easeOut,
      child: widget.child,
    ),
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COUNT-UP NUMBER — used in the stats bar
// ═════════════════════════════════════════════════════════════════════════════
class _CountUp extends StatelessWidget {
  final int target;
  final String suffix;
  final TextStyle style;
  const _CountUp({required this.target, required this.suffix, required this.style});

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<int>(
    tween: IntTween(begin: 0, end: target),
    duration: const Duration(milliseconds: 1400),
    curve: Curves.easeOutCubic,
    builder: (context, value, child) => Text('${_commas(value)}$suffix', style: style),
  );
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
    const tagClr   = kSlate400;

    return Container(
      color: bg,
      padding: const EdgeInsets.fromLTRB(20, 48, 20, 48),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(width: 4, height: 13, decoration: BoxDecoration(color: kGold, borderRadius: BorderRadius.circular(2))),
              const SizedBox(width: 8),
              Text(tag.toUpperCase(),
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                      letterSpacing: 2.5, color: tagClr)),
            ]),
            const SizedBox(height: 10),
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
            _Tappable(
              onTap: onAction,
              borderRadius: BorderRadius.circular(6),
              splashColor: (dark ? kWhite : kSlate800).withValues(alpha: 0.1),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: Row(children: [
                  Text(actionLabel!,
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                          color: dark ? kWhite : kSlate800)),
                  const SizedBox(width: 4),
                  Icon(Icons.arrow_forward, size: 13,
                      color: dark ? kWhite : kSlate800),
                ]),
              ),
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
// SMART FILTER TOGGLE CHIP (looks like a dropdown, expands the price slider)
// ═════════════════════════════════════════════════════════════════════════════
class _FilterToggleChip extends StatelessWidget {
  final bool expanded;
  final bool active;
  final String label;
  final VoidCallback onTap;
  const _FilterToggleChip({
    required this.expanded,
    required this.active,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => _Tappable(
    onTap: onTap,
    borderRadius: BorderRadius.circular(10),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: active ? kGoldSoft : kSlate100,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: active ? kGold.withValues(alpha: 0.5) : kSlate200),
      ),
      child: Row(children: [
        Expanded(
          child: Text(label,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 12.5,
                  color: active ? kSlate800 : kSlate600,
                  fontWeight: active ? FontWeight.w700 : FontWeight.w400)),
        ),
        AnimatedRotation(
          turns: expanded ? 0.5 : 0,
          duration: const Duration(milliseconds: 220),
          child: const Icon(Icons.keyboard_arrow_down, color: kSlate400, size: 18),
        ),
      ]),
    ),
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FAVORITE HEART — quick, tactile bookmarking with no backend round-trip
// ═════════════════════════════════════════════════════════════════════════════
class _FavoriteButton extends StatelessWidget {
  final bool isFavorite;
  final VoidCallback onTap;
  const _FavoriteButton({required this.isFavorite, required this.onTap});

  @override
  Widget build(BuildContext context) => _Tappable(
    onTap: onTap,
    borderRadius: BorderRadius.circular(20),
    child: Container(
      width: 32, height: 32,
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.45),
        shape: BoxShape.circle,
      ),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 180),
        transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
        child: Icon(
          isFavorite ? Icons.favorite : Icons.favorite_border,
          key: ValueKey(isFavorite),
          size: 16,
          color: isFavorite ? kGold : kWhite,
        ),
      ),
    ),
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PROPERTY CARD
// ═════════════════════════════════════════════════════════════════════════════
class _PropCard extends StatelessWidget {
  final Map<String, dynamic> property;
  final String priceSuffix;
  final String? badge;
  final bool dark;
  final VoidCallback onTap, onAction;
  final String actionLabel;
  final bool isFavorite;
  final VoidCallback onToggleFavorite;

  const _PropCard({
    required this.property,
    required this.priceSuffix,
    required this.onTap,
    required this.actionLabel,
    required this.onAction,
    required this.isFavorite,
    required this.onToggleFavorite,
    this.dark = false,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    final p      = property;
    final imgUrl = getImage(p);
    final price  = num.tryParse(p['price']?.toString() ?? '0') ?? 0;
    final suffix = paymentDurationMonths(p['payment_duration_months']) > 1
        ? formatPaymentPeriodLabel(paymentDurationMonths(p['payment_duration_months']))
        : priceSuffix;

    final surfaceColor = dark ? kWhite.withValues(alpha: 0.08) : kSurface;
    final borderColor  = dark ? kWhite.withValues(alpha: 0.12) : kSlate200;
    final titleColor    = dark ? kWhite : kSlate800;
    final locationColor = kSlate400;
    final dividerColor  = dark ? const Color(0x1FFFFFFF) : kSlate200;
    final priceColor    = dark ? kWhite : kSlate800;
    final btnBg   = dark ? kWhite : kSlate800;
    final btnText = dark ? kSlate800 : kWhite;

    return _Tappable(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        decoration: BoxDecoration(
          color: surfaceColor,
          border: Border.all(color: borderColor),
          borderRadius: BorderRadius.circular(14),
          boxShadow: dark ? null : [
            BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 14, offset: const Offset(0, 6)),
          ],
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
                        loadingBuilder: (_, child, progress) => progress == null
                            ? child
                            : Container(color: kSlate100, child: const Center(
                                child: CircularProgressIndicator(strokeWidth: 2, color: kSlate400))),
                        errorBuilder: (_, _, _) => _ImgPlaceholder(Icons.home_outlined))
                    : _ImgPlaceholder(Icons.home_outlined),
              ),
              if (p['featured'] == true || p['featured'] == 1)
                const Positioned(top: 10, left: 10,
                    child: _Chip(label: 'Featured', bg: kSlate800, fg: kWhite)),
              if (badge != null)
                Positioned(top: 10, right: 10,
                    child: _Chip(label: badge!, bg: kWhite, fg: kSlate800)),
              Positioned(bottom: 10, right: 10,
                  child: _FavoriteButton(isFavorite: isFavorite, onTap: onToggleFavorite)),
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
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: titleColor),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 4),
              Row(children: [
                Icon(Icons.location_on_outlined, size: 11, color: locationColor),
                const SizedBox(width: 3),
                Expanded(child: Text(p['location'] ?? p['address'] ?? 'Africa',
                    style: TextStyle(fontSize: 11, color: locationColor),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
              ]),
              const SizedBox(height: 12),
              Divider(color: dividerColor, height: 1),
              const SizedBox(height: 12),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(fmtPrice(price),
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: priceColor)),
                  Text(suffix,
                      style: const TextStyle(fontSize: 10, color: kSlate400)),
                ]),
                _Tappable(
                  onTap: onAction,
                  borderRadius: BorderRadius.circular(8),
                  splashColor: kWhite.withValues(alpha: 0.15),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                    decoration: BoxDecoration(
                      color: btnBg,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(actionLabel,
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
                            color: btnText, letterSpacing: 0.3)),
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
  final bool isFavorite;
  final VoidCallback onToggleFavorite;
  const _CommCard({
    required this.property,
    required this.onTap,
    required this.isFavorite,
    required this.onToggleFavorite,
  });

  @override
  Widget build(BuildContext context) {
    final p      = property;
    final imgUrl = getImage(p);
    final status = p['status']?.toString() ?? 'active';
    final price  = num.tryParse(p['price']?.toString() ?? '0') ?? 0;
    final pt     = p['price_type']?.toString() ?? '';
    final months = paymentDurationMonths(p['payment_duration_months']);
    final sfx    = pt != 'sale' && months > 1
        ? formatPaymentPeriodLabel(months)
        : (pt == 'yearly' ? '/yr' : pt == 'sale' ? '' : '/mo');

    return _Tappable(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      splashColor: kWhite.withValues(alpha: 0.1),
      child: Container(
        decoration: BoxDecoration(
          color: kWhite.withValues(alpha: 0.08),
          border: Border.all(color: kWhite.withValues(alpha: 0.12)),
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
                        loadingBuilder: (_, child, progress) => progress == null
                            ? child
                            : Container(color: kSlate100, child: const Center(
                                child: CircularProgressIndicator(strokeWidth: 2, color: kSlate400))),
                        errorBuilder: (_, _, _) => _ImgPlaceholder(Icons.business_outlined, dark: true))
                    : _ImgPlaceholder(Icons.business_outlined, dark: true),
              ),
              Positioned(top: 10, left: 10,
                  child: _StatusDot(status: status)),
              Positioned(top: 10, right: 10,
                  child: _Chip(
                    label: commercialTypeLabel(p['type']).toUpperCase(),
                    bg: kWhite.withValues(alpha: 0.12),
                    fg: kWhite,
                    bordered: true,
                  )),
              Positioned(bottom: 10, right: 10,
                  child: _FavoriteButton(isFavorite: isFavorite, onTap: onToggleFavorite)),
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
                  if (p['furnished'] == true) const _Tag(label: 'Furnished'),
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
                _Tappable(
                  onTap: onTap,
                  borderRadius: BorderRadius.circular(8),
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
      border: bordered ? Border.all(color: fg.withValues(alpha: 0.3)) : null,
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
      color: kWhite.withValues(alpha: 0.08),
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
        color: Colors.black.withValues(alpha: 0.5),
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

class _SolidButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _SolidButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => _Tappable(
    onTap: onTap,
    borderRadius: BorderRadius.circular(10),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
      decoration: BoxDecoration(
        color: kGold,
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(color: kGold.withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 8)),
        ],
      ),
      child: Text(label,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
              color: kWhite, letterSpacing: 0.3)),
    ),
  );
}

class _CleanSearchInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final VoidCallback onSubmit;
  final ValueChanged<String>? onChanged;
  const _CleanSearchInput({
    required this.controller,
    required this.hint,
    required this.onSubmit,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    style: const TextStyle(color: kSlate800, fontSize: 13),
    onSubmitted: (_) => onSubmit(),
    onChanged: onChanged,
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: kSlate400, fontSize: 13),
      filled: true, fillColor: kSlate100,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border:        OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kSlate200)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kSlate200)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kGold, width: 1.4)),
      prefixIcon: const Icon(Icons.search, size: 16, color: kSlate400),
      suffixIcon: ValueListenableBuilder(
        valueListenable: controller,
        builder: (_, val, _) => val.text.isNotEmpty
            ? IconButton(icon: const Icon(Icons.close, size: 13, color: kSlate400),
                tooltip: 'Clear search text',
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
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kGold, width: 1.4)),
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
// SKELETON GRID — sweeping shimmer instead of a flat fade
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
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))
      ..repeat();
  }
  @override void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (ctx, constraints) {
    final cols  = constraints.maxWidth > 560 ? 2 : 1;
    final itemW = (constraints.maxWidth - (cols - 1) * 14) / cols;
    final baseColor = widget.dark ? kWhite.withValues(alpha: 0.06) : kSlate100;
    final highlight  = widget.dark ? kWhite.withValues(alpha: 0.16) : kWhite;
    final borderClr  = widget.dark ? kWhite.withValues(alpha: 0.08) : kSlate200;
    return Wrap(
      spacing: 14, runSpacing: 14,
      children: List.generate(widget.count, (i) => AnimatedBuilder(
        animation: _ctrl,
        builder: (context, child) {
          final t = (_ctrl.value + (i * 0.15)) % 1.0;
          return Container(
            width: itemW, height: 280,
            decoration: BoxDecoration(
              border: Border.all(color: borderClr),
              borderRadius: BorderRadius.circular(14),
              gradient: LinearGradient(
                begin: Alignment(-1 + t * 3, 0),
                end: Alignment(0 + t * 3, 0),
                colors: [baseColor, highlight, baseColor],
                stops: const [0.35, 0.5, 0.65],
              ),
            ),
          );
        },
      )),
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
            color: dark ? kWhite.withValues(alpha: 0.06) : kSlate100,
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
// BOOKING FORM — now with live, smart validation
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

  static final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  @override
  void initState() {
    super.initState();
    for (final c in [_nameCtrl, _emailCtrl, _phoneCtrl]) {
      c.addListener(_refresh);
    }
  }

  void _refresh() { if (mounted) setState(() {}); }

  @override void dispose() {
    _nameCtrl.dispose(); _emailCtrl.dispose();
    _phoneCtrl.dispose(); _reqCtrl.dispose();
    super.dispose();
  }

  int get _nights {
    if (_checkIn == null || _checkOut == null) return 0;
    return _checkOut!.difference(_checkIn!).inDays;
  }

  bool get _canSubmit =>
      _nameCtrl.text.trim().isNotEmpty &&
      _emailRe.hasMatch(_emailCtrl.text.trim()) &&
      _phoneCtrl.text.trim().isNotEmpty &&
      _checkIn != null && _checkOut != null &&
      _checkOut!.isAfter(_checkIn!);

  Future<void> _submit() async {
    if (!_canSubmit) return;
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

  InputDecoration _inp(String hint, {bool invalid = false}) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: kSlate400, fontSize: 13),
    filled: true, fillColor: kSlate100,
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    border:        OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: invalid ? Colors.redAccent.withValues(alpha: 0.5) : kSlate200)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: invalid ? Colors.redAccent.withValues(alpha: 0.5) : kSlate200)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGold, width: 1.4)),
  );

  Widget _datePicker(String label, DateTime? value, VoidCallback onTap) => _Tappable(
    onTap: onTap,
    borderRadius: BorderRadius.circular(8),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: kSlate100,
        border: Border.all(color: kSlate200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(children: [
        const Icon(Icons.calendar_today_outlined, size: 13, color: kSlate400),
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
    final emailTyped = _emailCtrl.text.trim().isNotEmpty;
    final emailInvalid = emailTyped && !_emailRe.hasMatch(_emailCtrl.text.trim());

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Book Stay',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: kSlate800)),
          const SizedBox(height: 2),
          Text(widget.property['title'] ?? '',
              style: const TextStyle(fontSize: 13, color: kSlate600)),
        ])),
        IconButton(
          onPressed: widget.onClose,
          tooltip: 'Close',
          icon: const Icon(Icons.close, color: kSlate600, size: 20),
        ),
      ]),
      const SizedBox(height: 20),
      const Divider(color: kSlate200, height: 1),
      const SizedBox(height: 20),
      TextField(controller: _nameCtrl, style: const TextStyle(color: kSlate800, fontSize: 13),
          decoration: _inp('Your name')),
      const SizedBox(height: 10),
      TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: kSlate800, fontSize: 13),
          decoration: _inp('Email address', invalid: emailInvalid)),
      if (emailInvalid) Padding(
        padding: const EdgeInsets.only(top: 4, left: 4),
        child: Text('Enter a valid email so the owner can reach you',
            style: TextStyle(fontSize: 11, color: Colors.redAccent.withValues(alpha: 0.8))),
      ),
      const SizedBox(height: 10),
      TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone,
          style: const TextStyle(color: kSlate800, fontSize: 13),
          decoration: _inp('Phone number')),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(child: _datePicker('Check-in', _checkIn, () async {
          final d = await _pickDate(DateTime.now());
          if (d != null) setState(() {
            _checkIn = d;
            if (_checkOut != null && !_checkOut!.isAfter(_checkIn!)) _checkOut = null;
          });
        })),
        const SizedBox(width: 8),
        Expanded(child: _datePicker('Check-out', _checkOut, () async {
          final d = await _pickDate((_checkIn ?? DateTime.now()).add(const Duration(days: 1)));
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
            color: kGoldSoft,
            border: Border.all(color: kGold.withValues(alpha: 0.35)),
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
        Expanded(child: _Tappable(
          onTap: widget.onClose,
          borderRadius: BorderRadius.circular(8),
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
        Expanded(flex: 2, child: _Tappable(
          onTap: (_loading || !_canSubmit) ? null : _submit,
          borderRadius: BorderRadius.circular(8),
          splashColor: kWhite.withValues(alpha: 0.15),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 13),
            decoration: BoxDecoration(
              color: (_canSubmit) ? kSlate800 : kSlate400,
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