import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordReceiptsPage extends StatefulWidget {
  const LandlordReceiptsPage({super.key});

  @override
  State<LandlordReceiptsPage> createState() => _LandlordReceiptsPageState();
}

class _LandlordReceiptsPageState extends State<LandlordReceiptsPage> {
  List<Map<String, dynamic>> _receipts = [];
  bool _isLoading = true;
  String _error = '';
  String _info = '';

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
      final receipts = await LandlordApiService.getReceipts();
      setState(() {
        _receipts = receipts;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load receipts.';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleDownload(int id) async {
    try {
      setState(() => _info = '');
      await LandlordApiService.downloadOwnerReceipt(id);
      setState(() => _info = 'Receipt request sent.');
    } catch (e) {
      setState(() => _info = 'Receipt download is not available yet.');
    }
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
      case 'completed':
      case 'paid':
        return kSuccess;
      case 'pending':
        return kWarning;
      case 'failed':
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
          
          // ── Error/Info Alerts ─────────────────────
          if (_error.isNotEmpty)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              sliver: SliverToBoxAdapter(child: _alertBanner(_error, kDanger, Icons.error)),
            ),
          if (_info.isNotEmpty)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              sliver: SliverToBoxAdapter(child: _alertBanner(_info, kInfo, Icons.info)),
            ),
          
          // ── Receipts list ──────────────────────────
          if (_isLoading)
            SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: kSlate800, strokeWidth: 2)))
          else if (_receipts.isEmpty)
            SliverFillRemaining(child: _emptyState())
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              sliver: SliverList(delegate: SliverChildBuilderDelegate(
                (_, i) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _ReceiptCard(receipt: _receipts[i], onDownload: () => _handleDownload(_receipts[i]['id']))),
                childCount: _receipts.length,
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
        const Text('Payment Receipts',
          style: TextStyle(color: kWhite, fontSize: 20,
            fontWeight: FontWeight.w800, letterSpacing: -0.3)),
      ]),
      const SizedBox(height: 16),
      // Stats summary
      Text('${_receipts.length} receipt${_receipts.length != 1 ? 's' : ''}',
        style: const TextStyle(color: kSlate400, fontSize: 13)),
    ]),
  );

  // ── Horizontal stats row ───────────────────────────────────
  Widget _statsRow() {
    final completed = _receipts.where((r) => r['status'] == 'completed' || r['status'] == 'paid').length;
    final pending = _receipts.where((r) => r['status'] == 'pending').length;
    final total = _receipts.fold<double>(0, (sum, r) => sum + (r['amount'] as num? ?? 0));

    final items = [
      _StatItem(value: '${_receipts.length}',          label: 'Total',       icon: Icons.receipt_long,              accent: kSlate800, bg: kSlate100),
      _StatItem(value: '$completed',                   label: 'Completed',   icon: Icons.check_circle_outline,       accent: kSuccess,  bg: kSuccessBg),
      _StatItem(value: '$pending',                     label: 'Pending',     icon: Icons.pending_actions_outlined,   accent: kWarning,  bg: kWarningBg),
      _StatItem(value: _formatCurrency(total),         label: 'Total Value', icon: Icons.attach_money_outlined,     accent: kInfo,     bg: kInfoBg),
    ];

    return SizedBox(
      height: 96,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (_, i) => _StatCard2(item: items[i]),
      ),
    );
  }

  // ── Alert banner ───────────────────────────────────────────
  Widget _alertBanner(String message, Color color, IconData icon) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: color.withValues(alpha: 0.2)),
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
        child: const Icon(Icons.receipt_long, color: kSlate400, size: 26)),
      const SizedBox(height: 12),
      const Text('No receipts found.',
        style: TextStyle(color: kSlate500, fontSize: 13)),
      const SizedBox(height: 4),
      const Text('Completed payment receipts will appear here.',
        style: TextStyle(color: kSlate400, fontSize: 12)),
    ])),
  );

  Widget _buildReceiptCard(Map<String, dynamic> receipt) {
    final tenant = receipt['tenant'] as Map<String, dynamic>? ?? {};
    final user = tenant['user'] as Map<String, dynamic>? ?? {};
    final property = receipt['property'] as Map<String, dynamic>? ?? {};
    final status = receipt['status'] as String?;
    final type = receipt['type'] as String? ?? 'payment';

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
            // Tenant Info
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
                        '${user['first_name'] ?? ''} ${user['last_name'] ?? ''}',
                        style: const TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(user['email'] ?? 'No email', style: const TextStyle(color: kSlate400, fontSize: 12)),
                    ],
                  ),
                ),
                _buildStatusBadge(status ?? 'unknown'),
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
                      const Text('Type', style: TextStyle(color: kSlate500, fontSize: 10, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(type, style: const TextStyle(color: kSlate700, fontSize: 12)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Amount', style: TextStyle(color: kSlate500, fontSize: 10, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(_formatCurrency(receipt['amount']), style: const TextStyle(color: kSlate800, fontSize: 12, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Date', style: TextStyle(color: kSlate500, fontSize: 10, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(_formatDate(receipt['created_at'] ?? ''), style: const TextStyle(color: kSlate600, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Download Button
            OutlinedButton.icon(
              onPressed: () => _handleDownload(receipt['id']),
              icon: const Icon(Icons.download, size: 12),
              label: const Text('Download'),
              style: OutlinedButton.styleFrom(
                foregroundColor: kSlate800,
                side: const BorderSide(color: kSlate300),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
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
        color: _getStatusColor(status).withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: _getStatusColor(status).withValues(alpha: 0.3)),
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

// Receipt card — redesigned
class _ReceiptCard extends StatelessWidget {
  final Map<String, dynamic> receipt;
  final VoidCallback onDownload;

  const _ReceiptCard({required this.receipt, required this.onDownload});

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
      case 'completed':
      case 'paid':
        return kSuccess;
      case 'pending':
        return kWarning;
      case 'failed':
      case 'cancelled':
        return kDanger;
      default:
        return kSlate500;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tenant = receipt['tenant'] as Map<String, dynamic>? ?? {};
    final user = tenant['user'] as Map<String, dynamic>? ?? {};
    final property = receipt['property'] as Map<String, dynamic>? ?? {};
    final status = receipt['status'] as String?;
    final type = receipt['type'] as String? ?? 'payment';

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
            // Tenant Info
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
                        '${user['first_name'] ?? ''} ${user['last_name'] ?? ''}',
                        style: const TextStyle(color: kSlate800, fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(user['email'] ?? 'No email', style: const TextStyle(color: kSlate400, fontSize: 11)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: _getStatusColor(status).withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    (status ?? 'unknown').toUpperCase(),
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
                      const Text('Type', style: TextStyle(color: kSlate500, fontSize: 9, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(type, style: const TextStyle(color: kSlate700, fontSize: 11)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Amount', style: TextStyle(color: kSlate500, fontSize: 9, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(_formatCurrency(receipt['amount']), style: const TextStyle(color: kSlate800, fontSize: 11, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Date', style: TextStyle(color: kSlate500, fontSize: 9, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(_formatDate(receipt['created_at'] ?? ''), style: const TextStyle(color: kSlate600, fontSize: 11)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Download Button
            OutlinedButton.icon(
              onPressed: onDownload,
              icon: const Icon(Icons.download, size: 11),
              label: const Text('Download'),
              style: OutlinedButton.styleFrom(
                foregroundColor: kSlate800,
                side: const BorderSide(color: kSlate300),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
