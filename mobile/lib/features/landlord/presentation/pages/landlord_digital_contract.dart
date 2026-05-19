// ============================================================
// landlord_digital_contract.dart — Digital Contract page
// ============================================================
import 'package:flutter/material.dart';
import 'landlord_theme.dart';

class LandlordDigitalContractPage extends StatefulWidget {
  const LandlordDigitalContractPage({super.key});
  @override
  State<LandlordDigitalContractPage> createState() => _LandlordDigitalContractPageState();
}

class _LandlordDigitalContractPageState extends State<LandlordDigitalContractPage> {
  final List<DigitalContract> _contracts = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = '';
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _loading = false;
      // For now, empty list - will be populated from API
    });
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
      title: const Text('Digital Contracts',
        style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600)),
      actions: [
        IconButton(
          icon: const Icon(Icons.add_rounded, color: kGold),
          onPressed: () {
            // Navigate to create contract
          },
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
      // Error alert
      if (_error.isNotEmpty) ...[
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
        const SizedBox(height: 12),
      ],

      // Contract list
      if (_contracts.isEmpty) ...[
        LEmptyState(
          icon: Icons.description_rounded,
          title: 'No contracts yet',
          subtitle: 'Create digital contracts for your tenants to sign electronically.',
        ),
      ] else ...[
        ..._contracts.map((contract) => _ContractCard(contract: contract)),
      ],
    ],
  );
}

class _ContractCard extends StatelessWidget {
  final DigitalContract contract;
  const _ContractCard({required this.contract});

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
          child: Icon(Icons.description_rounded, color: kGold, size: 20)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(contract.title, style: TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
          Text(contract.propertyTitle, style: TextStyle(color: kSlate, fontSize: 11)),
        ])),
        LStatusBadge(label: contract.status, color: _getStatusColor(contract.status)),
      ]),
      const SizedBox(height: 12),
      Divider(color: kGold.withOpacity(0.1)),
      const SizedBox(height: 12),
      Row(children: [
        Icon(Icons.person_rounded, color: kSlate, size: 16),
        const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(contract.tenantName, style: TextStyle(color: kCream, fontSize: 13)),
          Text(contract.tenantEmail, style: TextStyle(color: kSlate, fontSize: 11)),
        ])),
      ]),
      const SizedBox(height: 12),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text('Created: ${_formatDate(contract.createdAt)}', style: TextStyle(color: kSlateDim, fontSize: 10)),
        Row(children: [
          Icon(Icons.visibility_rounded, color: kGold, size: 16),
          const SizedBox(width: 4),
          Text('View', style: TextStyle(color: kGold, fontSize: 11)),
        ]),
      ]),
      const SizedBox(height: 8),
      if (contract.landlordSigned && contract.tenantSigned) ...[
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: kSuccess.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Row(children: [
            Icon(Icons.check_circle_rounded, color: kSuccess, size: 14),
            const SizedBox(width: 8),
            Text('Both parties signed', style: TextStyle(color: kSuccess, fontSize: 11)),
          ]),
        ),
      ] else if (contract.landlordSigned) ...[
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: kWarning.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Row(children: [
            Icon(Icons.pending_rounded, color: kWarning, size: 14),
            const SizedBox(width: 8),
            Text('Waiting for tenant signature', style: TextStyle(color: kWarning, fontSize: 11)),
          ]),
        ),
      ],
    ]),
  );

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'draft': return kSlate;
      case 'pending_signature': return kWarning;
      case 'pending_review': return kInfo;
      case 'approved': return kSuccess;
      case 'rejected': return kDanger;
      default: return kSlate;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

class DigitalContract {
  final int id;
  final String title;
  final String propertyTitle;
  final String tenantName;
  final String tenantEmail;
  final String status;
  final bool landlordSigned;
  final bool tenantSigned;
  final DateTime createdAt;

  DigitalContract({
    required this.id,
    required this.title,
    required this.propertyTitle,
    required this.tenantName,
    required this.tenantEmail,
    required this.status,
    this.landlordSigned = false,
    this.tenantSigned = false,
    required this.createdAt,
  });
}
