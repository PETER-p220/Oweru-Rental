// ============================================================
// landlord_tenants.dart — My Tenants page
// ============================================================
import 'package:flutter/material.dart';
import 'landlord_theme.dart';

class LandlordTenantsPage extends StatefulWidget {
  const LandlordTenantsPage({super.key});
  @override
  State<LandlordTenantsPage> createState() => _LandlordTenantsPageState();
}

class _LandlordTenantsPageState extends State<LandlordTenantsPage> {
  final List<Tenant> _tenants = [];
  bool _loading = true;
  bool _refreshing = false;
  bool _creating = false;
  String _error = '';
  String _success = '';
  String _search = '';
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: _search);
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData({bool silent = false}) async {
    setState(() {
      if (!silent) _loading = true;
      else _refreshing = true;
      _error = '';
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _loading = false;
      _refreshing = false;
      // For now, empty list - will be populated from API
    });
  }

  Future<void> _syncFromApproved() async {
    setState(() {
      _creating = true;
      _error = '';
      _success = '';
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _creating = false;
      _success = 'No approved applications found to sync.';
    });
  }

  List<Tenant> get _filteredTenants {
    if (_search.isEmpty) return _tenants;
    final term = _search.toLowerCase();
    return _tenants.where((t) =>
      t.name.toLowerCase().contains(term) ||
      t.property.toLowerCase().contains(term) ||
      t.email.toLowerCase().contains(term)
    ).toList();
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
      title: const Text('My Tenants',
        style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600)),
      actions: [
        IconButton(
          icon: Icon(Icons.refresh_rounded, color: kGold, size: 20),
          onPressed: _refreshing ? null : () => _loadData(silent: true),
        ),
      ],
    ),
    body: _loading ? _buildLoading() : _buildContent(),
  );

  Widget _buildLoading() => const Center(
    child: CircularProgressIndicator(color: kGold),
  );

  Widget _buildContent() => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      // Header actions
      Row(children: [
        Expanded(
          child: LGoldButton(
            label: 'Sync from Approved Apps',
            icon: Icons.person_add_rounded,
            onTap: _syncFromApproved,
            fullWidth: true,
          ),
        ),
      ]),
      if (_success.isNotEmpty) ...[
        const SizedBox(height: 12),
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
      ],
      if (_error.isNotEmpty) ...[
        const SizedBox(height: 12),
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
      ],
      const SizedBox(height: 20),

      // Metrics
      Row(children: [
        Expanded(child: LCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Active tenants', style: TextStyle(color: kGold, fontSize: 10, letterSpacing: 1)),
            const SizedBox(height: 8),
            Text('${_tenants.length}', style: TextStyle(color: kCream, fontSize: 28, fontWeight: FontWeight.w700)),
          ],
        ))),
        const SizedBox(width: 12),
        Expanded(child: LCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Search', style: TextStyle(color: kGold, fontSize: 10, letterSpacing: 1)),
            const SizedBox(height: 8),
            TextField(
              controller: _searchController,
              onChanged: (v) => setState(() => _search = v),
              style: TextStyle(color: kCream, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search tenants...',
                hintStyle: TextStyle(color: kSlate, fontSize: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: kBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: kBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: kGold),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
          ],
        ))),
      ]),
      const SizedBox(height: 20),

      // Tenant list
      if (_tenants.isEmpty) ...[
        LEmptyState(
          icon: Icons.people_alt_rounded,
          title: 'No tenants found',
          subtitle: 'If you have approved applications, click Sync from Approved Apps to generate tenant records.',
        ),
      ] else if (_filteredTenants.isEmpty) ...[
        LCard(child: Padding(
          padding: const EdgeInsets.all(20),
          child: Center(child: Text('No tenants matched your search.',
            style: TextStyle(color: kSlate, fontSize: 13))),
        )),
      ] else ...[
        ..._filteredTenants.map((tenant) => _TenantCard(tenant: tenant)),
      ],
    ],
  );
}

class Tenant {
  final String name;
  final String email;
  final String phone;
  final String property;
  final String location;
  final String rent;
  final String status;
  final String? contractStart;
  final String? contractEnd;

  Tenant({
    required this.name,
    required this.email,
    required this.phone,
    required this.property,
    required this.location,
    required this.rent,
    required this.status,
    this.contractStart,
    this.contractEnd,
  });
}

class _TenantCard extends StatelessWidget {
  final Tenant tenant;
  const _TenantCard({required this.tenant});

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
          child: Icon(Icons.person_rounded, color: kGold, size: 20)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tenant.name, style: TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(tenant.email, style: TextStyle(color: kSlate, fontSize: 11)),
          const SizedBox(height: 2),
          Text(tenant.phone, style: TextStyle(color: kSlate, fontSize: 11)),
        ])),
        LStatusBadge(label: tenant.status, color: _getStatusColor(tenant.status)),
      ]),
      const SizedBox(height: 12),
      Divider(color: kGold.withOpacity(0.1)),
      const SizedBox(height: 12),
      Row(children: [
        Icon(Icons.home_work_rounded, color: kSlate, size: 16),
        const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tenant.property, style: TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w500)),
          Text(tenant.location, style: TextStyle(color: kSlate, fontSize: 11)),
        ])),
      ]),
      const SizedBox(height: 8),
      Row(children: [
        Icon(Icons.account_balance_wallet_rounded, color: kGold, size: 16),
        const SizedBox(width: 8),
        Text(tenant.rent, style: TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w600)),
      ]),
      if (tenant.contractStart != null && tenant.contractEnd != null) ...[
        const SizedBox(height: 8),
        Row(children: [
          Icon(Icons.calendar_today_rounded, color: kSlate, size: 16),
          const SizedBox(width: 8),
          Text('${tenant.contractStart} → ${tenant.contractEnd}',
            style: TextStyle(color: kSlate, fontSize: 11)),
        ]),
      ],
    ]),
  );

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active': return kSuccess;
      case 'pending': return kWarning;
      case 'expired': return kDanger;
      default: return kSlate;
    }
  }
}
