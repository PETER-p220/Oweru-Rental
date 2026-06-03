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
    int available = properties.where((p) => (p['available'] is bool ? p['available'] as bool : false) == true).length;
    int rented = properties.where((p) => (p['available'] is bool ? p['available'] as bool : false) == false).length;
    int monthlyRevenue = properties.fold(0, (sum, p) {
      final price = double.tryParse(p['price']?.toString() ?? '0') ?? 0;
      return sum + price.toInt();
    });
    return {'total': total, 'available': available, 'rented': rented, 'monthlyRevenue': monthlyRevenue};
  }

  Future<void> _handleEditProperty(Map<String, dynamic> property) async {
    // Navigate to edit property page (to be implemented)
    // For now, show a message that edit functionality will be added
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Edit functionality - navigate to edit page')),
    );
  }

  Future<void> _handleDeleteProperty(int propertyId, String title) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: kBg2,
        title: const Text('Delete Property', style: TextStyle(color: kCream)),
        content: Text('Are you sure you want to delete "$title"? This action cannot be undone.', style: const TextStyle(color: kSlate)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: kSlate)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Color(0xFFEF4444))),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isLoading = true);
      try {
        final success = await LandlordApiService.deleteProperty(propertyId);
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Property deleted successfully')),
          );
          await _loadProperties();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to delete property')),
          );
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error deleting property: $e')),
        );
      } finally {
        setState(() => _isLoading = false);
      }
    }
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
          final aPrice = double.tryParse(a['price']?.toString() ?? '0') ?? 0;
          final bPrice = double.tryParse(b['price']?.toString() ?? '0') ?? 0;
          return aPrice.compareTo(bPrice);
        case 'price-high':
          final aPrice = double.tryParse(a['price']?.toString() ?? '0') ?? 0;
          final bPrice = double.tryParse(b['price']?.toString() ?? '0') ?? 0;
          return bPrice.compareTo(aPrice);
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
      backgroundColor: kPageBg,
      extendBodyBehindAppBar: true,
      body: CustomScrollView(
        slivers: [
          // ── Slate header (matching dashboard) ──────
          SliverToBoxAdapter(child: _slateHeader()),
          
          // ── Stats row (horizontal scrollable) ──────
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            sliver: SliverToBoxAdapter(child: _statsRow()),
          ),
          
          // ── Search and filters ───────────────────────
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            sliver: SliverToBoxAdapter(child: _searchAndFilters()),
          ),
          
          // ── Properties list ──────────────────────────
          if (_isLoading)
            SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: kSlate800, strokeWidth: 2)))
          else if (_error.isNotEmpty)
            SliverFillRemaining(child: Center(child: Text(_error, style: const TextStyle(color: kDanger))))
          else if (filtered.isEmpty)
            SliverFillRemaining(child: _emptyState())
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              sliver: SliverList(delegate: SliverChildBuilderDelegate(
                (_, i) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _PropertyCard(property: filtered[i])),
                childCount: filtered.length,
              )),
            ),
        ],
      ),
    );
  }

  // ── Slate header block ───────────────────────────────────
  Widget _slateHeader() {
    final userService = UserService();
    final name = userService.userName ?? 'Landlord';
    return Container(
      color: kHeaderBg,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 12,
        left: 18, right: 18, bottom: 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Top bar
        Row(children: [
          const Text('My Properties',
            style: TextStyle(color: kWhite, fontSize: 20,
              fontWeight: FontWeight.w800, letterSpacing: -0.3)),
          const Spacer(),
          // Add property button
          GestureDetector(
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LandlordAddPropertyPage())),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: kWhite,
                borderRadius: BorderRadius.circular(8)),
              child: const Row(children: [
                Icon(Icons.add, size: 16, color: kSlate800),
                SizedBox(width: 4),
                Text('Add', style: TextStyle(color: kSlate800, fontSize: 12, fontWeight: FontWeight.w700)),
              ]),
            ),
          ),
        ]),
        const SizedBox(height: 16),
        // Stats summary
        Text('${_stats['total']} properties · ${_stats['available']} available · ${_stats['rented']} rented',
          style: const TextStyle(color: kSlate400, fontSize: 13)),
      ]),
    );
  }

  // ── Horizontal stats row ───────────────────────────────────
  Widget _statsRow() {
    final items = [
      _StatItem(value: '${_stats['total']}',          label: 'Total',       icon: Icons.home_work_outlined,              accent: kSlate800, bg: kSlate100),
      _StatItem(value: '${_stats['available']}',      label: 'Available',   icon: Icons.check_circle_outline,          accent: kSuccess,  bg: kSuccessBg),
      _StatItem(value: '${_stats['rented']}',         label: 'Rented',      icon: Icons.people_outline,                accent: kInfo,     bg: kInfoBg),
      _StatItem(value: _formatCurrency(_stats['monthlyRevenue']), label: 'Revenue', icon: Icons.account_balance_wallet_outlined, accent: kWarning,  bg: kWarningBg),
    ];

    return SizedBox(
      height: 96,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) => _StatCard2(item: items[i]),
      ),
    );
  }

  // ── Search and filters ────────────────────────────────────
  Widget _searchAndFilters() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      TextField(
        decoration: InputDecoration(
          hintText: 'Search properties...',
          hintStyle: const TextStyle(color: kSlate400),
          filled: true,
          fillColor: kWhite,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: kBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: kBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: kSlate600),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          prefixIcon: const Icon(Icons.search, color: kSlate400, size: 18),
        ),
        style: const TextStyle(color: kSlate800, fontSize: 14),
        onChanged: (value) => setState(() => _searchQuery = value),
      ),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: _filterDropdown('Status', _statusFilter, [
          const DropdownMenuItem(value: 'all', child: Text('All Status')),
          const DropdownMenuItem(value: 'available', child: Text('Available')),
          const DropdownMenuItem(value: 'rented', child: Text('Rented')),
        ], (v) => setState(() => _statusFilter = v ?? 'all'))),
        const SizedBox(width: 8),
        Expanded(child: _filterDropdown('Type', _typeFilter, [
          const DropdownMenuItem(value: 'all', child: Text('All Types')),
          const DropdownMenuItem(value: 'apartment', child: Text('Apartment')),
          const DropdownMenuItem(value: 'house', child: Text('House')),
          const DropdownMenuItem(value: 'studio', child: Text('Studio')),
          const DropdownMenuItem(value: 'villa', child: Text('Villa')),
        ], (v) => setState(() => _typeFilter = v ?? 'all'))),
        const SizedBox(width: 8),
        Expanded(child: _filterDropdown('Sort', _sortBy, [
          const DropdownMenuItem(value: 'listedDate', child: Text('Recent')),
          const DropdownMenuItem(value: 'price-low', child: Text('Low → High')),
          const DropdownMenuItem(value: 'price-high', child: Text('High → Low')),
        ], (v) => setState(() => _sortBy = v ?? 'listedDate'))),
      ]),
    ],
  );

  Widget _filterDropdown<T>(String label, T value, List<DropdownMenuItem<T>> items, ValueChanged<T?> onChanged) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: const TextStyle(color: kSlate500, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.8)),
      const SizedBox(height: 4),
      Container(
        decoration: BoxDecoration(
          color: kWhite,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: kBorder),
        ),
        child: DropdownButtonHideUnderline(child: DropdownButton<T>(
          value: value,
          isExpanded: true,
          dropdownColor: kWhite,
          style: const TextStyle(color: kSlate800, fontSize: 13),
          items: items,
          onChanged: onChanged,
          icon: const Icon(Icons.keyboard_arrow_down, color: kSlate400, size: 18),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        )),
      ),
    ],
  );

  Widget _emptyState() => Padding(
    padding: const EdgeInsets.symmetric(vertical: 64),
    child: Center(child: Column(children: [
      Container(
        width: 56, height: 56,
        decoration: BoxDecoration(
          color: kSlate200, borderRadius: BorderRadius.circular(14)),
        child: const Icon(Icons.home_work_outlined, color: kSlate400, size: 26)),
      const SizedBox(height: 12),
      const Text('No properties found.',
        style: TextStyle(color: kSlate500, fontSize: 13)),
      const SizedBox(height: 4),
      const Text('Try adjusting your filters or add your first property',
        style: TextStyle(color: kSlate400, fontSize: 12)),
    ])),
  );

  Widget _buildPropertyCard(Map<String, dynamic> property) {
    final title = property['title'] as String? ?? 'Property';
    final location = property['location'] as String? ?? '';
    final price = property['price'];
    final bedrooms = property['bedrooms'];
    final bathrooms = property['bathrooms'];
    final area = property['area'];
    final available = property['available'] as bool?;
    final images = property['images'] as List?;
    final tenant = property['tenant'] as Map<String, dynamic>?;
    final propertyId = property['id'] as int?;
    final currentImageIndex = _carouselStates[propertyId ?? 0] ?? 0;

    return Container(
      decoration: BoxDecoration(
        color: kCardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image Section with Carousel
          Stack(
            children: [
              Container(
                height: 160,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: kSlate100,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
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
                                      child: Icon(Icons.home_work_outlined, color: kSlate300, size: 48),
                                    ),
                                  )
                                : const Center(child: Icon(Icons.home_work_outlined, color: kSlate300, size: 48));
                          },
                        )
                      : const Center(child: Icon(Icons.home_work_outlined, color: kSlate300, size: 48)),
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
                        width: 6, height: 6,
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        decoration: BoxDecoration(
                          color: currentImageIndex == index ? kSlate800 : Colors.white.withOpacity(0.6),
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
                      color: kSlate800,
                      icon: Icons.edit,
                      iconColor: kWhite,
                      onPressed: () => _handleEditProperty(property),
                    ),
                    const SizedBox(width: 8),
                    _OverlayButton(
                      color: kDanger,
                      icon: Icons.delete,
                      iconColor: Colors.white,
                      onPressed: () => _handleDeleteProperty(propertyId ?? 0, title),
                    ),
                  ],
                ),
              ),
            ],
          ),
          // Content Section
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  title,
                  style: const TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w700),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
                const SizedBox(height: 4),
                // Location
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 12, color: kSlate400),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        location,
                        style: const TextStyle(color: kSlate500, fontSize: 12),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Features row
                Row(
                  children: [
                    if (bedrooms != null) ...[
                      const Icon(Icons.bed_outlined, size: 12, color: kSlate400),
                      const SizedBox(width: 3),
                      Text('$bedrooms bd', style: const TextStyle(color: kSlate500, fontSize: 11)),
                      const SizedBox(width: 8),
                    ],
                    if (bathrooms != null) ...[
                      const Icon(Icons.bathtub_outlined, size: 12, color: kSlate400),
                      const SizedBox(width: 3),
                      Text('$bathrooms ba', style: const TextStyle(color: kSlate500, fontSize: 11)),
                      const SizedBox(width: 8),
                    ],
                    if (area != null) ...[
                      const Icon(Icons.square_foot, size: 12, color: kSlate400),
                      const SizedBox(width: 3),
                      Text('${area}m²', style: const TextStyle(color: kSlate500, fontSize: 11)),
                    ],
                  ],
                ),
                // Tenant Info
                if (tenant != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: kInfoBg,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: kInfo.withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.person_outline, size: 12, color: kInfo),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '${tenant['firstName'] ?? ''} ${tenant['lastName'] ?? ''}'.trim(),
                            style: const TextStyle(color: kSlate700, fontSize: 11),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                // Price row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _formatCurrency(price),
                      style: const TextStyle(color: kSlate800, fontSize: 16, fontWeight: FontWeight.w800),
                    ),
                    Text('/ month', style: const TextStyle(color: kSlate400, fontSize: 11)),
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

