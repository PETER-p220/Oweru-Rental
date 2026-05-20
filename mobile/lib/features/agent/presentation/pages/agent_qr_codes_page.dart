import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../shared/services/agent_api_service.dart';

class AgentQrCodesPage extends StatefulWidget {
  const AgentQrCodesPage({super.key});

  @override
  State<AgentQrCodesPage> createState() => _AgentQrCodesPageState();
}

class _AgentQrCodesPageState extends State<AgentQrCodesPage> {
  List<Map<String, dynamic>> _items = [];
  bool _isLoading = true;
  String _error = '';
  Map<int, bool> _copied = {};

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
      final listings = await AgentApiService.getMyListings();
      final qrResults = await Future.wait(
        listings.map((item) async {
          try {
            final qrRes = await AgentApiService.generateQRCode(item['id']);
            return {'property': item, 'qr': qrRes};
          } catch (e) {
            return {'property': item, 'qr': null};
          }
        }),
      );
      setState(() {
        _items = qrResults;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load QR codes.';
        _isLoading = false;
      });
    }
  }

  int get _readyCount => _items.where((item) => item['qr'] != null).length;

  Future<void> _copyUrl(int propertyId) async {
    final url = 'https://rental.oweru.com/property/$propertyId?agent=8';
    await Clipboard.setData(ClipboardData(text: url));
    setState(() => _copied[propertyId] = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _copied[propertyId] = false);
      }
    });
  }

  Future<void> _openUrl(String url) async {
    final Uri uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1218),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1D26),
        elevation: 0,
        title: const Text('QR Codes', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          // Header Section
          Container(
            padding: const EdgeInsets.all(20),
            color: const Color(0xFF1A1D26),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Agent Workspace', style: TextStyle(color: Color(0xFF8B8680), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
                const SizedBox(height: 16),
                const Text('QR Codes', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Unique QR codes for each of your listings. Scan to open the property page instantly.',
                  style: TextStyle(color: Color(0xFF8B8680), fontSize: 13),
                ),
                const SizedBox(height: 22),
                // Stats Grid
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard('Listings', '${_items.length}', const Color(0xFFC9A84C)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatCard('Ready', '$_readyCount', const Color(0xFF10B981)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Error Alert
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
          // Table Section
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(20),
              color: const Color(0xFF1A1D26),
              child: _isLoading
                  ? _buildLoadingSkeleton()
                  : _items.isEmpty
                      ? _buildEmptyState()
                      : SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: DataTable(
                            headingRowColor: MaterialStateProperty.all(const Color(0xFF2A2418)),
                            columns: const [
                              DataColumn(label: Text('Property', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('QR Code', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Status', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Tracking URL', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Actions', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                            ],
                            rows: _items.asMap().entries.map((entry) {
                              final idx = entry.key;
                              final item = entry.value;
                              final property = item['property'] as Map<String, dynamic>? ?? {};
                              final hasQR = item['qr'] != null;
                              final propertyId = property['id'] ?? 0;
                              final url = 'https://rental.oweru.com/property/$propertyId?agent=8';
                              return DataRow(
                                cells: [
                                  DataCell(Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(property['title'] ?? 'Unknown', style: const TextStyle(color: Color(0xFFE8E1D5), fontSize: 14, fontWeight: FontWeight.w400)),
                                      if (property['location'] != null || property['address'] != null)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 2),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.location_on, size: 11, color: Color(0xFFC9A84C)),
                                              const SizedBox(width: 5),
                                              Expanded(
                                                child: Text(
                                                  property['location'] ?? property['address'] ?? '',
                                                  style: const TextStyle(color: Color(0xFF8B8680), fontSize: 12),
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                    ],
                                  )),
                                  DataCell(Center(
                                    child: hasQR
                                        ? Container(
                                            width: 48,
                                            height: 48,
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: const Color(0xFF2A2418)),
                                            ),
                                            child: const Icon(Icons.qr_code_2, size: 32, color: Colors.black),
                                          )
                                        : Container(
                                            width: 48,
                                            height: 48,
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF162035),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: const Color(0xFF2A2418), style: BorderStyle.solid),
                                            ),
                                            child: const Icon(Icons.qr_code_2, size: 20, color: Color(0xFF8B8680)),
                                          ),
                                  )),
                                  DataCell(Center(
                                    child: _buildStatusBadge(hasQR ? 'Ready' : 'Unavailable', hasQR),
                                  )),
                                  DataCell(GestureDetector(
                                    onTap: () => _openUrl(url),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.link, size: 11, color: Color(0xFFC9A84C)),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            url,
                                            style: const TextStyle(color: Color(0xFFC9A84C), fontSize: 11),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  )),
                                  DataCell(Center(
                                    child: hasQR
                                        ? Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              _buildActionButton(Icons.download, 'Download', const Color(0xFFC9A84C), () {}),
                                              const SizedBox(width: 8),
                                              _buildActionButton(
                                                _copied[propertyId] == true ? Icons.check : Icons.copy,
                                                _copied[propertyId] == true ? 'Copied!' : 'Copy',
                                                _copied[propertyId] == true ? const Color(0xFF10B981) : const Color(0xFF8B8680),
                                                () => _copyUrl(propertyId),
                                              ),
                                            ],
                                          )
                                        : const Text('—', style: TextStyle(color: Color(0xFF8B8680), fontSize: 11)),
                                  )),
                                ],
                              );
                            }).toList(),
                          ),
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 0.14),
          ),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(color: color, fontSize: 30, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status, bool isReady) {
    final color = isReady ? const Color(0xFF10B981) : const Color(0xFFEF4444);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 5),
          Text(
            status.toUpperCase(),
            style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.1),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color == const Color(0xFFC9A84C) ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(7),
          border: Border.all(color: color),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color == const Color(0xFFC9A84C) ? const Color(0xFF0F1218) : color),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(color: color == const Color(0xFFC9A84C) ? const Color(0xFF0F1218) : color, fontSize: 11, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return DataTable(
      headingRowColor: MaterialStateProperty.all(const Color(0xFF2A2418)),
      columns: const [
        DataColumn(label: Text('Property', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
        DataColumn(label: Text('QR Code', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
        DataColumn(label: Text('Status', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
        DataColumn(label: Text('Tracking URL', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
        DataColumn(label: Text('Actions', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
      ],
      rows: List.generate(4, (index) {
        return DataRow(
          cells: [
            DataCell(Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(height: 14, width: 100, color: const Color(0xFF1E2D4A)),
                const SizedBox(height: 4),
                Container(height: 11, width: 60, color: const Color(0xFF1E2D4A)),
              ],
            )),
            DataCell(Center(child: Container(width: 48, height: 48, color: const Color(0xFF1E2D4A)))),
            DataCell(Center(child: Container(width: 60, height: 24, color: const Color(0xFF1E2D4A)))),
            DataCell(Container(height: 11, width: 120, color: const Color(0xFF1E2D4A))),
            DataCell(Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(width: 60, height: 28, color: const Color(0xFF1E2D4A)),
                const SizedBox(width: 8),
                Container(width: 60, height: 28, color: const Color(0xFF1E2D4A)),
              ],
            )),
          ],
        );
      }),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: const Color(0xFFC9A84C).withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF2A2418)),
            ),
            child: const Icon(Icons.qr_code_2, size: 24, color: Color(0xFFC9A84C)),
          ),
          const SizedBox(height: 18),
          const Text('No QR Codes Yet', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 22, fontWeight: FontWeight.w300)),
          const SizedBox(height: 6),
          const Text(
            'QR codes will appear here once your listings are active.',
            style: TextStyle(color: Color(0xFF8B8680), fontSize: 14),
          ),
        ],
      ),
    );
  }
}
