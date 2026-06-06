import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../home/presentation/pages/home_page.dart';

// ==================== COLOR CONSTANTS ====================
const Color kBg = Color(0xFFF8FAFC);
const Color kBg2 = Color(0xFF1E293B);
const Color kSurface = Color(0xFFFFFFFF);
const Color kCream = Color(0xFFF8FAFC);
const Color kGold = Color(0xFF1E293B);
const Color kGoldBorder = Color(0xFFFFD54F);
const Color kSlate800 = Color(0xFF1E293B);
const Color kSlate600 = Color(0xFF475569);
const Color kSlate400 = Color(0xFF94A3B8);
const Color kSlate200 = Color(0xFFE2E8F0);
const Color kSlate100 = Color(0xFFF1F5F9);
const String kStorageBase = 'https://rental.oweru.com';
const String kApiBase = 'https://rental.oweru.com/api';
// =======================================================

class PublicPropertyDetailPage extends StatefulWidget {
  final Map<String, dynamic> property;
  const PublicPropertyDetailPage({super.key, required this.property});

  @override
  State<PublicPropertyDetailPage> createState() => _PublicPropertyDetailPageState();
}

class _PublicPropertyDetailPageState extends State<PublicPropertyDetailPage> {
  int _selectedImageIndex = 0;
  late PageController _pageController;
  bool _showBookingForm = false;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  // Authentication check and navigation to login
  void _handleApplyProperty() {
    // Check if user is logged in (using SharedPreferences would be ideal)
    // For now, always redirect to login to match frontend behavior
    Navigator.of(context).pushNamed('/login');
  }

  // Image resolution logic (same as home_page.dart)
  String resolveStoragePath(String? path) {
    if (path == null || path.trim().isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final clean = path.replaceFirst(RegExp(r'^/+'), '');
    if (clean.startsWith('storage/')) return '$kStorageBase/$clean';
    return '$kStorageBase/storage/$clean';
  }

  String getImage(Map<String, dynamic> p) {
    for (final key in ['propertyImages', 'property_images']) {
      final ci = p[key];
      if (ci is List && ci.isNotEmpty) {
        final img = ci.firstWhere(
            (i) => i['is_primary'] == 1 || i['is_primary'] == true,
            orElse: () => ci[0]);
        final path = img['image_path'] ?? img['path'] ?? '';
        if (path.toString().isNotEmpty) return resolveStoragePath(path.toString());
      }
    }
    var imgs = p['images'];
    if (imgs is String) {
      try { imgs = jsonDecode(imgs); } catch (_) { imgs = null; }
    }
    if (imgs is List && imgs.isNotEmpty) {
      final first = imgs[0];
      if (first is String && first.trim().isNotEmpty) return resolveStoragePath(first);
      final path = first['path'] ?? first['image_path'] ?? first['url'] ?? first['src'] ?? '';
      if (path.toString().isNotEmpty) return resolveStoragePath(path.toString());
    }
    return '';
  }

  List<String> get _images {
    final property = widget.property;
    final imgs = <String>[];
    
    // Try propertyImages/property_images first
    for (final key in ['propertyImages', 'property_images']) {
      final ci = property[key];
      if (ci is List && ci.isNotEmpty) {
        for (final img in ci) {
          final path = img['image_path'] ?? img['path'] ?? '';
          if (path.toString().isNotEmpty) {
            imgs.add(resolveStoragePath(path.toString()));
          }
        }
      }
    }
    
    // Then try images
    if (imgs.isEmpty) {
      var imageList = property['images'];
      if (imageList is String) {
        try { imageList = jsonDecode(imageList); } catch (_) { imageList = null; }
      }
      if (imageList is List && imageList.isNotEmpty) {
        for (final item in imageList) {
          if (item is String && item.trim().isNotEmpty) {
            imgs.add(resolveStoragePath(item));
          } else if (item is Map) {
            final path = item['path'] ?? item['image_path'] ?? item['url'] ?? item['src'] ?? '';
            if (path.toString().isNotEmpty) {
              imgs.add(resolveStoragePath(path.toString()));
            }
          }
        }
      }
    }
    
    return imgs;
  }

  String get _title => widget.property['title'] ?? 'Property';
  String get _location => widget.property['location'] ?? widget.property['address'] ?? 'Location not specified';
  String get _description => widget.property['description'] ?? 'No description available';
  
  num get _price {
    final price = widget.property['price'];
    if (price is num) return price;
    if (price is String) return num.tryParse(price) ?? 0;
    return 0;
  }

  String get _type => widget.property['type'] ?? 'property';
  int? get _bedrooms => widget.property['bedrooms'];
  int? get _bathrooms => widget.property['bathrooms'];
  String? get _area => widget.property['area'];
  bool get _isBnb => _type.toLowerCase() == 'bnb' || _type.toLowerCase().contains('short');
  bool get _isFeatured => widget.property['featured'] == true || widget.property['featured'] == 1;
  bool get _isAvailable => widget.property['available'] != false;
  bool get _isFurnished => widget.property['furnished'] == true || widget.property['furnished'] == 1;

  String fmtPrice(num price) {
    return 'TZS ${price
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')
    }';
  }

