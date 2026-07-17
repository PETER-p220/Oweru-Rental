import 'package:flutter/material.dart';
import 'agent_theme.dart';
import '../../../shared/services/agent_api_service.dart';

class LeadsPage extends StatefulWidget {
  const LeadsPage({super.key});

  @override
  State<LeadsPage> createState() => _LeadsPageState();
}

class _LeadsPageState extends State<LeadsPage> {
  List<Map<String, dynamic>> _leads = [];
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
      final leads = await AgentApiService.getLeads();
      setState(() {
        _leads = leads;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load leads.';
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredLeads {
    if (_searchQuery.isEmpty) return _leads;
    return _leads.where((item) {
      final name = (item['name'] as String? ?? item['user']?['first_name'] as String? ?? '').toLowerCase();
      final email = (item['email'] as String? ?? '').toLowerCase();
      final propertyTitle = (item['property']?['title'] as String? ?? '').toLowerCase();
      return name.contains(_searchQuery.toLowerCase()) || email.contains(_searchQuery.toLowerCase()) || propertyTitle.contains(_searchQuery.toLowerCase());
    }).toList();
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '—';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '—';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'new':
        return const Color(0xFF22C55E);
      case 'contacted':
        return const Color(0xFF38BDF8);
      case 'interested':
        return const Color(0xFFF59E0B);
      case 'converted':
        return const Color(0xFF10B981);
      default:
        return const Color(0xFFEF4444);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredLeads;
    final totalLeads = _leads.length;
    final newLeads = _leads.where((item) => item['status'] == 'new').length;
    final convertedLeads = _leads.where((item) => item['status'] == 'converted').length;
    final conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100) : 0.0;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPageBg,
        elevation: 0,
        title: const Text('Leads & Visitors', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Stats Section
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kBg2,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Agent Workspace', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.1)),
                const SizedBox(height: 8),
                const Text('Leads & Visitors', style: TextStyle(color: kCream, fontSize: 24, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                const Text('Track your latest lead conversions here.', style: TextStyle(color: kSlate, fontSize: 13)),
                const SizedBox(height: 22),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.6,
                  children: [
                    _buildStatCard('Total Leads', '$totalLeads', const Color(0xFF38BDF8)),
                    _buildStatCard('New Today', '$newLeads', const Color(0xFF22C55E)),
                    _buildStatCard('Converted', '$convertedLeads', const Color(0xFFF59E0B)),
                    _buildStatCard('Conversion Rate', '${conversionRate.toStringAsFixed(1)}%', const Color(0xFFFB7185)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Search Section
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kBg2,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search leads',
                    hintStyle: const TextStyle(color: kSlate),
                    filled: true,
                    fillColor: kBg3,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                  style: const TextStyle(color: kCream),
                  onChanged: (value) {
                    setState(() => _searchQuery = value);
                  },
                ),
                if (_error.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Text(_error, style: const TextStyle(color: Color(0xFFE07070))),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Leads List
          if (_isLoading)
            const Center(child: CircularProgressIndicator(color: kGold))
          else if (filtered.isEmpty)
            Container(
              padding: const EdgeInsets.all(40),
              decoration: BoxDecoration(
                color: kBg2,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: kBorder),
              ),
              child: const Center(child: Text('No leads found.', style: TextStyle(color: kSlate))),
            )
          else
            ...filtered.map((lead) => _buildLeadCard(lead)),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kBg3,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _buildLeadCard(Map<String, dynamic> lead) {
    final name = lead['name'] as String? ?? lead['user']?['first_name'] as String? ?? 'Lead';
    final email = lead['email'] as String? ?? '';
    final phone = lead['phone'] as String? ?? '';
    final status = lead['status'] as String? ?? 'new';
    final createdAt = lead['created_at'] as String?;
    final property = lead['property'] as Map<String, dynamic>?;
    final propertyTitle = property?['title'] as String? ?? 'General interest';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kBg2,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
                    if (email.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(email, style: const TextStyle(color: kSlate, fontSize: 13)),
                    ],
                    if (phone.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(phone, style: const TextStyle(color: kSlate, fontSize: 13)),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _getStatusColor(status),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          // Property Section
          if (property != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: kBg3,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Property', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(propertyTitle, style: const TextStyle(color: kCream, fontSize: 13)),
                ],
              ),
            ),
          ],
          // Created Date
          const SizedBox(height: 16),
          Row(
            children: [
              const Text('Created: ', style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w600)),
              Text(_formatDate(createdAt), style: const TextStyle(color: kCream, fontSize: 13)),
            ],
          ),
          // Actions
          if (email.isNotEmpty || phone.isNotEmpty) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                if (email.isNotEmpty)
                  Expanded(
                    child: ElevatedButton(
                      onPressed: null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kGold.withValues(alpha: 0.15),
                        foregroundColor: kGold,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        side: BorderSide(color: kBorder),
                      ),
                      child: const Text('Email', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                if (email.isNotEmpty && phone.isNotEmpty) const SizedBox(width: 12),
                if (phone.isNotEmpty)
                  Expanded(
                    child: ElevatedButton(
                      onPressed: null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kGold.withValues(alpha: 0.15),
                        foregroundColor: kGold,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        side: BorderSide(color: kBorder),
                      ),
                      child: const Text('Call', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
