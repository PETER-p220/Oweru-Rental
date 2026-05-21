import 'package:flutter/material.dart';
import '../../home/presentation/pages/home_page.dart';

// ==================== COLOR CONSTANTS ====================
const Color kBg = Color(0xFF121212);
const Color kBg2 = Color(0xFF1E1E1E);
const Color kBg3 = Color(0xFF2A2A2A);
const Color kCream = Color(0xFFF5F0E6);
const Color kGold = Color(0xFFFFC107);
const Color kGoldBorder = Color(0xFFFFD54F);
const Color kSlate = Color(0xFF94A3B8);
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

  List<String> get _images {
    final imgs = widget.property['images'];
    if (imgs is List && imgs.isNotEmpty) {
      return imgs.map((i) => i is String ? i : (i['image_path'] ?? i['url'] ?? '').toString()).toList();
    }
    return [];
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

  String fmtPrice(num price) {
    return '\$${price.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final images = _images;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: kCream),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          _title,
          style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600),
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.favorite_border, color: kGold),
            onPressed: () {},
          ),
          IconButton(
            icon: Icon(Icons.share, color: kGold),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Carousel
            if (images.isNotEmpty)
              SizedBox(
                height: 250,
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: images.length,
                  onPageChanged: (index) {
                    setState(() => _selectedImageIndex = index);
                  },
                  itemBuilder: (context, index) {
                    final img = images[index];
                    return Image.network(
                      img.startsWith('http') ? img : 'https://rental.oweru.com/storage/$img',
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => Container(
                        color: kBg3,
                        child: const Center(
                          child: Icon(Icons.apartment, color: kSlate, size: 48),
                        ),
                      ),
                    );
                  },
                ),
              )
            else
              Container(
                height: 250,
                color: kBg3,
                child: const Center(
                  child: Icon(Icons.apartment, color: kSlate, size: 48),
                ),
              ),

            // Image Indicators
            if (images.length > 1)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    images.length,
                    (index) => Container(
                      width: 8,
                      height: 8,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: _selectedImageIndex == index ? kGold : kSlate,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ),
              ),

            // Property Info
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          _title,
                          style: const TextStyle(
                            color: kCream,
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: kGold.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: kGoldBorder),
                        ),
                        child: Text(
                          _type.toUpperCase(),
                          style: const TextStyle(
                            color: kGold,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.05,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: kGold, size: 16),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          _location,
                          style: const TextStyle(color: kSlate, fontSize: 14),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Price
                  Text(
                    fmtPrice(_price),
                    style: const TextStyle(
                      color: kGold,
                      fontSize: 28,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'per month',
                    style: TextStyle(color: kSlate, fontSize: 12),
                  ),
                  const SizedBox(height: 24),

                  // Features
                  if (_bedrooms != null || _bathrooms != null || _area != null)
                    Row(
                      children: [
                        if (_bedrooms != null) ...[
                          _FeatureIcon(icon: Icons.bed, label: '$_bedrooms Beds'),
                          const SizedBox(width: 16),
                        ],
                        if (_bathrooms != null) ...[
                          _FeatureIcon(icon: Icons.bathtub, label: '$_bathrooms Baths'),
                          const SizedBox(width: 16),
                        ],
                        if (_area != null) ...[
                          _FeatureIcon(icon: Icons.square_foot, label: '$_area m²'),
                        ],
                      ],
                    ),

                  const SizedBox(height: 24),

                  // Description
                  const Text(
                    'Description',
                    style: TextStyle(
                      color: kCream,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _description,
                    style: const TextStyle(
                      color: kSlate,
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Contact Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kGold,
                        foregroundColor: kBg,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Contact Landlord',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
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

class _FeatureIcon extends StatelessWidget {
  final IconData icon;
  final String label;

  const _FeatureIcon({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: kGold, size: 18),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(color: kSlate, fontSize: 13),
        ),
      ],
    );
  }
}