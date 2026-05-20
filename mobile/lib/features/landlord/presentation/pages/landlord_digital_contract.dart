import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordDigitalContractPage extends StatefulWidget {
  const LandlordDigitalContractPage({super.key});

  @override
  State<LandlordDigitalContractPage> createState() => _LandlordDigitalContractPageState();
}

class _LandlordDigitalContractPageState extends State<LandlordDigitalContractPage> {
  List<Map<String, dynamic>> _contracts = [];
  List<Map<String, dynamic>> _properties = [];
  List<Map<String, dynamic>> _tenants = [];
  bool _isLoading = true;
  String _error = '';
  String _success = '';
  bool _showModal = false;
  bool _uploading = false;
  bool _creating = false;
  Map<String, dynamic> _previewContract = {};
  String _title = '';
  String _propertyId = '';
  String _tenantId = '';
  String _fileUrl = '';
  String _fileName = '';
  String _contractType = 'nyumba';

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
      final contracts = await LandlordApiService.getDigitalContracts();
      final properties = await LandlordApiService.getMyProperties();
      final tenants = await LandlordApiService.getMyTenants();
      setState(() {
        _contracts = contracts;
        _properties = properties;
        _tenants = tenants;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load data.';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleCreateContract() async {
    if (_title.isEmpty || _propertyId.isEmpty || _tenantId.isEmpty) {
      setState(() => _error = 'Please fill all required fields.');
      return;
    }
    if (_fileUrl.isEmpty) {
      setState(() => _error = 'Please upload a contract file.');
      return;
    }

    setState(() {
      _creating = true;
      _error = '';
    });

    try {
      await LandlordApiService.createDigitalContract({
        'title': _title,
        'property_id': int.parse(_propertyId),
        'tenant_id': int.parse(_tenantId),
        'file_url': _fileUrl,
        'file_name': _fileName,
        'file_type': 'application/pdf',
        'status': 'draft',
      });
      setState(() {
        _success = 'Contract created successfully.';
        _showModal = false;
        _title = '';
        _propertyId = '';
        _tenantId = '';
        _fileUrl = '';
        _fileName = '';
      });
      await _loadData();
    } catch (e) {
      setState(() => _error = 'Failed to create contract.');
    } finally {
      setState(() => _creating = false);
    }
  }

  Future<void> _sendToTenant(int contractId) async {
    try {
      setState(() => _error = '');
      await LandlordApiService.sendContractToTenant(contractId);
      setState(() => _success = 'Contract sent to tenant.');
      await _loadData();
    } catch (e) {
      setState(() => _error = 'Failed to send contract.');
    }
  }

  Future<void> _approveContract(int contractId) async {
    try {
      setState(() => _error = '');
      await LandlordApiService.approveSignedContract(contractId);
      setState(() => _success = 'Contract approved.');
      await _loadData();
    } catch (e) {
      setState(() => _error = 'Failed to approve contract.');
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
      case 'draft':
        return const Color(0xFF6B7280);
      case 'pending_signature':
        return const Color(0xFFC9A84C);
      case 'pending_review':
        return const Color(0xFF3B82F6);
      case 'approved':
        return const Color(0xFF16A34A);
      case 'rejected':
        return const Color(0xFFDC2626);
      default:
        return const Color(0xFF6B7280);
    }
  }

  String _getStatusLabel(String? status) {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'Rasimu';
      case 'pending_signature':
        return 'Inasubiri Sahihi';
      case 'pending_review':
        return 'Inakaguliwa';
      case 'approved':
        return 'Imeidhinishwa';
      case 'rejected':
        return 'Imekataliwa';
      default:
        return status ?? 'Unknown';
    }
  }

  Map<String, int> get _stats {
    return {
      'total': _contracts.length,
      'draft': _contracts.where((c) => c['status'] == 'draft').length,
      'pending': _contracts.where((c) => c['status'] == 'pending_signature').length,
      'review': _contracts.where((c) => c['status'] == 'pending_review').length,
      'approved': _contracts.where((c) => c['status'] == 'approved').length,
    };
  }