// ════════════════════════════════════════════════════════════
// Sub-widgets (matching dashboard)
// ════════════════════════════════════════════════════════════

// Stat data holder
class _StatItem {
  final String value, label;
  final IconData icon;
  final Color accent, bg;
  const _StatItem({
    required this.value, required this.label,
    required this.icon,  required this.accent, required this.bg});
}

// Stat card — horizontal scrollable
class _StatCard2 extends StatelessWidget {
  final _StatItem item;
  const _StatCard2({required this.item});

  @override
  Widget build(BuildContext context) => Container(
    width: 110,
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(
      color: kCardBg,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: kBorder)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Container(
        width: 28, height: 28,
        decoration: BoxDecoration(
          color: item.bg, borderRadius: BorderRadius.circular(7)),
        child: Icon(item.icon, color: item.accent, size: 14)),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(item.value,
          style: const TextStyle(color: kSlate800, fontSize: 16,
            fontWeight: FontWeight.w800, letterSpacing: -0.3),
          maxLines: 1, overflow: TextOverflow.ellipsis),
        const SizedBox(height: 1),
        Text(item.label,
          style: const TextStyle(color: kSlate500, fontSize: 10)),
      ]),
    ]),
  );
}

// Property card — redesigned as a horizontal list item
class _PropertyCard extends StatelessWidget {
  final Map<String, dynamic> property;
  const _PropertyCard({required this.property});

