// ============================================================
// landlord_applications.dart — Applications page
// ============================================================
import 'package:flutter/material.dart';
import 'landlord_theme.dart';

class LandlordApplicationsPage extends StatefulWidget {
  const LandlordApplicationsPage({super.key});
  @override
  State<LandlordApplicationsPage> createState() => _LandlordApplicationsPageState();
}

class _LandlordApplicationsPageState extends State<LandlordApplicationsPage> {
  final List<Application> _applications = [];
  bool _loading = true;
  String _error = '';
  String _success = '';
  int? _busyId;
  final Map<int, String> _rejectionReasons = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = '';
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _loading = false;
      // For now, empty list - will be populated from API
    });
  }

  ApplicationStats get _stats => ApplicationStats(
    total: _applications.length,
    pending: _applications.where((a) => a.status == 'pending').length,
    approved: _applications.where((a) => a.status == 'approved').length,
    rejected: _applications.where((a) => a.status == 'rejected').length,
  );

  Future<void> _handleApprove(int id) async {
    setState(() {
      _busyId = id;
      _error = '';
      _success = '';
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _busyId = null;
      _success = 'Application approved. Tenant record created.';
    });

    // Navigate to tenants page after delay
    Future.delayed(const Duration(seconds: 2), () {
      // Navigate to tenants
    });
  }

  Future<void> _handleReject(int id) async {
    final reason = _rejectionReasons[id]?.trim();
    if (reason == null || reason.isEmpty) {
      setState(() => _error = 'Add a rejection reason before rejecting.');
      return;
    }

    setState(() {
      _busyId = id;
      _error = '';
      _success = '';
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _busyId = null;
      _success = 'Application rejected successfully.';
      _rejectionReasons.remove(id);
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    appBar: AppBar(
      backgroundColor: kBg2,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_rounded, color: kGold),
        onPressed: () => Navigator.pop(context),
      ),
      title: const Text('Applications',
        style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600)),
    ),
    body: _loading ? _buildLoading() : _buildContent(),
  );

  Widget _buildLoading() => const Center(
    child: CircularProgressIndicator(color: kGold),
  );

  Widget _buildContent() => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      // Stats
      Row(children: [
        _StatCard(label: 'Total', value: '${_stats.total}', color: kGold),
        const SizedBox(width: 12),
        _StatCard(label: 'Pending', value: '${_stats.pending}', color: kWarning),
        const SizedBox(width: 12),
        _StatCard(label: 'Approved', value: '${_stats.approved}', color: kSuccess),
      ]),
      const SizedBox(height: 12),
      Row(children: [
        _StatCard(label: 'Rejected', value: '${_stats.rejected}', color: kDanger),
      ]),
      const SizedBox(height: 20),

      // Error/Success alerts
      if (_error.isNotEmpty) ...[
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: kDanger.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: kDanger.withOpacity(0.3)),
          ),
          child: Row(children: [
            Icon(Icons.error_outline_rounded, color: kDanger, size: 16),
            const SizedBox(width: 8),
            Expanded(child: Text(_error, style: TextStyle(color: kDanger, fontSize: 12))),
          ]),
        ),
        const SizedBox(height: 12),
      ],
      if (_success.isNotEmpty) ...[
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: kSuccess.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: kSuccess.withOpacity(0.3)),
          ),
          child: Row(children: [
            Icon(Icons.check_circle_rounded, color: kSuccess, size: 16),
            const SizedBox(width: 8),
            Expanded(child: Text(_success, style: TextStyle(color: kSuccess, fontSize: 12))),
          ]),
        ),
        const SizedBox(height: 12),
      ],

      // Applications list
      if (_applications.isEmpty) ...[
        LEmptyState(
          icon: Icons.people_alt_rounded,
          title: 'No applications yet',
          subtitle: 'Applications from tenants will appear here.',
        ),
      ] else ...[
        ..._applications.map((app) => _ApplicationCard(
          application: app,
          isBusy: _busyId == app.id,
          rejectionReason: _rejectionReasons[app.id] ?? '',
          onRejectionReasonChange: (reason) => setState(() => _rejectionReasons[app.id] = reason),
          onApprove: () => _handleApprove(app.id),
          onReject: () => _handleReject(app.id),
        )),
      ],
    ],
  );
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) => Expanded(child: LCard(child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label.toUpperCase(), style: TextStyle(color: color, fontSize: 10, letterSpacing: 1)),
      const SizedBox(height: 8),
      Text(value, style: TextStyle(color: kCream, fontSize: 28, fontWeight: FontWeight.w700)),
    ],
  )));
}

