import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../shared/digital_contract/digital_contract_utils.dart';
import '../../../../shared/services/tenant_api_service.dart';
import '../../../../shared/widgets/tenant_contract_signing_sheet.dart';
import 'tenant_theme.dart';

/// Tenant digital contracts — mirrors web `DigitalContractPage` flow.
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
        _contracts = data.where(contractIsVisibleToTenant).toList();
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

  Future<void> _openContract(Map<String, dynamic> contract) async {
    final refreshed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => TenantContractSigningSheet(
        contract: contract,
        onSubmit: (id, fields, signature) => TenantApiService.submitDigitalContract(
          contractId: id,
          fields: fields,
          signature: signature,
        ),
        onDownload: _downloadContract,
      ),
    );
    if (refreshed == true) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mkataba umewasilishwa kwa mafanikio')),
      );
      _load();
    }
  }

  Future<void> _downloadContract(int contractId, String fileName) async {
    try {
      final body = await TenantApiService.downloadDigitalContract(contractId);
      if (body.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Imeshindwa kupakua hati')),
          );
        }
        return;
      }
      // API may return a URL string in JSON
      String? url;
      if (body.startsWith('http')) {
        url = body;
      } else if (body.contains('url')) {
        final match = RegExp(r'https?://[^\s"]+').firstMatch(body);
        url = match?.group(0);
      }
      if (url != null && await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Pakua: $fileName')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Imeshindwa kupakua hati')),
        );
      }
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
        title: const Text('Digital Contracts',
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
                          subtitle: 'Digital rental agreements from your landlord will appear here.',
                        )
                      else
                        ..._contracts.map(_buildContractCard),
                    ],
                  ),
                ),
    );
  }

  Widget _buildContractCard(Map<String, dynamic> contract) {
    final status = contract['status']?.toString() ?? '';
    final sm = contractStatusMeta(status);
    final property = contract['property'] as Map<String, dynamic>?;
    final title = contract['title']?.toString() ?? 'Mkataba';
    final propertyLabel = property?['title']?.toString() ?? 'Property';

    return GestureDetector(
      onTap: () => _openContract(contract),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: kBg2,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: status == 'approved' ? kGoldBorder : kBorder),
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
                    color: sm.color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: sm.color.withOpacity(0.25)),
                  ),
                  child: Icon(Icons.description_rounded, color: sm.color, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 3),
                      Text(propertyLabel, style: const TextStyle(color: kSlate, fontSize: 11)),
                    ],
                  ),
                ),
                TStatusBadge(label: sm.label, color: sm.color),
              ],
            ),
            const SizedBox(height: 12),
            Divider(color: kGold.withOpacity(0.1), height: 1),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _infoChip(Icons.calendar_today_rounded, (contract['created_at'] ?? '').toString()),
                if (status == 'pending_signature')
                  const Text('Gusa kusaini →', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.w600))
                else
                  const Text('Angalia →', style: TextStyle(color: kSlate, fontSize: 11)),
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
          Text(label.length > 20 ? '${label.substring(0, 20)}…' : label,
              style: const TextStyle(color: kSlate, fontSize: 10, fontWeight: FontWeight.w500)),
        ],
      );
}
