import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordCommissionReportsPage extends StatefulWidget {
  const LandlordCommissionReportsPage({super.key});

  @override
  State<LandlordCommissionReportsPage> createState() => _LandlordCommissionReportsPageState();
}

class _LandlordCommissionReportsPageState extends State<LandlordCommissionReportsPage> {
  List<Map<String, dynamic>> _commissions = [];
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final commissions = await LandlordApiService.getCommissionReports();
      setState(() {
        _commissions = commissions;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load commission reports.';
        _isLoading = false;
      });
    }
  }

  double get _total {
    return _commissions.fold<double>(0, (sum, item) => sum + (double.tryParse(item['amount']?.toString() ?? '0') ?? 0));
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
      case 'paid':
        return kSuccess;
      case 'pending':
        return kWarning;
      case 'cancelled':
        return kDanger;
      default:
        return kSlate500;
    }
  }

  @override
  Widget build(BuildContext context) {
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
            sliver: SliverToBoxAdapter(child: _statsRow()),
          ),
          
          // ── Error Alert ─────────────────────────────
          if (_error.isNotEmpty)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              sliver: SliverToBoxAdapter(child: _alertBanner(_error, kDanger, Icons.error)),
            ),
          
          // ── Commissions list ───────────────────────
          if (_isLoading)
            SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: kSlate800, strokeWidth: 2)))
          else if (_commissions.isEmpty)
            SliverFillRemaining(child: _emptyState())
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              sliver: SliverList(delegate: SliverChildBuilderDelegate(
                (_, i) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _CommissionCard(commission: _commissions[i])),
                childCount: _commissions.length,
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
        const Text('Commission Reports',
          style: TextStyle(color: kWhite, fontSize: 20,
            fontWeight: FontWeight.w800, letterSpacing: -0.3)),
      ]),
      const SizedBox(height: 16),
      // Stats summary
      Text('${_commissions.length} commission${_commissions.length != 1 ? 's' : ''}',
        style: const TextStyle(color: kSlate400, fontSize: 13)),
    ]),
  );

  // ── Horizontal stats row ───────────────────────────────────
  Widget _statsRow() {
    final items = [
      _StatItem(value: '${_commissions.length}', label: 'Records', icon: Icons.description, accent: kSlate800, bg: kSlate100),
      _StatItem(value: _formatCurrency(_total), label: 'Total', icon: Icons.attach_money, accent: kSuccess, bg: kSuccessBg),
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
        child: const Icon(Icons.description, color: kSlate400, size: 26)),
      const SizedBox(height: 12),
      const Text('No commission records found.',
        style: TextStyle(color: kSlate500, fontSize: 13)),
      const SizedBox(height: 4),
      const Text('Commission records will appear here.',
        style: TextStyle(color: kSlate400, fontSize: 12)),
    ])),
  );

  Widget _buildCommissionCard(Map<String, dynamic> commission) {
    final agent = commission['agent'] as Map<String, dynamic>? ?? {};
    final property = commission['property'] as Map<String, dynamic>? ?? {};
    final status = commission['status'] as String?;

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
            // Agent Info
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
                        '${agent['first_name'] ?? ''} ${agent['last_name'] ?? ''}',
                        style: const TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(agent['email'] ?? 'No email', style: const TextStyle(color: kSlate400, fontSize: 12)),
                    ],
                  ),
                ),
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
              child: Row(
                children: [
                  const Icon(Icons.location_on, size: 11, color: kSlate400),
                  const SizedBox(width: 4),
                  Expanded(child: Text(property['title'] ?? 'Untitled property', style: const TextStyle(color: kSlate600, fontSize: 12))),
                ],
              ),
            ),
            const SizedBox(height: 12),
            // Details Row
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Amount', style: TextStyle(color: kSlate500, fontSize: 10, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(_formatCurrency(commission['amount']), style: const TextStyle(color: kSlate800, fontSize: 12, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Created', style: TextStyle(color: kSlate500, fontSize: 10, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(_formatDate(commission['created_at'] ?? ''), style: const TextStyle(color: kSlate600, fontSize: 12)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Status', style: TextStyle(color: kSlate500, fontSize: 10, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      if (status != null)
                        _buildStatusBadge(status)
                      else
                        const Text('unknown', style: TextStyle(color: kSlate400, fontSize: 11)),
                    ],
                  ),
                ),
              ],
            ),
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

// Commission card — redesigned
class _CommissionCard extends StatelessWidget {
  final Map<String, dynamic> commission;

  const _CommissionCard({required this.commission});

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
      case 'paid':
        return kSuccess;
      case 'pending':
        return kWarning;
      case 'cancelled':
        return kDanger;
      default:
        return kSlate500;
    }
  }

  @override
  Widget build(BuildContext context) {
    final agent = commission['agent'] as Map<String, dynamic>? ?? {};
    final property = commission['property'] as Map<String, dynamic>? ?? {};
    final status = commission['status'] as String?;

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
            // Agent Info
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
                        '${agent['first_name'] ?? ''} ${agent['last_name'] ?? ''}',
                        style: const TextStyle(color: kSlate800, fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(agent['email'] ?? 'No email', style: const TextStyle(color: kSlate400, fontSize: 11)),
                    ],
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
              child: Row(
                children: [
                  const Icon(Icons.location_on, size: 10, color: kSlate400),
                  const SizedBox(width: 3),
                  Expanded(child: Text(property['title'] ?? 'Untitled property', style: const TextStyle(color: kSlate600, fontSize: 11))),
                ],
              ),
            ),
            const SizedBox(height: 10),
            // Details Row
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Amount', style: TextStyle(color: kSlate500, fontSize: 9, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(_formatCurrency(commission['amount']), style: const TextStyle(color: kSlate800, fontSize: 11, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Created', style: TextStyle(color: kSlate500, fontSize: 9, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(_formatDate(commission['created_at'] ?? ''), style: const TextStyle(color: kSlate600, fontSize: 11)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Status', style: TextStyle(color: kSlate500, fontSize: 9, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      if (status != null)
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
                        )
                      else
                        const Text('unknown', style: TextStyle(color: kSlate400, fontSize: 10)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
