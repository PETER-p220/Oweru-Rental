// ============================================================
// APPLICATIONS PAGE — homepage color scheme
// ============================================================
import 'package:flutter/material.dart';
import '../../../../shared/services/tenant_api_service.dart';
import 'payments_page.dart';
import 'tenant_theme.dart';

class ApplicationsPage extends StatefulWidget {
  const ApplicationsPage({super.key});
  @override
  State<ApplicationsPage> createState() => _ApplicationsPageState();
}

class _ApplicationsPageState extends State<ApplicationsPage> {
  List<Map<String, dynamic>> _applications = [];
  bool _isLoading = true;
  String _error = '';
  String _filter = 'all';

  static const _filters = ['all', 'approved', 'pending', 'rejected'];

  static const _statusColors = {
    'approved': kSuccess,
    'pending':  kWarning,
    'rejected': kDanger,
    'active':   kInfo,
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = ''; });
    try {
      final data = await TenantApiService.getApplications();
      if (mounted) setState(() { _applications = data; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  List<Map<String, dynamic>> get _filtered => _filter == 'all'
      ? _applications
      : _applications.where((a) =>
          (a['status']?.toString().toLowerCase()) == _filter).toList();

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
                    _filterRow(),
                    const SizedBox(height: 16),
                    if (_filtered.isEmpty)
                      const TEmptyState(
                        icon: Icons.description_rounded,
                        title: 'No applications yet',
                        subtitle: 'Apply for a property to track the status of your rental applications.',
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
    title: const Text('My Applications',
      style: TextStyle(color: kCream, fontSize: 17, fontWeight: FontWeight.w700)),
    actions: [
      IconButton(
        onPressed: _load,
        icon: const Icon(Icons.refresh_rounded, color: kGold, size: 20)),
    ],
  );

  Widget _filterRow() => SingleChildScrollView(
    scrollDirection: Axis.horizontal,
    child: Row(children: _filters.map((f) {
      final sel = _filter == f;
      return Padding(
        padding: const EdgeInsets.only(right: 8),
        child: GestureDetector(
          onTap: () => setState(() => _filter = f),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: sel ? kGold : kBg2,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: sel ? kGold : kGoldBorder)),
            child: Text(f.toUpperCase(),
              style: TextStyle(
                color: sel ? kBg : kSlate,
                fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
          ),
        ),
      );
    }).toList()),
  );

  Widget _card(Map<String, dynamic> app) {
    final status    = (app['status']?.toString() ?? 'pending').toLowerCase();
    final color     = _statusColors[status] ?? kSlate;
    final property  = app['property'] as Map<String, dynamic>?;
    final title     = property?['title']?.toString() ?? 'Property';
    final location  = property?['location']?.toString() ?? '';
    final rent      = property?['price'] ?? app['rent'] ?? 0;
    final message   = app['message']?.toString() ?? 'Application submitted';
    final createdAt = app['created_at']?.toString() ?? 'Recently';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: kBg2, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder)),
      child: Column(children: [
        // Header row
        Padding(
          padding: const EdgeInsets.all(14),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(width: 48, height: 48,
              decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kGoldBorder)),
              child: const Icon(Icons.apartment_rounded, color: kGold, size: 22)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title,
                style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
              if (location.isNotEmpty) ...[
                const SizedBox(height: 2),
                Row(children: [
                  const Icon(Icons.location_on, size: 10, color: kGold),
                  const SizedBox(width: 3),
                  Text(location, style: const TextStyle(color: kSlate, fontSize: 11)),
                ]),
              ],
              const SizedBox(height: 6),
              TStatusBadge(label: status, color: color),
            ])),
            Text(createdAt, style: const TextStyle(color: kSlateDim, fontSize: 10)),
          ]),
        ),
        Divider(color: kGold.withOpacity(0.1), height: 1),
        // Footer row
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Monthly Rent', style: TextStyle(color: kSlateDim, fontSize: 10)),
                Text('TZS $rent',
                  style: const TextStyle(color: kGold, fontSize: 14, fontWeight: FontWeight.w700)),
              ]),
              if (status == 'approved')
                TGoldButton(
                  label: 'Make Payment',
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const PaymentsPage()),
                  ),
                  fullWidth: false,
                ),
            ]),
            const SizedBox(height: 8),
            Text(message, style: const TextStyle(color: kSlate, fontSize: 11, height: 1.5)),
          ]),
        ),
      ]),
    );
  }

  Widget _skeleton() => ListView(
    padding: const EdgeInsets.all(16),
    children: List.generate(4, (_) => const TSkeletonCard(height: 140)),
  );
}