  @override
  Widget build(BuildContext context) {
    final stats = _stats;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        title: const Text('Digital Contracts', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: kGold),
            onPressed: () => setState(() => _showModal = true),
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
                const Text('Landlord Workspace', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
                const SizedBox(height: 16),
                const Text('Digital Contracts', style: TextStyle(color: kCream, fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Upload rental contracts and manage digital signatures for your tenants.',
                  style: TextStyle(color: kSlate, fontSize: 13),
                ),
                const SizedBox(height: 24),
                // Stats Row
                if (!_isLoading && _contracts.isNotEmpty)
                  Row(
                    children: [
                      _buildStatCard('Total', '${stats['total']}', kSlate),
                      const SizedBox(width: 12),
                      _buildStatCard('Rasimu', '${stats['draft']}', kSlate),
                      const SizedBox(width: 12),
                      _buildStatCard('Zinasubiri Sahihi', '${stats['pending']}', const Color(0xFFC9A84C)),
                      const SizedBox(width: 12),
                      _buildStatCard('Zinakaguliwa', '${stats['review']}', const Color(0xFF3B82F6)),
                      const SizedBox(width: 12),
                      _buildStatCard('Zilizoidhinishwa', '${stats['approved']}', const Color(0xFF16A34A)),
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
          // Contracts List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: kGold))
                : _contracts.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.shield, size: 48, color: kSlate),
                            const SizedBox(height: 16),
                            const Text('No digital contracts', style: TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            const Text(
                              'Create your first digital contract for your tenants.',
                              style: TextStyle(color: kSlate, fontSize: 13),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _contracts.length,
                        itemBuilder: (context, index) => _buildContractCard(_contracts[index]),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => setState(() => _showModal = true),
        backgroundColor: kGold,
        foregroundColor: kBg,
        icon: const Icon(Icons.add),
        label: const Text('Create Contract'),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          color: kBg3,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: kBorder),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: kSlate, fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _buildContractCard(Map<String, dynamic> contract) {
    final property = contract['property'] as Map<String, dynamic>? ?? {};
    final tenant = contract['tenant'] as Map<String, dynamic>? ?? {};
    final status = contract['status'] as String? ?? 'draft';
    final fileName = contract['file_name'] as String?;
    final fields = contract['fields'] as List?;

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
          // Header
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(contract['title'] ?? 'Contract', style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600)),
                    if (fileName != null) ...[
                      const SizedBox(height: 4),
                      Text('📄 $fileName', style: const TextStyle(color: kSlate, fontSize: 12)),
                    ],
                    if (fields != null && fields.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text('${fields.length} fields', style: const TextStyle(color: kGold, fontSize: 11)),
                    ],
                  ],
                ),
              ),
              _buildStatusBadge(status),
            ],
          ),
          const SizedBox(height: 16),
          // Property Info
          Row(
            children: [
              const Icon(Icons.location_on, size: 12, color: kGold),
              const SizedBox(width: 6),
              Expanded(
                child: Text(property['title'] ?? 'Property #${contract['property_id']}', style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          if (property['location'] != null)
            Padding(
              padding: const EdgeInsets.only(left: 18, top: 2),
              child: Text(property['location'], style: const TextStyle(color: kSlate, fontSize: 12)),
            ),
          if (property['price'] != null)
            Padding(
              padding: const EdgeInsets.only(left: 18, top: 2),
              child: Text('${_formatCurrency(property['price'])}/month', style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          const SizedBox(height: 12),
          // Tenant Info
          Row(
            children: [
              const Icon(Icons.person, size: 12, color: kSlate),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '${tenant['user']?['first_name'] ?? ''} ${tenant['user']?['last_name'] ?? ''}'.trim() ?? 'Tenant #${contract['tenant_id']}',
                  style: const TextStyle(color: kCream, fontSize: 13),
                ),
              ),
            ],
          ),
          if (tenant['user']?['email'] != null)
            Padding(
              padding: const EdgeInsets.only(left: 18, top: 2),
              child: Text(tenant['user']['email'], style: const TextStyle(color: kSlate, fontSize: 11)),
            ),
          const SizedBox(height: 12),
          // Date
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 12, color: kSlate),
              const SizedBox(width: 6),
              Text(_formatDate(contract['created_at'] ?? ''), style: const TextStyle(color: kSlate, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 16),
          // Actions
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => setState(() => _previewContract = contract),
                  icon: const Icon(Icons.visibility, size: 14),
                  label: const Text('View'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: kGold,
                    side: const BorderSide(color: kGold),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              if (status == 'draft')
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _sendToTenant(contract['id']),
                    icon: const Icon(Icons.send, size: 14),
                    label: const Text('Send'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kGold,
                      foregroundColor: kBg,
                    ),
                  ),
                ),
              if (status == 'pending_review')
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _approveContract(contract['id']),
                    icon: const Icon(Icons.check_circle, size: 14),
                    label: const Text('Approve'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
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
        _getStatusLabel(status).toUpperCase(),
        style: TextStyle(color: _getStatusColor(status), fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5),
      ),
    );
  }
}
