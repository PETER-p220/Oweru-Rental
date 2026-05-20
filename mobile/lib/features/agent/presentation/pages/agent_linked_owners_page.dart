import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../shared/services/agent_api_service.dart';

class AgentLinkedOwnersPage extends StatefulWidget {
  const AgentLinkedOwnersPage({super.key});

  @override
  State<AgentLinkedOwnersPage> createState() => _AgentLinkedOwnersPageState();
}

class _AgentLinkedOwnersPageState extends State<AgentLinkedOwnersPage> {
  List<Map<String, dynamic>> _owners = [];
  bool _isLoading = true;
  String _error = '';
  String _searchQuery = '';

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
      final owners = await AgentApiService.getLinkedOwners();
      setState(() {
        _owners = owners;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load linked owners.';
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _allRows {
    return _owners.expand((owner) {
      final propertiesList = owner['properties_list'] as List<dynamic>? ?? [];
      return propertiesList.map((prop) => {'owner': owner, 'prop': prop});
    }).toList();
  }

  List<Map<String, dynamic>> get _filteredRows {
    if (_searchQuery.isEmpty) return _allRows;
    final q = _searchQuery.toLowerCase();
    return _allRows.where((row) {
      final prop = row['prop'] as Map<String, dynamic>;
      final title = (prop['title'] ?? '').toLowerCase();
      final location = (prop['location'] ?? '').toLowerCase();
      final landlordName = (prop['landlord_name'] ?? '').toLowerCase();
      final landlordPhone = (prop['landlord_phone'] ?? '').toLowerCase();
      return '$title $location $landlordName $landlordPhone'.contains(q);
    }).toList();
  }

  Future<void> _makePhoneCall(String phone) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
    }
  }

  Future<void> _openWhatsApp(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    final Uri whatsappUri = Uri.parse('https://wa.me/$cleanPhone');
    if (await canLaunchUrl(whatsappUri)) {
      await launchUrl(whatsappUri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalWithInfo = _owners.length;
    final totalProps = _allRows.length;
    final showing = _filteredRows.length;

    return Scaffold(
      backgroundColor: const Color(0xFF0F1218),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1D26),
        elevation: 0,
        title: const Text('Linked Owners', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 18, fontWeight: FontWeight.w700)),
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
                const Text('Linked Owners', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Properties where landlord contact details have been recorded.',
                  style: TextStyle(color: Color(0xFF8B8680), fontSize: 13),
                ),
                const SizedBox(height: 22),
                // Stats Grid
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard('Owners', '$totalWithInfo', const Color(0xFF38BDF8)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatCard('Properties with Info', '$totalProps', const Color(0xFF22C55E)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard('Showing', '$showing', const Color(0xFFA78BFA)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Search Section
          Container(
            padding: const EdgeInsets.all(20),
            color: const Color(0xFF1A1D26),
            child: TextField(
              onChanged: (value) => setState(() => _searchQuery = value),
              decoration: InputDecoration(
                hintText: 'Search property, location, landlord name or phone...',
                hintStyle: const TextStyle(color: Color(0xFF8B8680)),
                filled: true,
                fillColor: const Color(0xFF2A2418),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF2A2418)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF2A2418)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFC9A84C)),
                ),
              ),
              style: const TextStyle(color: Color(0xFFE8E1D5)),
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
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFFC9A84C)))
                  : _filteredRows.isEmpty
                      ? const Center(
                          child: Text('No properties with landlord info found.', style: TextStyle(color: Color(0xFF8B8680), fontSize: 13)),
                        )
                      : SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: DataTable(
                            headingRowColor: MaterialStateProperty.all(const Color(0xFF2A2418)),
                            columns: const [
                              DataColumn(label: Text('Property', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Location', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Landlord Name', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Landlord Phone', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                              DataColumn(label: Text('Actions', style: TextStyle(color: Color(0xFFC9A84C), fontWeight: FontWeight.w700))),
                            ],
                            rows: _filteredRows.map((row) {
                              final prop = row['prop'] as Map<String, dynamic>;
                              final landlordName = prop['landlord_name'] as String?;
                              final landlordPhone = prop['landlord_phone'] as String?;
                              return DataRow(
                                cells: [
                                  DataCell(Text(prop['title'] ?? 'Unknown', style: const TextStyle(color: Color(0xFFE8E1D5), fontWeight: FontWeight.w500))),
                                  DataCell(Row(
                                    children: [
                                      const Icon(Icons.location_on, size: 11, color: Color(0xFF8EA0B5)),
                                      const SizedBox(width: 4),
                                      Expanded(child: Text(prop['location'] ?? '—', style: const TextStyle(color: Color(0xFF8EA0B5), fontSize: 12))),
                                    ],
                                  )),
                                  DataCell(landlordName != null
                                      ? Text(landlordName, style: const TextStyle(color: Color(0xFFE8E1D5), fontSize: 13))
                                      : _buildNoBadge()),
                                  DataCell(landlordPhone != null
                                      ? GestureDetector(
                                          onTap: () => _makePhoneCall(landlordPhone),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.phone, size: 13, color: Color(0xFF38BDF8)),
                                              const SizedBox(width: 5),
                                              Text(landlordPhone, style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 13)),
                                            ],
                                          ),
                                        )
                                      : _buildNoBadge()),
                                  DataCell(landlordPhone != null
                                      ? Row(
                                          children: [
                                            _buildActionButton(Icons.phone, 'Call', const Color(0xFF22C55E), () => _makePhoneCall(landlordPhone)),
                                            const SizedBox(width: 8),
                                            _buildActionButton(Icons.message, 'WhatsApp', const Color(0xFF25D366), () => _openWhatsApp(landlordPhone)),
                                          ],
                                        )
                                      : _buildNoBadge()),
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

  Widget _buildNoBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFF8A8070).withOpacity(0.08),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: const Color(0xFF8A8070).withOpacity(0.18)),
      ),
      child: const Text(
        'Not set',
        style: TextStyle(color: Color(0xFF8A8070), fontSize: 11, fontStyle: FontStyle.italic),
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 5),
            Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}
