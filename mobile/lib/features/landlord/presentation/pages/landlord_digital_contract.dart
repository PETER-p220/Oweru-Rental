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
            decoration: BoxDecoration(
              color: kCardBg,
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
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.transparent,
                              kSlate300,
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
                                    decoration: BoxDecoration(
                                      color: kSlate800,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Text(
                                    'Mkataba Mpya',
                                    style: TextStyle(
                                      color: kSlate500,
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
                                  color: kSlate800,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            decoration: BoxDecoration(
                              color: kSlate100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.close,
                                  color: kSlate500, size: 16),
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
                              color: kDanger.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: kDanger.withOpacity(0.25),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error,
                                    size: 16, color: kDanger),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _error,
                                    style: const TextStyle(
                                        color: kDanger,
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
                                color: kSlate800,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 10),
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
                                color: kSlate800,
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
                                hintStyle: const TextStyle(color: kSlate400),
                                filled: true,
                                fillColor: kSlate100,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding:
                                    const EdgeInsets.symmetric(
                                        horizontal: 16, vertical: 14),
                              ),
                              style: const TextStyle(color: kSlate800),
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
                                color: kSlate800,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String>(
                              value: _propertyId.isEmpty
                                  ? null
                                  : _propertyId,
                              isExpanded: true,
                              dropdownColor: kCardBg,
                              style: const TextStyle(color: kSlate800),
                              decoration: InputDecoration(
                                hintText: 'Chagua mali…',
                                hintStyle:
                                    const TextStyle(color: kSlate400),
                                filled: true,
                                fillColor: kSlate100,
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
                                    style: const TextStyle(color: kSlate800),
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
                                color: kSlate800,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String>(
                              value:
                                  _tenantId.isEmpty ? null : _tenantId,
                              isExpanded: true,
                              dropdownColor: kCardBg,
                              style: const TextStyle(color: kSlate800),
                              decoration: InputDecoration(
                                hintText: 'Chagua mpangaji…',
                                hintStyle:
                                    const TextStyle(color: kSlate400),
                                filled: true,
                                fillColor: kSlate100,
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
                                        const TextStyle(color: kSlate800),
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
                                      color: kSlate500, fontSize: 11),
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
                                color: kSlate800,
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
                                          strokeWidth: 2, color: kSlate800),
                                    )
                                  : const Icon(
                                      Icons.upload_file_rounded,
                                      color: kSlate800,
                                    ),
                              label: Flexible(
                                child: Text(
                                  _fileName.isEmpty
                                      ? 'Chagua faili la mkataba'
                                      : _fileName,
                                  style: const TextStyle(color: kSlate800),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: kSlate800,
                                side: const BorderSide(color: kSlate300),
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
                              backgroundColor: kSlate800,
                              foregroundColor: kWhite,
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
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? kSlate800.withOpacity(0.12)
              : kSlate100.withOpacity(0.3),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? kSlate800 : kBorder,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: TextStyle(
                color: isSelected ? kSlate800 : kSlate500,
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
                color: isSelected ? kSlate800.withOpacity(0.7) : kSlate400,
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
        return kSlate500;
      case 'pending_signature':
        return kWarning;
      case 'pending_review':
        return kInfo;
      case 'approved':
        return kSuccess;
      case 'rejected':
        return kDanger;
      default:
        return kSlate500;
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
      backgroundColor: kPageBg,
      extendBodyBehindAppBar: true,
      body: CustomScrollView(
        slivers: [
          // ── Slate header (matching dashboard) ──────
          SliverToBoxAdapter(child: _slateHeader()),
          
          // ── Stats row (horizontal scrollable) ──────
          if (!_isLoading && _contracts.isNotEmpty)
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
          
          // ── Contracts list ──────────────────────────
          if (_isLoading)
            SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: kSlate800, strokeWidth: 2)))
          else if (_contracts.isEmpty)
            SliverFillRemaining(child: _emptyState())
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              sliver: SliverList(delegate: SliverChildBuilderDelegate(
                (_, i) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _ContractCard(contract: _contracts[i], downloadingId: _downloadingId, onDownload: _downloadContract, onSend: _sendToTenant, onApprove: _approveContract)),
                childCount: _contracts.length,
              )),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openCreateSheet,
        backgroundColor: kSlate800,
        child: const Icon(Icons.add, color: kWhite),
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
        const Text('Mikataba ya Kidijitali',
          style: TextStyle(color: kWhite, fontSize: 20,
            fontWeight: FontWeight.w800, letterSpacing: -0.3)),
      ]),
      const SizedBox(height: 16),
      // Stats summary
      Text('${_contracts.length} mkataba${_contracts.length != 1 ? 'ya' : ''}',
        style: const TextStyle(color: kSlate400, fontSize: 13)),
    ]),
  );

  // ── Horizontal stats row ───────────────────────────────────
  Widget _statsRow(Map<String, int> stats) {
    final items = [
      _StatItem(value: '${stats['total']}',          label: 'Jumla',       icon: Icons.description,               accent: kSlate800, bg: kSlate100),
      _StatItem(value: '${stats['draft']}',          label: 'Rasimu',      icon: Icons.edit_document,             accent: kSlate500, bg: kSlate100),
      _StatItem(value: '${stats['pending']}',        label: 'Zinasubiri',  icon: Icons.pending_actions,           accent: kWarning,  bg: kWarningBg),
      _StatItem(value: '${stats['review']}',         label: 'Zinakaguliwa',icon: Icons.rate_review,               accent: kInfo,     bg: kInfoBg),
      _StatItem(value: '${stats['approved']}',       label: 'Zilizoidhinishwa', icon: Icons.check_circle,               accent: kSuccess,  bg: kSuccessBg),
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
      const Text('Hakuna mikataba ya kidijitali.',
        style: TextStyle(color: kSlate500, fontSize: 13)),
      const SizedBox(height: 4),
      const Text('Unda mkataba wako wa kwanza kwa mpangaji.',
        style: TextStyle(color: kSlate400, fontSize: 12)),
    ])),
  );

  // ── Contract card (old method, kept for modal reference) ──────
  Widget _buildContractCard(Map<String, dynamic> contract) {
    final id = contract['id'] as int?;
    final property = contract['property'] as Map<String, dynamic>? ?? {};
    final tenant = contract['tenant'] as Map<String, dynamic>? ?? {};
    final status = contract['status'] as String? ?? 'draft';
    final fileName = contract['file_name'] as String?;
    final fields = contract['fields'] as List?;
    final isDownloading = _downloadingId == id;
    final createdAt = contract['created_at'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kCardBg,
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
                        color: kSlate800,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (fileName != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        '📄 $fileName',
                        style: const TextStyle(color: kSlate400, fontSize: 12),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    if (fields != null && fields.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        '${fields.length} sehemu',
                        style: const TextStyle(color: kSlate500, fontSize: 11),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
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
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 11, color: kSlate400),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        property['title'] ?? 'Mali #${contract['property_id']}',
                        style: const TextStyle(color: kSlate800, fontSize: 13, fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                if (property['location'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(property['location'], style: const TextStyle(color: kSlate500, fontSize: 11)),
                  ),
                if (property['price'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text('${_formatCurrency(property['price'])}/mwezi', style: const TextStyle(color: kSlate600, fontSize: 11, fontWeight: FontWeight.w600)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Tenant Info
          Row(
            children: [
              const Icon(Icons.person, size: 11, color: kSlate400),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  '${tenant['user']?['first_name'] ?? ''} ${tenant['user']?['last_name'] ?? ''}'.trim().isNotEmpty
                      ? '${tenant['user']?['first_name'] ?? ''} ${tenant['user']?['last_name'] ?? ''}'.trim()
                      : 'Mpangaji #${contract['tenant_id']}',
                  style: const TextStyle(color: kSlate700, fontSize: 13),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          if (tenant['user']?['email'] != null)
            Padding(
              padding: const EdgeInsets.only(left: 15, top: 2),
              child: Text(tenant['user']['email'], style: const TextStyle(color: kSlate400, fontSize: 11)),
            ),
          const SizedBox(height: 12),
          // Date and Actions Row
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 11, color: kSlate400),
              const SizedBox(width: 4),
              Text(_formatDate(createdAt ?? ''), style: const TextStyle(color: kSlate500, fontSize: 12)),
              const Spacer(),
              // Actions
              if (fileName != null)
                IconButton(
                  icon: isDownloading
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: kSlate800))
                      : const Icon(Icons.download, size: 16, color: kSlate600),
                  onPressed: isDownloading ? null : () => _downloadContract(id!),
                  tooltip: 'Pakua',
                  constraints: const BoxConstraints(),
                  padding: const EdgeInsets.all(6),
                ),
              if (status == 'draft')
                IconButton(
                  icon: const Icon(Icons.send, size: 16, color: kSlate600),
                  onPressed: () => _sendToTenant(id!),
                  tooltip: 'Tuma kwa Mpangaji',
                  constraints: const BoxConstraints(),
                  padding: const EdgeInsets.all(6),
                ),
              if (status == 'pending_review')
                IconButton(
                  icon: const Icon(Icons.check_circle, size: 16, color: kSuccess),
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
        border: Border.all(color: _getStatusColor(status).withOpacity(0.3)),
      ),
      child: Text(
        _getStatusLabel(status).toUpperCase(),
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

// Contract card — redesigned
class _ContractCard extends StatelessWidget {
  final Map<String, dynamic> contract;
  final int? downloadingId;
  final Function(int) onDownload;
  final Function(int) onSend;
  final Function(int) onApprove;

  const _ContractCard({
    required this.contract,
    required this.downloadingId,
    required this.onDownload,
    required this.onSend,
    required this.onApprove,
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
      case 'draft':
        return kSlate500;
      case 'pending_signature':
        return kWarning;
      case 'pending_review':
        return kInfo;
      case 'approved':
        return kSuccess;
      case 'rejected':
        return kDanger;
      default:
        return kSlate500;
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

  @override
  Widget build(BuildContext context) {
    final id = contract['id'] as int?;
    final property = contract['property'] as Map<String, dynamic>? ?? {};
    final tenant = contract['tenant'] as Map<String, dynamic>? ?? {};
    final status = contract['status'] as String? ?? 'draft';
    final fileName = contract['file_name'] as String?;
    final fields = contract['fields'] as List?;
    final isDownloading = downloadingId == id;
    final createdAt = contract['created_at'] as String?;

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
                        style: const TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w700),
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (fileName != null) ...[
                        const SizedBox(height: 3),
                        Text('📄 $fileName', style: const TextStyle(color: kSlate400, fontSize: 11)),
                      ],
                      if (fields != null && fields.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text('${fields.length} sehemu', style: const TextStyle(color: kSlate500, fontSize: 10)),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: _getStatusColor(status).withOpacity(0.3)),
                  ),
                  child: Text(
                    _getStatusLabel(status).toUpperCase(),
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
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 10, color: kSlate400),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          property['title'] ?? 'Mali #${contract['property_id']}',
                          style: const TextStyle(color: kSlate800, fontSize: 12, fontWeight: FontWeight.w600),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (property['location'] != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 3),
                      child: Text(property['location'], style: const TextStyle(color: kSlate500, fontSize: 10)),
                    ),
                  if (property['price'] != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text('${_formatCurrency(property['price'])}/mwezi', style: const TextStyle(color: kSlate600, fontSize: 10, fontWeight: FontWeight.w600)),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            // Tenant Info
            Row(
              children: [
                const Icon(Icons.person, size: 10, color: kSlate400),
                const SizedBox(width: 3),
                Expanded(
                  child: Text(
                    '${tenant['user']?['first_name'] ?? ''} ${tenant['user']?['last_name'] ?? ''}'.trim().isNotEmpty
                        ? '${tenant['user']?['first_name'] ?? ''} ${tenant['user']?['last_name'] ?? ''}'.trim()
                        : 'Mpangaji #${contract['tenant_id']}',
                    style: const TextStyle(color: kSlate700, fontSize: 12),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            if (tenant['user']?['email'] != null)
              Padding(
                padding: const EdgeInsets.only(left: 13, top: 2),
                child: Text(tenant['user']['email'], style: const TextStyle(color: kSlate400, fontSize: 10)),
              ),
            const SizedBox(height: 10),
            // Date and Actions Row
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 10, color: kSlate400),
                const SizedBox(width: 3),
                Text(_formatDate(createdAt ?? ''), style: const TextStyle(color: kSlate500, fontSize: 11)),
                const Spacer(),
                // Actions
                if (fileName != null)
                  IconButton(
                    icon: isDownloading
                        ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: kSlate800))
                        : const Icon(Icons.download, size: 14, color: kSlate600),
                    onPressed: isDownloading ? null : () => onDownload(id!),
                    tooltip: 'Pakua',
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.all(4),
                  ),
                if (status == 'draft')
                  IconButton(
                    icon: const Icon(Icons.send, size: 14, color: kSlate600),
                    onPressed: () => onSend(id!),
                    tooltip: 'Tuma kwa Mpangaji',
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.all(4),
                  ),
                if (status == 'pending_review')
                  IconButton(
                    icon: const Icon(Icons.check_circle, size: 14, color: kSuccess),
                    onPressed: () => onApprove(id!),
                    tooltip: 'Idhinisha',
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.all(4),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}