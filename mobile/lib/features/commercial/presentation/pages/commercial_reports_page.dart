import 'package:flutter/material.dart';
import '../../../shared/services/commercial_api_service.dart';

const Color kWhite = Color(0xFFFFFFFF);
const Color kBg = Color(0xFFF8FAFC);
const Color kBorder = Color(0xFFE2E8F0);
const Color kSlate800 = Color(0xFF1E293B);
const Color kSlate500 = Color(0xFF64748B);

class CommercialReportsPage extends StatefulWidget {
  const CommercialReportsPage({super.key});

  @override
  State<CommercialReportsPage> createState() => _CommercialReportsPageState();
}

class _CommercialReportsPageState extends State<CommercialReportsPage> {
  List<Map<String, dynamic>> _reports = [];
  bool _loading = true;
  String _type = 'revenue';
  String _period = 'monthly';
  bool _generating = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await CommercialApiService.getReports();
      setState(() {
        _reports = data;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _generate() async {
    setState(() => _generating = true);
    final res = await CommercialApiService.generateReport(type: _type, period: _period);
    setState(() => _generating = false);
    if (!mounted) return;
    if (res['success'] == false) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message']?.toString() ?? 'Failed')));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Report generated')));
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(backgroundColor: kWhite, foregroundColor: kSlate800, title: const Text('Reports')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: kWhite, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('Generate report', style: TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _type,
                        decoration: const InputDecoration(labelText: 'Type', border: OutlineInputBorder()),
                        items: const [
                          DropdownMenuItem(value: 'revenue', child: Text('Revenue')),
                          DropdownMenuItem(value: 'bookings', child: Text('Bookings')),
                          DropdownMenuItem(value: 'performance', child: Text('Performance')),
                        ],
                        onChanged: (v) => setState(() => _type = v ?? 'revenue'),
                      ),
                      const SizedBox(height: 10),
                      DropdownButtonFormField<String>(
                        value: _period,
                        decoration: const InputDecoration(labelText: 'Period', border: OutlineInputBorder()),
                        items: const [
                          DropdownMenuItem(value: 'weekly', child: Text('Weekly')),
                          DropdownMenuItem(value: 'monthly', child: Text('Monthly')),
                          DropdownMenuItem(value: 'quarterly', child: Text('Quarterly')),
                          DropdownMenuItem(value: 'yearly', child: Text('Yearly')),
                        ],
                        onChanged: (v) => setState(() => _period = v ?? 'monthly'),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _generating ? null : _generate,
                          child: _generating ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Generate'),
                        ),
                      ),
                    ]),
                  ),
                  const SizedBox(height: 20),
                  const Text('Recent reports', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  if (_reports.isEmpty)
                    const Text('No reports yet', style: TextStyle(color: kSlate500))
                  else
                    ..._reports.map((r) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(color: kWhite, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
                          child: Row(children: [
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(r['title']?.toString() ?? r['type']?.toString() ?? 'Report', style: const TextStyle(fontWeight: FontWeight.w600)),
                              Text(r['period']?.toString() ?? '', style: const TextStyle(color: kSlate500, fontSize: 12)),
                            ])),
                            Text(r['generated_at']?.toString().split('T').first ?? '', style: const TextStyle(color: kSlate500, fontSize: 11)),
                          ]),
                        )),
                ],
              ),
            ),
    );
  }
}
