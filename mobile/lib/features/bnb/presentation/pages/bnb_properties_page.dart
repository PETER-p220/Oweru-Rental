import 'package:flutter/material.dart';
import '../../../shared/services/bnb_api_service.dart';

const Color kGold = Color(0xFFC89128);
const Color kBg = Color(0xFF0A0F1E);
const Color kBg2 = Color(0xFF0F172A);
const Color kBg3 = Color(0xFF162035);
const Color kCream = Color(0xFFF1F5F9);
const Color kSlate = Color(0xFF94A3B8);
const Color kBorder = Color(0x26C89128);

class BnbPropertiesPage extends StatefulWidget {
  const BnbPropertiesPage({super.key});

  @override
  State<BnbPropertiesPage> createState() => _BnbPropertiesPageState();
}

class _BnbPropertiesPageState extends State<BnbPropertiesPage> {
  List<Map<String, dynamic>> _properties = [];
  bool _isLoading = true;
  String _error = '';
  String _searchQuery = '';
  String _statusFilter = 'all';

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
      final properties = await BnbApiService.getProperties();
      setState(() {
        _properties = properties;
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

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'available':
        return const Color(0xFF10B981);
      case 'occupied':
        return const Color(0xFFEF4444);
      case 'maintenance':
        return const Color(0xFFF59E0B);
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
        title: const Text('BNB Properties', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
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
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: 'Search properties...',
                          hintStyle: const TextStyle(color: kSlate),
                          filled: true,
                          fillColor: kBg3,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          prefixIcon: const Icon(Icons.search, color: kSlate, size: 20),
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
                    _buildFilterChip('All', 'all'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Available', 'available'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Occupied', 'occupied'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Maintenance', 'maintenance'),
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
                                const Icon(Icons.home_work_outlined, size: 48, color: kSlate),
                                const SizedBox(height: 16),
                                const Text('No properties found', style: TextStyle(color: kCream, fontSize: 16)),
                                const SizedBox(height: 8),
                                const Text('Start by adding your first listing', style: TextStyle(color: kSlate, fontSize: 13)),
                                const SizedBox(height: 16),
                                ElevatedButton(
                                  onPressed: () => _showAddPropertyDialog(),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: kGold,
                                    foregroundColor: kBg,
                                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  child: const Text('Add Property', style: TextStyle(fontWeight: FontWeight.w600)),
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

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _statusFilter == value;
    return InkWell(
      onTap: () => setState(() => _statusFilter = value),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? kGold : kBg3,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? kGold : kBorder),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? kBg : kSlate,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }

  Widget _buildPropertyCard(Map<String, dynamic> property) {
    final title = property['title'] as String? ?? 'Untitled';
    final location = property['location'] as String? ?? 'No location';
    final price = property['price'];
    final bedrooms = property['bedrooms'] ?? 1;
    final bathrooms = property['bathrooms'] ?? 1;
    final maxGuests = property['bnb_details']?['max_guests'] ?? property['max_guests'] ?? 2;
    final status = property['status'] as String? ?? 'available';
    final averageRating = property['average_rating'];
    final images = property['images'] as List?;
    final imageUrl = images != null && images.isNotEmpty ? images[0] as String? : null;
    final description = property['description'] as String? ?? '';
    final amenities = property['bnb_details']?['amenities_bnb'] as Map<String, dynamic>? ?? {};

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: kBg2,
        borderRadius: BorderRadius.circular(16),
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
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                ),
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: imageUrl != null && imageUrl.isNotEmpty
                      ? Image.network(
                          imageUrl.startsWith('http') ? imageUrl : 'https://rental.oweru.com/storage/$imageUrl',
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const Center(
                            child: Icon(Icons.home_work_outlined, color: kSlate, size: 48),
                          ),
                        )
                      : const Center(
                          child: Icon(Icons.home_work_outlined, color: kSlate, size: 48),
                        ),
                ),
              ),
              // Status Badge
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              // Rating Badge
              if (averageRating != null)
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.star, color: kGold, size: 12),
                        const SizedBox(width: 4),
                        Text(
                          averageRating.toString(),
                          style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          // Content Section
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 14, color: kSlate),
                    const SizedBox(width: 4),
                    Expanded(child: Text(location, style: const TextStyle(color: kSlate, fontSize: 13))),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildInfoChip(Icons.bed, '$bedrooms bed${bedrooms != 1 ? 's' : ''}'),
                    const SizedBox(width: 12),
                    _buildInfoChip(Icons.bathtub, '$bathrooms bath${bathrooms != 1 ? 's' : ''}'),
                    const SizedBox(width: 12),
                    _buildInfoChip(Icons.people, '$maxGuests guests'),
                  ],
                ),
                if (amenities.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: amenities.entries
                        .where((e) => e.value == true)
                        .take(4)
                        .map((e) => _buildAmenityChip(e.key))
                        .toList(),
                  ),
                ],
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    description,
                    style: const TextStyle(color: kSlate, fontSize: 13),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_formatCurrency(price), style: const TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700)),
                        const Text('per night', style: TextStyle(color: kSlate, fontSize: 11)),
                      ],
                    ),
                    Row(
                      children: [
                        ElevatedButton(
                          onPressed: () => _showPropertyDetails(property),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF38BDF8).withValues(alpha: 0.15),
                            foregroundColor: const Color(0xFF38BDF8),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            side: BorderSide(color: const Color(0xFF38BDF8).withValues(alpha: 0.3)),
                          ),
                          child: const Text('View', style: TextStyle(fontWeight: FontWeight.w600)),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kGold.withValues(alpha: 0.15),
                            foregroundColor: kGold,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            side: BorderSide(color: kBorder),
                          ),
                          child: const Icon(Icons.edit, size: 16),
                        ),
                      ],
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

  Widget _buildInfoChip(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 14, color: kSlate),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(color: kCream, fontSize: 13)),
      ],
    );
  }

  Widget _buildAmenityChip(String amenity) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: kGold.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: kBorder),
      ),
      child: Text(
        amenity,
        style: const TextStyle(color: kGold, fontSize: 11),
      ),
    );
  }

  void _showPropertyDetails(Map<String, dynamic> property) {
    showDialog(
      context: context,
      builder: (context) => _PropertyDetailDialog(property: property),
    );
  }

  void _showAddPropertyDialog() {
    showDialog(
      context: context,
      builder: (context) => _AddPropertyDialog(onSuccess: _loadProperties),
    );
  }
}

