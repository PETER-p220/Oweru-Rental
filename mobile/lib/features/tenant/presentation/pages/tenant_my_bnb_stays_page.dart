import 'package:flutter/material.dart';
import '../../../../shared/services/bnb_api_service.dart';
import 'tenant_theme.dart';

class TenantMyBnbStaysPage extends StatefulWidget {
  const TenantMyBnbStaysPage({super.key});

  @override
  State<TenantMyBnbStaysPage> createState() => _TenantMyBnbStaysPageState();
}

class _TenantMyBnbStaysPageState extends State<TenantMyBnbStaysPage> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<Map<String, dynamic>> _bookings = [];
  List<Map<String, dynamic>> _reviews = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = ''; });
    try {
      final results = await Future.wait([
        BnbApiService.getMyBookings(),
        BnbApiService.getMyReviews(),
      ]);
      setState(() {
        _bookings = results[0];
        _reviews = results[1];
        _loading = false;
      });
    } catch (_) {
      setState(() { _error = 'Unable to load stays.'; _loading = false; });
    }
  }

  String _fmt(num? n) {
    final v = (n ?? 0).toDouble();
    if (v >= 1000000) return 'TZS ${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000) return 'TZS ${(v / 1000).toStringAsFixed(0)}k';
    return 'TZS ${v.toStringAsFixed(0)}';
  }

  String _fmtDate(String? s) {
    if (s == null || s.isEmpty) return '—';
    final d = DateTime.tryParse(s);
    if (d == null) return s;
    return '${d.day}/${d.month}/${d.year}';
  }

  Future<void> _submitReview(Map<String, dynamic> booking) async {
    int rating = 5;
    final commentCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Review stay'),
        content: StatefulBuilder(builder: (context, setLocal) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) {
              return IconButton(
                icon: Icon(i < rating ? Icons.star : Icons.star_border, color: kGold),
                onPressed: () => setLocal(() => rating = i + 1),
              );
            })),
            TextField(controller: commentCtrl, maxLines: 3, decoration: const InputDecoration(hintText: 'Your review (min 10 chars)')),
          ],
        )),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Submit')),
        ],
      ),
    );
    if (ok != true || commentCtrl.text.trim().length < 10) return;
    final propertyId = booking['property_id'] as int? ?? booking['property']?['id'] as int? ?? 0;
    final res = await BnbApiService.submitMyReview(
      propertyId: propertyId,
      bookingId: booking['id'] as int,
      rating: rating,
      comment: commentCtrl.text.trim(),
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(res['success'] == true ? 'Review submitted' : (res['message']?.toString() ?? 'Failed')),
    ));
    if (res['success'] == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    final reviewable = _bookings.where((b) => b['can_review'] == true).length;

    return Scaffold(
      backgroundColor: kBg,
      appBar: tenantPageAppBar('My Stays'),
      body: _loading
          ? ListView(padding: const EdgeInsets.all(16), children: List.generate(4, (_) => const TSkeletonCard()))
          : _error.isNotEmpty
              ? TErrorState(message: _error, onRetry: _load)
              : Column(
                  children: [
                    if (reviewable > 0)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.all(16),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(color: kGold.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12), border: Border.all(color: kGold.withValues(alpha: 0.3))),
                        child: Text('$reviewable stay${reviewable > 1 ? 's' : ''} ready to review', style: const TextStyle(color: kSlate800, fontWeight: FontWeight.w600)),
                      ),
                    TabBar(
                      controller: _tabs,
                      labelColor: kGold,
                      unselectedLabelColor: kSlate500,
                      indicatorColor: kGold,
                      tabs: const [Tab(text: 'Bookings'), Tab(text: 'Reviews')],
                    ),
                    Expanded(
                      child: TabBarView(
                        controller: _tabs,
                        children: [
                          RefreshIndicator(
                            onRefresh: _load,
                            color: kGold,
                            child: _bookings.isEmpty
                                ? ListView(children: const [SizedBox(height: 60), Center(child: Text('No stays yet', style: TextStyle(color: kSlate500)))])
                                : ListView.builder(
                                    padding: const EdgeInsets.all(16),
                                    itemCount: _bookings.length,
                                    itemBuilder: (_, i) {
                                      final b = _bookings[i];
                                      final title = b['property']?['title']?.toString() ?? 'Stay';
                                      return Container(
                                        margin: const EdgeInsets.only(bottom: 10),
                                        padding: const EdgeInsets.all(14),
                                        decoration: BoxDecoration(color: kWhite, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
                                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, color: kSlate800)),
                                          const SizedBox(height: 6),
                                          Text('${_fmtDate(b['check_in']?.toString())} → ${_fmtDate(b['check_out']?.toString())}', style: const TextStyle(color: kSlate500, fontSize: 12)),
                                          const SizedBox(height: 8),
                                          Row(children: [
                                            Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: kSlate100, borderRadius: BorderRadius.circular(999)), child: Text(b['status']?.toString() ?? '—', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600))),
                                            const Spacer(),
                                            Text(_fmt(num.tryParse(b['total_price']?.toString() ?? '0')), style: const TextStyle(color: kGold, fontWeight: FontWeight.w800)),
                                          ]),
                                          if (b['can_review'] == true) ...[
                                            const SizedBox(height: 10),
                                            SizedBox(width: double.infinity, child: OutlinedButton(onPressed: () => _submitReview(b), child: const Text('Write review'))),
                                          ],
                                        ]),
                                      );
                                    },
                                  ),
                          ),
                          RefreshIndicator(
                            onRefresh: _load,
                            color: kGold,
                            child: _reviews.isEmpty
                                ? ListView(children: const [SizedBox(height: 60), Center(child: Text('No reviews yet', style: TextStyle(color: kSlate500)))])
                                : ListView.builder(
                                    padding: const EdgeInsets.all(16),
                                    itemCount: _reviews.length,
                                    itemBuilder: (_, i) {
                                      final r = _reviews[i];
                                      return Container(
                                        margin: const EdgeInsets.only(bottom: 10),
                                        padding: const EdgeInsets.all(14),
                                        decoration: BoxDecoration(color: kWhite, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
                                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                          Text(r['property']?['title']?.toString() ?? 'Property', style: const TextStyle(fontWeight: FontWeight.w700)),
                                          const SizedBox(height: 6),
                                          Row(children: List.generate(5, (n) => Icon(n < (r['rating'] as int? ?? 0) ? Icons.star : Icons.star_border, size: 16, color: kGold))),
                                          const SizedBox(height: 8),
                                          Text(r['comment']?.toString() ?? '', style: const TextStyle(color: kSlate600, fontSize: 13)),
                                        ]),
                                      );
                                    },
                                  ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}
