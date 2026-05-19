// ============================================================
// landlord_receipts.dart — Receipts page
// ============================================================
import 'package:flutter/material.dart';
import 'landlord_theme.dart';

class LandlordReceiptsPage extends StatefulWidget {
  const LandlordReceiptsPage({super.key});
  @override
  State<LandlordReceiptsPage> createState() => _LandlordReceiptsPageState();
}

class _LandlordReceiptsPageState extends State<LandlordReceiptsPage> {
  final List<Receipt> _receipts = [];
  bool _loading = true;
  String _error = '';
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

  List<Receipt> get _filteredReceipts {
    if (_search.isEmpty) return _receipts;
    final term = _search.toLowerCase();
    return _receipts.where((r) =>
      r.tenantName.toLowerCase().contains(term) ||
      r.propertyTitle.toLowerCase().contains(term) ||
      r.id.toLowerCase().contains(term)
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
      title: const Text('Receipts',
        style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600)),
      actions: [
        IconButton(
          icon: const Icon(Icons.filter_list_rounded, color: kGold),
          onPressed: () {
            // Show filter dialog
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
      // Search
      LCard(child: TextField(
        controller: _searchController,
        onChanged: (v) => setState(() => _search = v),
        style: TextStyle(color: kCream, fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Search receipts...',
          hintStyle: TextStyle(color: kSlate, fontSize: 12),
          prefixIcon: Icon(Icons.search_rounded, color: kSlate, size: 20),
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
      )),
      const SizedBox(height: 20),

      // Receipt list
      if (_receipts.isEmpty) ...[
        LEmptyState(
          icon: Icons.receipt_long_rounded,
          title: 'No receipts yet',
          subtitle: 'Receipts are auto-generated when you record payments.',
        ),
      ] else if (_filteredReceipts.isEmpty) ...[
        LCard(child: Padding(
          padding: const EdgeInsets.all(20),
          child: Center(child: Text('No receipts matched your search.',
            style: TextStyle(color: kSlate, fontSize: 13))),
        )),
      ] else ...[
        ..._filteredReceipts.map((receipt) => _ReceiptCard(receipt: receipt)),
      ],
    ],
  );
}

class _ReceiptCard extends StatelessWidget {
  final Receipt receipt;
  const _ReceiptCard({required this.receipt});

  @override
  Widget build(BuildContext context) => LCard(
    padding: const EdgeInsets.all(16),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Row(children: [
          Container(width: 36, height: 36,
            decoration: BoxDecoration(
              color: kGold.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(Icons.receipt_long_rounded, color: kGold, size: 18)),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(receipt.tenantName, style: TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
            Text(receipt.propertyTitle, style: TextStyle(color: kSlate, fontSize: 11)),
          ]),
        ]),
        LStatusBadge(label: receipt.status, color: _getStatusColor(receipt.status)),
      ]),
      const SizedBox(height: 12),
      Divider(color: kGold.withOpacity(0.1)),
      const SizedBox(height: 12),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Amount', style: TextStyle(color: kSlate, fontSize: 10)),
          Text(_formatCurrency(receipt.amount), style: TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.w700)),
        ]),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('Date', style: TextStyle(color: kSlate, fontSize: 10)),
          Text(_formatDate(receipt.date), style: TextStyle(color: kCream, fontSize: 12)),
        ]),
      ]),
      const SizedBox(height: 8),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text('Receipt #${receipt.id}', style: TextStyle(color: kSlateDim, fontSize: 10)),
        Row(children: [
          Icon(Icons.download_rounded, color: kGold, size: 16),
          const SizedBox(width: 4),
          Text('Download', style: TextStyle(color: kGold, fontSize: 11)),
        ]),
      ]),
    ]),
  );

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'paid': return kSuccess;
      case 'pending': return kWarning;
      case 'failed': return kDanger;
      default: return kSlate;
    }
  }

  String _formatCurrency(int amount) {
    if (amount >= 1000000) {
      return 'TZS ${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return 'TZS ${(amount / 1000).toStringAsFixed(0)}K';
    }
    return 'TZS $amount';
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

class Receipt {
  final String id;
  final String tenantName;
  final String propertyTitle;
  final int amount;
  final DateTime date;
  final String status;

  Receipt({
    required this.id,
    required this.tenantName,
    required this.propertyTitle,
    required this.amount,
    required this.date,
    required this.status,
  });
}