class _PropertyDetailDialog extends StatelessWidget {
  final Map<String, dynamic> property;

  const _PropertyDetailDialog({required this.property});

  @override
  Widget build(BuildContext context) {
    final title = property['title'] as String? ?? 'Untitled';
    final location = property['location'] as String? ?? 'No location';
    final price = property['price'];
    final bedrooms = property['bedrooms'] ?? 1;
    final bathrooms = property['bathrooms'] ?? 1;
    final maxGuests = property['bnb_details']?['max_guests'] ?? property['max_guests'] ?? 2;
    final status = property['status'] as String? ?? 'available';
    final description = property['description'] as String? ?? '';
    final amenities = property['bnb_details']?['amenities_bnb'] as Map<String, dynamic>? ?? {};
    final images = property['images'] as List?;
    final imageUrl = images != null && images.isNotEmpty ? images[0] as String? : null;

    String formatCurrency(dynamic value) {
      if (value == null) return 'TZS 0';
      final double numericValue = value is double ? value : (double.tryParse(value.toString()) ?? 0);
      if (numericValue >= 1000000) {
        return 'TZS ${(numericValue / 1000000).toStringAsFixed(1)}M';
      } else if (numericValue >= 1000) {
        return 'TZS ${(numericValue / 1000).toStringAsFixed(1)}K';
      }
      return 'TZS ${numericValue.toStringAsFixed(0)}';
    }

    return Dialog(
      backgroundColor: kBg2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: 600,
        constraints: const BoxConstraints(maxHeight: 700),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: kBorder)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: const TextStyle(color: kCream, fontSize: 20, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.location_on, size: 14, color: kSlate),
                            const SizedBox(width: 4),
                            Text(location, style: const TextStyle(color: kSlate, fontSize: 13)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: kSlate),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Image
                    if (imageUrl != null && imageUrl.isNotEmpty)
                      Container(
                        height: 200,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: kBg3,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            imageUrl.startsWith('http') ? imageUrl : 'https://rental.oweru.com/storage/$imageUrl',
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => const Center(
                              child: Icon(Icons.home_work_outlined, color: kSlate, size: 48),
                            ),
                          ),
                        ),
                      ),
                    const SizedBox(height: 20),
                    // Info Grid
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 2.5,
                      children: [
                        _buildInfoItem('Price', '${formatCurrency(price)}/night'),
                        _buildInfoItem('Status', status.toUpperCase()),
                        _buildInfoItem('Bedrooms', '$bedrooms'),
                        _buildInfoItem('Bathrooms', '$bathrooms'),
                        _buildInfoItem('Max Guests', '$maxGuests'),
                        _buildInfoItem('Min Stay', '${property['bnb_details']?['min_stay'] ?? 1} nights'),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Amenities
                    if (amenities.isNotEmpty) ...[
                      const Text('Amenities', style: TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: amenities.entries
                            .where((e) => e.value == true)
                            .map((e) => _buildAmenityChip(e.key))
                            .toList(),
                      ),
                      const SizedBox(height: 20),
                    ],
                    // Description
                    const Text('Description', style: TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Text(description, style: const TextStyle(color: kCream, fontSize: 14, height: 1.6)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: kBg3,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildAmenityChip(String amenity) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: kGold.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: kBorder),
      ),
      child: Text(
        amenity,
        style: const TextStyle(color: kGold, fontSize: 13),
      ),
    );
  }
}

