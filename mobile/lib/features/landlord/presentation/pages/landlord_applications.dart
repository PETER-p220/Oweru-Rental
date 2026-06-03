import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordApplicationsPage extends StatefulWidget {
  const LandlordApplicationsPage({super.key});

  @override
  State<LandlordApplicationsPage> createState() => _LandlordApplicationsPageState();
}

class _LandlordApplicationsPageState extends State<LandlordApplicationsPage> {
  List<Map<String, dynamic>> _applications = [];
  bool _isLoading = true;
  String _error = '';
  String _success = '';
  int? _busyId;
  final Map<int, String> _rejectionReasons = {};

  @override
  void initState() {
    super.initState();
    _loadApplications();
  }

  Future<void> _loadApplications() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final applications = await LandlordApiService.getApplications();
      setState(() {
        _applications = applications;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load applications.';
        _isLoading = false;
      });
    }
  }

  Map<String, int> get _stats {
    return {
      'total': _applications.length,
      'pending': _applications.where((a) => a['status'] == 'pending').length,
      'approved': _applications.where((a) => a['status'] == 'approved').length,
      'rejected': _applications.where((a) => a['status'] == 'rejected').length,
    };
  }

  String _formatCurrency(dynamic value) {
    if (value == null) return 'TZS 0';
    final double numericValue = value is double ? value : (double.tryParse(value.toString()) ?? 0);
    if (numericValue >= 1000000) {
      return 'TZS ${(numericValue / 1000000).toStringAsFixed(1)}M';
    } else if (numericValue >= 1000) {
      return 'TZS ${(numericValue / 1000).toStringAsFixed(1)}K';
    }
    return 'TZS ${numericValue.toStringAsFixed(0)}';
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '—';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'approved':
        return const Color(0xFF10B981);
      case 'rejected':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF6B7280);
    }
  }

  Future<void> _handleApprove(int id) async {
    setState(() {
      _busyId = id;
      _error = '';
      _success = '';
    });

    try {
      await LandlordApiService.approveApplication(id);
      await _loadApplications();
      setState(() {
        _success = 'Application approved successfully.';
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to approve application.';
      });
    } finally {
      setState(() {
        _busyId = null;
      });
    }
  }

  Future<void> _handleReject(int id) async {
    final reason = _rejectionReasons[id]?.trim();
    if (reason == null || reason.isEmpty) {
      setState(() {
        _error = 'Add a rejection reason before rejecting an application.';
      });
      return;
    }

    setState(() {
      _busyId = id;
      _error = '';
      _success = '';
    });

    try {
      await LandlordApiService.rejectApplication(id, reason);
      await _loadApplications();
      setState(() {
        _success = 'Application rejected successfully.';             
        _rejectionReasons.remove(id);
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to reject application.';
      });
    } finally {
      setState(() {
        _busyId = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final stats = _stats;

    return Scaffold(
      backgroundColor: kPageBg,
      extendBodyBehindAppBar: true,
      body: CustomScrollView(
        slivers: [
          // ── Slate header (matching dashboard) ──────
          SliverToBoxAdapter(child: _slateHeader()),
          
          // ── Stats row (horizontal scrollable) ──────
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            sliver: SliverToBoxAdapter(child: _statsRow(stats)),
          ),
          
          // ── Error/Success Alerts ─────────────────────
          if (_error.isNotEmpty)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              sliver: SliverToBoxAdapter(child: _alertBanner(_error, kDanger, Icons.error)),
            ),
          if (_success.isNotEmpty)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              sliver: SliverToBoxAdapter(child: _alertBanner(_success, kSuccess, Icons.check_circle)),
            ),
          
          // ── Applications list ──────────────────────────
          if (_isLoading)
            SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: kSlate800, strokeWidth: 2)))
          else if (_applications.isEmpty)
            SliverFillRemaining(child: _emptyState())
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              sliver: SliverList(delegate: SliverChildBuilderDelegate(
                (_, i) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _ApplicationCard(application: _applications[i], busyId: _busyId, rejectionReasons: _rejectionReasons, onApprove: _handleApprove, onReject: _handleReject, onReasonChange: (id, reason) => setState(() => _rejectionReasons[id] = reason))),
                childCount: _applications.length,
              )),
            ),
        ],
      ),
    );
  }

  // ── Slate header block ───────────────────────────────────
  Widget _slateHeader() => Container(
    color: kHeaderBg,
    padding: EdgeInsets.only(
      top: MediaQuery.of(context).padding.top + 12,
      left: 18, right: 18, bottom: 20),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Top bar
      Row(children: [
        const Text('Applications',
          style: TextStyle(color: kWhite, fontSize: 20,
            fontWeight: FontWeight.w800, letterSpacing: -0.3)),
      ]),
      const SizedBox(height: 16),
      // Stats summary
      Text('${_stats['total']} total · ${_stats['pending']} pending · ${_stats['approved']} approved',
        style: const TextStyle(color: kSlate400, fontSize: 13)),
    ]),
  );

  // ── Horizontal stats row ───────────────────────────────────
  Widget _statsRow(Map<String, int> stats) {
    final items = [
      _StatItem(value: '${stats['total']}',          label: 'Total',       icon: Icons.description_outlined,         accent: kSlate800, bg: kSlate100),
      _StatItem(value: '${stats['pending']}',        label: 'Pending',     icon: Icons.pending_actions_outlined,     accent: kWarning,  bg: kWarningBg),
      _StatItem(value: '${stats['approved']}',       label: 'Approved',    icon: Icons.check_circle_outline,        accent: kSuccess,  bg: kSuccessBg),
      _StatItem(value: '${stats['rejected']}',        label: 'Rejected',    icon: Icons.cancel_outlined,             accent: kDanger,   bg: kDangerBg),
    ];

    return SizedBox(
      height: 96,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) => _StatCard2(item: items[i]),
      ),
    );
  }

  // ── Alert banner ───────────────────────────────────────────
  Widget _alertBanner(String message, Color color, IconData icon) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: color.withOpacity(0.08),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: color.withOpacity(0.2)),
    ),
    child: Row(children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(width: 10),
      Expanded(child: Text(message, style: TextStyle(color: color, fontSize: 13))),
    ]),
  );

  // ── Empty state ────────────────────────────────────────────
  Widget _emptyState() => Padding(
    padding: const EdgeInsets.symmetric(vertical: 64),
    child: Center(child: Column(children: [
      Container(
        width: 56, height: 56,
        decoration: BoxDecoration(
          color: kSlate200, borderRadius: BorderRadius.circular(14)),
        child: const Icon(Icons.description_outlined, color: kSlate400, size: 26)),
      const SizedBox(height: 12),
      const Text('No applications yet.',
        style: TextStyle(color: kSlate500, fontSize: 13)),
      const SizedBox(height: 4),
      const Text('Applications from tenants will appear here.',
        style: TextStyle(color: kSlate400, fontSize: 12)),
    ])),
  );

  Widget _buildApplicationCard(Map<String, dynamic> application) {
    final user = application['user'] as Map<String, dynamic>?;
    final property = application['property'] as Map<String, dynamic>?;
    final status = application['status'] as String? ?? 'pending';
    final message = application['message'] as String?;
    final rejectionReason = application['rejection_reason'] as String?;
    final createdAt = application['created_at'] as String?;

    return Container(
      decoration: BoxDecoration(
        color: kCardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: kSlate200,
                    shape: BoxShape.circle,
                  ),
                  child: Center(child: Icon(Icons.person_outline, color: kSlate500, size: 20)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${user?['first_name'] ?? ''} ${user?['last_name'] ?? ''}',
                        style: const TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(user?['email'] ?? 'No email', style: const TextStyle(color: kSlate400, fontSize: 12)),
                    ],
                  ),
                ),
                _buildStatusBadge(status),
              ],
            ),
            const SizedBox(height: 12),
            // Property Info
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: kSlate100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(property?['title'] ?? 'Untitled property', style: const TextStyle(color: kSlate800, fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 11, color: kSlate400),
                      const SizedBox(width: 4),
                      Expanded(child: Text(property?['location'] ?? 'No location', style: const TextStyle(color: kSlate500, fontSize: 11))),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(_formatCurrency(property?['price']), style: const TextStyle(color: kSlate800, fontSize: 12, fontWeight: FontWeight.w700)),
                      const SizedBox(width: 8),
                      Text('Applied ${_formatDate(createdAt ?? '')}', style: const TextStyle(color: kSlate400, fontSize: 10)),
                    ],
                  ),
                ],
              ),
            ),
            if (message != null && message.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: kSlate100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Message:', style: TextStyle(color: kSlate600, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(message, style: const TextStyle(color: kSlate600, fontSize: 12, height: 1.4)),
                  ],
                ),
              ),
            ],
            if (rejectionReason != null && rejectionReason.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: kDangerBg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: kDanger.withOpacity(0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Rejection Reason:', style: TextStyle(color: kDanger, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(rejectionReason, style: const TextStyle(color: kDanger, fontSize: 12, height: 1.4)),
                  ],
                ),
              ),
            ],
            if (status == 'pending') ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _busyId == application['id'] ? null : () => _handleApprove(application['id']),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kSuccess,
                        foregroundColor: kWhite,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: Text(_busyId == application['id'] ? 'Working...' : 'Approve', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _busyId == application['id'] ? null : () => _handleReject(application['id']),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kDanger,
                        foregroundColor: kWhite,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: Text(_busyId == application['id'] ? 'Working...' : 'Reject', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              TextField(
                decoration: InputDecoration(
                  hintText: 'Rejection reason (required)...',
                  hintStyle: const TextStyle(color: kSlate400),
                  filled: true,
                  fillColor: kWhite,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: kBorder),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                style: const TextStyle(color: kSlate800, fontSize: 12),
                onChanged: (value) {
                  setState(() {
                    _rejectionReasons[application['id']] = value;
                  });
                },
              ),
            ] else ...[
              const SizedBox(height: 12),
              const Text('No further action needed.', style: TextStyle(color: kSlate400, fontSize: 12)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withOpacity(0.12),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: _getStatusColor(status).withOpacity(0.3)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: _getStatusColor(status), fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════
// Sub-widgets (matching dashboard)
// ════════════════════════════════════════════════════════════

// Stat data holder
class _StatItem {
  final String value, label;
  final IconData icon;
  final Color accent, bg;
  const _StatItem({
    required this.value, required this.label,
    required this.icon,  required this.accent, required this.bg});
}

// Stat card — horizontal scrollable
class _StatCard2 extends StatelessWidget {
  final _StatItem item;
  const _StatCard2({required this.item});

  @override
  Widget build(BuildContext context) => Container(
    width: 110,
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(
      color: kCardBg,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: kBorder)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Container(
        width: 28, height: 28,
        decoration: BoxDecoration(
          color: item.bg, borderRadius: BorderRadius.circular(7)),
        child: Icon(item.icon, color: item.accent, size: 14)),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(item.value,
          style: const TextStyle(color: kSlate800, fontSize: 16,
            fontWeight: FontWeight.w800, letterSpacing: -0.3),
          maxLines: 1, overflow: TextOverflow.ellipsis),
        const SizedBox(height: 1),
        Text(item.label,
          style: const TextStyle(color: kSlate500, fontSize: 10)),
      ]),
    ]),
  );
}

