import 'package:flutter/material.dart';
import '../../../shared/services/commercial_api_service.dart';

const Color kGold = Color(0xFFC89128);
const Color kBg = Color(0xFF0A0F1E);
const Color kBg2 = Color(0xFF0F172A);
const Color kBg3 = Color(0xFF162035);
const Color kCream = Color(0xFFF1F5F9);
const Color kSlate = Color(0xFF94A3B8);
const Color kBorder = Color(0x26C89128);

class CommercialPropertiesPage extends StatefulWidget {
  const CommercialPropertiesPage({super.key});

  @override
  State<CommercialPropertiesPage> createState() => _CommercialPropertiesPageState();
}

class _CommercialPropertiesPageState extends State<CommercialPropertiesPage> {
  List<Map<String, dynamic>> _properties = [];
  bool _isLoading = true;
  String _error = '';
  String _searchQuery = '';
  String _statusFilter = 'all';
  String _typeFilter = 'all';
  final int _currentPage = 1;
  final int _lastPage = 1;
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _loadProperties();
  }

  Future<void> _loadProperties() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final properties = await CommercialApiService.getProperties();
      setState(() {
        _properties = properties;
        _total = properties.length;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load properties.';
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredProperties {
    var filtered = _properties;

    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((item) {
        final title = (item['title'] as String? ?? '').toLowerCase();
        final location = (item['location'] as String? ?? '').toLowerCase();
        return title.contains(_searchQuery.toLowerCase()) || location.contains(_searchQuery.toLowerCase());
      }).toList();
    }

    if (_statusFilter != 'all') {
      filtered = filtered.where((item) => item['status'] == _statusFilter).toList();
    }

    if (_typeFilter != 'all') {
      filtered = filtered.where((item) => item['type'] == _typeFilter).toList();
    }

    return filtered;
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

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '—';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'active':
        return const Color(0xFF10B981);
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'inactive':
        return const Color(0xFF64748B);
      case 'rejected':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  Color _getTypeColor(String? type) {
    switch (type?.toLowerCase()) {
      case 'office':
        return const Color(0xFF22D3EE);
      case 'retail':
        return const Color(0xFFF472B6);
      case 'warehouse':
        return const Color(0xFFFB923C);
      case 'commercial':
        return const Color(0xFFA78BFA);
      case 'industrial':
        return const Color(0xFF818CF8);
      default:
        return const Color(0xFF94A3B8);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredProperties;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        title: const Text('My Properties', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: kGold),
            onPressed: () => _showAddPropertyDialog(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search and Filter Section
          Container(
            padding: const EdgeInsets.all(16),
            color: kBg2,
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.tune, size: 14, color: kGold),
                    const SizedBox(width: 8),
                    const Text('Filters', style: TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 8),
                    Text('— ${filtered.length} results', style: const TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: 'Search properties...',
                          hintStyle: const TextStyle(color: kSlate),
                          filled: true,
                          fillColor: kBg3,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                          prefixIcon: const Icon(Icons.search, color: kSlate, size: 14),
                        ),
                        style: const TextStyle(color: kCream),
                        onChanged: (value) {
                          setState(() => _searchQuery = value);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _statusFilter,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: kBg3,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                        ),
                        style: const TextStyle(color: kCream, fontSize: 13),
                        items: const [
                          DropdownMenuItem(value: 'all', child: Text('All Status')),
                          DropdownMenuItem(value: 'active', child: Text('Active')),
                          DropdownMenuItem(value: 'pending', child: Text('Pending')),
                          DropdownMenuItem(value: 'inactive', child: Text('Inactive')),
                          DropdownMenuItem(value: 'rejected', child: Text('Rejected')),
                        ],
                        onChanged: (value) => setState(() => _statusFilter = value ?? 'all'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _typeFilter,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: kBg3,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                        ),
                        style: const TextStyle(color: kCream, fontSize: 13),
                        items: const [
                          DropdownMenuItem(value: 'all', child: Text('All Types')),
                          DropdownMenuItem(value: 'office', child: Text('Office')),
                          DropdownMenuItem(value: 'retail', child: Text('Retail')),
                          DropdownMenuItem(value: 'warehouse', child: Text('Warehouse')),
                          DropdownMenuItem(value: 'commercial', child: Text('Commercial')),
                          DropdownMenuItem(value: 'industrial', child: Text('Industrial')),
                        ],
                        onChanged: (value) => setState(() => _typeFilter = value ?? 'all'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Properties List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: kGold))
                : _error.isNotEmpty
                    ? Center(child: Text(_error, style: const TextStyle(color: Color(0xFFE07070))))
                    : filtered.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.domain_outlined, size: 48, color: kSlate),
                                const SizedBox(height: 16),
                                const Text('No properties found', style: TextStyle(color: kCream, fontSize: 16)),
                                const SizedBox(height: 8),
                                const Text('Get started by adding your first listing', style: TextStyle(color: kSlate, fontSize: 13)),
                                const SizedBox(height: 16),
                                ElevatedButton(
                                  onPressed: () => _showAddPropertyDialog(),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: kGold,
                                    foregroundColor: kBg,
                                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  ),
                                  child: const Text('Add First Property', style: TextStyle(fontWeight: FontWeight.w700)),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: filtered.length,
                            itemBuilder: (context, index) => _buildPropertyCard(filtered[index]),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildPropertyCard(Map<String, dynamic> property) {
    final title = property['title'] as String? ?? 'Untitled';
    final location = property['location'] as String? ?? 'No location';
    final price = property['price'];
    final priceType = property['price_type'] as String? ?? 'monthly';
    final status = property['status'] as String? ?? 'pending';
    final type = property['type'] as String? ?? 'commercial';
    final bedrooms = property['bedrooms'];
    final bathrooms = property['bathrooms'];
    final area = property['area'];
    final parkingSpaces = property['parking_spaces'];
    final furnished = property['furnished'] as bool? ?? false;
    final views = property['views'] ?? 0;
    final images = property['property_images'] as List?;
    final imageUrl = images != null && images.isNotEmpty ? images[0]['image_path'] as String? : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: kBg2,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image Section
          Stack(
            children: [
              Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: kBg3,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  child: imageUrl != null && imageUrl.isNotEmpty
                      ? Image.network(
                          imageUrl.startsWith('http') ? imageUrl : 'https://rental.oweru.com/storage/$imageUrl',
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const Center(
                            child: Icon(Icons.domain_outlined, color: kSlate, size: 36),
                          ),
                        )
                      : const Center(
                          child: Icon(Icons.domain_outlined, color: kSlate, size: 36),
                        ),
                ),
              ),
              // Status and Type Badges
              Positioned(
                top: 12,
                left: 12,
                child: Row(
                  children: [
                    _buildStatusBadge(status),
                    const SizedBox(width: 6),
                    _buildTypeBadge(type),
                  ],
                ),
              ),
              // Views
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: kBorder),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.visibility, size: 11, color: kSlate),
                      const SizedBox(width: 5),
                      Text('$views', style: const TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // Content Section
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 11, color: kSlate),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(location, style: const TextStyle(color: kSlate, fontSize: 12), overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                // Price
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text(_formatCurrency(price), style: const TextStyle(color: kGold, fontSize: 18, fontWeight: FontWeight.w700)),
                        const SizedBox(width: 4),
                        Text(_getPriceSuffix(priceType), style: const TextStyle(color: kSlate, fontSize: 11)),
                      ],
                    ),
                    if (furnished)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                        decoration: BoxDecoration(
                          color: kBg3,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('Furnished', style: TextStyle(color: kSlate, fontSize: 10, fontWeight: FontWeight.w600)),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                // Feature Tags
                if (bedrooms != null || bathrooms != null || area != null || parkingSpaces != null)
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      if (bedrooms != null) _buildFeatureTag('$bedrooms Beds'),
                      if (bathrooms != null) _buildFeatureTag('$bathrooms Baths'),
                      if (area != null) _buildFeatureTag('$area m²'),
                      if (parkingSpaces != null) _buildFeatureTag('$parkingSpaces P'),
                    ],
                  ),
                const SizedBox(height: 14),
                // Actions
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.edit, size: 12),
                        label: const Text('Edit', style: TextStyle(fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kGold.withOpacity(0.08),
                          foregroundColor: kGold,
                          padding: const EdgeInsets.symmetric(vertical: 9),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          side: BorderSide(color: kBorder),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.toggle_on, size: 12),
                        label: Text(status == 'active' ? 'Deactivate' : 'Activate', style: const TextStyle(fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kBg3,
                          foregroundColor: kSlate,
                          padding: const EdgeInsets.symmetric(vertical: 9),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          side: BorderSide(color: kBorder),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444).withOpacity(0.06),
                        foregroundColor: const Color(0xFFEF4444),
                        padding: const EdgeInsets.all(9),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        side: BorderSide(color: const Color(0xFFEF4444).withOpacity(0.12)),
                      ),
                      child: const Icon(Icons.delete, size: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _getStatusColor(status).withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 5,
            height: 5,
            decoration: BoxDecoration(
              color: _getStatusColor(status),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 5),
          Text(
            status.toUpperCase(),
            style: TextStyle(color: _getStatusColor(status), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeBadge(String type) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _getTypeColor(type).withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        type.toUpperCase(),
        style: TextStyle(color: _getTypeColor(type), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5),
      ),
    );
  }

  Widget _buildFeatureTag(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: kBg3,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(text, style: const TextStyle(color: kSlate, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }

  String _getPriceSuffix(String priceType) {
    switch (priceType.toLowerCase()) {
      case 'monthly':
        return '/mo';
      case 'yearly':
        return '/yr';
      default:
        return '';
    }
  }

  void _showAddPropertyDialog() {
    // TODO: Implement add property dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Add property dialog to be implemented')),
    );
  }
}
