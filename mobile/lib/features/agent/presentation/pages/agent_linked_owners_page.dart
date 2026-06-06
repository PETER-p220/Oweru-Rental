import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../shared/services/agent_api_service.dart';

// Oweru Brand Colors
const Color kNavy900 = Color(0xFF0F172A);
const Color kNavy800 = Color(0xFF141F35);
const Color kGold = Color(0xFFC89128);
const Color kOffWhite = Color(0xFFF8F8F9);
const Color kSlateBlue = Color(0xFF6888BC);
const Color kMutedBlue = Color(0xFF9AAABF);
const Color kTableBorder = Color(0xFFC9D1DF);

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
      backgroundColor: kNavy900,
      appBar: AppBar(
        backgroundColor: kNavy900,
        elevation: 0,
        title: const Text('Linked Owners', style: TextStyle(color: kOffWhite, fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Panel
            _buildHeaderPanel(totalWithInfo, totalProps, showing),
            const SizedBox(height: 24),
            // Table Panel
            _buildTablePanel(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderPanel(int totalWithInfo, int totalProps, int showing) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: kNavy800,
        border: Border.all(color: kGold.withValues(alpha: 0.15)),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.30),
            blurRadius: 60,
            offset: const Offset(0, 24),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Title
          Text(
            'AGENT WORKSPACE',
            style: TextStyle(
              color: kGold,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.18,
              textBaseline: TextBaseline.alphabetic,
            ),
          ),
          const SizedBox(height: 10),
          // Heading
          const Text(
            'Linked Owners',
            style: TextStyle(
              color: kOffWhite,
              fontSize: 34,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.02,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 8),
          // Description
          Text(
            'Properties where landlord contact details have been recorded.',
            style: TextStyle(
              color: kMutedBlue,
              fontSize: 15,
              height: 1.7,
            ),
          ),
          const SizedBox(height: 22),
          // Stats Grid
          Row(
            children: [
              Expanded(
                child: _buildStatCard('Owners', '$totalWithInfo', const Color(0xFF38BDF8)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: _buildStatCard('Properties with Info', '$totalProps', const Color(0xFF22C55E)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: _buildStatCard('Showing', '$showing', const Color(0xFFA78BFA)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTablePanel() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: kNavy800,
        border: Border.all(color: kGold.withValues(alpha: 0.15)),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.30),
            blurRadius: 60,
            offset: const Offset(0, 24),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Search Input
          Container(
            constraints: const BoxConstraints(maxWidth: 340),
            margin: const EdgeInsets.only(bottom: 16),
            child: TextField(
              onChanged: (value) => setState(() => _searchQuery = value),
              style: const TextStyle(color: kOffWhite, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search property, location, landlord name or phone...',
                hintStyle: TextStyle(color: kMutedBlue.withValues(alpha: 0.7)),
                filled: true,
                fillColor: kOffWhite.withValues(alpha: 0.04),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: kGold.withValues(alpha: 0.20), width: 1.5),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: kGold.withValues(alpha: 0.20), width: 1.5),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: kGold, width: 1.5),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ),
          // Error Alert
          if (_error.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.18)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error, size: 16, color: Color(0xFFEF4444)),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_error, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 14))),
                ],
              ),
            ),
          // Table
          _isLoading
              ? const Center(child: CircularProgressIndicator(color: kGold))
              : _filteredRows.isEmpty
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: Text('No properties with landlord info found.', style: TextStyle(color: kMutedBlue, fontSize: 13)),
                      ),
                    )
                  : _buildDataTable(),
        ],
      ),
    );
  }

  Widget _buildDataTable() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kGold.withValues(alpha: 0.12)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(kNavy900.withValues(alpha: 0.60)),
          headingTextStyle: const TextStyle(
            color: kSlateBlue,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.12,
          ),
          dataTextStyle: const TextStyle(
            color: kTableBorder,
            fontSize: 13,
          ),
          horizontalMargin: 0,
          columnSpacing: 16,
          headingRowHeight: 48,
          dataRowMinHeight: 56,
          dataRowMaxHeight: 80,
          border: TableBorder(
            horizontalInside: BorderSide(color: kOffWhite.withValues(alpha: 0.04)),
            bottom: BorderSide(color: kGold.withValues(alpha: 0.10)),
          ),
          columns: const [
            DataColumn(
              label: Text('PROPERTY'),
            ),
            DataColumn(
              label: Text('LOCATION'),
            ),
            DataColumn(
              label: Text('LANDLORD NAME'),
            ),
            DataColumn(
              label: Text('LANDLORD PHONE'),
            ),
            DataColumn(
              label: Text('ACTIONS'),
            ),
          ],
          rows: _filteredRows.map((row) {
            final prop = row['prop'] as Map<String, dynamic>;
            final landlordName = prop['landlord_name'] as String?;
            final landlordPhone = prop['landlord_phone'] as String?;
            return DataRow(
              cells: [
                DataCell(
                  Text(
                    prop['title'] ?? 'Unknown',
                    style: const TextStyle(
                      color: kOffWhite,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                DataCell(
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 11, color: kMutedBlue),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          prop['location'] ?? '—',
                          style: const TextStyle(color: kMutedBlue, fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                DataCell(
                  landlordName != null
                      ? Text(
                          landlordName,
                          style: const TextStyle(color: kOffWhite, fontSize: 13),
                        )
                      : _buildNoBadge(),
                ),
                DataCell(
                  landlordPhone != null
                      ? GestureDetector(
                          onTap: () => _makePhoneCall(landlordPhone),
                          child: Row(
                            children: [
                              const Icon(Icons.phone, size: 13, color: Color(0xFF38BDF8)),
                              const SizedBox(width: 5),
                              Text(
                                landlordPhone,
                                style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 13),
                              ),
                            ],
                          ),
                        )
                      : _buildNoBadge(),
                ),
                DataCell(
                  landlordPhone != null
                      ? Row(
                          children: [
                            _buildActionButton(Icons.phone, 'Call', const Color(0xFF22C55E), () => _makePhoneCall(landlordPhone)),
                            const SizedBox(width: 8),
                            _buildActionButton(Icons.message, 'WhatsApp', const Color(0xFF25D366), () => _openWhatsApp(landlordPhone)),
                          ],
                        )
                      : _buildNoBadge(),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
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
        color: const Color(0xFF8A8070).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: const Color(0xFF8A8070).withValues(alpha: 0.18)),
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
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color.withValues(alpha: 0.2)),
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
