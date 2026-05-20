import 'package:flutter/material.dart';
import '../../../../shared/services/tenant_api_service.dart';
import 'tenant_theme.dart';

class ApplicationStatusPage extends StatefulWidget {
  const ApplicationStatusPage({super.key});

  @override
  State<ApplicationStatusPage> createState() => _ApplicationStatusPageState();
}

class _ApplicationStatusPageState extends State<ApplicationStatusPage> {
  List<Map<String, dynamic>> _applications = [];
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
      final data = await TenantApiService.getApplications();
      if (!mounted) return;
      setState(() {
        _applications = data;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load application status';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        iconTheme: const IconThemeData(color: kGold),
        title: const Text('Application Status', style: TextStyle(color: kCream, fontWeight: FontWeight.w700)),
      ),
      body: _loading
          ? ListView(padding: const EdgeInsets.all(16), children: List.generate(4, (_) => const TSkeletonCard(height: 110)))
          : _error.isNotEmpty
              ? TErrorState(message: _error, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  color: kGold,
                  backgroundColor: kBg2,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: _applications.isEmpty
                        ? const [
                            TEmptyState(
                              icon: Icons.description_outlined,
                              title: 'No applications found',
                              subtitle: 'Once you submit applications, status updates appear here.',
                            )
                          ]
                        : _applications.map(_card).toList(),
                  ),
                ),
    );
  }

  Widget _card(Map<String, dynamic> app) {
    final status = (app['status'] ?? 'pending').toString();
    final property = app['property'] as Map<String, dynamic>?;
    final color = switch (status) {
      'approved' => kSuccess,
      'rejected' => kDanger,
      _ => kWarning,
    };
    final tip = switch (status) {
      'approved' => 'Contact landlord to finalize move-in details.',
      'rejected' => 'Try improving your profile and apply again.',
      _ => 'Your application is under review.',
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: kBg2, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Expanded(child: Text((property?['title'] ?? 'Property').toString(), style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600))),
          TStatusBadge(label: status, color: color),
        ]),
        const SizedBox(height: 8),
        Text((app['message'] ?? tip).toString(), style: const TextStyle(color: kSlate, fontSize: 11, height: 1.5)),
        const SizedBox(height: 8),
        Text((app['created_at'] ?? '').toString(), style: const TextStyle(color: kSlateDim, fontSize: 10)),
      ]),
    );
  }
}
