// ============================================================
// SAVED PROPERTIES PAGE — homepage color scheme
// ============================================================
import 'package:flutter/material.dart';
import '../../../../shared/services/tenant_api_service.dart';
import 'tenant_theme.dart';

class SavedPropertiesPage extends StatefulWidget {
  const SavedPropertiesPage({super.key});
  @override
  State<SavedPropertiesPage> createState() => _SavedPropertiesPageState();
}

class _SavedPropertiesPageState extends State<SavedPropertiesPage> {
  List<Map<String, dynamic>> _properties = [];
  bool _isLoading = true;
  String _error = '';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = ''; });
    try {
      final data = await TenantApiService.getSavedProperties();
      if (mounted) setState(() { _properties = data; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  List<Map<String, dynamic>> get _filtered => _properties.where((p) {
    final q = _searchQuery.toLowerCase();
    return q.isEmpty ||
        (p['title']?.toString() ?? '').toLowerCase().contains(q) ||
        (p['location']?.toString() ?? '').toLowerCase().contains(q);
  }).toList();

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    appBar: _appBar(),
    body: _isLoading
        ? _skeleton()
        : _error.isNotEmpty
            ? TErrorState(message: _error, onRetry: _load)
            : RefreshIndicator(
                onRefresh: _load,
                color: kGold,
                backgroundColor: kBg2,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                  children: [
                    _searchBar(),
                    const SizedBox(height: 16),
                    if (_filtered.isEmpty)
                      const TEmptyState(
                        icon: Icons.favorite_rounded,
                        title: 'No saved properties',
                        subtitle: 'Save properties you like to compare and apply later.',
                      )
                    else
                      ..._filtered.map(_card),
                  ],
                ),
              ),
  );

  PreferredSizeWidget _appBar() => AppBar(
    backgroundColor: kBg2,
    elevation: 0,
    iconTheme: const IconThemeData(color: kGold),
    title: const Text('Saved Properties',
      style: TextStyle(color: kCream, fontSize: 17, fontWeight: FontWeight.w700)),
    actions: [
      IconButton(onPressed: _load,
        icon: const Icon(Icons.refresh_rounded, color: kGold, size: 20)),
    ],
  );

  Widget _searchBar() => TextField(
    onChanged: (v) => setState(() => _searchQuery = v),
    style: const TextStyle(color: kCream, fontSize: 13),
    decoration: InputDecoration(
      hintText: 'Search saved properties...',
      hintStyle: const TextStyle(color: kSlateDim, fontSize: 13),
      prefixIcon: const Icon(Icons.search_rounded, color: kSlate, size: 20),
      filled: true, fillColor: kBg2,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border:        OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kBorder)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kBorder)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kGold)),
    ),
  );

  Widget _card(Map<String, dynamic> prop) {
    final title     = prop['title']?.toString() ?? 'Property';
    final location  = prop['location']?.toString() ?? '';
    final price     = prop['price'] ?? 0;
    final bedrooms  = prop['bedrooms'] ?? 1;
    final bathrooms = prop['bathrooms'] ?? 1;
    final area      = prop['area'] ?? 0;
    final type      = prop['type']?.toString() ?? 'Residential';
    final id        = prop['id'] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: kBg2, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder)),
      clipBehavior: Clip.antiAlias,
      child: Column(children: [
        // Image
        Stack(children: [
          Container(
            height: 175,
            decoration: BoxDecoration(
              color: kBg3,
              image: DecorationImage(
                image: NetworkImage('https://picsum.photos/seed/prop$id/400/300'),
                fit: BoxFit.cover)),
          ),
          // gradient overlay
          Container(height: 175,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter, end: Alignment.bottomCenter,
                colors: [Colors.transparent, kBg.withOpacity(0.6)]))),
          // type badge
          Positioned(top: 10, left: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: kGoldDim, borderRadius: BorderRadius.circular(5),
                border: Border.all(color: kGoldBorder)),
              child: Text(type.toUpperCase(),
                style: const TextStyle(color: kGold, fontSize: 9, fontWeight: FontWeight.w700)))),
          // remove button
          Positioned(top: 8, right: 8,
            child: Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: kDanger.withOpacity(0.9), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.favorite, color: kWhite, size: 16))),
        ]),
        // Details
        Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title,
              style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 5),
            if (location.isNotEmpty)
              Row(children: [
                const Icon(Icons.location_on, size: 11, color: kGold),
                const SizedBox(width: 4),
                Expanded(child: Text(location,
                  style: const TextStyle(color: kSlate, fontSize: 11),
                  overflow: TextOverflow.ellipsis)),
              ]),
            const SizedBox(height: 12),
            // Stats row
            Row(children: [
              _statChip(Icons.bed_rounded, '$bedrooms bed'),
              const SizedBox(width: 8),
              _statChip(Icons.bathroom_rounded, '$bathrooms bath'),
              const SizedBox(width: 8),
              _statChip(Icons.square_foot_rounded, '${area}m²'),
            ]),
            const SizedBox(height: 12),
            Divider(color: kGold.withOpacity(0.1), height: 1),
            const SizedBox(height: 12),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Price', style: TextStyle(color: kSlateDim, fontSize: 10)),
                Text('TZS $price',
                  style: const TextStyle(color: kGold, fontSize: 15, fontWeight: FontWeight.w700)),
              ]),
              TGoldButton(label: 'Apply Now', onTap: () {}, fullWidth: false),
            ]),
          ]),
        ),
      ]),
    );
  }

  Widget _statChip(IconData icon, String label) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
    decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(6),
      border: Border.all(color: kBorder)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 11, color: kGold),
      const SizedBox(width: 4),
      Text(label, style: const TextStyle(color: kSlate, fontSize: 10, fontWeight: FontWeight.w500)),
    ]),
  );

  Widget _skeleton() => ListView(
    padding: const EdgeInsets.all(16),
    children: List.generate(3, (_) => const TSkeletonCard(height: 260)),
  );
}