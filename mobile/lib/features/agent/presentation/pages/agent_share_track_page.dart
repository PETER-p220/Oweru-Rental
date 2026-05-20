import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../shared/services/agent_api_service.dart';

class AgentShareTrackPage extends StatefulWidget {
  const AgentShareTrackPage({super.key});

  @override
  State<AgentShareTrackPage> createState() => _AgentShareTrackPageState();
}

class _AgentShareTrackPageState extends State<AgentShareTrackPage> {
  List<Map<String, dynamic>> _links = [];
  bool _isLoading = true;
  bool _refreshing = false;
  String _error = '';
  String _searchQuery = '';                   
  DateTime? _lastUpdated;
  Map<int, bool> _copied = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData({bool silent = false}) async {
    setState(() {
      if (!silent) _isLoading = true;
      _refreshing = true;
      _error = '';
    });

    try {
      final links = await AgentApiService.getTrackingLinks();
      setState(() {
        _links = links;
        _lastUpdated = DateTime.now();
        _isLoading = false;
        _refreshing = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load tracking links.';
        _isLoading = false;
        _refreshing = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_searchQuery.isEmpty) return _links;
    final q = _searchQuery.toLowerCase();
    return _links.where((item) {
      final title = (item['title'] ?? '').toLowerCase();
      final url = (item['tracking_url'] ?? '').toLowerCase();
      return '$title $url'.contains(q);
    }).toList();
  }

  int get _totalClicks => _links.fold(0, (sum, item) => sum + (int.tryParse(item['clicks']?.toString() ?? '0') ?? 0));
  int get _totalShares => _links.fold(0, (sum, item) => sum + (int.tryParse(item['shares']?.toString() ?? '0') ?? 0));

  Future<void> _handleCopy(Map<String, dynamic> item) async {
    final url = item['tracking_url'] as String? ?? '';
    await Clipboard.setData(ClipboardData(text: url));
    setState(() => _copied[item['id']] = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _copied[item['id']] = false);
      }
    });
  }

  Future<void> _handleWhatsApp(Map<String, dynamic> item) async {
    final url = item['tracking_url'] as String? ?? '';
    final whatsappUrl = 'https://wa.me/?text=${Uri.encodeComponent('Check out this property: $url')}';
    final Uri uri = Uri.parse(whatsappUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openUrl(String url) async {
    final Uri uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '—';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1218),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1D26),
        elevation: 0,
        title: const Text('Share & Track', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 18, fontWeight: FontWeight.w700)),
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
                const Text('Share & Track', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Tracking links for your listings. Clicks are recorded automatically when someone opens your link.',
                  style: TextStyle(color: Color(0xFF8B8680), fontSize: 13),
                ),
                const SizedBox(height: 22),
                // Stats Grid
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard('Total Links', '${_links.length}', const Color(0xFFC9A84C)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatCard('Total Clicks', '$_totalClicks', const Color(0xFF10B981)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard('Total Shares', '$_totalShares', const Color(0xFFF59E0B)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Search and Refresh Section
          Container(
            padding: const EdgeInsets.all(20),
            color: const Color(0xFF1A1D26),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    onChanged: (value) => setState(() => _searchQuery = value),
                    decoration: InputDecoration(
                      hintText: 'Search properties...',
                      hintStyle: const TextStyle(color: Color(0xFF8B8680)),
                      filled: true,
                      fillColor: const Color(0xFF162035),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(9),
                        borderSide: const BorderSide(color: Color(0xFF2A2418)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(9),
                        borderSide: const BorderSide(color: Color(0xFF2A2418)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(9),
                        borderSide: const BorderSide(color: Color(0xFFC9A84C)),
                      ),
                      prefixIcon: const Icon(Icons.search, color: Color(0xFF8B8680), size: 14),
                    ),
                    style: const TextStyle(color: Color(0xFFE8E1D5)),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: _refreshing ? null : () => _loadData(silent: true),
                  icon: SizedBox(
                    width: 13,
                    height: 13,
                    child: _refreshing
                        ? const CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF8B8680))
                        : const Icon(Icons.refresh, size: 13),
                  ),
                  label: Text(_refreshing ? 'Refreshing...' : 'Refresh'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFC9A84C),
                    backgroundColor: Color(0xFFC9A84C).withOpacity(0.12),
                    side: BorderSide(color: Color(0xFFC9A84C).withOpacity(0.3)),
                  ),
                ),
              ],
            ),
          ),
          // Last Updated
          if (_lastUpdated != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 6),
                  const Text('Live · last updated just now', style: TextStyle(color: Color(0xFF8B8680), fontSize: 11)),
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
                  : _filtered.isEmpty
                      ? _buildEmptyState()
                      : SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: DataTable(
                            headingRowColor: MaterialStateProperty.all(const Color(0xFF2A2418)),
                            columns: const [
                              DataColumn(label: Text('#', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Property', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Tracking URL', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Stats', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Actions', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                            ],
                            rows: _filtered.asMap().entries.map((entry) {
                              final idx = entry.key;
                              final item = entry.value;
                              return DataRow(
                                cells: [
                                  DataCell(Center(
                                    child: Container(
                                      width: 28,
                                      height: 28,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFC9A84C).withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: const Color(0xFF2A2418)),
                                      ),
                                      child: Center(
                                        child: Text('${idx + 1}', style: const TextStyle(color: Color(0xFFC9A84C), fontSize: 11, fontWeight: FontWeight.w700)),
                                      ),
                                    ),
                                  )),
                                  DataCell(Text(item['title'] ?? 'Unknown', style: const TextStyle(color: Color(0xFFE8E1D5), fontSize: 14))),
                                  DataCell(GestureDetector(
                                    onTap: () => _openUrl(item['tracking_url'] ?? ''),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.link, size: 12, color: Color(0xFFC9A84C)),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            item['tracking_url'] ?? '',
                                            style: const TextStyle(color: Color(0xFFC9A84C), fontSize: 11),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  )),
                                  DataCell(Row(
                                    children: [
                                      _buildStatBadge(Icons.visibility, '${item['clicks'] ?? 0}', const Color(0xFF38BDF8)),
                                      const SizedBox(width: 8),
                                      _buildStatBadge(Icons.share, '${item['shares'] ?? 0}', const Color(0xFFF59E0B)),
                                      const SizedBox(width: 8),
                                      Text(_formatDate(item['created_at'] ?? ''), style: const TextStyle(color: Color(0xFF8B8680), fontSize: 11)),
                                    ],
                                  )),
                                  DataCell(Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      _buildActionButton(
                                        _copied[item['id']] == true ? Icons.check : Icons.copy,
                                        _copied[item['id']] == true ? 'Copied!' : 'Copy',
                                        _copied[item['id']] == true ? const Color(0xFF10B981) : const Color(0xFFC9A84C),
                                        () => _handleCopy(item),
                                      ),
                                      const SizedBox(width: 8),
                                      _buildActionButton(Icons.message, 'WhatsApp', const Color(0xFF25D366), () => _handleWhatsApp(item)),
                                    ],
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

  Widget _buildStatBadge(IconData icon, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 8, color: color),
          const SizedBox(width: 4),
          Text(value, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
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
          color: color == const Color(0xFFC9A84C) ? color.withOpacity(0.12) : color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(7),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return DataTable(
      headingRowColor: MaterialStateProperty.all(const Color(0xFF2A2418)),
      columns: const [
        DataColumn(label: Text('#', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
        DataColumn(label: Text('Property', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
        DataColumn(label: Text('Tracking URL', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
        DataColumn(label: Text('Stats', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
        DataColumn(label: Text('Actions', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
      ],
      rows: List.generate(3, (index) {
        return DataRow(
          cells: [
            DataCell(Center(child: Container(width: 28, height: 28, color: const Color(0xFF1E2D4A)))),
            DataCell(Container(height: 14, width: 100, color: const Color(0xFF1E2D4A))),
            DataCell(Container(height: 11, width: 150, color: const Color(0xFF1E2D4A))),
            DataCell(Row(
              children: [
                Container(width: 50, height: 20, color: const Color(0xFF1E2D4A)),
                const SizedBox(width: 8),
                Container(width: 50, height: 20, color: const Color(0xFF1E2D4A)),
              ],
            )),
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
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: const Color(0xFFC9A84C).withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF2A2418)),
            ),
            child: const Icon(Icons.link, size: 22, color: Color(0xFFC9A84C)),
          ),
          const SizedBox(height: 16),
          const Text('No tracking links found', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 20, fontWeight: FontWeight.w300)),
          const SizedBox(height: 6),
          Text(
            _searchQuery.isNotEmpty ? 'Try a different search term.' : 'Tracking links will appear here once your listings are live.',
            style: const TextStyle(color: Color(0xFF8B8680), fontSize: 14),
          ),
        ],
      ),
    );
  }
}
