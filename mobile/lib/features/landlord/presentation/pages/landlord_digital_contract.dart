import 'package:file_picker/file_picker.dart';
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
  bool _uploading = false;
  bool _creating = false;
  int? _downloadingId;
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
        'contract_type': _contractType,
        'status': 'draft',
      });
      setState(() {
        _success = 'Contract created successfully.';
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

  Future<void> _downloadContract(int contractId) async {
    setState(() => _downloadingId = contractId);
    try {
      setState(() => _error = '');
      final fileUrl = await LandlordApiService.downloadDigitalContract(contractId);
      if (fileUrl != null) {
        setState(() => _success = 'Contract downloaded successfully.');
      } else {
        setState(() => _error = 'Failed to download contract.');
      }
    } catch (e) {
      setState(() => _error = 'Unable to download contract.');
    } finally {
      setState(() => _downloadingId = null);
    }
  }

  String _formatCurrency(dynamic value) {
    if (value == null) return 'TZS 0';
    final double numericValue =
        value is double ? value : (double.tryParse(value.toString()) ?? 0);
    if (numericValue >= 1000000) {
      return 'TZS ${(numericValue / 1000000).toStringAsFixed(1)}M';
    } else if (numericValue >= 1000) {
      return 'TZS ${(numericValue / 1000).toStringAsFixed(1)}K';
    }
    return 'TZS ${numericValue.toStringAsFixed(0)}';
  }

  Future<void> _pickAndUploadFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx'],
    );
    if (result == null || result.files.single.path == null) return;
    final path = result.files.single.path!;
    final name = result.files.single.name;
    setState(() {
      _uploading = true;
      _error = '';
    });
    try {
      final uploaded = await LandlordApiService.uploadContractFile(path);
      if (uploaded != null) {
        setState(() {
          _fileUrl = uploaded['url']?.toString() ??
              uploaded['file_url']?.toString() ??
              '';
          _fileName = uploaded['file_name']?.toString() ?? name;
        });
      } else {
        setState(() => _error = 'Failed to upload file.');
      }
    } catch (_) {
      setState(() => _error = 'Failed to upload file.');
    } finally {
      setState(() => _uploading = false);
    }
  }

  void _openCreateSheet() {
    // Reset form state before opening
    setState(() {
      _title = '';
      _propertyId = '';
      _tenantId = '';
      _fileUrl = '';
      _fileName = '';
      _contractType = 'nyumba';
      _error = '';
    });

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            height: MediaQuery.of(context).size.height * 0.85,
            decoration: const BoxDecoration(
              color: kBg2,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        height: 2,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.transparent,
                              kGold,
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: const BoxDecoration(
                                      color: kGold,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Text(
                                    'Mkataba Mpya',
                                    style: TextStyle(
                                      color: kSlate,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.14,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'Unda Mkataba wa Kidijitali',
                                style: TextStyle(
                                  color: kCream,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            decoration: BoxDecoration(
                              color: kBg3,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.close,
                                  color: kSlate, size: 16),
                              onPressed: () => Navigator.pop(ctx),
                              padding: const EdgeInsets.all(8),
                              constraints: const BoxConstraints(),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Form content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_error.isNotEmpty)
                          Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color:
                                  const Color(0xFFEF4444).withOpacity(0.08),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: const Color(0xFFEF4444)
                                    .withOpacity(0.25),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error,
                                    size: 16, color: Color(0xFFEF4444)),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _error,
                                    style: const TextStyle(
                                        color: Color(0xFFEF4444),
                                        fontSize: 14),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        const SizedBox(height: 8),
                        // Contract Type Selection
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Aina ya Mkataba *',
                              style: TextStyle(
                                color: kCream,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 10),
                            // FIX: Use Row with Expanded instead of Wrap+SizedBox
                            // to avoid overflow in the contract type buttons
                            Row(
                              children: [
                                Expanded(
                                  child: _buildContractTypeButton(
                                    'chumba',
                                    'Mkataba wa Chumba',
                                    'Oweru International',
                                    setModalState,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _buildContractTypeButton(
                                    'nyumba',
                                    'Mkataba wa Nyumba',
                                    'Mmiliki binafsi',
                                    setModalState,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _buildContractTypeButton(
                                    'custom',
                                    'Mkataba wa Kawaida',
                                    'Muundo maalum',
                                    setModalState,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        // Title
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Kichwa cha Mkataba *',
                              style: TextStyle(
                                color: kCream,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              decoration: InputDecoration(
                                hintText: _contractType == 'chumba'
                                    ? 'Mfano: Chumba Namba 5'
                                    : 'Mfano: Nyumba — Mikocheni A',
                                hintStyle: const TextStyle(color: kSlate),
                                filled: true,
                                fillColor: kBg3,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding:
                                    const EdgeInsets.symmetric(
                                        horizontal: 16, vertical: 14),
                              ),
                              style: const TextStyle(color: kCream),
                              onChanged: (v) =>
                                  setModalState(() => _title = v),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        // Property dropdown (full width)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Mali / Nyumba *',
                              style: TextStyle(
                                color: kCream,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String>(
                              value: _propertyId.isEmpty
                                  ? null
                                  : _propertyId,
                              isExpanded: true, // FIX: prevents text overflow
                              dropdownColor: kBg3,
                              style: const TextStyle(color: kCream),
                              decoration: InputDecoration(
                                hintText: 'Chagua mali…',
                                hintStyle:
                                    const TextStyle(color: kSlate),
                                filled: true,
                                fillColor: kBg3,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding:
                                    const EdgeInsets.symmetric(
                                        horizontal: 16, vertical: 14),
                              ),
                              items: _properties.map((p) {
                                return DropdownMenuItem(
                                  value: p['id'].toString(),
                                  child: Text(
                                    '${p['title']}${p['location'] != null ? ' — ${p['location']}' : ''}',
                                    style: const TextStyle(color: kCream),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                );
                              }).toList(),
                              onChanged: (v) => setModalState(
                                  () => _propertyId = v ?? ''),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Tenant dropdown (full width)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Mpangaji *',
                              style: TextStyle(
                                color: kCream,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String>(
                              value:
                                  _tenantId.isEmpty ? null : _tenantId,
                              isExpanded: true, // FIX: prevents text overflow
                              dropdownColor: kBg3,
                              style: const TextStyle(color: kCream),
                              decoration: InputDecoration(
                                hintText: 'Chagua mpangaji…',
                                hintStyle:
                                    const TextStyle(color: kSlate),
                                filled: true,
                                fillColor: kBg3,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding:
                                    const EdgeInsets.symmetric(
                                        horizontal: 16, vertical: 14),
                              ),
                              items: _tenants.map((t) {
                                final user =
                                    t['user'] as Map<String, dynamic>?;
                                return DropdownMenuItem(
                                  value: t['id'].toString(),
                                  child: Text(
                                    '${user?['first_name'] ?? ''} ${user?['last_name'] ?? ''}'
                                        .trim(),
                                    style:
                                        const TextStyle(color: kCream),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                );
                              }).toList(),
                              onChanged: (v) => setModalState(
                                  () => _tenantId = v ?? ''),
                            ),
                            if (_tenants.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 5),
                                child: Text(
                                  '${_tenants.length} mpangaji ${_tenants.length != 1 ? 'waliopatikana' : 'aliyepatikana'}',
                                  style: const TextStyle(
                                      color: kSlate, fontSize: 11),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        // File Upload
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Hati ya Mkataba * (PDF/Word, max 10 MB)',
                              style: TextStyle(
                                color: kCream,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 8),
                            OutlinedButton.icon(
                              onPressed: _uploading
                                  ? null
                                  : () async {
                                      await _pickAndUploadFile();
                                      setModalState(() {});
                                    },
                              icon: _uploading
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2, color: kGold),
                                    )
                                  : const Icon(
                                      Icons.upload_file_rounded,
                                      color: kGold,
                                    ),
                              label: Flexible(
                                child: Text(
                                  _fileName.isEmpty
                                      ? 'Chagua faili la mkataba'
                                      : _fileName,
                                  style: const TextStyle(color: kGold),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: kGold,
                                side: const BorderSide(color: kGold),
                                minimumSize:
                                    const Size(double.infinity, 48),
                                shape: RoundedRectangleBorder(
                                    borderRadius:
                                        BorderRadius.circular(10)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        // Submit Button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _creating
                                ? null
                                : () async {
                                    await _handleCreateContract();
                                    if (mounted && _error.isEmpty) {
                                      Navigator.pop(ctx);
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: kGold,
                              foregroundColor: kBg,
                              minimumSize:
                                  const Size(double.infinity, 48),
                              shape: RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(10)),
                            ),
                            child: Text(
                              _creating ? 'Inaundwa...' : 'Unda Mkataba',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildContractTypeButton(
    String type,
    String label,
    String sublabel,
    StateSetter setModalState,
  ) {
    final isSelected = _contractType == type;
    return GestureDetector(
      onTap: () => setModalState(() => _contractType = type),
      child: Container(
        padding:
            const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? kGold.withOpacity(0.12)
              : kBg3.withOpacity(0.3),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? kGold : kBorder,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: TextStyle(
                color: isSelected ? kGold : kSlate,
                fontWeight: FontWeight.w600,
                fontSize: 11,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 3),
            Text(
              sublabel,
              style: TextStyle(
                color: isSelected ? kGold.withOpacity(0.7) : kSlate,
                fontSize: 10,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
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
      'pending':
          _contracts.where((c) => c['status'] == 'pending_signature').length,
      'review':
          _contracts.where((c) => c['status'] == 'pending_review').length,
      'approved':
          _contracts.where((c) => c['status'] == 'approved').length,
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
        title: const Text(
          'Mikataba ya Kidijitali',
          style: TextStyle(
              color: kCream, fontSize: 18, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: kGold),
            onPressed: _openCreateSheet,
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
                const Text(
                  'Eneo la Mpangishaji',
                  style: TextStyle(
                    color: kSlate,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.14,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Mikataba ya Kidijitali',
                  style: TextStyle(
                      color: kCream,
                      fontSize: 28,
                      fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Pakia mikataba ya kukodisha na simamia sahihi za kidijitali kwa mpangaji wako.',
                  style: TextStyle(color: kSlate, fontSize: 13),
                ),
                const SizedBox(height: 24),
                // FIX: Stats wrapped in a scrollable row to avoid overflow
                if (!_isLoading && _contracts.isNotEmpty)
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildStatCard('Total', '${stats['total']}', kSlate),
                        const SizedBox(width: 10),
                        _buildStatCard(
                            'Rasimu', '${stats['draft']}', kSlate),
                        const SizedBox(width: 10),
                        _buildStatCard(
                          'Zinasubiri',
                          '${stats['pending']}',
                          const Color(0xFFC9A84C),
                        ),
                        const SizedBox(width: 10),
                        _buildStatCard(
                          'Zinakaguliwa',
                          '${stats['review']}',
                          const Color(0xFF3B82F6),
                        ),
                        const SizedBox(width: 10),
                        _buildStatCard(
                          'Zilizoidhinishwa',
                          '${stats['approved']}',
                          const Color(0xFF16A34A),
                        ),
                      ],
                    ),
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
                border: Border.all(
                    color: const Color(0xFFEF4444).withOpacity(0.18)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error,
                      size: 16, color: Color(0xFFEF4444)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _error,
                      style: const TextStyle(
                          color: Color(0xFFEF4444), fontSize: 14),
                    ),
                  ),
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
                border: Border.all(
                    color: const Color(0xFF10B981).withOpacity(0.22)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle,
                      size: 16, color: Color(0xFF10B981)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _success,
                      style: const TextStyle(
                          color: Color(0xFF10B981), fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          // Contracts List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: kGold))
                : _contracts.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.shield,
                                size: 48, color: kSlate),
                            const SizedBox(height: 16),
                            const Text(
                              'No digital contracts',
                              style: TextStyle(
                                color: kCream,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Create your first digital contract for your tenants.',
                              style: TextStyle(
                                  color: kSlate, fontSize: 13),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _contracts.length,
                        itemBuilder: (context, index) =>
                            _buildContractCard(_contracts[index]),
                      ),
          ),
        ],
      ),
     
    );
  }

  // FIX: stat cards are now fixed-width (not Expanded inside a non-flex parent)
  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      width: 90,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: kBg3,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
                color: color, fontSize: 22, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(color: kSlate, fontSize: 10),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildContractCard(Map<String, dynamic> contract) {
    final id = contract['id'] as int?;
    final property =
        contract['property'] as Map<String, dynamic>? ?? {};
    final tenant =
        contract['tenant'] as Map<String, dynamic>? ?? {};
    final status = contract['status'] as String? ?? 'draft';
    final fileName = contract['file_name'] as String?;
    final fields = contract['fields'] as List?;
    final isDownloading = _downloadingId == id;
    final createdAt = contract['created_at'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kBg2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with title and status
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      contract['title'] ?? 'Contract',
                      style: const TextStyle(
                        color: kCream,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (fileName != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        '📄 $fileName',
                        style:
                            const TextStyle(color: kSlate, fontSize: 12),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    if (fields != null && fields.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        '${fields.length} sehemu',
                        style: const TextStyle(
                            color: kGold, fontSize: 11),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              _buildStatusBadge(status),
            ],
          ),
          const SizedBox(height: 16),
          // Property Info
          Row(
            children: [
              const Icon(Icons.location_on, size: 13, color: kGold),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  property['title'] ??
                      'Mali #${contract['property_id']}',
                  style: const TextStyle(
                    color: kCream,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          if (property['location'] != null)
            Padding(
              padding: const EdgeInsets.only(left: 19, top: 2),
              child: Text(
                property['location'],
                style: const TextStyle(color: kSlate, fontSize: 12),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          if (property['price'] != null)
            Padding(
              padding: const EdgeInsets.only(left: 19, top: 2),
              child: Text(
                '${_formatCurrency(property['price'])}/mwezi',
                style: const TextStyle(
                  color: kGold,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          const SizedBox(height: 12),
          // Tenant Info
          Row(
            children: [
              const Icon(Icons.person, size: 13, color: kSlate),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '${tenant['user']?['first_name'] ?? ''} ${tenant['user']?['last_name'] ?? ''}'
                      .trim()
                      .isNotEmpty
                      ? '${tenant['user']?['first_name'] ?? ''} ${tenant['user']?['last_name'] ?? ''}'
                          .trim()
                      : 'Mpangaji #${contract['tenant_id']}',
                  style: const TextStyle(color: kCream, fontSize: 14),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          if (tenant['user']?['email'] != null)
            Padding(
              padding: const EdgeInsets.only(left: 19, top: 2),
              child: Text(
                tenant['user']['email'],
                style: const TextStyle(color: kSlate, fontSize: 11),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          const SizedBox(height: 12),
          // Date and Actions Row
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 13, color: kSlate),
              const SizedBox(width: 6),
              Text(
                _formatDate(createdAt ?? ''),
                style: const TextStyle(color: kSlate, fontSize: 12),
              ),
              const Spacer(),
              // Actions
              if (fileName != null)
                IconButton(
                  icon: isDownloading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: kGold),
                        )
                      : const Icon(Icons.download,
                          size: 18, color: kGold),
                  onPressed:
                      isDownloading ? null : () => _downloadContract(id!),
                  tooltip: 'Pakua',
                  constraints: const BoxConstraints(),
                  padding: const EdgeInsets.all(6),
                ),
              if (status == 'draft')
                IconButton(
                  icon: const Icon(Icons.send, size: 18, color: kGold),
                  onPressed: () => _sendToTenant(id!),
                  tooltip: 'Tuma kwa Mpangaji',
                  constraints: const BoxConstraints(),
                  padding: const EdgeInsets.all(6),
                ),
              if (status == 'pending_review')
                IconButton(
                  icon: const Icon(Icons.check_circle,
                      size: 18, color: Color(0xFF16A34A)),
                  onPressed: () => _approveContract(id!),
                  tooltip: 'Idhinisha',
                  constraints: const BoxConstraints(),
                  padding: const EdgeInsets.all(6),
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
        border: Border.all(
            color: _getStatusColor(status).withOpacity(0.3)),
      ),
      child: Text(
        _getStatusLabel(status).toUpperCase(),
        style: TextStyle(
          color: _getStatusColor(status),
          fontSize: 9,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}