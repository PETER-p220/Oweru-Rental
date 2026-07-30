import 'package:flutter/material.dart';
import '../../../../core/utils/property_images.dart';
import '../../../../shared/services/bnb_api_service.dart';
import 'tenant_bnb_property_detail_page.dart';
import 'tenant_theme.dart';

class TenantBrowseBnbPage extends StatefulWidget {
  const TenantBrowseBnbPage({super.key});

  @override
  State<TenantBrowseBnbPage> createState() => _TenantBrowseBnbPageState();
}

class _TenantBrowseBnbPageState extends State<TenantBrowseBnbPage> {
  List<Map<String, dynamic>> _properties = [];
  bool _loading = true;
  String _error = '';
  String _search = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = ''; });
    try {
      final list = await BnbApiService.getPublicList(
        search: _search.trim().isEmpty ? null : _search.trim(),
      );
      if (!mounted) return;
      setState(() {
        _properties = list;
        _loading = false;
        if (list.isEmpty) _error = '';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not load BnB stays.';
        _loading = false;
      });
      debugPrint('TenantBrowseBnbPage._load: $e');
    }
  }

  int _propertyId(Map<String, dynamic> p) {
    final raw = p['id'];
    if (raw is int) return raw;
    return int.tryParse(raw?.toString() ?? '') ?? 0;
  }

  String _fmt(num? n) {
    final v = (n ?? 0).toDouble();
    if (v >= 1000000) return 'TZS ${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000) return 'TZS ${(v / 1000).toStringAsFixed(0)}k';
    return 'TZS ${v.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: tenantPageAppBar('Browse BnB Stays'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search by title or location…',
                prefixIcon: const Icon(Icons.search_rounded, color: kSlate500),
                filled: true,
                fillColor: kWhite,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kBorder)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kBorder)),
              ),
              onSubmitted: (_) { setState(() => _search = _searchCtrl.text); _load(); },
            ),
          ),
          Expanded(
            child: _loading
                ? ListView(padding: const EdgeInsets.all(16), children: List.generate(4, (_) => const TSkeletonCard(height: 100)))
                : _error.isNotEmpty
                    ? TErrorState(message: _error, onRetry: _load)
                    : RefreshIndicator(
                        onRefresh: _load,
                        color: kGold,
                        child: _properties.isEmpty
                            ? ListView(children: const [
                                SizedBox(height: 80),
                                Center(child: Text('No short stays found', style: TextStyle(color: kSlate500))),
                              ])
                            : ListView.builder(
                                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                                itemCount: _properties.length,
                                itemBuilder: (_, i) {
                                  final p = _properties[i];
                                  final id = _propertyId(p);
                                  if (id <= 0) return const SizedBox.shrink();
                                  final img = getPropertyImageUrl(p);
                                  return GestureDetector(
                                    onTap: () => Navigator.push(context, MaterialPageRoute(
                                      builder: (_) => TenantBnbPropertyDetailPage(propertyId: id),
                                    )),
                                    child: Container(
                                      margin: const EdgeInsets.only(bottom: 12),
                                      decoration: BoxDecoration(
                                        color: kWhite,
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(color: kBorder),
                                      ),
                                      child: Row(
                                        children: [
                                          ClipRRect(
                                            borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
                                            child: img.isNotEmpty
                                                ? Image.network(img, width: 96, height: 96, fit: BoxFit.cover)
                                                : Container(width: 96, height: 96, color: kSlate200, child: const Icon(Icons.hotel_rounded, color: kSlate400)),
                                          ),
                                          Expanded(
                                            child: Padding(
                                              padding: const EdgeInsets.all(12),
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(p['title']?.toString() ?? 'Stay', maxLines: 1, overflow: TextOverflow.ellipsis,
                                                      style: const TextStyle(fontWeight: FontWeight.w700, color: kSlate800, fontSize: 14)),
                                                  const SizedBox(height: 4),
                                                  Text(p['location']?.toString() ?? '—', style: const TextStyle(color: kSlate500, fontSize: 12)),
                                                  const SizedBox(height: 8),
                                                  Text('${_fmt(num.tryParse(p['price']?.toString() ?? '0'))}/night',
                                                      style: const TextStyle(color: kGold, fontWeight: FontWeight.w800, fontSize: 13)),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ),
          ),
        ],
      ),
    );
  }
}
