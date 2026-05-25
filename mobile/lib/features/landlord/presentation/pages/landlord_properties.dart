import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import '../../../../shared/services/user_service.dart';
import 'landlord_add_property.dart';
import 'landlord_theme.dart';

class LandlordPropertiesPage extends StatefulWidget {
  const LandlordPropertiesPage({super.key});

  @override
  State<LandlordPropertiesPage> createState() => _LandlordPropertiesPageState();
}

class _LandlordPropertiesPageState extends State<LandlordPropertiesPage> {
  List<Map<String, dynamic>> _properties = [];
  bool _isLoading = true;
  String _error = '';
  String _searchQuery = '';
  String _statusFilter = 'all';
  String _typeFilter = 'all';
  String _sortBy = 'listedDate';
  Map<String, int> _stats = {'total': 0, 'available': 0, 'rented': 0, 'monthlyRevenue': 0};
  final Map<int, int> _carouselStates = {};

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

    // Debug: Check token status
    final userService = UserService();
    debugPrint('Token check in properties page: ${userService.token != null ? "Token exists" : "Token is null"}');
    debugPrint('Token value: ${userService.token}');

    try {
      final properties = await LandlordApiService.getMyProperties();
      debugPrint('Loaded ${properties.length} properties from API');
      debugPrint('Properties data: $properties');
      setState(() {
        _properties = properties;
        _stats = _calculateStats(properties);
        _isLoading = false;
      });
      debugPrint('State updated with ${_properties.length} properties');
    } catch (e) {
      debugPrint('Error loading properties: $e');
      setState(() {
        _error = 'Unable to load properties: $e';
        _isLoading = false;
      });
    }
  }

  Map<String, int> _calculateStats(List<Map<String, dynamic>> properties) {
    int total = properties.length;
    int available = properties.where((p) => (p['available'] as bool? ?? false) == true).length;
    int rented = properties.where((p) => (p['available'] as bool? ?? false) == false).length;
    int monthlyRevenue = properties.fold(0, (sum, p) => sum + (p['price'] as int? ?? 0));
    return {'total': total, 'available': available, 'rented': rented, 'monthlyRevenue': monthlyRevenue};
  }

  List<Map<String, dynamic>> get _filteredAndSortedProperties {
    var filtered = _properties;

    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((item) {
        final title = (item['title'] as String? ?? '').toLowerCase();
        final location = (item['location'] as String? ?? '').toLowerCase();
        final address = (item['address'] as String? ?? '').toLowerCase();
        return title.contains(_searchQuery.toLowerCase()) ||
               location.contains(_searchQuery.toLowerCase()) ||
               address.contains(_searchQuery.toLowerCase());
      }).toList();
    }

    if (_statusFilter != 'all') {
      if (_statusFilter == 'available') {
        filtered = filtered.where((item) => (item['available'] as bool? ?? false) == true).toList();
      } else if (_statusFilter == 'rented') {
        filtered = filtered.where((item) => (item['available'] as bool? ?? false) == false).toList();
      }
    }

    if (_typeFilter != 'all') {
      filtered = filtered.where((item) => item['type'] == _typeFilter).toList();
    }

    filtered.sort((a, b) {
      switch (_sortBy) {
        case 'price-low':
          return (a['price'] as int? ?? 0).compareTo(b['price'] as int? ?? 0);
        case 'price-high':
          return (b['price'] as int? ?? 0).compareTo(a['price'] as int? ?? 0);
        case 'listedDate':
        default:
          final aDate = DateTime.parse(a['created_at'] ?? DateTime.now().toIso8601String());
          final bDate = DateTime.parse(b['created_at'] ?? DateTime.now().toIso8601String());
          return bDate.compareTo(aDate);
      }
    });

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

  Color _getStatusColor(bool? available) {
    if (available == true) return const Color(0xFF10B981);
    if (available == false) return const Color(0xFF3B82F6);
    return const Color(0xFF6B7280);
  }

  String _getStatusText(bool? available) {
    if (available == true) return 'Available';
    if (available == false) return 'Rented';
    return 'Unknown';
  }

  IconData _getStatusIcon(bool? available) {
    if (available == true) return Icons.check_circle;
    if (available == false) return Icons.people;
    return Icons.home;
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredAndSortedProperties;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        title: Row(
          children: [
            const Icon(Icons.apartment, color: kGold, size: 28),
            const SizedBox(width: 12),
            const Flexible(
              child: Text(
                'My Properties',
                style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: kGold.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text('${_stats['total']}', style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: kGold),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const LandlordAddPropertyPage()),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Stats Section — FIX: use IntrinsicHeight + flexible children to prevent overflow
          Container(
            padding: const EdgeInsets.all(16),
            color: kBg2,
            child: IntrinsicHeight(
              child: Row(
                children: [
                  Expanded(child: _buildStatCard('Total', '${_stats['total']}', kCream)),
                  const SizedBox(width: 10),
                  Expanded(child: _buildStatCard('Available', '${_stats['available']}', const Color(0xFF10B981))),
                  const SizedBox(width: 10),
                  Expanded(child: _buildStatCard('Rented', '${_stats['rented']}', const Color(0xFF3B82F6))),
                  const SizedBox(width: 10),
                  Expanded(child: _buildStatCard('Revenue', _formatCurrency(_stats['monthlyRevenue']), const Color(0xFF38BDF8))),
                ],
              ),
            ),
          ),
          // Search and Filter Section
          Container(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            color: kBg2,
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search properties...',
                    hintStyle: const TextStyle(color: kSlate),
                    filled: true,
                    fillColor: kBg3,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    prefixIcon: const Icon(Icons.search, color: kSlate, size: 18),
                  ),
                  style: const TextStyle(color: kCream),
                  onChanged: (value) {
                    setState(() => _searchQuery = value);
                  },
                ),
                const SizedBox(height: 10),
                // FIX: wrap filters in a Row with Flexible children to prevent right overflow
                Row(
                  children: [
                    Flexible(
                      child: _buildDropdown<String>(
                        value: _statusFilter,
                        items: const [
                          DropdownMenuItem(value: 'all', child: Text('All Status')),
                          DropdownMenuItem(value: 'available', child: Text('Available')),
                          DropdownMenuItem(value: 'rented', child: Text('Rented')),
                        ],
                        onChanged: (v) => setState(() => _statusFilter = v ?? 'all'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: _buildDropdown<String>(
                        value: _typeFilter,
                        items: const [
                          DropdownMenuItem(value: 'all', child: Text('All Types')),
                          DropdownMenuItem(value: 'apartment', child: Text('Apartment')),
                          DropdownMenuItem(value: 'house', child: Text('House')),
                          DropdownMenuItem(value: 'studio', child: Text('Studio')),
                          DropdownMenuItem(value: 'villa', child: Text('Villa')),
                        ],
                        onChanged: (v) => setState(() => _typeFilter = v ?? 'all'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: _buildDropdown<String>(
                        value: _sortBy,
                        items: const [
                          DropdownMenuItem(value: 'listedDate', child: Text('Recent')),
                          DropdownMenuItem(value: 'price-low', child: Text('Low → High')),
                          DropdownMenuItem(value: 'price-high', child: Text('High → Low')),
                        ],
                        onChanged: (v) => setState(() => _sortBy = v ?? 'listedDate'),
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
                              children: const [
                                Icon(Icons.apartment, size: 48, color: kSlate),
                                SizedBox(height: 16),
                                Text('No properties found', style: TextStyle(color: kCream, fontSize: 16)),
                                SizedBox(height: 8),
                                Text('Try adjusting your filters or add your first property', style: TextStyle(color: kSlate, fontSize: 13)),
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

  Widget _buildDropdown<T>({
    required T value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
  }) {
    return DropdownButtonFormField<T>(
      initialValue: value,
      isExpanded: true,
      dropdownColor: kBg3,
      decoration: InputDecoration(
        filled: true,
        fillColor: kBg3,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      ),
      style: const TextStyle(color: kCream, fontSize: 13),
      iconEnabledColor: kGold,
      items: items,
      onChanged: onChanged,
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: kBg3,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w600),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: kSlate, fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 0.05),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPropertyCard(Map<String, dynamic> property) {
    final title = property['title'] as String? ?? 'Property';
    final location = property['location'] as String? ?? '';
    final price = property['price'];
    final bedrooms = property['bedrooms'];
    final bathrooms = property['bathrooms'];
    final area = property['area'];
    final description = property['description'] as String?;
    final available = property['available'] as bool?;
    final createdAt = property['created_at'] as String?;
    final images = property['images'] as List?;
    final tenant = property['tenant'] as Map<String, dynamic>?;
    final propertyId = property['id'] as int?;
    final currentImageIndex = _carouselStates[propertyId ?? 0] ?? 0;

    return LCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image Section with Carousel
          Stack(
            children: [
              Container(
                height: 180,
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: kBg3,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                ),
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  child: images != null && images.isNotEmpty
                      ? PageView.builder(
                          itemCount: images.length,
                          onPageChanged: (index) {
                            if (propertyId != null) {
                              setState(() => _carouselStates[propertyId] = index);
                            }
                          },
                          controller: PageController(initialPage: currentImageIndex),
                          itemBuilder: (context, index) {
                            final img = images[index] as String?;
                            return img != null && img.isNotEmpty
                                ? Image.network(
                                    img.startsWith('http') ? img : 'https://rental.oweru.com/storage/$img',
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, _, _) => const Center(
                                      child: Icon(Icons.apartment, color: kSlate, size: 48),
                                    ),
                                  )
                                : const Center(child: Icon(Icons.apartment, color: kSlate, size: 48));
                          },
                        )
                      : const Center(child: Icon(Icons.apartment, color: kSlate, size: 48)),
                ),
              ),
              // Carousel Controls
              if (images != null && images.length > 1) ...[
                Positioned(
                  left: 8, top: 0, bottom: 0,
                  child: Center(
                    child: _CarouselButton(
                      icon: Icons.chevron_left,
                      onPressed: () {
                        if (propertyId != null) {
                          setState(() => _carouselStates[propertyId] = (currentImageIndex - 1 + images.length) % images.length);
                        }
                      },
                    ),
                  ),
                ),
                Positioned(
                  right: 8, top: 0, bottom: 0,
                  child: Center(
                    child: _CarouselButton(
                      icon: Icons.chevron_right,
                      onPressed: () {
                        if (propertyId != null) {
                          setState(() => _carouselStates[propertyId] = (currentImageIndex + 1) % images.length);
                        }
                      },
                    ),
                  ),
                ),
                // Image Indicators
                Positioned(
                  bottom: 8, left: 0, right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      images.length,
                      (index) => Container(
                        width: 7, height: 7,
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        decoration: BoxDecoration(
                          color: currentImageIndex == index ? kGold : Colors.white.withOpacity(0.5),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
              // Status Badge
              Positioned(
                top: 10, right: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(available).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: _getStatusColor(available).withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(_getStatusIcon(available), size: 10, color: _getStatusColor(available)),
                      const SizedBox(width: 4),
                      Text(
                        _getStatusText(available).toUpperCase(),
                        style: TextStyle(
                          color: _getStatusColor(available),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // Edit / Delete Buttons
              Positioned(
                top: 10, left: 10,
                child: Row(
                  children: [
                    _OverlayButton(
                      color: kGold,
                      icon: Icons.edit,
                      iconColor: kBg,
                      onPressed: () {},
                    ),
                    const SizedBox(width: 8),
                    _OverlayButton(
                      color: const Color(0xFFEF4444),
                      icon: Icons.delete,
                      iconColor: Colors.white,
                      onPressed: () {},
                    ),
                  ],
                ),
              ),
            ],
          ),
          // Content Section — same style as dashboard _PropertyCard
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  title,
                  style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
                const SizedBox(height: 6),
                // Location
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 13, color: kSlate),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        location,
                        style: const TextStyle(color: kSlate, fontSize: 13),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                // Features row
                Row(
                  children: [
                    if (bedrooms != null) ...[
                      const Icon(Icons.bed, size: 13, color: kSlate),
                      const SizedBox(width: 4),
                      Text('$bedrooms bd', style: const TextStyle(color: kSlate, fontSize: 12)),
                      const SizedBox(width: 10),
                    ],
                    if (bathrooms != null) ...[
                      const Icon(Icons.bathtub, size: 13, color: kSlate),
                      const SizedBox(width: 4),
                      Text('$bathrooms ba', style: const TextStyle(color: kSlate, fontSize: 12)),
                      const SizedBox(width: 10),
                    ],
                    if (area != null) ...[
                      const Icon(Icons.square_foot, size: 13, color: kSlate),
                      const SizedBox(width: 4),
                      Text('${area}m²', style: const TextStyle(color: kSlate, fontSize: 12)),
                    ],
                  ],
                ),
                if (description != null && description.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    description,
                    style: const TextStyle(color: kSlate, fontSize: 12, height: 1.4),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                // Tenant Info
                if (tenant != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6).withOpacity(0.05),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.people, size: 13, color: Color(0xFF3B82F6)),
                            SizedBox(width: 6),
                            Text('Current Tenant', style: TextStyle(color: Color(0xFF3B82F6), fontSize: 12, fontWeight: FontWeight.w600)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${tenant['firstName'] ?? ''} ${tenant['lastName'] ?? ''}'.trim(),
                          style: const TextStyle(color: kCream, fontSize: 13),
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (tenant['contractStart'] != null || tenant['contractEnd'] != null)
                          Text(
                            '${_formatDate(tenant['contractStart'] ?? '')} – ${_formatDate(tenant['contractEnd'] ?? '')}',
                            style: const TextStyle(color: kSlate, fontSize: 11),
                          ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                // Price row — FIX: use Row with Expanded to prevent right overflow
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _formatCurrency(price),
                          style: const TextStyle(color: kGold, fontSize: 18, fontWeight: FontWeight.w700),
                        ),
                        const Text('/ month', style: TextStyle(color: kSlate, fontSize: 11)),
                      ],
                    ),
                    // Views + Inquiries
                    Row(
                      children: [
                        const Icon(Icons.visibility, size: 12, color: kSlate),
                        const SizedBox(width: 4),
                        Text('${property['views'] ?? 0}', style: const TextStyle(color: kSlate, fontSize: 11)),
                        const SizedBox(width: 12),
                        const Icon(Icons.info_outline, size: 12, color: kSlate),
                        const SizedBox(width: 4),
                        Text('${property['inquiries'] ?? 0}', style: const TextStyle(color: kSlate, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 11, color: kSlate),
                    const SizedBox(width: 6),
                    Text(
                      'Listed ${_formatDate(createdAt ?? '')}',
                      style: const TextStyle(color: kSlate, fontSize: 11),
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
}

// ── Helper widgets ────────────────────────────────────────────

class _CarouselButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;

  const _CarouselButton({required this.icon, required this.onPressed});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onPressed,
    child: Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: Colors.white, size: 18),
    ),
  );
}

class _OverlayButton extends StatelessWidget {
  final Color color;
  final IconData icon;
  final Color iconColor;
  final VoidCallback onPressed;

  const _OverlayButton({
    required this.color,
    required this.icon,
    required this.iconColor,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onPressed,
    child: Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      child: Icon(icon, size: 14, color: iconColor),
    ),
  );
}