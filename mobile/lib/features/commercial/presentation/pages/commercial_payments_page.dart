import 'package:flutter/material.dart';
import '../../../shared/services/commercial_api_service.dart';

const Color kWhite = Color(0xFFFFFFFF);
const Color kBg = Color(0xFFF8FAFC);
const Color kBorder = Color(0xFFE2E8F0);
const Color kSlate800 = Color(0xFF1E293B);
const Color kSlate500 = Color(0xFF64748B);
const Color kEmerald = Color(0xFF10B981);

class CommercialPaymentsPage extends StatefulWidget {
  const CommercialPaymentsPage({super.key});

  @override
  State<CommercialPaymentsPage> createState() => _CommercialPaymentsPageState();
}

class _CommercialPaymentsPageState extends State<CommercialPaymentsPage> {
  List<Map<String, dynamic>> _payments = [];
  Map<String, dynamic> _summary = {};
  bool _loading = true;
  String _status = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await CommercialApiService.getPayments(status: _status == 'all' ? null : _status);
      setState(() {
        _payments = (data['data'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        _summary = (data['summary'] as Map<String, dynamic>?) ?? {};
        _loading = false;
      });
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
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kWhite,
        foregroundColor: kSlate800,
        title: const Text('Payments'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(44),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
            child: Row(children: ['all', 'completed', 'pending', 'failed'].map((s) {
              final active = _status == s;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(s),
                  selected: active,
                  onSelected: (_) { setState(() => _status = s); _load(); },
                ),
              );
            }).toList()),
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Wrap(spacing: 10, runSpacing: 10, children: [
                    _sum('Received', _fmt(_summary['total_received'])),
                    _sum('This month', _fmt(_summary['this_month'])),
                    _sum('Completed', '${_summary['completed_count'] ?? 0}'),
                    _sum('Pending', '${_summary['pending_count'] ?? 0}'),
                  ]),
                  const SizedBox(height: 16),
                  if (_payments.isEmpty)
                    const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('No payments', style: TextStyle(color: kSlate500))))
                  else
                    ..._payments.map((p) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(color: kWhite, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
                          child: Row(children: [
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(p['property']?['title']?.toString() ?? p['description']?.toString() ?? 'Payment', style: const TextStyle(fontWeight: FontWeight.w600)),
                              Text(p['tenant_name']?.toString() ?? '', style: const TextStyle(color: kSlate500, fontSize: 12)),
                            ])),
                            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                              Text(_fmt(p['amount']), style: const TextStyle(fontWeight: FontWeight.w800, color: kEmerald)),
                              Text(p['status']?.toString() ?? '', style: const TextStyle(fontSize: 11, color: kSlate500)),
                            ]),
                          ]),
                        )),
                ],
              ),
            ),
    );
  }

  Widget _sum(String label, String value) => Container(
        width: (MediaQuery.of(context).size.width - 42) / 2,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: kWhite, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(color: kSlate500, fontSize: 11)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
        ]),
      );
}