class _ApplicationCard extends StatelessWidget {
  final Application application;
  final bool isBusy;
  final String rejectionReason;
  final ValueChanged<String> onRejectionReasonChange;
  final VoidCallback onApprove;
  final VoidCallback onReject;
  const _ApplicationCard({
    required this.application,
    required this.isBusy,
    required this.rejectionReason,
    required this.onRejectionReasonChange,
    required this.onApprove,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) => LCard(
    padding: const EdgeInsets.all(16),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(width: 40, height: 40,
          decoration: BoxDecoration(
            color: kGold.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(child: Text(
            application.applicantName[0].toUpperCase(),
            style: TextStyle(color: kGold, fontSize: 18, fontWeight: FontWeight.w700),
          )),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(application.applicantName, style: TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
          Text(application.email, style: TextStyle(color: kSlate, fontSize: 11)),
          Text(application.phone, style: TextStyle(color: kSlate, fontSize: 11)),
        ])),
        LStatusBadge(label: application.status, color: _getStatusColor(application.status)),
      ]),
      const SizedBox(height: 12),
      Divider(color: kGold.withOpacity(0.1)),
      const SizedBox(height: 12),
      Row(children: [
        Icon(Icons.home_work_rounded, color: kSlate, size: 16),
        const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(application.propertyTitle, style: TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w500)),
          Text(application.propertyLocation, style: TextStyle(color: kSlate, fontSize: 11)),
        ])),
      ]),
      const SizedBox(height: 8),
      Text(_formatCurrency(application.price), style: TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      Text(application.message, style: TextStyle(color: kSlate, fontSize: 12)),
      const SizedBox(height: 12),
      if (application.status == 'pending') ...[
        if (application.rejectionReason != null && application.rejectionReason!.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: kDanger.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(application.rejectionReason!, style: TextStyle(color: kDanger, fontSize: 11)),
          ),
          const SizedBox(height: 12),
        ],
        Row(children: [
          Expanded(child: LGoldButton(
            label: isBusy ? 'Working…' : '✓ Approve',
            onTap: isBusy ? null : onApprove,
            fullWidth: true,
          )),
          const SizedBox(width: 8),
          Expanded(child: TextField(
            onChanged: onRejectionReasonChange,
            style: TextStyle(color: kCream, fontSize: 12),
            decoration: InputDecoration(
              hintText: 'Rejection reason…',
              hintStyle: TextStyle(color: kSlate, fontSize: 11),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: BorderSide(color: kBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: BorderSide(color: kBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: BorderSide(color: kGold),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            ),
          )),
          const SizedBox(width: 8),
          Expanded(child: LGhostButton(
            label: isBusy ? 'Working…' : '✕ Reject',
            onTap: isBusy ? null : onReject,
            borderColor: kDanger,
          )),
        ]),
      ] else ...[
        Text('No further action needed.', style: TextStyle(color: kSlateDim, fontSize: 12)),
      ],
    ]),
  );

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending': return kWarning;
      case 'approved': return kSuccess;
      case 'rejected': return kDanger;
      default: return kSlate;
    }
  }

  String _formatCurrency(int amount) {
    if (amount >= 1000000) {
      return 'TZS ${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return 'TZS ${(amount / 1000).toStringAsFixed(0)}K';
    }
    return 'TZS $amount';
  }
}

class Application {
  final int id;
  final String applicantName;
  final String email;
  final String phone;
  final String propertyTitle;
  final String propertyLocation;
  final int price;
  final String status;
  final String message;
  final String? rejectionReason;
  final DateTime appliedAt;

  Application({
    required this.id,
    required this.applicantName,
    required this.email,
    required this.phone,
    required this.propertyTitle,
    required this.propertyLocation,
    required this.price,
    required this.status,
    required this.message,
    this.rejectionReason,
    required this.appliedAt,
  });
}

class ApplicationStats {
  final int total;
  final int pending;
  final int approved;
  final int rejected;

  ApplicationStats({
    required this.total,
    required this.pending,
    required this.approved,
    required this.rejected,
  });
}
