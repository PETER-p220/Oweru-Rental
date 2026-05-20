import 'package:flutter/material.dart';
import '../../../../shared/services/tenant_api_service.dart';
import 'tenant_theme.dart';

class TenantAnalyticsPage extends StatefulWidget {
  const TenantAnalyticsPage({super.key});

  @override
  State<TenantAnalyticsPage> createState() => _TenantAnalyticsPageState();
}

class _TenantAnalyticsPageState extends State<TenantAnalyticsPage> {
  Map<String, dynamic> _analytics = {};
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final data = await TenantApiService.getAnalytics();
      if (!mounted) return;
      setState(() {
        _analytics = data['data'] ?? data;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load analytics';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final statuses = (_analytics['applications_by_status'] as Map<String, dynamic>?) ?? {};
    final pending = (statuses['pending'] ?? 0) as num;
    final approved = (statuses['approved'] ?? 0) as num;
    final rejected = (statuses['rejected'] ?? 0) as num;
    final total = pending + approved + rejected;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        iconTheme: const IconThemeData(color: kGold),
        title: const Text('Analytics', style: TextStyle(color: kCream, fontWeight: FontWeight.w700)),
      ),
      body: _loading
          ? ListView(padding: const EdgeInsets.all(16), children: List.generate(3, (_) => const TSkeletonCard(height: 110)))
          : _error.isNotEmpty
              ? TErrorState(message: _error, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  color: kGold,
                  backgroundColor: kBg2,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      TCard(
                        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          const Text('Total Applications', style: TextStyle(color: kSlate, fontSize: 12)),
                          Text('$total', style: const TextStyle(color: kGold, fontSize: 24, fontWeight: FontWeight.w800)),
                        ]),
                      ),
                      const SizedBox(height: 12),
                      _metric('Approved', approved, kSuccess),
                      _metric('Pending', pending, kWarning),
                      _metric('Rejected', rejected, kDanger),
                    ],
                  ),
                ),
    );
  }

  Widget _metric(String label, num value, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: kBg2, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
      child: Row(
        children: [
          Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 10),
          Expanded(child: Text(label, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600))),
          Text('$value', style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
