// ============================================================
// properties_page.dart — dark navy/gold theme + skeleton load
// ============================================================
import 'package:flutter/material.dart';
import '../../../../shared/services/tenant_api_service.dart';
import 'tenant_theme.dart';
import 'property_detail_page.dart';

class PropertiesPage extends StatefulWidget {
  const PropertiesPage({super.key});
  @override
  State<PropertiesPage> createState() => _PropertiesPageState();
}

class _PropertiesPageState extends State<PropertiesPage> {
  List<Map<String, dynamic>> _properties = [];
  List<Map<String, dynamic>> _filtered   = [];
  bool   _isLoading  = true;
  String _error      = '';
  String _search     = '';
  String _typeFilter = 'all';
  final _searchCtrl  = TextEditingController();
  final _scrollCtrl  = ScrollController();

  final _types = ['all', 'house', 'apartment', 'villa', 'studio', 'commercial'];

  @override
  void initState() {
    super.initState();
    _loadProperties();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadProperties() async {
    setState(() { _isLoading = true; _error = ''; });
    try {
      final data = await TenantApiService.getDashboard();
      final raw  = (data['properties'] as List? ?? []).cast<Map<String, dynamic>>();
      if (mounted) setState(() { _properties = raw; _filtered = raw; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = 'Failed to load properties.'; _isLoading = false; });
    }
  }

  void _applyFilters() {
    setState(() {
      _filtered = _properties.where((p) {
        final q = _search.toLowerCase();
        final matchSearch = q.isEmpty ||
            (p['title']    ?? '').toString().toLowerCase().contains(q) ||
            (p['location'] ?? '').toString().toLowerCase().contains(q);
        final matchType = _typeFilter == 'all' ||
            (p['type'] ?? '').toString().toLowerCase() == _typeFilter;
        return matchSearch && matchType;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      body: NestedScrollView(
        controller: _scrollCtrl,
        headerSliverBuilder: (_, _) => [
          _buildSliverAppBar(),
          SliverToBoxAdapter(child: _buildSearchBar()),
          SliverToBoxAdapter(child: _buildTypeChips()),
        ],
        body: _isLoading
            ? _buildSkeleton()
            : _error.isNotEmpty
                ? TErrorState(message: _error, onRetry: _loadProperties)
                : _filtered.isEmpty
                    ? _buildEmpty()
                    : _buildList(),
      ),
    );
  }

  // ── Sliver header ──────────────────────────────────────────
  Widget _buildSliverAppBar() => SliverAppBar(
    automaticallyImplyLeading: false,
    backgroundColor: kBg2,
    expandedHeight: 130,
    pinned: true,
    flexibleSpace: FlexibleSpaceBar(
      background: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0A0F1E), kBg2],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.home_work_rounded, color: kGold, size: 14),
                const SizedBox(width: 6),
                Text('${_filtered.length} properties',
                  style: const TextStyle(color: kSlate, fontSize: 12)),
              ]),
              const SizedBox(height: 8),
              const Text('Browse Properties',
                style: TextStyle(color: kCream, fontSize: 22,
                  fontWeight: FontWeight.w800, letterSpacing: -0.5)),
              const SizedBox(height: 4),
              Container(width: 36, height: 2,
                decoration: BoxDecoration(
                  gradient: kGoldGradient,
                  borderRadius: BorderRadius.circular(1))),
            ]),
          ),
        ),
      ),
    ),
  );

  // ── Search bar ─────────────────────────────────────────────
  Widget _buildSearchBar() => Container(
    color: kBg2,
    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
    child: TextField(
      controller: _searchCtrl,
      onChanged: (v) { _search = v; _applyFilters(); },
      style: const TextStyle(color: kCream, fontSize: 13),
      decoration: InputDecoration(
        hintText: 'Search by name or location…',
        hintStyle: const TextStyle(color: kSlateDim, fontSize: 13),
        prefixIcon: const Icon(Icons.search_rounded, color: kSlate, size: 20),
        suffixIcon: _search.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.close_rounded, color: kSlate, size: 18),
                onPressed: () { _searchCtrl.clear(); _search = ''; _applyFilters(); })
            : null,
        filled: true,
        fillColor: kBg3,
        contentPadding: const EdgeInsets.symmetric(vertical: 0),
        border:        OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kGold, width: 1.5)),
      ),
    ),
  );

  // ── Filter chips ───────────────────────────────────────────
  Widget _buildTypeChips() => Container(
    color: kBg2,
    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
    child: SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: _types.map((t) {
          final sel = _typeFilter == t;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () { _typeFilter = t; _applyFilters(); },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  gradient: sel ? kGoldGradient : null,
                  color: sel ? null : kBg3,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: sel ? kGold : kBorder),
                ),
                child: Text(
                  t == 'all' ? 'All Types' : t[0].toUpperCase() + t.substring(1),
                  style: TextStyle(
                    color: sel ? kBg : kSlate,
                    fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    ),
  );

  // ── Property list ──────────────────────────────────────────
  Widget _buildList() => RefreshIndicator(
    onRefresh: _loadProperties,
    color: kGold,
    backgroundColor: kBg2,
    child: ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      itemCount: _filtered.length,
      itemBuilder: (_, i) => _PropertyCard(
        property: _filtered[i],
        onTap: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) =>
            PropertyDetailPage(property: _filtered[i]))),
      ),
    ),
  );

  // ── Skeleton loader ────────────────────────────────────────
  Widget _buildSkeleton() => ListView(
    padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
    children: List.generate(4, (_) => const _CardSkeleton()),
  );

  // ── Empty state ────────────────────────────────────────────
  Widget _buildEmpty() => const Center(
    child: TEmptyState(
      icon: Icons.home_work_rounded,
      title: 'No properties found',
      subtitle: 'Try adjusting your search or filters.',
    ),
  );
}