// Application card — redesigned
class _ApplicationCard extends StatelessWidget {
  final Map<String, dynamic> application;
  final int? busyId;
  final Map<int, String> rejectionReasons;
  final Function(int) onApprove;
  final Function(int) onReject;
  final Function(int, String) onReasonChange;

  const _ApplicationCard({
    required this.application,
    required this.busyId,
    required this.rejectionReasons,
    required this.onApprove,
    required this.onReject,
    required this.onReasonChange,
  });

  String _formatCurrency(dynamic value) {
    if (value == null) return 'TZS 0';
    final double v = value is double ? value : (double.tryParse(value.toString()) ?? 0);
    if (v >= 1000000) return 'TZS ${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000)    return 'TZS ${(v / 1000).toStringAsFixed(1)}K';
    return 'TZS ${v.toStringAsFixed(0)}';
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '—';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return kWarning;
      case 'approved':
        return kSuccess;
      case 'rejected':
        return kDanger;
      default:
        return kSlate500;
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = application['user'] as Map<String, dynamic>?;
    final property = application['property'] as Map<String, dynamic>?;
    final status = application['status'] as String? ?? 'pending';
    final message = application['message'] as String?;
    final rejectionReason = application['rejection_reason'] as String?;
    final createdAt = application['created_at'] as String?;

    return Container(
      decoration: BoxDecoration(
        color: kCardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                    color: kSlate200,
                    shape: BoxShape.circle,
                  ),
                  child: Center(child: Icon(Icons.person_outline, color: kSlate500, size: 18)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${user?['first_name'] ?? ''} ${user?['last_name'] ?? ''}',
                        style: const TextStyle(color: kSlate800, fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(user?['email'] ?? 'No email', style: const TextStyle(color: kSlate400, fontSize: 11)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: _getStatusColor(status).withOpacity(0.3)),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: TextStyle(color: _getStatusColor(status), fontSize: 8, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Property Info
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: kSlate100,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(property?['title'] ?? 'Untitled property', style: const TextStyle(color: kSlate800, fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 10, color: kSlate400),
                      const SizedBox(width: 3),
                      Expanded(child: Text(property?['location'] ?? 'No location', style: const TextStyle(color: kSlate500, fontSize: 10))),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text(_formatCurrency(property?['price']), style: const TextStyle(color: kSlate800, fontSize: 11, fontWeight: FontWeight.w700)),
                      const SizedBox(width: 6),
                      Text('Applied ${_formatDate(createdAt ?? '')}', style: const TextStyle(color: kSlate400, fontSize: 9)),
                    ],
                  ),
                ],
              ),
            ),
            if (message != null && message.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: kSlate100,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Message:', style: TextStyle(color: kSlate600, fontSize: 10, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 3),
                    Text(message, style: const TextStyle(color: kSlate600, fontSize: 11, height: 1.4)),
                  ],
                ),
              ),
            ],
            if (rejectionReason != null && rejectionReason.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: kDangerBg,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: kDanger.withOpacity(0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Rejection Reason:', style: TextStyle(color: kDanger, fontSize: 10, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 3),
                    Text(rejectionReason, style: const TextStyle(color: kDanger, fontSize: 11, height: 1.4)),
                  ],
                ),
              ),
            ],
            if (status == 'pending') ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: busyId == application['id'] ? null : () => onApprove(application['id']),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kSuccess,
                        foregroundColor: kWhite,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      child: Text(busyId == application['id'] ? 'Working...' : 'Approve', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: busyId == application['id'] ? null : () => onReject(application['id']),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kDanger,
                        foregroundColor: kWhite,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      child: Text(busyId == application['id'] ? 'Working...' : 'Reject', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              TextField(
                decoration: InputDecoration(
                  hintText: 'Rejection reason (required)...',
                  hintStyle: const TextStyle(color: kSlate400),
                  filled: true,
                  fillColor: kWhite,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: BorderSide(color: kBorder),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                ),
                style: const TextStyle(color: kSlate800, fontSize: 11),
                onChanged: (value) => onReasonChange(application['id'], value),
              ),
            ] else ...[
              const SizedBox(height: 10),
              const Text('No further action needed.', style: TextStyle(color: kSlate400, fontSize: 11)),
            ],
          ],
        ),
      ),
    );
  }
}
