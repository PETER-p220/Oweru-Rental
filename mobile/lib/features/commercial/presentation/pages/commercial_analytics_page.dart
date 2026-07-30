import 'package:flutter/material.dart';
import '../../../shared/services/commercial_api_service.dart';

const Color kWhite = Color(0xFFFFFFFF);
const Color kBg = Color(0xFFF8FAFC);
const Color kBorder = Color(0xFFE2E8F0);
const Color kSlate800 = Color(0xFF1E293B);
const Color kSlate500 = Color(0xFF64748B);
const Color kSlate900 = Color(0xFF0F172A);

class CommercialAnalyticsPage extends StatefulWidget {
  const CommercialAnalyticsPage({super.key});

  @override
  State<CommercialAnalyticsPage> createState() => _CommercialAnalyticsPageState();
}

class _CommercialAnalyticsPageState extends State<CommercialAnalyticsPage> {
  Map<String, dynamic> _data = {};
  bool _loading = true;
  String _range = '6months';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await CommercialApiService.getAnalytics();
      setState(() { _data = data; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
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
    final perf = (_data['property_performance'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kWhite,
        foregroundColor: kSlate800,
        title: const Text('Analytics', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          DropdownButton<String>(
            value: _range,
            underline: const SizedBox(),
            items: const [
              DropdownMenuItem(value: '1month', child: Text('1M')),
              DropdownMenuItem(value: '3months', child: Text('3M')),
              DropdownMenuItem(value: '6months', child: Text('6M')),
              DropdownMenuItem(value: '1year', child: Text('1Y')),
            ],
            onChanged: (v) { if (v != null) { setState(() => _range = v); _load(); } },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Wrap(spacing: 10, runSpacing: 10, children: [
                    _card('Revenue', _fmt(_data['total_revenue'])),
                    _card('Applications', '${_data['total_bookings'] ?? 0}'),
                    _card('Occupancy', '${_data['occupancy_rate'] ?? 0}%'),
                    _card('Payments', '${_data['total_payments'] ?? 0}'),
                  ]),
                  const SizedBox(height: 20),
                  const Text('Property performance', style: TextStyle(fontWeight: FontWeight.w700, color: kSlate900)),
                  const SizedBox(height: 10),
                  ...perf.take(8).map((p) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(color: kWhite, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
                        child: Row(children: [
                          Expanded(child: Text(p['title']?.toString() ?? 'Property', style: const TextStyle(fontWeight: FontWeight.w600))),
                          Text(_fmt(p['revenue']), style: const TextStyle(fontWeight: FontWeight.w800, color: kSlate800)),
                        ]),
                      )),
                ],
              ),
            ),
    );
  }

  Widget _card(String label, String value) => Container(
        width: (MediaQuery.of(context).size.width - 42) / 2,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: kWhite, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(color: kSlate500, fontSize: 11)),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: kSlate900)),
        ]),
      );
}
