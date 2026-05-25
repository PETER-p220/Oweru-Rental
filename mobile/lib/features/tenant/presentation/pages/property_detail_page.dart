// ============================================================
// property_detail_page.dart — dark navy/gold + tenant_theme
// ============================================================
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'tenant_theme.dart';

class PropertyDetailPage extends StatefulWidget {
  final Map<String, dynamic> property;
  const PropertyDetailPage({super.key, required this.property});

  @override
  State<PropertyDetailPage> createState() => _PropertyDetailPageState();
}

class _PropertyDetailPageState extends State<PropertyDetailPage>
    with SingleTickerProviderStateMixin {
  int    _selectedImg = 0;
  bool   _isSaved     = false;
  bool   _showAllDesc = false;
  late PageController        _pageCtrl;
  late AnimationController   _fadeCtrl;
  late Animation<double>     _fadeAnim;

  // ── Data helpers ──────────────────────────────────────────
  Map<String, dynamic> get p => widget.property;

  List<String> get _images {
    for (final key in ['property_images', 'propertyImages']) {
      final list = p[key];
      if (list is List && list.isNotEmpty) {
        final urls = list
          .map<String>((i) => (i['image_path'] ?? i['url'] ?? '').toString())
          .where((s) => s.isNotEmpty)
          .toList();
        if (urls.isNotEmpty) return urls;
      }
    }
    final imgs = p['images'];
    if (imgs is List && imgs.isNotEmpty) {
      return imgs
        .map<String>((i) => i is String ? i : (i['image_path'] ?? i['url'] ?? '').toString())
        .where((s) => s.isNotEmpty)
        .toList();
    }
    return [];
  }

  String get _title    => (p['title']       ?? 'Untitled Property').toString();
  String get _location => (p['location']    ?? p['address'] ?? 'Location not specified').toString();
  String get _type     => (p['type']        ?? '').toString();
  String get _desc     => (p['description'] ?? '').toString();
  num get _price {
    final price = p['price'];
    if (price is num) return price;
    if (price is String) {
      try {
        return double.parse(price);
      } catch (_) {
        return 0;
      }
    }
    return 0;
  }
  int get _beds {
    final beds = p['bedrooms'];
    if (beds is int) return beds;
    if (beds is num) return beds.toInt();
    if (beds is String) {
      try { return int.parse(beds); } catch (_) { return 0; }
    }
    return 0;
  }
  int get _baths {
    final baths = p['bathrooms'];
    if (baths is int) return baths;
    if (baths is num) return baths.toInt();
    if (baths is String) {
      try { return int.parse(baths); } catch (_) { return 0; }
    }
    return 0;
  }
  bool   get _featured  => p['featured']  == true;
  bool   get _available => p['available'] != false;
  bool   get _furnished => p['furnished'] == true;

  List<String> get _amenities {
    final a = p['amenities'];
    return a is List ? a.map((e) => e.toString()).toList() : [];
  }

  String _fmt(num price) {
    if (price >= 1000000) return 'TZS ${(price / 1000000).toStringAsFixed(1)}M';
    if (price >= 1000)    return 'TZS ${(price / 1000).toStringAsFixed(0)}K';
    return 'TZS $price';
  }

  String _cap(String s) => s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

  // ── Lifecycle ─────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _pageCtrl = PageController();
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 350));
    _fadeAnim  = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _fadeCtrl.forward();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  void _goToImage(int i) {
    setState(() => _selectedImg = i);
    _pageCtrl.animateToPage(i,
      duration: const Duration(milliseconds: 280), curve: Curves.easeInOut);
  }

  void _prevImg() {
    if (_images.isEmpty) return;
    _goToImage((_selectedImg - 1 + _images.length) % _images.length);
  }
  void _nextImg() {
    if (_images.isEmpty) return;
    _goToImage((_selectedImg + 1) % _images.length);
  }

  // ── Build ─────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      body: FadeTransition(
        opacity: _fadeAnim,
        child: CustomScrollView(
          slivers: [
            _sliverAppBar(),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 48),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 20),
                    _header(),
                    const SizedBox(height: 16),
                    _statsRow(),
                    if (_desc.isNotEmpty) ...[const SizedBox(height: 14), _descCard()],
                    if (_amenities.isNotEmpty) ...[const SizedBox(height: 14), _amenitiesCard()],
                    const SizedBox(height: 14),
                    _detailsCard(),
                    const SizedBox(height: 14),
                    _trustCard(),
                    const SizedBox(height: 24),
                    _ctaButtons(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Sliver app bar + gallery ──────────────────────────────
  Widget _sliverAppBar() => SliverAppBar(
    expandedHeight: 340,
    pinned: true,
    backgroundColor: kBg,
    leading: Padding(
      padding: const EdgeInsets.all(8),
      child: GestureDetector(
        onTap: () => Navigator.pop(context),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black54,
            shape: BoxShape.circle,
            border: Border.all(color: kGoldBorder),
          ),
          child: const Icon(Icons.arrow_back_ios_new_rounded, color: kCream, size: 16),
        ),
      ),
    ),
    actions: [
      Padding(
        padding: const EdgeInsets.all(8),
        child: GestureDetector(
          onTap: () {
            setState(() => _isSaved = !_isSaved);
            _snack(_isSaved ? 'Property saved!' : 'Removed from saved', kGold);
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: _isSaved ? kGoldDim : Colors.black54,
              shape: BoxShape.circle,
              border: Border.all(color: _isSaved ? kGold : kGoldBorder),
            ),
            child: Icon(
              _isSaved ? Icons.bookmark_rounded : Icons.bookmark_outline_rounded,
              color: _isSaved ? kGold : kCream, size: 18),
          ),
        ),
      ),
    ],
    flexibleSpace: FlexibleSpaceBar(background: _gallery()),
  );

  Widget _gallery() {
    final imgs = _images;
    return Stack(fit: StackFit.expand, children: [
      // Image PageView
      imgs.isEmpty
          ? Container(color: kBg2,
              child: const Center(child: Icon(Icons.image_rounded, color: kSlateDim, size: 56)))
          : PageView.builder(
              controller: _pageCtrl,
              onPageChanged: (i) => setState(() => _selectedImg = i),
              itemCount: imgs.length,
              itemBuilder: (_, i) => Image.network(
                imgs[i],
                fit: BoxFit.cover,
                frameBuilder: (ctx, child, frame, _) => frame == null
                    ? Container(color: kBg2,
                        child: const Center(child: CircularProgressIndicator(
                          color: kGold, strokeWidth: 1.5)))
                    : child,
                errorBuilder: (_, _, _) => Container(color: kBg2,
                  child: const Center(child: Icon(Icons.image_rounded, color: kSlateDim, size: 48))),
              ),
            ),

      // Dark gradient
      Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter, end: Alignment.bottomCenter,
            colors: [Colors.transparent, Color(0xDD0A0F1E)],
            stops: [0.35, 1.0],
          ),
        ),
      ),

      // Featured badge
      if (_featured)
        Positioned(
          top: 56, left: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              gradient: kGoldGradient,
              borderRadius: BorderRadius.circular(5),
            ),
            child: const Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.star_rounded, size: 10, color: kBg),
              SizedBox(width: 4),
              Text('FEATURED', style: TextStyle(color: kBg, fontSize: 9,
                fontWeight: FontWeight.w800, letterSpacing: 1.2)),
            ]),
          ),
        ),

      // Nav arrows
      if (imgs.length > 1) ...[
        Positioned(left: 12, top: 0, bottom: 0,
          child: Center(child: _navBtn(Icons.chevron_left_rounded, _prevImg))),
        Positioned(right: 12, top: 0, bottom: 0,
          child: Center(child: _navBtn(Icons.chevron_right_rounded, _nextImg))),
      ],

      // Image counter
      if (imgs.length > 1)
        Positioned(
          bottom: 58, right: 14,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.black54,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.camera_alt_rounded, size: 10, color: kCream),
              const SizedBox(width: 5),
              Text('${_selectedImg + 1} / ${imgs.length}',
                style: const TextStyle(color: kCream, fontSize: 11, fontWeight: FontWeight.w500)),
            ]),
          ),
        ),

      // Thumbnail strip
      if (imgs.length > 1)
        Positioned(
          bottom: 0, left: 0, right: 0,
          child: Container(
            height: 52,
            color: kBg.withOpacity(.85),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              itemCount: imgs.length,
              itemBuilder: (_, i) {
                final active = _selectedImg == i;
                return GestureDetector(
                  onTap: () => _goToImage(i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    margin: const EdgeInsets.only(right: 7),
                    width: 58, height: 40,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(5),
                      border: Border.all(
                        color: active ? kGold : Colors.transparent, width: 1.8),
                      boxShadow: active
                          ? [BoxShadow(color: kGold.withOpacity(.3), blurRadius: 5)]
                          : null,
                    ),
                    clipBehavior: Clip.hardEdge,
                    child: Opacity(
                      opacity: active ? 1.0 : 0.42,
                      child: Image.network(imgs[i], fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(color: kBg2)),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
    ]);
  }

  Widget _navBtn(IconData icon, VoidCallback onTap) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 38, height: 38,
      decoration: BoxDecoration(
        color: Colors.black54,
        shape: BoxShape.circle,
        border: Border.all(color: kGoldBorder),
      ),
      child: Icon(icon, color: kCream, size: 20),
    ),
  );

  // ── Header ────────────────────────────────────────────────
  Widget _header() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Wrap(spacing: 8, runSpacing: 6, children: [
        if (_type.isNotEmpty) _tag(_cap(_type)),
        if (_featured)  _pill('FEATURED',  kGold),
        if (_available) _pill('AVAILABLE', kSuccess),
        if (_furnished) _pill('FURNISHED', kWarning),
      ]),
      const SizedBox(height: 12),
      Text(_title,
        style: const TextStyle(color: kCream, fontSize: 24,
          fontWeight: FontWeight.w800, letterSpacing: -0.5, height: 1.2)),
      const SizedBox(height: 8),
      Row(children: [
        const Icon(Icons.location_on_rounded, color: kGold, size: 13),
        const SizedBox(width: 5),
        Expanded(child: Text(_location,
          style: const TextStyle(color: kSlate, fontSize: 13), maxLines: 2)),
      ]),
      const SizedBox(height: 14),
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: kBg2,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: kGoldBorder),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('MONTHLY RENT',
                style: TextStyle(color: kSlateDim, fontSize: 9,
                  fontWeight: FontWeight.w700, letterSpacing: 1.5)),
              const SizedBox(height: 5),
              Text(_fmt(_price),
                style: const TextStyle(color: kGold, fontSize: 26,
                  fontWeight: FontWeight.w800, letterSpacing: -0.5)),
              const Text('per month',
                style: TextStyle(color: kSlate, fontSize: 11)),
            ]),
            Container(
              width: 50, height: 50,
              decoration: BoxDecoration(
                color: kGoldDim, borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kGoldBorder)),
              child: const Icon(Icons.apartment_rounded, color: kGold, size: 24),
            ),
          ],
        ),
      ),
    ],
  );

  Widget _tag(String label) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 4),
    decoration: BoxDecoration(
      color: kGoldDim, border: Border.all(color: kGoldBorder),
      borderRadius: BorderRadius.circular(4)),
    child: Text(label.toUpperCase(),
      style: const TextStyle(color: kGold, fontSize: 9,
        fontWeight: FontWeight.w700, letterSpacing: 1.6)),
  );

  Widget _pill(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
    decoration: BoxDecoration(
      color: color.withOpacity(.12), border: Border.all(color: color.withOpacity(.3)),
      borderRadius: BorderRadius.circular(20)),
    child: Text(label,
      style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
  );

  // ── Stats row ─────────────────────────────────────────────
  Widget _statsRow() {
    final stats = <Map<String, dynamic>>[];
    if (_beds  > 0) stats.add({'icon': Icons.bed_rounded,     'label': 'BEDROOMS',  'value': '$_beds'});
    if (_baths > 0) stats.add({'icon': Icons.bathtub_rounded, 'label': 'BATHROOMS', 'value': '$_baths'});
    if (_type.isNotEmpty) stats.add({'icon': Icons.home_rounded, 'label': 'TYPE', 'value': _cap(_type)});
    if (stats.isEmpty) return const SizedBox.shrink();
    return Row(
      children: List.generate(stats.length, (i) {
        final s = stats[i];
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(right: i < stats.length - 1 ? 10 : 0),
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: kBg2, borderRadius: BorderRadius.circular(10),
              border: Border.all(color: kBorder)),
            child: Column(children: [
              Icon(s['icon'] as IconData, color: kGold, size: 20),
              const SizedBox(height: 7),
              Text(s['value'] as String,
                style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w800)),
              const SizedBox(height: 3),
              Text(s['label'] as String,
                style: const TextStyle(color: kSlateDim, fontSize: 8,
                  fontWeight: FontWeight.w600, letterSpacing: 0.9)),
            ]),
          ),
        );
      }),
    );
  }

  // ── Description ───────────────────────────────────────────
  Widget _descCard() => _card(
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _tag('About this property'),
      const SizedBox(height: 12),
      AnimatedCrossFade(
        firstChild: Text(_desc,
          maxLines: 4, overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: kSlate, fontSize: 13, height: 1.8)),
        secondChild: Text(_desc,
          style: const TextStyle(color: kSlate, fontSize: 13, height: 1.8)),
        crossFadeState: _showAllDesc ? CrossFadeState.showSecond : CrossFadeState.showFirst,
        duration: const Duration(milliseconds: 220),
      ),
      if (_desc.length > 200) ...[
        const SizedBox(height: 10),
        GestureDetector(
          onTap: () => setState(() => _showAllDesc = !_showAllDesc),
          child: Text(_showAllDesc ? 'Show less ↑' : 'Read more ↓',
            style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
        ),
      ],
    ]),
  );

  // ── Amenities ─────────────────────────────────────────────
  Widget _amenitiesCard() => _card(
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _tag('Amenities & Features'),
      const SizedBox(height: 14),
      Wrap(
        spacing: 8, runSpacing: 8,
        children: _amenities.map((a) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: kGoldDim, border: Border.all(color: kGoldBorder),
            borderRadius: BorderRadius.circular(6)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.check_circle_rounded, color: kSuccess, size: 11),
            const SizedBox(width: 6),
            Text(a, style: const TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w500)),
          ]),
        )).toList(),
      ),
    ]),
  );

  // ── Details ───────────────────────────────────────────────
  Widget _detailsCard() => _card(
    topAccent: true,
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _tag('Property Details'),
      const SizedBox(height: 14),
      _row('Property Type', _type.isNotEmpty ? _cap(_type) : 'N/A'),
      _row('Availability',  _available ? 'Available Now' : 'Not Available',
        valueColor: _available ? kSuccess : kDanger),
      _row('Furnished',     _furnished ? 'Yes' : 'No'),
      if (_beds  > 0) _row('Bedrooms',  '$_beds'),
      if (_baths > 0) _row('Bathrooms', '$_baths'),
      if (p['dalali'] != null)
        _row('Agent Code',
          (p['dalali']['code'] ?? 'N/A').toString(),
          valueColor: kGold, mono: true),
    ]),
  );

  Widget _row(String label, String value, {Color? valueColor, bool mono = false}) =>
    Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: kGold.withOpacity(.08)))),
      child: Row(children: [
        Expanded(child: Text(label,
          style: const TextStyle(color: kSlate, fontSize: 12))),
        Text(value,
          style: TextStyle(
            color: valueColor ?? kCream, fontSize: 12.5, fontWeight: FontWeight.w600,
            fontFamily: mono ? 'monospace' : null)),
      ]),
    );

  // ── Trust ─────────────────────────────────────────────────
  Widget _trustCard() => _card(
    child: Column(children: [
      _trustRow(Icons.verified_rounded,     'Verified Listing'),
      _trustRow(Icons.lock_rounded,          'Secure Application Process'),
      _trustRow(Icons.support_agent_rounded, 'Tenant Support 24/7'),
    ]),
  );

  Widget _trustRow(IconData icon, String label) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 9),
    child: Row(children: [
      Container(
        width: 28, height: 28,
        decoration: BoxDecoration(color: kGoldDim, borderRadius: BorderRadius.circular(7)),
        child: Icon(icon, color: kGold, size: 14)),
      const SizedBox(width: 12),
      Text(label, style: const TextStyle(color: kSlate, fontSize: 12)),
    ]),
  );

  // ── CTA ───────────────────────────────────────────────────
  Widget _ctaButtons() => Column(children: [
    TGoldButton(
      label: 'APPLY FOR THIS PROPERTY',
      icon: Icons.send_rounded,
      onTap: _showApplyDialog,
    ),
    const SizedBox(height: 10),
    GestureDetector(
      onTap: () => setState(() => _isSaved = !_isSaved),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: _isSaved ? kGoldDim : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: _isSaved ? kGold : kGoldBorder)),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(_isSaved ? Icons.bookmark_rounded : Icons.bookmark_outline_rounded,
            color: _isSaved ? kGold : kSlate, size: 16),
          const SizedBox(width: 8),
          Text(_isSaved ? 'SAVED TO MY LIST' : 'SAVE PROPERTY',
            style: TextStyle(
              color: _isSaved ? kGold : kSlate,
              fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 0.9)),
        ]),
      ),
    ),
    const SizedBox(height: 10),
    TGhostButton(label: 'SCHEDULE A VIEWING', onTap: _showScheduleDialog),
  ]);

  // ── Dialogs ───────────────────────────────────────────────
  void _showApplyDialog() => showDialog(
    context: context,
    barrierColor: Colors.black87,
    builder: (_) => _ThemedDialog(
      accentColor: kGold,
      icon: Icons.shield_rounded,
      title: 'Apply for Property',
      body: 'Submit your rental application. The owner will review and respond shortly.',
      confirmLabel: 'CONFIRM',
      onConfirm: () { Navigator.pop(context); _snack('Application submitted!', kSuccess); },
      onCancel:  () => Navigator.pop(context),
    ),
  );

  void _showScheduleDialog() => showDialog(
    context: context,
    barrierColor: Colors.black87,
    builder: (_) => _ThemedDialog(
      accentColor: kWarning,
      icon: Icons.calendar_today_rounded,
      title: 'Schedule a Viewing',
      body: 'A viewing request will be sent to the owner. They will confirm a suitable time.',
      confirmLabel: 'SEND REQUEST',
      onConfirm: () { Navigator.pop(context); _snack('Viewing request sent!', kWarning); },
      onCancel:  () => Navigator.pop(context),
    ),
  );

  void _snack(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        Icon(Icons.check_circle_rounded, color: color, size: 15),
        const SizedBox(width: 8),
        Expanded(child: Text(msg, style: const TextStyle(color: kCream, fontSize: 12))),
      ]),
      backgroundColor: kBg2,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      duration: const Duration(seconds: 3),
    ));
  }

  // ── Card wrapper ──────────────────────────────────────────
  Widget _card({required Widget child, bool topAccent = false}) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: kBg2, borderRadius: BorderRadius.circular(12),
      border: Border.all(color: topAccent ? kGoldBorder : kBorder)),
    child: topAccent
        ? Stack(children: [
            Positioned(top: 0, left: 0, right: 0,
              child: Container(height: 2,
                decoration: const BoxDecoration(
                  gradient: kGoldGradient,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(12), topRight: Radius.circular(12))))),
            Padding(padding: const EdgeInsets.only(top: 4), child: child),
          ])
        : child,
  );
}

