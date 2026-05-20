import 'package:flutter/material.dart';
import '../../../../shared/services/tenant_api_service.dart';
import 'tenant_theme.dart';

class ContractsPage extends StatefulWidget {
  const ContractsPage({super.key});

  @override
  State<ContractsPage> createState() => _ContractsPageState();
}

class _ContractsPageState extends State<ContractsPage> {
  List<Map<String, dynamic>> _contracts = [];
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });
    try {
      final data = await TenantApiService.getDigitalContracts();
      if (!mounted) return;
      setState(() {
        _contracts = data;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load digital contracts';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        iconTheme: const IconThemeData(color: kGold),
        title: const Text('Contracts',
            style: TextStyle(color: kCream, fontSize: 17, fontWeight: FontWeight.w700)),
      ),
      body: _isLoading
          ? ListView(
              padding: const EdgeInsets.all(16),
              children: List.generate(4, (_) => const TSkeletonCard(height: 120)),
            )
          : _error.isNotEmpty
              ? TErrorState(message: _error, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  color: kGold,
                  backgroundColor: kBg2,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (_contracts.isEmpty)
                        const TEmptyState(
                          icon: Icons.description_rounded,
                          title: 'No contracts yet',
                          subtitle: 'Your digital rental agreements will appear here.',
                        )
                      else
                        ..._contracts.map((c) => _buildContractCard(c, c['status'] == 'active' || c['status'] == 'approved')),
                    ],
                  ),
                ),
    );
  }

  Widget _buildContractCard(Map<String, dynamic> contract, bool isActive) {
    final statusColor = isActive ? kSuccess : kSlateDim;
    final statusLabel = isActive ? 'Active' : 'Expired';

    return GestureDetector(
      onTap: () => _showContractDetails(context, contract),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: kBg2,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isActive ? kGoldBorder : kBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: statusColor.withOpacity(0.25)),
                  ),
                  child: Icon(Icons.description_rounded, color: statusColor, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        (contract['property']?['title'] ?? contract['property'] ?? 'Property').toString(),
                        style: const TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Contract #${contract['id']}',
                        style: const TextStyle(color: kSlate, fontSize: 10),
                      ),
                    ],
                  ),
                ),
                TStatusBadge(label: statusLabel, color: statusColor),
              ],
            ),
            const SizedBox(height: 12),
            Divider(color: kGold.withOpacity(0.1), height: 1),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _infoChip(Icons.calendar_today_rounded, (contract['created_at'] ?? '').toString()),
                _infoChip(Icons.description_rounded, (contract['status'] ?? 'pending').toString()),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoChip(IconData icon, String label) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: 11, color: kGold),
      const SizedBox(width: 5),
      Text(label, style: const TextStyle(color: kSlate, fontSize: 10, fontWeight: FontWeight.w500)),
    ],
  );

  void _showContractDetails(BuildContext context, Map<String, dynamic> contract) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: kBg2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _buildContractDetailsModal(ctx, contract),
    );
  }

  Widget _buildContractDetailsModal(BuildContext context, Map<String, dynamic> contract) {
    return SingleChildScrollView(
      child: Container(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 24,
          bottom: MediaQuery.of(context).viewInsets.bottom + 28,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Center(
              child: Container(
                width: 36, height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: kGold.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Contract Details',
                    style: TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w700)),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 32, height: 32,
                    decoration: BoxDecoration(
                      color: kBg3,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: kBorder),
                    ),
                    child: const Icon(Icons.close_rounded, color: kSlate, size: 18),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildDetailSection('Property Information', [
              ('Property', (contract['property']?['title'] ?? contract['property'] ?? 'N/A').toString()),
              ('Status', (contract['status'] ?? 'pending').toString()),
            ]),
            const SizedBox(height: 16),
            _buildDetailSection('Contract Terms', [
              ('Created', (contract['created_at'] ?? '').toString()),
              ('Updated', (contract['updated_at'] ?? '').toString()),
            ]),
            const SizedBox(height: 24),
            TGoldButton(
              label: contract['status'] == 'pending_signature' ? 'Sign & Submit' : 'Close',
              icon: Icons.download_rounded,
              onTap: () async {
                if (contract['status'] == 'pending_signature') {
                  final ok = await TenantApiService.submitDigitalContract(
                    contractId: (contract['id'] as num).toInt(),
                    fields: {},
                    signature: 'Signed on mobile',
                  );
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(ok ? 'Contract submitted' : 'Failed to submit contract')),
                    );
                    Navigator.pop(context);
                    _load();
                  }
                  return;
                }
                Navigator.pop(context);
              },
            ),
            const SizedBox(height: 10),
            TGhostButton(
              label: 'Close',
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailSection(String title, List<(String, String)> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TLabel(title),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: kBg3,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: kBorder),
          ),
          child: Column(
            children: items.asMap().entries.map((entry) {
              final isLast = entry.key == items.length - 1;
              final item = entry.value;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                decoration: BoxDecoration(
                  border: isLast ? null : const Border(bottom: BorderSide(color: kBorder)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(item.$1, style: const TextStyle(color: kSlate, fontSize: 12)),
                    Text(item.$2,
                        style: const TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600)),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}