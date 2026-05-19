// ============================================================
// landlord_properties.dart — My Properties page
// ============================================================
import 'package:flutter/material.dart';
import 'landlord_theme.dart';
import 'landlord_add_property.dart';

class LandlordPropertiesPage extends StatefulWidget {
  const LandlordPropertiesPage({super.key});
  @override
  State<LandlordPropertiesPage> createState() => _LandlordPropertiesPageState();
}

class _LandlordPropertiesPageState extends State<LandlordPropertiesPage> {
  final List<Property> _properties = [];
  bool _loading = true;                  
  String _error = '';
  String _search = '';
  String _statusFilter = 'all';
  String _typeFilter = 'all';                
  String _sortBy = 'listedDate';
  late final TextEditingController _searchController;      

final Map<int, int> _carouselStates = {};

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: _search);
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = '';
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _loading = false;
      // For now, empty list - will be populated from API
    });
  }

  List<Property> get _filteredProperties {
    var filtered = _properties.where((p) {
      final matchesSearch = p.title.toLowerCase().contains(_search.toLowerCase()) ||
                           p.location.toLowerCase().contains(_search.toLowerCase());
      final matchesStatus = _statusFilter == 'all' || p.status == _statusFilter;
      final matchesType = _typeFilter == 'all' || p.type == _typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    }).toList();

    // Sort
    switch (_sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price.compareTo(b.price));
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price.compareTo(a.price));
        break;
      case 'listedDate':
      default:
        filtered.sort((a, b) => b.listedDate.compareTo(a.listedDate));
    }

    return filtered;
  }

  PropertyStats get _stats => PropertyStats(
    total: _properties.length,
    available: _properties.where((p) => p.status == 'available').length,
    rented: _properties.where((p) => p.status == 'rented').length,
    maintenance: _properties.where((p) => p.status == 'maintenance').length,
    monthlyRevenue: _properties.fold(0, (sum, p) => sum + (p.status == 'rented' ? p.price : 0)),
  );

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    appBar: AppBar(
      backgroundColor: kBg2,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_rounded, color: kGold),
        onPressed: () => Navigator.pop(context),
      ),
      title: const Text('My Properties',
        style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600)),
      actions: [
        IconButton(
          icon: const Icon(Icons.add_rounded, color: kGold),
          onPressed: () {
            Navigator.push(context, MaterialPageRoute(
              builder: (context) => const LandlordAddPropertyPage(),
            ));
          },
        ),
      ],
    ),
    body: _loading ? _buildLoading() : _buildContent(),
  );

  Widget _buildLoading() => const Center(
    child: CircularProgressIndicator(color: kGold),
  );

  Widget _buildContent() => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      // Stats
      Row(children: [
        _StatCard(label: 'Total', value: '${_stats.total}', color: kGold),
        const SizedBox(width: 12),
        _StatCard(label: 'Available', value: '${_stats.available}', color: kSuccess),
        const SizedBox(width: 12),
        _StatCard(label: 'Rented', value: '${_stats.rented}', color: kInfo),
      ]),
      const SizedBox(height: 12),
      Row(children: [
        _StatCard(label: 'Maintenance', value: '${_stats.maintenance}', color: kWarning),
        const SizedBox(width: 12),
        Expanded(child: _StatCard(label: 'Revenue', value: _formatCurrency(_stats.monthlyRevenue), color: kGold)),
      ]),
      const SizedBox(height: 20),

      // Filters
      LCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: TextField(
            controller: _searchController,
            onChanged: (v) => setState(() => _search = v),
            style: TextStyle(color: kCream, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Search properties...',
              hintStyle: TextStyle(color: kSlate, fontSize: 12),
              prefixIcon: Icon(Icons.search_rounded, color: kSlate, size: 20),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: kBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: kBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: kGold),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
          )),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _FilterDropdown(
            label: 'Status',
            value: _statusFilter,
            options: const ['all', 'available', 'rented', 'maintenance'],
            onChanged: (v) => setState(() => _statusFilter = v),
          )),
          const SizedBox(width: 8),
          Expanded(child: _FilterDropdown(
            label: 'Type',
            value: _typeFilter,
            options: const ['all', 'apartment', 'house', 'studio', 'villa'],
            onChanged: (v) => setState(() => _typeFilter = v),
          )),
          const SizedBox(width: 8),
          Expanded(child: _FilterDropdown(
            label: 'Sort',
            value: _sortBy,
            options: const ['listedDate', 'price-low', 'price-high'],
            onChanged: (v) => setState(() => _sortBy = v),
          )),
        ]),
      ])),
      const SizedBox(height: 20),

      // Property list
      if (_properties.isEmpty) ...[
        LEmptyState(
          icon: Icons.home_work_rounded,
          title: 'No properties found',
          subtitle: 'Add your first property to start managing your portfolio.',
        ),
      ] else if (_filteredProperties.isEmpty) ...[
        LCard(child: Padding(
          padding: const EdgeInsets.all(20),
          child: Center(child: Text('No properties matched your filters.',
            style: TextStyle(color: kSlate, fontSize: 13))),
        )),
      ] else ...[
        ..._filteredProperties.map((property) => _PropertyCard(
          property: property,
          carouselIndex: _carouselStates[property.id] ?? 0,
          onCarouselChange: (index) => setState(() => _carouselStates[property.id] = index),
        )),
      ],
    ],
  );

  String _formatCurrency(int amount) {
    if (amount >= 1000000) {
      return 'TZS ${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return 'TZS ${(amount / 1000).toStringAsFixed(0)}K';
    }
    return 'TZS $amount';
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) => Expanded(child: LCard(child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label.toUpperCase(), style: TextStyle(color: color, fontSize: 10, letterSpacing: 1)),
      const SizedBox(height: 8),
      Text(value, style: TextStyle(color: kCream, fontSize: 24, fontWeight: FontWeight.w700)),
    ],
  )));
}