// ── Reusable themed dialog ────────────────────────────────────
class _ThemedDialog extends StatelessWidget {
  final Color     accentColor;
  final IconData  icon;
  final String    title;
  final String    body;
  final String    confirmLabel;
  final VoidCallback onConfirm;
  final VoidCallback onCancel;

  const _ThemedDialog({
    required this.accentColor,
    required this.icon,
    required this.title,
    required this.body,
    required this.confirmLabel,
    required this.onConfirm,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) => Dialog(
    backgroundColor: kBg2,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    child: Stack(children: [
      Positioned(top: 0, left: 0, right: 0,
        child: Container(height: 2,
          decoration: BoxDecoration(
            color: accentColor,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(14), topRight: Radius.circular(14))))),
      Padding(
        padding: const EdgeInsets.fromLTRB(24, 30, 24, 24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 52, height: 52,
            decoration: BoxDecoration(
              color: accentColor.withOpacity(.12), shape: BoxShape.circle,
              border: Border.all(color: accentColor.withOpacity(.3))),
            child: Icon(icon, color: accentColor, size: 22)),
          const SizedBox(height: 14),
          Text(title,
            style: const TextStyle(color: kCream, fontSize: 19, fontWeight: FontWeight.w800),
            textAlign: TextAlign.center),
          const SizedBox(height: 9),
          Text(body,
            style: const TextStyle(color: kSlate, fontSize: 12, height: 1.7),
            textAlign: TextAlign.center),
          const SizedBox(height: 22),
          Row(children: [
            Expanded(
              child: ElevatedButton(
                onPressed: onConfirm,
                style: ElevatedButton.styleFrom(
                  backgroundColor: accentColor, foregroundColor: kBg, elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                child: Text(confirmLabel,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton(
                onPressed: onCancel,
                style: OutlinedButton.styleFrom(
                  foregroundColor: kSlate, side: const BorderSide(color: kBorder),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                child: const Text('CANCEL',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.8)),
              ),
            ),
          ]),
        ]),
      ),
    ]),
  );
}