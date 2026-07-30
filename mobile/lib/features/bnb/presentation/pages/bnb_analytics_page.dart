import 'package:flutter/material.dart';
import '../../../shared/services/bnb_api_service.dart';

const Color kGold = Color(0xFFC89128);
const Color kBg = Color(0xFF0A0F1E);
const Color kBg2 = Color(0xFF0F172A);
const Color kCream = Color(0xFFF1F5F9);
const Color kSlate = Color(0xFF94A3B8);
const Color kBorder = Color(0x26C89128);

class BnbAnalyticsPage extends StatefulWidget {
  const BnbAnalyticsPage({super.key});

  @override
  State<BnbAnalyticsPage> createState() => _BnbAnalyticsPageState();
}

class _BnbAnalyticsPageState extends State<BnbAnalyticsPage> {
  Map<String, dynamic> _data = {};
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = ''; });
    try {
      final data = await BnbApiService.getAnalytics();
      setState(() { _data = data; _loading = false; });
    } catch (_) {
      setState(() { _error = 'Unable to load analytics.'; _loading = false; });
    }
  }

  String _fmt(dynamic v) {
    final n = v is num ? v.toDouble() : (double.tryParse(v?.toString() ?? '0') ?? 0);
    if (n >= 1000000) return 'TZS ${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return 'TZS ${(n / 1000).toStringAsFixed(0)}k';
    return 'TZS ${n.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final top = (_data['topProperties'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(backgroundColor: kBg2, foregroundColor: kCream, title: const Text('Analytics')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kGold))
          : _error.isNotEmpty
              ? Center(child: Text(_error, style: const TextStyle(color: kSlate)))
              : RefreshIndicator(
                  onRefresh: _load,
                  color: kGold,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Wrap(spacing: 10, runSpacing: 10, children: [
                        _stat('Revenue', _fmt(_data['totalRevenue'])),
                        _stat('Bookings', '${_data['totalBookings'] ?? 0}'),
                        _stat('Occupancy', '${_data['occupancyRate'] ?? 0}%'),
                        _stat('Rating', '${_data['averageRating'] ?? 0}'),
                      ]),
                      const SizedBox(height: 20),
                      const Text('Top properties', style: TextStyle(color: kCream, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 10),
                      if (top.isEmpty)
                        const Text('No property data yet', style: TextStyle(color: kSlate))
                      else
                        ...top.map((p) => Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(color: kBg2, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
                              child: Row(children: [
                                Expanded(child: Text(p['title']?.toString() ?? 'Property', style: const TextStyle(color: kCream, fontWeight: FontWeight.w600))),
                                Text(_fmt(p['revenue']), style: const TextStyle(color: kGold, fontWeight: FontWeight.w800)),
                              ]),
                            )),
                    ],
                  ),
                ),
    );
  }

  Widget _stat(String label, String value) => Container(
        width: (MediaQuery.of(context).size.width - 42) / 2,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: kBg2, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(color: kSlate, fontSize: 11)),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(color: kCream, fontWeight: FontWeight.w800, fontSize: 16)),
        ]),
      );
}