// ── Skeleton card ─────────────────────────────────────────────
class _CardSkeleton extends StatefulWidget {
  const _CardSkeleton();
  @override State<_CardSkeleton> createState() => _CardSkeletonState();
}
class _CardSkeletonState extends State<_CardSkeleton> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
  }
  @override void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween<double>(begin: 0.25, end: 0.6).animate(
        CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut)),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        height: 260,
        decoration: BoxDecoration(
          color: kBg2,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: kBorder),
        ),
        child: Column(children: [
          // image area
          Container(
            height: 165,
            decoration: const BoxDecoration(
              color: kBg3,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
          ),
          // info area
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(height: 13, width: 180, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
              const SizedBox(height: 8),
              Container(height: 10, width: 120, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
              const SizedBox(height: 12),
              Row(children: [
                Container(height: 10, width: 60, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
                const SizedBox(width: 12),
                Container(height: 10, width: 60, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }
}

// ── Property card ─────────────────────────────────────────────
class _PropertyCard extends StatelessWidget {
  final Map<String, dynamic> property;
  final VoidCallback onTap;
  const _PropertyCard({required this.property, required this.onTap});

  String get _imageUrl {
    final imgs = property['property_images'] as List?;
    if (imgs != null && imgs.isNotEmpty) {
      return imgs.first['image_path']?.toString() ?? '';
    }
    final fallback = property['images'] as List?;
    if (fallback != null && fallback.isNotEmpty) {
      final first = fallback.first;
      return (first is String ? first : first['image_path']?.toString()) ?? '';
    }
    return '';
  }

  String get _location => (property['location'] ?? property['address'] ?? '').toString();
  String get _type     => (property['type'] ?? '').toString();
  num    get _price    => (property['price'] ?? 0) as num;
  int    get _beds     => (property['bedrooms'] ?? 0) as int;
  int    get _baths    => (property['bathrooms'] ?? 0) as int;
  bool   get _featured => property['featured'] == true;

  String _formatPrice(num p) {
    if (p >= 1000000) return 'TZS ${(p / 1000000).toStringAsFixed(1)}M';
    if (p >= 1000)    return 'TZS ${(p / 1000).toStringAsFixed(0)}K';
    return 'TZS $p';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: kBg2,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: kBorder),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(.18), blurRadius: 14, offset: const Offset(0, 4))],
        ),
        clipBehavior: Clip.hardEdge,
        child: Column(children: [
          // ── Image ──────────────────────────────────────────
          SizedBox(
            height: 180,
            child: Stack(fit: StackFit.expand, children: [
              _imageUrl.isNotEmpty
                  ? Image.network(
                      _imageUrl,
                      fit: BoxFit.cover,
                      // show skeleton color while loading
                      frameBuilder: (ctx, child, frame, _) {
                        if (frame == null) {
                          return Container(color: kBg3,
                            child: const Center(child: Icon(Icons.image_rounded, color: kSlateDim, size: 36)));
                        }
                        return child;
                      },
                      errorBuilder: (_, _, _) => Container(color: kBg3,
                        child: const Center(child: Icon(Icons.image_rounded, color: kSlateDim, size: 36))),
                    )
                  : Container(color: kBg3,
                      child: const Center(child: Icon(Icons.image_rounded, color: kSlateDim, size: 36))),

              // gradient
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter, end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0xEE0A0F1E)],
                    stops: [0.3, 1.0],
                  ),
                ),
              ),

              // Featured badge
              if (_featured)
                Positioned(
                  top: 10, left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: kGoldGradient,
                      borderRadius: BorderRadius.circular(5),
                    ),
                    child: const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.star_rounded, size: 9, color: kBg),
                      SizedBox(width: 4),
                      Text('FEATURED', style: TextStyle(color: kBg, fontSize: 8, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
                    ]),
                  ),
                ),

              // Type badge
              if (_type.isNotEmpty)
                Positioned(
                  bottom: 12, left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                      color: kGoldDim,
                      border: Border.all(color: kGoldBorder),
                      borderRadius: BorderRadius.circular(5),
                    ),
                    child: Text(
                      _type[0].toUpperCase() + _type.substring(1),
                      style: const TextStyle(color: kGold, fontSize: 9, fontWeight: FontWeight.w700)),
                  ),
                ),

              // Price
              Positioned(
                bottom: 12, right: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    gradient: kGoldGradient,
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: Text(
                    _formatPrice(_price),
                    style: const TextStyle(color: kBg, fontSize: 11, fontWeight: FontWeight.w800)),
                ),
              ),
            ]),
          ),

          // ── Info ───────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                (property['title'] ?? 'Untitled Property').toString(),
                style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w700),
                maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 5),
              if (_location.isNotEmpty)
                Row(children: [
                  const Icon(Icons.location_on_rounded, color: kGold, size: 11),
                  const SizedBox(width: 4),
                  Expanded(child: Text(_location,
                    style: const TextStyle(color: kSlate, fontSize: 11),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
                ]),
              const SizedBox(height: 12),
              Divider(color: kGold.withOpacity(0.1), height: 1),
              const SizedBox(height: 12),
              Row(children: [
                if (_beds > 0)  _spec(Icons.bed_rounded,      '$_beds bed'),
                if (_beds > 0 && _baths > 0) _vDivider(),
                if (_baths > 0) _spec(Icons.bathtub_rounded,  '$_baths bath'),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: kGoldDim,
                    border: Border.all(color: kGoldBorder),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text('View Details',
                    style: TextStyle(color: kGold, fontSize: 10, fontWeight: FontWeight.w700)),
                ),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _spec(IconData icon, String label) => Row(children: [
    Icon(icon, color: kGold, size: 12),
    const SizedBox(width: 4),
    Text(label, style: const TextStyle(color: kSlate, fontSize: 11)),
  ]);

  Widget _vDivider() => Container(
    width: 1, height: 12,
    margin: const EdgeInsets.symmetric(horizontal: 10),
    color: kBorder);
}