class _FilterDropdown extends StatelessWidget {
  final String label;
  final String value;
  final List<String> options;
  final ValueChanged<String> onChanged;
  const _FilterDropdown({
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(label, style: TextStyle(color: kSlate, fontSize: 10)),
    const SizedBox(height: 4),
    DropdownButtonFormField<String>(
      value: value,
      dropdownColor: kBg2,
      style: TextStyle(color: kCream, fontSize: 12),
      decoration: InputDecoration(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: kBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: kBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: kGold),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      ),
      items: options.map((opt) => DropdownMenuItem(
        value: opt,
        child: Text(opt == 'all' ? 'All' : opt[0].toUpperCase() + opt.substring(1),
          style: TextStyle(color: kCream, fontSize: 12)),
      )).toList(),
      onChanged: (v) => onChanged(v ?? 'all'),
    ),
  ]);
}

class _PropertyCard extends StatelessWidget {
  final Property property;
  final int carouselIndex;
  final ValueChanged<int> onCarouselChange;
  const _PropertyCard({
    required this.property,
    required this.carouselIndex,
    required this.onCarouselChange,
  });

  @override
  Widget build(BuildContext context) => LCard(
    padding: EdgeInsets.zero,
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Image carousel
      Stack(children: [
        Container(
          height: 180,
          decoration: BoxDecoration(
            color: kGoldDim,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
          ),
          child: property.images.isNotEmpty
            ? PageView.builder(
                itemCount: property.images.length,
                onPageChanged: onCarouselChange,
                itemBuilder: (context, index) => Image.network(
                  property.images[index],
                  fit: BoxFit.cover,
                  errorBuilder: (c, e, s) => Center(
                    child: Icon(Icons.home_work_rounded, color: kGold.withOpacity(0.5), size: 48),
                  ),
                ),
              )
            : Center(child: Icon(Icons.home_work_rounded, color: kGold.withOpacity(0.5), size: 48)),
        ),
        // Status badge
        Positioned(top: 12, right: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: _getStatusColor(property.status).withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _getStatusColor(property.status).withOpacity(0.3)),
            ),
            child: Text(property.status.toUpperCase(),
              style: TextStyle(color: _getStatusColor(property.status), fontSize: 10, fontWeight: FontWeight.w600)),
          )),
        // Action buttons
        Positioned(top: 12, left: 12,
          child: Row(children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(color: kGold, borderRadius: BorderRadius.circular(8)),
              child: Icon(Icons.edit_rounded, color: kBg, size: 16),
            ),
            const SizedBox(width: 8),
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(color: kDanger, borderRadius: BorderRadius.circular(8)),
              child: Icon(Icons.delete_rounded, color: kBg, size: 16),
            ),
          ])),
        // Carousel indicators
        if (property.images.length > 1)
          Positioned(bottom: 12, left: 0, right: 0,
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              ...List.generate(property.images.length, (i) => Container(
                width: 6, height: 6,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                decoration: BoxDecoration(
                  color: carouselIndex == i ? kGold : kSlate.withOpacity(0.5),
                  shape: BoxShape.circle,
                ),
              )),
            ])),
      ]),
      // Details
      Padding(padding: const EdgeInsets.all(16), child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(property.title, style: TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Row(children: [
            Icon(Icons.location_on_rounded, color: kSlate, size: 14),
            const SizedBox(width: 4),
            Expanded(child: Text(property.location, style: TextStyle(color: kSlate, fontSize: 12))),
          ]),
          const SizedBox(height: 8),
          Row(children: [
            Icon(Icons.bed_rounded, color: kSlate, size: 14),
            const SizedBox(width: 4),
            Text('${property.bedrooms}', style: TextStyle(color: kSlate, fontSize: 12)),
            const SizedBox(width: 12),
            Icon(Icons.bathtub_rounded, color: kSlate, size: 14),
            const SizedBox(width: 4),
            Text('${property.bathrooms}', style: TextStyle(color: kSlate, fontSize: 12)),
            const SizedBox(width: 12),
            Icon(Icons.square_foot_rounded, color: kSlate, size: 14),
            const SizedBox(width: 4),
            Text('${property.area}m²', style: TextStyle(color: kSlate, fontSize: 12)),
          ]),
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('TZS ${property.price.toString()}', style: TextStyle(color: kGold, fontSize: 18, fontWeight: FontWeight.w700)),
            Text('/month', style: TextStyle(color: kSlate, fontSize: 11)),
          ]),
        ],
      )),
    ]),
  );

  Color _getStatusColor(String status) {
    switch (status) {
      case 'available': return kSuccess;
      case 'rented': return kInfo;
      case 'maintenance': return kWarning;
      default: return kSlate;
    }
  }
}

class Property {
  final int id;
  final String title;
  final String location;
  final int price;
  final String type;
  final int bedrooms;
  final int bathrooms;
  final int area;
  final String status;
  final DateTime listedDate;
  final List<String> images;

  Property({
    required this.id,
    required this.title,
    required this.location,
    required this.price,
    required this.type,
    required this.bedrooms,
    required this.bathrooms,
    required this.area,
    required this.status,
    required this.listedDate,
    this.images = const [],
  });
}

class PropertyStats {
  final int total;
  final int available;
  final int rented;
  final int maintenance;
  final int monthlyRevenue;

  PropertyStats({
    required this.total,
    required this.available,
    required this.rented,
    required this.maintenance,
    required this.monthlyRevenue,
  });
}
