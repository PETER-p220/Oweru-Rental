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
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        title: const Text('My Tenants', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: _refreshing ? kSlate : kGold),
            onPressed: _refreshing ? null : () => _loadTenants(silent: true),
          ),
        ],
      ),
      body: Column(
        children: [
          // Header Section
          Container(
            padding: const EdgeInsets.all(20),
            color: kBg2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Landlord Workspace', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
                    Row(
                      children: [
                        ElevatedButton.icon(
                          onPressed: _creatingTenants ? null : _handleCreateFromApproved,
                          icon: const Icon(Icons.person_add, size: 14),
                          label: Text(_creatingTenants ? 'Creating...' : 'Sync from Approved Apps'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kGold,
                            foregroundColor: kBg,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text('My Tenants', style: TextStyle(color: kCream, fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Active tenant records connected to your approved applications, with contract dates and rent amounts from your live system.',
                  style: TextStyle(color: kSlate, fontSize: 13),
                ),
                const SizedBox(height: 22),
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricCard('Active tenants', '${_tenants.length}'),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: kBg3,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: kBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Search', style: TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
                            const SizedBox(height: 8),
                            TextField(
                              decoration: InputDecoration(
                                hintText: 'Search tenants or properties',
                                hintStyle: const TextStyle(color: kSlate),
                                filled: true,
                                fillColor: kBg2,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              ),
                              style: const TextStyle(color: kCream, fontSize: 13),
                              onChanged: (value) {
                                setState(() => _searchQuery = value);
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Error/Success Alerts
          if (_error.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withOpacity(0.06),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.18)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error, size: 16, color: Color(0xFFEF4444)),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_error, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 14))),
                ],
              ),
            ),
          if (_success.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.22)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, size: 16, color: Color(0xFF10B981)),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_success, style: const TextStyle(color: Color(0xFF10B981), fontSize: 14))),
                ],
              ),
            ),
          // Tenants List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: kGold))
                : _tenants.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.people, size: 48, color: kSlate),
                            const SizedBox(height: 16),
                            const Text('No tenants found', style: TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            const Text(
                              'If you have approved applications, click Sync from Approved Apps above to generate tenant records automatically.',
                              style: TextStyle(color: kSlate, fontSize: 13),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton.icon(
                              onPressed: _creatingTenants ? null : _handleCreateFromApproved,
                              icon: const Icon(Icons.person_add, size: 16),
                              label: Text(_creatingTenants ? 'Creating...' : 'Sync from Approved Apps'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: kGold,
                                foregroundColor: kBg,
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                          ],
                        ),
                      )
                    : filtered.isEmpty
                        ? const Center(
                            child: Text('No tenants matched your search.', style: TextStyle(color: kSlate, fontSize: 13)),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: filtered.length,
                            itemBuilder: (context, index) => _buildTenantCard(filtered[index]),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: kBg3,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 0.14),
          ),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(color: kCream, fontSize: 30, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _buildTenantCard(Map<String, dynamic> tenant) {
    final user = tenant['user'] as Map<String, dynamic>? ?? {};
    final property = tenant['property'] as Map<String, dynamic>? ?? {};
    final contract = tenant['contract'] as Map<String, dynamic>? ?? {};
    final digitalContracts = tenant['digital_contracts'] as List?;
    final applicationId = tenant['application_id'];
    final application = tenant['application'] as Map<String, dynamic>? ?? {};

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kBg2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Tenant Info
          Row(
            children: [
              const CircleAvatar(
                backgroundColor: kGold,
                child: Icon(Icons.person, color: kBg, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${user['first_name'] ?? ''} ${user['last_name'] ?? ''}',
                      style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(user['email'] ?? 'No email', style: const TextStyle(color: kSlate, fontSize: 13)),
                    const SizedBox(height: 2),
                    Text(user['phone'] ?? 'No phone', style: const TextStyle(color: kSlate, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Property Info
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: kBg3,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(property['title'] ?? 'Untitled property', style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(property['location'] ?? 'No location', style: const TextStyle(color: kSlate, fontSize: 13)),
                const SizedBox(height: 4),
                Text(_formatCurrency(property['price'] ?? contract['rent_amount']), style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w600)),
                if (property['bedrooms'] != null || property['bathrooms'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      '${property['bedrooms'] ?? 0} bed · ${property['bathrooms'] ?? 0} bath',
                      style: const TextStyle(color: kSlate, fontSize: 12),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Contract Info
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Contract Dates', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    if (contract['start_date'] != null && contract['end_date'] != null)
                      Text('${_formatDate(contract['start_date'])} → ${_formatDate(contract['end_date'])}', style: const TextStyle(color: kCream, fontSize: 13))
                    else if (digitalContracts != null && digitalContracts.isNotEmpty)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Digital Contract', style: TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w600)),
                          Text('${digitalContracts[0]['status']}'.replaceAll('_', ' '), style: const TextStyle(color: kSlate, fontSize: 12)),
                          Text('Created: ${_formatDate(digitalContracts[0]['created_at'])}', style: const TextStyle(color: kSlate, fontSize: 11)),
                        ],
                      )
                    else
                      const Text('No active contract', style: TextStyle(color: kSlate, fontSize: 13)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Rent', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(_formatCurrency(property['price'] ?? contract['rent_amount'] ?? 0), style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Status', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    if (digitalContracts != null && digitalContracts.isNotEmpty)
                      _buildStatusBadge('${digitalContracts[0]['status']}'.replaceAll('_', ' '))
                    else if (contract['status'] != null)
                      _buildStatusBadge(contract['status'])
                    else
                      const Text('No contract', style: TextStyle(color: kSlate, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          if (applicationId != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: kGold.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: kGold.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.description, size: 14, color: kGold),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('View Application', style: TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
                        Text('ID: $applicationId ${application['status'] != null ? '· ${application['status']}' : ''}', style: const TextStyle(color: kSlate, fontSize: 10)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
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
