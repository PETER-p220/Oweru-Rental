import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordCompliancePage extends StatefulWidget {
  const LandlordCompliancePage({super.key});

  @override
  State<LandlordCompliancePage> createState() => _LandlordCompliancePageState();
}

class _LandlordCompliancePageState extends State<LandlordCompliancePage> {
  List<Map<String, dynamic>> _items = [];
  Map<String, dynamic> _stats = {};
  bool _loading = true;
  String _error = '';
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = ''; });
    try {
      final res = await LandlordApiService.getComplianceRequests(
        status: _statusFilter == 'all' ? null : _statusFilter,
      );
      final data = res['data'];
      setState(() {
        _items = data is List
            ? data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
        _stats = res['stats'] is Map ? Map<String, dynamic>.from(res['stats']) : {};
        _loading = false;
      });
    } catch (_) {
      setState(() { _error = 'Could not load compliance requests.'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kPageBg,
      appBar: AppBar(
        backgroundColor: kHeaderBg,
        foregroundColor: Colors.white,
        title: const Text('Compliance Requests', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          PopupMenuButton<String>(
            initialValue: _statusFilter,
            onSelected: (v) { setState(() => _statusFilter = v); _load(); },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'all', child: Text('All')),
              PopupMenuItem(value: 'submitted', child: Text('Submitted')),
              PopupMenuItem(value: 'in_progress', child: Text('In progress')),
              PopupMenuItem(value: 'resolved', child: Text('Resolved')),
            ],
            icon: const Icon(Icons.filter_list),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kSlate800))
          : _error.isNotEmpty
              ? Center(child: Text(_error, style: const TextStyle(color: kDanger)))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (_stats.isNotEmpty)
                        Row(children: [
                          _statChip('Total', '${_stats['total'] ?? 0}'),
                          const SizedBox(width: 8),
                          _statChip('Open', '${_stats['open'] ?? 0}'),
                        ]),
                      const SizedBox(height: 12),
                      if (_items.isEmpty)
                        const Padding(
                          padding: EdgeInsets.only(top: 48),
                          child: Center(child: Text('No compliance requests yet.',
                              style: TextStyle(color: kSlate500))),
                        )
                      else
                        ..._items.map(_tile),
                    ],
                  ),
                ),
    );
  }

  Widget _statChip(String label, String value) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: kCardBg, borderRadius: BorderRadius.circular(10), border: Border.all(color: kBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontSize: 11, color: kSlate500, fontWeight: FontWeight.w600)),
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: kSlate900)),
      ]),
    ),
  );

  Widget _tile(Map<String, dynamic> item) {
    final title = item['title']?.toString() ?? 'Request';
    final ref = item['reference']?.toString() ?? '';
    final status = item['status']?.toString() ?? 'submitted';
    final tenant = item['tenant'] is Map ? item['tenant']['name']?.toString() : null;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      color: kCardBg,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kBorder)),
      child: ListTile(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text([ref, if (tenant != null) 'Tenant: $tenant', status].join(' · '),
            style: const TextStyle(fontSize: 12, color: kSlate500)),
        trailing: const Icon(Icons.chevron_right, color: kSlate400),
        onTap: () => _openDetail(item),
      ),
    );
  }

  Future<void> _openDetail(Map<String, dynamic> item) async {
    final responseCtrl = TextEditingController(text: item['owner_response']?.toString() ?? '');
    String status = item['status']?.toString() ?? 'acknowledged';
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: kCardBg,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(item['title']?.toString() ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(item['description']?.toString() ?? '', style: const TextStyle(color: kSlate600, height: 1.4)),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: status,
            decoration: const InputDecoration(labelText: 'Status', border: OutlineInputBorder()),
            items: const [
              DropdownMenuItem(value: 'acknowledged', child: Text('Acknowledged')),
              DropdownMenuItem(value: 'in_progress', child: Text('In progress')),
              DropdownMenuItem(value: 'resolved', child: Text('Resolved')),
              DropdownMenuItem(value: 'closed', child: Text('Closed')),
            ],
            onChanged: (v) { if (v != null) status = v; },
          ),
          const SizedBox(height: 12),
          TextField(
            controller: responseCtrl,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Message to tenant', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: kSlate800, padding: const EdgeInsets.symmetric(vertical: 14)),
            onPressed: () async {
              await LandlordApiService.updateComplianceRequest(
                item['id'] as int,
                status: status,
                ownerResponse: responseCtrl.text.trim(),
              );
              if (ctx.mounted) Navigator.pop(ctx);
              _load();
            },
            child: const Text('Save & notify tenant'),
          ),
        ]),
      ),
    );
  }
}
