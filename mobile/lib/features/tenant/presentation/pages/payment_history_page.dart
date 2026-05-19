// ============================================================
// PAYMENT HISTORY PAGE — homepage color scheme
// ============================================================
import 'package:flutter/material.dart';
import 'tenant_theme.dart';

class PaymentHistoryPage extends StatefulWidget {
  const PaymentHistoryPage({super.key});
  @override
  State<PaymentHistoryPage> createState() => _PaymentHistoryPageState();
}

class _PaymentHistoryPageState extends State<PaymentHistoryPage> {
  static const _history = [
    {'id': 1, 'property': 'Masaki Apartments - Unit 3B', 'amount': 850000, 'date': '2024-11-15', 'month': 'November 2024', 'transactionId': 'TZN-2024-11-001', 'method': 'Tigo Money'},
    {'id': 2, 'property': 'Masaki Apartments - Unit 3B', 'amount': 850000, 'date': '2024-10-15', 'month': 'October 2024',  'transactionId': 'TZN-2024-10-001', 'method': 'Mpesa'},
    {'id': 3, 'property': 'Masaki Apartments - Unit 3B', 'amount': 850000, 'date': '2024-09-15', 'month': 'September 2024','transactionId': 'TZN-2024-09-001', 'method': 'Airtel Money'},
    {'id': 4, 'property': 'Masaki Apartments - Unit 3B', 'amount': 850000, 'date': '2024-08-15', 'month': 'August 2024',   'transactionId': 'TZN-2024-08-001', 'method': 'Tigo Money'},
  ];

  int get _totalPaid => _history.fold(0, (s, p) => s + (p['amount'] as int));

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    appBar: AppBar(
      backgroundColor: kBg2,
      elevation: 0,
      iconTheme: const IconThemeData(color: kGold),
      title: const Text('Payment History',
        style: TextStyle(color: kCream, fontSize: 17, fontWeight: FontWeight.w700)),
    ),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      children: [
        _summaryCard(),
        const SizedBox(height: 20),
        const TSectionHeader('Recent Payments'),
        ..._history.map(_historyCard),
      ],
    ),
  );

  Widget _summaryCard() => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      gradient: kBannerGradient,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: kGoldBorder),
      boxShadow: const [BoxShadow(color: Color(0x20C89128), blurRadius: 16, offset: Offset(0, 6))],
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(width: 36, height: 36,
          decoration: BoxDecoration(color: kGoldDim, borderRadius: BorderRadius.circular(9),
            border: Border.all(color: kGoldBorder)),
          child: const Icon(Icons.account_balance_wallet_rounded, color: kGold, size: 18)),
        const SizedBox(width: 10),
        const Text('Total Paid', style: TextStyle(color: kSlate, fontSize: 12, fontWeight: FontWeight.w500)),
      ]),
      const SizedBox(height: 14),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text('TZS $_totalPaid',
          style: const TextStyle(color: kGold, fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(color: kGoldDim, borderRadius: BorderRadius.circular(8),
            border: Border.all(color: kGoldBorder)),
          child: Text('${_history.length} payments',
            style: const TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.w600)),
        ),
      ]),
      const SizedBox(height: 12),
      // mini bar chart
      Row(children: List.generate(_history.length, (i) => Expanded(child: Container(
        margin: const EdgeInsets.only(right: 4),
        height: 4,
        decoration: BoxDecoration(
          color: kGold.withOpacity(0.6),
          borderRadius: BorderRadius.circular(2)),
      )))),
    ]),
  );

  Widget _historyCard(Map<String, dynamic> p) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: kBg2, borderRadius: BorderRadius.circular(12),
      border: Border.all(color: kBorder)),
    child: Row(children: [
      Container(width: 44, height: 44,
        decoration: BoxDecoration(color: kSuccess.withOpacity(0.12),
          borderRadius: BorderRadius.circular(10)),
        child: const Icon(Icons.check_circle_rounded, color: kSuccess, size: 22)),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(p['month'] as String,
          style: const TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 3),
        Text('${p['transactionId']} · ${p['method']}',
          style: const TextStyle(color: kSlateDim, fontSize: 10)),
      ])),
      Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
        Text('TZS ${p['amount']}',
          style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w700)),
        const SizedBox(height: 3),
        Text(p['date'] as String,
          style: const TextStyle(color: kSlateDim, fontSize: 10)),
        const SizedBox(height: 4),
        const TStatusBadge(label: 'Paid', color: kSuccess),
      ]),
    ]),
  );
}