  String _getTypeLabel() {
    if (_type.isEmpty) return 'Property';
    return _type[0].toUpperCase() + _type.substring(1).replaceAll('_', ' ');
  }

  List<Map<String, dynamic>> get _amenities {
    final amenities = widget.property['amenities'];
    if (amenities is List) {
      return amenities
          .map((a) => {'label': a.toString()})
          .toList();
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    final images = _images;
    final isMobile = MediaQuery.of(context).size.width < 768;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kSlate800,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: kSlate800),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          _title,
          style: const TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w600),
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.favorite_border, color: kSlate800),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.share, color: kSlate800),
            onPressed: () {},
          ),
        ],
      ),
      body: _showBookingForm
          ? _buildBookingForm()
          : SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Gallery Section
            if (images.isNotEmpty)
              _buildGallery(images)
            else
              Container(
                height: 280,
                color: kSlate100,
                child: const Center(
                  child: Icon(Icons.home_outlined, color: kSlate200, size: 48),
                ),
              ),

            // Main Content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header with title and type
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: kSlate100,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: kSlate200),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    _getTypeLabel().toUpperCase(),
                                    style: const TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.8,
                                      color: kSlate600,
                                    ),
                                  ),
                                  if (_isFeatured) ...[
                                    const SizedBox(width: 4),
                                    const Icon(Icons.star, size: 10, color: kSlate400),
                                    const Text(
                                      ' Featured',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                        color: kSlate600,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _title,
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                color: kSlate800,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        fmtPrice(_price),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: kSlate800,
                        ),
                        textAlign: TextAlign.right,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 14, color: kSlate400),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          _location,
                          style: const TextStyle(color: kSlate600, fontSize: 13),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (_isAvailable)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.1),
                            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Available',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF10B981),
                            ),
                          ),
                        ),
                      if (_isFurnished) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: kSlate800.withValues(alpha: 0.1),
                            border: Border.all(color: kSlate800.withValues(alpha: 0.3)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Furnished',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: kSlate800,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: kSlate200, height: 1),
                  const SizedBox(height: 16),

                  // Key Stats
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      if (_bedrooms != null)
                        _StatBox(
                          icon: Icons.bed_outlined,
                          value: '$_bedrooms',
                          label: 'Bedrooms',
                        ),
                      if (_bathrooms != null)
                        _StatBox(
                          icon: Icons.bathtub_outlined,
                          value: '$_bathrooms',
                          label: 'Bathrooms',
                        ),
                      if (_area != null)
                        _StatBox(
                          icon: Icons.square_foot_outlined,
                          value: _area!,
                          label: 'm²',
                        ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Description
                  if (_description.isNotEmpty) ...[
                    const Text(
                      'About this property',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: kSlate800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _description,
                      style: const TextStyle(
                        fontSize: 13,
                        color: kSlate600,
                        height: 1.6,
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Amenities
                  if (_amenities.isNotEmpty) ...[
                    const Text(
                      'Amenities & Features',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: kSlate800,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _amenities.map((a) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: kSlate100,
                            border: Border.all(color: kSlate200),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.check_circle_outline, size: 12, color: Color(0xFF10B981)),
                              const SizedBox(width: 5),
                              Text(
                                a['label'],
                                style: const TextStyle(fontSize: 11, color: kSlate600),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // CTA Buttons
                  if (_isBnb)
                    GestureDetector(
                      onTap: () => setState(() => _showBookingForm = true),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          color: kSlate800,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Book Now',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: kSlate100,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    )
                  else
                    GestureDetector(
                      onTap: () => _handleApplyProperty(),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          color: kSlate800,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Apply for this Property',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: kSlate100,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  const SizedBox(height: 10),
                  GestureDetector(
                    onTap: () {},
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: kSlate200),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text(
                        'Save Property',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: kSlate600,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  GestureDetector(
                    onTap: () {},
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: kSlate200),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text(
                        'Schedule a Viewing',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: kSlate600,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Location Card
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      border: Border.all(color: kSlate200),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 14, color: kSlate800),
                            const SizedBox(width: 6),
                            const Text(
                              'Location',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                                color: kSlate600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _location,
                          style: const TextStyle(
                            fontSize: 13,
                            color: kSlate800,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Trust Row
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      border: Border.all(color: kSlate200),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ...['Verified Listing', 'Secure Application Process', 'Tenant Support 24/7']
                            .map((item) => Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                children: [
                                  const Icon(Icons.check_circle_outline, size: 12, color: kSlate800),
                                  const SizedBox(width: 8),
                                  Text(
                                    item,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: kSlate600,
                                    ),
                                  ),
                                ],
                              ),
                            ))
                            ,
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGallery(List<String> images) {
    return Stack(
      children: [
        SizedBox(
          height: 300,
          width: double.infinity,
          child: PageView.builder(
            controller: _pageController,
            itemCount: images.length,
            onPageChanged: (index) => setState(() => _selectedImageIndex = index),
            itemBuilder: (context, index) => Image.network(
              images[index],
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => Container(
                color: kSlate100,
                child: const Center(
                  child: Icon(Icons.home_outlined, color: kSlate200, size: 48),
                ),
              ),
            ),
          ),
        ),
        // Featured Badge
        if (_isFeatured)
          Positioned(
            top: 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: kSlate800,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'Featured',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: kSlate200,
                  letterSpacing: 1.2,
                ),
              ),
            ),
          ),
        // Image Counter
        if (images.length > 1)
          Positioned(
            bottom: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: kSlate800.withValues(alpha: 0.8),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.camera_alt_outlined, size: 12, color: kSlate100),
                  const SizedBox(width: 5),
                  Text(
                    '${_selectedImageIndex + 1} / ${images.length}',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: kSlate100,
                    ),
                  ),
                ],
              ),
            ),
          ),
        // Prev/Next Buttons
        if (images.length > 1) ...[
          Positioned(
            left: 12,
            top: 50,
            child: GestureDetector(
              onTap: () {
                _pageController.previousPage(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                );
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: kSlate800.withValues(alpha: 0.7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.chevron_left, color: kSlate100, size: 20),
              ),
            ),
          ),
          Positioned(
            right: 12,
            top: 50,
            child: GestureDetector(
              onTap: () {
                _pageController.nextPage(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                );
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: kSlate800.withValues(alpha: 0.7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.chevron_right, color: kSlate100, size: 20),
              ),
            ),
          ),
        ],
        // Thumbnail Indicators
        if (images.length > 1)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
              color: kSlate800.withValues(alpha: 0.9),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: List.generate(
                    images.length,
                    (i) => GestureDetector(
                      onTap: () {
                        _pageController.animateToPage(i,
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut);
                      },
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          width: 50,
                          height: 40,
                          margin: const EdgeInsets.only(right: 6),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: _selectedImageIndex == i ? kSlate200 : kSlate400,
                              width: _selectedImageIndex == i ? 2 : 1,
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Image.network(
                            images[i],
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => const Icon(Icons.home_outlined, size: 16, color: kSlate400),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildBookingForm() {
    return _BookingFormWidget(
      property: widget.property,
      onClose: () => setState(() => _showBookingForm = false),
      onSuccess: () {
        setState(() => _showBookingForm = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking submitted! The owner will contact you soon.')),
        );
      },
    );
  }
}

class _FeatureIcon extends StatelessWidget {
  final IconData icon;
  final String label;

  const _FeatureIcon({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: kSlate800, size: 16),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(color: kSlate600, fontSize: 12),
        ),
      ],
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// STAT BOX
// ═════════════════════════════════════════════════════════════════════════════
class _StatBox extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  const _StatBox({
    required this.icon,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
      decoration: BoxDecoration(
        color: kSlate100,
        border: Border.all(color: kSlate200),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        children: [
          Icon(icon, size: 16, color: kSlate800),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: kSlate800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: kSlate600,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// BOOKING FORM WIDGET
// ═════════════════════════════════════════════════════════════════════════════
class _BookingFormWidget extends StatefulWidget {
  final Map<String, dynamic> property;
  final VoidCallback onClose;
  final VoidCallback onSuccess;

  const _BookingFormWidget({
    required this.property,
    required this.onClose,
    required this.onSuccess,
  });

  @override
  State<_BookingFormWidget> createState() => _BookingFormWidgetState();
}

class _BookingFormWidgetState extends State<_BookingFormWidget> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _reqCtrl = TextEditingController();
  DateTime? _checkIn, _checkOut;
  bool _loading = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _reqCtrl.dispose();
    super.dispose();
  }

  int get _nights {
    if (_checkIn == null || _checkOut == null) return 0;
    return _checkOut!.difference(_checkIn!).inDays;
  }

  Future<void> _submit() async {
    if (_nameCtrl.text.isEmpty || _emailCtrl.text.isEmpty || _phoneCtrl.text.isEmpty ||
        _checkIn == null || _checkOut == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all required fields')),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      final price = num.tryParse(widget.property['price']?.toString() ?? '0') ?? 0;
      final res = await http.post(
        Uri.parse('$kApiBase/public/bnb/book'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'property_id': widget.property['id'],
          'customer_name': _nameCtrl.text,
          'customer_email': _emailCtrl.text,
          'customer_phone': _phoneCtrl.text,
          'check_in': _checkIn?.toIso8601String(),
          'check_out': _checkOut?.toIso8601String(),
          'special_requests': _reqCtrl.text,
          'total_amount': _nights * price,
          'status': 'pending',
        }),
      );
      
      if (mounted) {
        if (res.statusCode == 200 || res.statusCode == 201) {
          widget.onSuccess();
        } else {
          final d = jsonDecode(res.body);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(d['message'] ?? 'Booking failed')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Network error. Please try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  InputDecoration _inp(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: kSlate400, fontSize: 13),
    filled: true,
    fillColor: kSlate100,
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: kSlate200),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: kSlate200),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: kSlate800),
    ),
  );

  Widget _datePicker(String label, DateTime? value, VoidCallback onTap) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: kSlate100,
        border: Border.all(color: kSlate200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          const Icon(Icons.calendar_today_outlined, size: 13, color: kSlate400),
          const SizedBox(width: 8),
          Text(
            value == null ? label : '${value.day}/${value.month}/${value.year}',
            style: TextStyle(
              fontSize: 13,
              color: value == null ? kSlate400 : kSlate800,
            ),
          ),
        ],
      ),
    ),
  );

  Future<DateTime?> _pickDate(DateTime first) => showDatePicker(
    context: context,
    initialDate: first,
    firstDate: first,
    lastDate: DateTime.now().add(const Duration(days: 365)),
  );

  String fmtPrice(num price) {
    return 'TZS ${price.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')
    }';
  }

  @override
  Widget build(BuildContext context) {
    final price = num.tryParse(widget.property['price']?.toString() ?? '0') ?? 0;

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Book Stay',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: kSlate800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.property['title'] ?? '',
                        style: const TextStyle(fontSize: 13, color: kSlate600),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: widget.onClose,
                  child: const Icon(Icons.close, color: kSlate600, size: 20),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Divider(color: kSlate200, height: 1),
            const SizedBox(height: 20),
            TextField(
              controller: _nameCtrl,
              style: const TextStyle(color: kSlate800, fontSize: 13),
              decoration: _inp('Your name'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              style: const TextStyle(color: kSlate800, fontSize: 13),
              decoration: _inp('Email address'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              style: const TextStyle(color: kSlate800, fontSize: 13),
              decoration: _inp('Phone number'),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _datePicker('Check-in', _checkIn, () async {
                    final d = await _pickDate(DateTime.now());
                    if (d != null) setState(() => _checkIn = d);
                  }),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _datePicker('Check-out', _checkOut, () async {
                    final d = await _pickDate(_checkIn ?? DateTime.now());
                    if (d != null) setState(() => _checkOut = d);
                  }),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _reqCtrl,
              maxLines: 3,
              style: const TextStyle(color: kSlate800, fontSize: 13),
              decoration: _inp('Special requests (optional)'),
            ),
            if (_nights > 0) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: kSlate100,
                  border: Border.all(color: kSlate200),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      fmtPrice(_nights * price),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: kSlate800,
                      ),
                    ),
                    Text(
                      '$_nights night${_nights != 1 ? 's' : ''}',
                      style: const TextStyle(fontSize: 12, color: kSlate600),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: widget.onClose,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      decoration: BoxDecoration(
                        border: Border.all(color: kSlate200),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Cancel',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 13, color: kSlate600),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: GestureDetector(
                    onTap: _loading ? null : _submit,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      decoration: BoxDecoration(
                        color: _loading ? kSlate800.withValues(alpha: 0.6) : kSlate800,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _loading ? 'Submitting…' : 'Book Now',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: kSlate100,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}