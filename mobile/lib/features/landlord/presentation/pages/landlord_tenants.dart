import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordTenantsPage extends StatefulWidget {
  const LandlordTenantsPage({super.key});

  @override
  State<LandlordTenantsPage> createState() => _LandlordTenantsPageState();
}

class _LandlordTenantsPageState extends State<LandlordTenantsPage> {
  List<Map<String, dynamic>> _tenants = [];
  bool _isLoading = true;
  String _error = '';
  String _success = '';
  String _searchQuery = '';
  bool _refreshing = false;
  bool _creatingTenants = false;

  @override
  void initState() {
    super.initState();
    _loadTenants();
  }

  Future<void> _loadTenants({bool silent = false}) async {
    setState(() {
      if (!silent) {
        _isLoading = true;
      } else {
        _refreshing = true;
      }
      _error = '';
    });

    try {
      final tenants = await LandlordApiService.getMyTenants();
      setState(() {
        _tenants = tenants;
        _isLoading = false;
        _refreshing = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load tenants.';
        _isLoading = false;
        _refreshing = false;
      });
    }
  }

  Future<void> _handleCreateFromApproved() async {
    setState(() {
      _creatingTenants = true;
      _error = '';
      _success = '';
    });

    try {
      final response = await LandlordApiService.createTenantFromApprovedApplication();
      final count = response['tenants_created']?.length ?? 0;
      setState(() {
        _success = 'Created $count tenant record${count != 1 ? 's' : ''} from approved applications.';
      });
      await _loadTenants(silent: true);
    } catch (e) {
      setState(() {
        _error = 'Failed to create tenants from approved applications.';
      });
    } finally {
      setState(() {
        _creatingTenants = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredTenants {
    if (_searchQuery.isEmpty) return _tenants;
    return _tenants.where((tenant) {
      final user = tenant['user'] as Map<String, dynamic>? ?? {};
      final property = tenant['property'] as Map<String, dynamic>? ?? {};
      final haystack = [
        user['first_name'],
        user['last_name'],
        user['email'],
        property['title'],
        property['location'],
      ].join(' ').toLowerCase();
      return haystack.contains(_searchQuery.toLowerCase());
    }).toList();
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
      case 'active':
      case 'signed':
        return const Color(0xFF10B981);
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'expired':
      case 'rejected':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF6B7280);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredTenants;

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
          
          // ── Search ───────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            sliver: SliverToBoxAdapter(child: _searchSection()),
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
          
          // ── Tenants list ────────────────────────────
          if (_isLoading)
            SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: kSlate800, strokeWidth: 2)))
          else if (_tenants.isEmpty)
            SliverFillRemaining(child: _emptyState())
          else if (filtered.isEmpty)
            SliverFillRemaining(child: Center(child: const Text('No tenants matched your search.', style: TextStyle(color: kSlate500, fontSize: 13))))
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              sliver: SliverList(delegate: SliverChildBuilderDelegate(
                (_, i) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _TenantCard(tenant: filtered[i])),
                childCount: filtered.length,
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
        const Text('My Tenants',
          style: TextStyle(color: kWhite, fontSize: 20,
            fontWeight: FontWeight.w800, letterSpacing: -0.3)),
        const Spacer(),
        // Refresh button
        GestureDetector(
          onTap: _refreshing ? null : () => _loadTenants(silent: true),
          child: Container(
            padding: const EdgeInsets.all(8),
            child: Icon(Icons.refresh, 
              color: _refreshing ? kSlate400 : kWhite, 
              size: 20),
          ),
        ),
      ]),
      const SizedBox(height: 16),
      // Stats summary
      Text('${_tenants.length} active tenant${_tenants.length != 1 ? 's' : ''}',
        style: const TextStyle(color: kSlate400, fontSize: 13)),
    ]),
  );

  // ── Horizontal stats row ───────────────────────────────────
  Widget _statsRow() {
    final items = [
      _StatItem(value: '${_tenants.length}',          label: 'Tenants',      icon: Icons.people_outline,                accent: kSlate800, bg: kSlate100),
      _StatItem(value: '${_tenants.length}',          label: 'Properties',   icon: Icons.home_work_outlined,              accent: kInfo,     bg: kInfoBg),
      _StatItem(value: 'Active',                      label: 'Status',       icon: Icons.check_circle_outline,          accent: kSuccess,  bg: kSuccessBg),
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

  // ── Search section ────────────────────────────────────────
  Widget _searchSection() => TextField(
    decoration: InputDecoration(
      hintText: 'Search tenants or properties...',
      hintStyle: const TextStyle(color: kSlate400),
      filled: true,
      fillColor: kWhite,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: kBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: kBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: kSlate600),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      prefixIcon: const Icon(Icons.search, color: kSlate400, size: 18),
    ),
    style: const TextStyle(color: kSlate800, fontSize: 14),
    onChanged: (value) => setState(() => _searchQuery = value),
  );

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
        child: const Icon(Icons.people_outline, color: kSlate400, size: 26)),
      const SizedBox(height: 12),
      const Text('No tenants found.',
        style: TextStyle(color: kSlate500, fontSize: 13)),
      const SizedBox(height: 4),
      const Text('Sync from approved applications to create tenant records.',
        style: TextStyle(color: kSlate400, fontSize: 12)),
      const SizedBox(height: 16),
      ElevatedButton(
        onPressed: _creatingTenants ? null : _handleCreateFromApproved,
        style: ElevatedButton.styleFrom(
          backgroundColor: kSlate800,
          foregroundColor: kWhite,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        child: Text(_creatingTenants ? 'Creating...' : 'Sync from Approved Apps'),
      ),
    ])),
  );

  Widget _buildTenantCard(Map<String, dynamic> tenant) {
    final user = tenant['user'] as Map<String, dynamic>? ?? {};
    final property = tenant['property'] as Map<String, dynamic>? ?? {};
    final contract = tenant['contract'] as Map<String, dynamic>? ?? {};
    final digitalContracts = tenant['digital_contracts'] as List?;

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
                  Text(property['title'] ?? 'Untitled property', style: const TextStyle(color: kSlate800, fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 11, color: kSlate400),
                      const SizedBox(width: 4),
                      Expanded(child: Text(property['location'] ?? 'No location', style: const TextStyle(color: kSlate500, fontSize: 11))),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            // Contract Info Row
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Rent', style: TextStyle(color: kSlate500, fontSize: 10, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(_formatCurrency(property['price'] ?? contract['rent_amount'] ?? 0), style: const TextStyle(color: kSlate800, fontSize: 13, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Contract', style: TextStyle(color: kSlate500, fontSize: 10, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      if (contract['start_date'] != null && contract['end_date'] != null)
                        Text('${_formatDate(contract['start_date'])} - ${_formatDate(contract['end_date'])}', style: const TextStyle(color: kSlate600, fontSize: 11))
                      else
                        const Text('No dates', style: TextStyle(color: kSlate400, fontSize: 11)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Status', style: TextStyle(color: kSlate500, fontSize: 10, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      if (digitalContracts != null && digitalContracts.isNotEmpty)
                        _buildStatusBadge('${digitalContracts[0]['status']}'.replaceAll('_', ' '))
                      else if (contract['status'] != null)
                        _buildStatusBadge(contract['status'])
                      else
                        const Text('No contract', style: TextStyle(color: kSlate400, fontSize: 11)),
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

// Tenant card — redesigned
class _TenantCard extends StatelessWidget {
  final Map<String, dynamic> tenant;
  const _TenantCard({required this.tenant});

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
      case 'active':
      case 'signed':
        return kSuccess;
      case 'pending':
        return kWarning;
      case 'expired':
      case 'rejected':
        return kDanger;
      default:
        return kSlate500;
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = tenant['user'] as Map<String, dynamic>? ?? {};
    final property = tenant['property'] as Map<String, dynamic>? ?? {};
    final contract = tenant['contract'] as Map<String, dynamic>? ?? {};
    final digitalContracts = tenant['digital_contracts'] as List?;

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
                  Text(property['title'] ?? 'Untitled property', style: const TextStyle(color: kSlate800, fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 10, color: kSlate400),
                      const SizedBox(width: 3),
                      Expanded(child: Text(property['location'] ?? 'No location', style: const TextStyle(color: kSlate500, fontSize: 10))),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            // Contract Info Row
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Rent', style: TextStyle(color: kSlate500, fontSize: 9, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(_formatCurrency(property['price'] ?? contract['rent_amount'] ?? 0), style: const TextStyle(color: kSlate800, fontSize: 12, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Contract', style: TextStyle(color: kSlate500, fontSize: 9, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      if (contract['start_date'] != null && contract['end_date'] != null)
                        Text('${_formatDate(contract['start_date'])} - ${_formatDate(contract['end_date'])}', style: const TextStyle(color: kSlate600, fontSize: 10))
                      else
                        const Text('No dates', style: TextStyle(color: kSlate400, fontSize: 10)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Status', style: TextStyle(color: kSlate500, fontSize: 9, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      if (digitalContracts != null && digitalContracts.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: _getStatusColor('${digitalContracts[0]['status']}').withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: _getStatusColor('${digitalContracts[0]['status']}').withValues(alpha: 0.3)),
                          ),
                          child: Text(
                            '${digitalContracts[0]['status']}'.replaceAll('_', ' ').toUpperCase(),
                            style: TextStyle(color: _getStatusColor('${digitalContracts[0]['status']}'), fontSize: 8, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                          ),
                        )
                      else if (contract['status'] != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: _getStatusColor(contract['status']).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: _getStatusColor(contract['status']).withValues(alpha: 0.3)),
                          ),
                          child: Text(
                            contract['status'].toString().toUpperCase(),
                            style: TextStyle(color: _getStatusColor(contract['status']), fontSize: 8, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                          ),
                        )
                      else
                        const Text('No contract', style: TextStyle(color: kSlate400, fontSize: 10)),
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
