import 'package:flutter/material.dart';
import 'agent_theme.dart';
import '../../../shared/services/agent_api_service.dart';
import 'agent_add_listing_page.dart';

class MyListingsPage extends StatefulWidget {
  const MyListingsPage({super.key});

  @override
  State<MyListingsPage> createState() => _MyListingsPageState();
}

class _MyListingsPageState extends State<MyListingsPage> {
  List<Map<String, dynamic>> _listings = [];
  bool _isLoading = true;
  String _error = '';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadListings();
  }

  Future<void> _loadListings() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final listings = await AgentApiService.getMyListings();
      setState(() {
        _listings = listings;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load listings.';
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredListings {
    if (_searchQuery.isEmpty) return _listings;
    return _listings.where((item) {
      final title = (item['title'] as String? ?? '').toLowerCase();
      final location = (item['location'] as String? ?? '').toLowerCase();
      return title.contains(_searchQuery.toLowerCase()) || location.contains(_searchQuery.toLowerCase());
    }).toList();
  }

  String _formatCurrency(dynamic value) {
    if (value == null) return 'TZS 0';
    final double numericValue = value is double ? value : (double.tryParse(value.toString()) ?? 0);
    if (numericValue >= 1000000) {
      return 'TZS ${(numericValue / 1000000).toStringAsFixed(1)}M';
    } else if (numericValue >= 1000) {
      return 'TZS ${(numericValue / 1000).toStringAsFixed(1)}K';
    }
    return 'TZS ${numericValue.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredListings;
    final total = _listings.length;
    final available = _listings.where((item) => item['available'] == true).length;
    final withOwners = _listings.where((item) => item['owner'] != null).length;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPageBg,
        elevation: 0,
        title: const Text('My Listings', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
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
                const Text('My Listings', style: TextStyle(color: kCream, fontSize: 24, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                const Text('Live listings assigned to your agent account.', style: TextStyle(color: kSlate, fontSize: 13)),
                const SizedBox(height: 22),
                Row(
                  children: [
                    _buildStatCard('Total', '$total', const Color(0xFF38BDF8)),
                    const SizedBox(width: 12),
                    _buildStatCard('Available', '$available', const Color(0xFF22C55E)),
                    const SizedBox(width: 12),
                    _buildStatCard('With Owners', '$withOwners', const Color(0xFFF59E0B)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Search and Add Section
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kBg2,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: 'Search listings',
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
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const AgentAddListingPage()),
                        ).then((_) => _loadListings());
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kGold,
                        foregroundColor: kBg,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Add Listing', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ],
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
          // Listings Table
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
                const Text('Listings', style: TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                if (_isLoading)
                  const Center(child: CircularProgressIndicator(color: kGold))
                else if (filtered.isEmpty)
                  const Center(child: Text('No listings found.', style: TextStyle(color: kSlate)))
                else
                  Column(
                    children: [
                      // Table Header
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: kBg3,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          children: [
                            Expanded(flex: 3, child: Text('Property', style: TextStyle(color: kSlate, fontSize: 12, fontWeight: FontWeight.w600))),
                            Expanded(flex: 2, child: Text('Owner', style: TextStyle(color: kSlate, fontSize: 12, fontWeight: FontWeight.w600))),
                            Expanded(flex: 1, child: Text('Price', style: TextStyle(color: kSlate, fontSize: 12, fontWeight: FontWeight.w600))),
                            Expanded(flex: 1, child: Text('Status', style: TextStyle(color: kSlate, fontSize: 12, fontWeight: FontWeight.w600))),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Table Rows
                      ...filtered.map((item) => _buildListingRow(item)),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: kBg3,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: kBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  Widget _buildListingRow(Map<String, dynamic> item) {
    final title = item['title'] as String? ?? 'Untitled';
    final location = item['location'] as String? ?? 'No location';
    final owner = item['owner'] as Map<String, dynamic>?;
    final ownerName = owner != null ? '${owner['first_name'] ?? ''} ${owner['last_name'] ?? ''}'.trim() : '—';
    final price = item['price'];
    final available = item['available'] as bool? ?? false;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: kBorder, width: 1)),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w500)),
                const SizedBox(height: 4),
                Text(location, style: const TextStyle(color: kSlate, fontSize: 11)),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(ownerName, style: const TextStyle(color: kCream, fontSize: 12)),
          ),
          Expanded(
            flex: 1,
            child: Text(_formatCurrency(price), style: const TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          Expanded(
            flex: 1,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: available ? const Color(0xFF22C55E).withValues(alpha: 0.2) : const Color(0xFFF59E0B).withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                available ? 'Available' : 'Occupied',
                style: TextStyle(
                  color: available ? const Color(0xFF22C55E) : const Color(0xFFF59E0B),
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