class _AddPropertyDialog extends StatefulWidget {
  final VoidCallback onSuccess;

  const _AddPropertyDialog({required this.onSuccess});

  @override
  State<_AddPropertyDialog> createState() => _AddPropertyDialogState();
}

class _AddPropertyDialogState extends State<_AddPropertyDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _locationController = TextEditingController();
  final _addressController = TextEditingController();
  String _propertyType = 'apartment';
  int _bedrooms = 1;
  int _bathrooms = 1;
  int _maxGuests = 2;
  int _minStay = 1;
  bool _isLoading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _locationController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await BnbApiService.createProperty({
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'price': double.tryParse(_priceController.text) ?? 0,
        'location': _locationController.text.trim(),
        'address': _addressController.text.trim(),
        'property_type': _propertyType,
        'bedrooms': _bedrooms,
        'bathrooms': _bathrooms,
        'bnb_details': {
          'max_guests': _maxGuests,
          'min_stay': _minStay,
        },
      });

      widget.onSuccess();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to create property.')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: kBg2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: 500,
        constraints: const BoxConstraints(maxHeight: 700),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: kBorder)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Add New Property', style: TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700)),
                  IconButton(
                    icon: const Icon(Icons.close, color: kSlate),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            // Form
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextFormField(
                        controller: _titleController,
                        decoration: const InputDecoration(
                          labelText: 'Title *',
                          hintText: 'e.g. Luxury Beach Villa',
                          labelStyle: TextStyle(color: kSlate),
                          hintStyle: TextStyle(color: kSlate),
                          filled: true,
                          fillColor: kBg3,
                          border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                          enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: kBorder), borderRadius: BorderRadius.all(Radius.circular(8))),
                          focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: kGold), borderRadius: BorderRadius.all(Radius.circular(8))),
                        ),
                        style: const TextStyle(color: kCream),
                        validator: (value) => (value?.trim() ?? '').isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _priceController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Price per Night (TZS) *',
                          hintText: '50000',
                          labelStyle: TextStyle(color: kSlate),
                          hintStyle: TextStyle(color: kSlate),
                          filled: true,
                          fillColor: kBg3,
                          border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                          enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: kBorder), borderRadius: BorderRadius.all(Radius.circular(8))),
                          focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: kGold), borderRadius: BorderRadius.all(Radius.circular(8))),
                        ),
                        style: const TextStyle(color: kCream),
                        validator: (value) => (value?.trim() ?? '').isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _locationController,
                        decoration: const InputDecoration(
                          labelText: 'Location *',
                          hintText: 'Dar es Salaam, Africa',
                          labelStyle: TextStyle(color: kSlate),
                          hintStyle: TextStyle(color: kSlate),
                          filled: true,
                          fillColor: kBg3,
                          border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                          enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: kBorder), borderRadius: BorderRadius.all(Radius.circular(8))),
                          focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: kGold), borderRadius: BorderRadius.all(Radius.circular(8))),
                        ),
                        style: const TextStyle(color: kCream),
                        validator: (value) => (value?.trim() ?? '').isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        initialValue: _propertyType,
                        decoration: const InputDecoration(
                          labelText: 'Property Type',
                          labelStyle: TextStyle(color: kSlate),
                          filled: true,
                          fillColor: kBg3,
                          border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                          enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: kBorder), borderRadius: BorderRadius.all(Radius.circular(8))),
                          focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: kGold), borderRadius: BorderRadius.all(Radius.circular(8))),
                        ),
                        style: const TextStyle(color: kCream),
                        items: const [
                          DropdownMenuItem(value: 'apartment', child: Text('Apartment')),
                          DropdownMenuItem(value: 'house', child: Text('House')),
                          DropdownMenuItem(value: 'villa', child: Text('Villa')),
                          DropdownMenuItem(value: 'studio', child: Text('Studio')),
                          DropdownMenuItem(value: 'condo', child: Text('Condo')),
                        ],
                        onChanged: (value) => setState(() => _propertyType = value ?? 'apartment'),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _addressController,
                        decoration: const InputDecoration(
                          labelText: 'Address *',
                          hintText: 'Full street address',
                          labelStyle: TextStyle(color: kSlate),
                          hintStyle: TextStyle(color: kSlate),
                          filled: true,
                          fillColor: kBg3,
                          border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                          enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: kBorder), borderRadius: BorderRadius.all(Radius.circular(8))),
                          focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: kGold), borderRadius: BorderRadius.all(Radius.circular(8))),
                        ),
                        style: const TextStyle(color: kCream),
                        validator: (value) => (value?.trim() ?? '').isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _descriptionController,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          labelText: 'Description *',
                          hintText: 'Describe your property...',
                          labelStyle: TextStyle(color: kSlate),
                          hintStyle: TextStyle(color: kSlate),
                          filled: true,
                          fillColor: kBg3,
                          border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                          enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: kBorder), borderRadius: BorderRadius.all(Radius.circular(8))),
                          focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: kGold), borderRadius: BorderRadius.all(Radius.circular(8))),
                        ),
                        style: const TextStyle(color: kCream),
                        validator: (value) => (value?.trim() ?? '').isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Bedrooms', style: TextStyle(color: kSlate, fontSize: 13)),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove, size: 16),
                                      onPressed: () => setState(() => _bedrooms = _bedrooms > 1 ? _bedrooms - 1 : 1),
                                      padding: EdgeInsets.zero,
                                      color: kGold,
                                    ),
                                    Text('$_bedrooms', style: const TextStyle(color: kCream, fontSize: 16)),
                                    IconButton(
                                      icon: const Icon(Icons.add, size: 16),
                                      onPressed: () => setState(() => _bedrooms++),
                                      padding: EdgeInsets.zero,
                                      color: kGold,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Bathrooms', style: TextStyle(color: kSlate, fontSize: 13)),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove, size: 16),
                                      onPressed: () => setState(() => _bathrooms = _bathrooms > 1 ? _bathrooms - 1 : 1),
                                      padding: EdgeInsets.zero,
                                      color: kGold,
                                    ),
                                    Text('$_bathrooms', style: const TextStyle(color: kCream, fontSize: 16)),
                                    IconButton(
                                      icon: const Icon(Icons.add, size: 16),
                                      onPressed: () => setState(() => _bathrooms++),
                                      padding: EdgeInsets.zero,
                                      color: kGold,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Max Guests', style: TextStyle(color: kSlate, fontSize: 13)),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove, size: 16),
                                      onPressed: () => setState(() => _maxGuests = _maxGuests > 1 ? _maxGuests - 1 : 1),
                                      padding: EdgeInsets.zero,
                                      color: kGold,
                                    ),
                                    Text('$_maxGuests', style: const TextStyle(color: kCream, fontSize: 16)),
                                    IconButton(
                                      icon: const Icon(Icons.add, size: 16),
                                      onPressed: () => setState(() => _maxGuests++),
                                      padding: EdgeInsets.zero,
                                      color: kGold,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Min Stay (nights)', style: TextStyle(color: kSlate, fontSize: 13)),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove, size: 16),
                                      onPressed: () => setState(() => _minStay = _minStay > 1 ? _minStay - 1 : 1),
                                      padding: EdgeInsets.zero,
                                      color: kGold,
                                    ),
                                    Text('$_minStay', style: const TextStyle(color: kCream, fontSize: 16)),
                                    IconButton(
                                      icon: const Icon(Icons.add, size: 16),
                                      onPressed: () => setState(() => _minStay++),
                                      padding: EdgeInsets.zero,
                                      color: kGold,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Footer
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: kBorder)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel', style: TextStyle(color: kSlate)),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kGold,
                      foregroundColor: kBg,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: _isLoading
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: kBg))
                        : const Text('Create Property', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