  String _formatPrice(dynamic price) {
    if (price == null) return 'TZS 0';
    final double v = price is double ? price : (double.tryParse(price.toString()) ?? 0);
    if (v >= 1000000) return 'TZS ${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000)    return 'TZS ${(v / 1000).toStringAsFixed(1)}K';
    return 'TZS ${v.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final title = property['title'] as String? ?? 'Property';
    final location = property['location'] as String? ?? '';
    final price = property['price'];
    final bedrooms = property['bedrooms'];
    final bathrooms = property['bathrooms'];
    final area = property['area'];
    final available = property['available'] as bool?;
    final images = property['images'] as List?;
    final tenant = property['tenant'] as Map<String, dynamic>?;
    final propertyId = property['id'] as int?;

    return Container(
      decoration: BoxDecoration(
        color: kCardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image Section
          Stack(
            children: [
              Container(
                height: 140,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: kSlate100,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                ),
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  child: images != null && images.isNotEmpty
                      ? Image.network(
                          (images[0] as String).startsWith('http') ? images[0] as String : 'https://rental.oweru.com/storage/${images[0]}',
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const Center(
                            child: Icon(Icons.home_work_outlined, color: kSlate300, size: 40),
                          ),
                        )
                      : const Center(child: Icon(Icons.home_work_outlined, color: kSlate300, size: 40)),
                ),
              ),
              // Status Badge
              Positioned(
                top: 8, right: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: (available == true ? kSuccess : kInfo).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: (available == true ? kSuccess : kInfo).withOpacity(0.3)),
                  ),
                  child: Text(
                    available == true ? 'AVAILABLE' : 'RENTED',
                    style: TextStyle(
                      color: available == true ? kSuccess : kInfo,
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ],
          ),
          // Content Section
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(color: kSlate800, fontSize: 13, fontWeight: FontWeight.w700),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 11, color: kSlate400),
                    const SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        location,
                        style: const TextStyle(color: kSlate500, fontSize: 11),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (bedrooms != null) ...[
                      const Icon(Icons.bed_outlined, size: 11, color: kSlate400),
                      const SizedBox(width: 3),
                      Text('$bedrooms bd', style: const TextStyle(color: kSlate500, fontSize: 10)),
                      const SizedBox(width: 8),
                    ],
                    if (bathrooms != null) ...[
                      const Icon(Icons.bathtub_outlined, size: 11, color: kSlate400),
                      const SizedBox(width: 3),
                      Text('$bathrooms ba', style: const TextStyle(color: kSlate500, fontSize: 10)),
                      const SizedBox(width: 8),
                    ],
                    if (area != null) ...[
                      const Icon(Icons.square_foot, size: 11, color: kSlate400),
                      const SizedBox(width: 3),
                      Text('${area}m²', style: const TextStyle(color: kSlate500, fontSize: 10)),
                    ],
                  ],
                ),
                if (tenant != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: kInfoBg,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: kInfo.withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.person_outline, size: 11, color: kInfo),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '${tenant['firstName'] ?? ''} ${tenant['lastName'] ?? ''}'.trim(),
                            style: const TextStyle(color: kSlate700, fontSize: 10),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _formatPrice(price),
                      style: const TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w800),
                    ),
                    Text('/ month', style: const TextStyle(color: kSlate400, fontSize: 10)),
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