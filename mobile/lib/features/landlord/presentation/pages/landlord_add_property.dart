// ============================================================
// landlord_add_property.dart — Add Property page
// ============================================================
import 'package:flutter/material.dart';
import 'landlord_theme.dart';

class LandlordAddPropertyPage extends StatefulWidget {
  const LandlordAddPropertyPage({super.key});
  @override
  State<LandlordAddPropertyPage> createState() => _LandlordAddPropertyPageState();
}

class _LandlordAddPropertyPageState extends State<LandlordAddPropertyPage> {
  int _step = 1;
  bool _isLoading = false;
  final List<String> _errors = [];
  
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _addressController = TextEditingController();
  final _priceController = TextEditingController();
  final _bedroomsController = TextEditingController(text: '1');
  final _bathroomsController = TextEditingController(text: '1');
  final _latitudeController = TextEditingController();
  final _longitudeController = TextEditingController();

  String _propertyType = 'house';
  final Set<String> _amenities = {};
  final List<String> _images = [];
  bool _featured = false;

  final List<PropertyType> _propertyTypes = [
    PropertyType(value: 'house', label: 'House', icon: Icons.home_rounded),
    PropertyType(value: 'Master-bedroom', label: 'Masterbedroom', icon: Icons.apartment_rounded),
    PropertyType(value: 'Single-room', label: 'Single room', icon: Icons.bed_rounded),
  ];

  final List<String> _commonAmenities = [
    'Parking', 'Security', 'Gym', 'Pool', 'Garden', 'Balcony',
    'Air Conditioning', 'Heating', 'WiFi', 'Kitchen', 'Laundry',
    'Elevator', 'Storage', 'Pet Friendly', 'Furnished'
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _addressController.dispose();
    _priceController.dispose();
    _bedroomsController.dispose();
    _bathroomsController.dispose();
    _latitudeController.dispose();
    _longitudeController.dispose();
    super.dispose();
  }

  bool _validateStep() {
    _errors.clear();
    
    if (_step == 1) {
      if (_titleController.text.trim().isEmpty) _errors.add('Property title is required');
      if (_descriptionController.text.trim().isEmpty) _errors.add('Description is required');
      if (_locationController.text.trim().isEmpty) _errors.add('Location is required');
      if (_addressController.text.trim().isEmpty) _errors.add('Address is required');
    }
    
    if (_step == 2) {
      final price = int.tryParse(_priceController.text);
      if (price == null || price <= 0) _errors.add('Price must be greater than 0');
    }
    
    if (_step == 3) {
      if (_images.isEmpty) _errors.add('At least one image is required');
    }
    
    setState(() {});
    return _errors.isEmpty;
  }

  void _handleNext() {
    if (_validateStep()) {
      setState(() => _step++);
    }
  }

  void _handleBack() {
    setState(() => _step--);
  }

  Future<void> _handleSubmit() async {
    if (!_validateStep()) return;

    setState(() => _isLoading = true);

    // Simulate API call
    await Future.delayed(const Duration(seconds: 2));

    setState(() => _isLoading = false);
    
    // Navigate back to properties
    Navigator.pop(context);
  }

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
      title: const Text('Add New Property',
        style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600)),
    ),
    body: _isLoading ? _buildLoading() : _buildContent(),
  );

  Widget _buildLoading() => const Center(
    child: CircularProgressIndicator(color: kGold),
  );

  Widget _buildContent() => Form(
    key: _formKey,
    child: ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Steps indicator
        Row(children: [
          _StepIndicator(step: 1, current: _step, label: 'Basic Info'),
          Expanded(child: Container(height: 2, color: _step > 1 ? kGold : kBorder)),
          _StepIndicator(step: 2, current: _step, label: 'Details'),
          Expanded(child: Container(height: 2, color: _step > 2 ? kGold : kBorder)),
          _StepIndicator(step: 3, current: _step, label: 'Features'),
        ]),
        const SizedBox(height: 24),

        // Errors
        if (_errors.isNotEmpty) ...[
          ..._errors.map((error) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: kDanger.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: kDanger.withOpacity(0.3)),
            ),
            child: Row(children: [
              Icon(Icons.error_outline_rounded, color: kDanger, size: 16),
              const SizedBox(width: 8),
              Expanded(child: Text(error, style: TextStyle(color: kDanger, fontSize: 12))),
            ]),
          )),
          const SizedBox(height: 16),
        ],

        // Step content
        if (_step == 1) _buildStep1(),
        if (_step == 2) _buildStep2(),
        if (_step == 3) _buildStep3(),

        const SizedBox(height: 24),
        // Actions
        Row(children: [
          if (_step > 1) ...[
            Expanded(child: LGhostButton(
              label: 'Back',
              onTap: _handleBack,
              borderColor: kBorder,
            )),
            const SizedBox(width: 12),
          ],
          Expanded(child: LGoldButton(
            label: _step == 3 ? 'Submit' : 'Next',
            onTap: _step == 3 ? _handleSubmit : _handleNext,
            fullWidth: true,
          )),
        ]),
      ],
    ),
  );

  Widget _buildStep1() => LCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Basic Information', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600)),
    const SizedBox(height: 20),
    
    const Text('Property Title *', style: TextStyle(color: kCream, fontSize: 13)),
    const SizedBox(height: 8),
    TextField(
      controller: _titleController,
      style: TextStyle(color: kCream, fontSize: 14),
      decoration: InputDecoration(
        hintText: 'e.g., Modern 2BR Apartment in Masaki',
        hintStyle: TextStyle(color: kSlate, fontSize: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kGold)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
    ),
    const SizedBox(height: 16),

    const Text('Description *', style: TextStyle(color: kCream, fontSize: 13)),
    const SizedBox(height: 8),
    TextField(
      controller: _descriptionController,
      maxLines: 4,
      style: TextStyle(color: kCream, fontSize: 14),
      decoration: InputDecoration(
        hintText: 'Describe your property, highlighting key features and amenities...',
        hintStyle: TextStyle(color: kSlate, fontSize: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kGold)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
    ),
    const SizedBox(height: 16),

    const Text('Property Type *', style: TextStyle(color: kCream, fontSize: 13)),
    const SizedBox(height: 8),
    GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 8,
      mainAxisSpacing: 8,
      childAspectRatio: 1.2,
      children: _propertyTypes.map((type) => InkWell(
        onTap: () => setState(() => _propertyType = type.value),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          decoration: BoxDecoration(
            color: _propertyType == type.value ? kGold.withOpacity(0.12) : kBg2,
            border: Border.all(color: _propertyType == type.value ? kGold : kBorder),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(type.icon, color: kGold, size: 24),
            const SizedBox(height: 8),
            Text(type.label, style: TextStyle(color: kCream, fontSize: 11)),
          ]),
        ),
      )).toList(),
    ),
    const SizedBox(height: 16),

    const Text('Location *', style: TextStyle(color: kCream, fontSize: 13)),
    const SizedBox(height: 8),
    TextField(
      controller: _locationController,
      style: TextStyle(color: kCream, fontSize: 14),
      decoration: InputDecoration(
        hintText: 'e.g., Dar es Salaam, Masaki',
        hintStyle: TextStyle(color: kSlate, fontSize: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kGold)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
    ),
    const SizedBox(height: 16),

    const Text('Full Address *', style: TextStyle(color: kCream, fontSize: 13)),
    const SizedBox(height: 8),
    TextField(
      controller: _addressController,
      style: TextStyle(color: kCream, fontSize: 14),
      decoration: InputDecoration(
        hintText: 'e.g., 34 Toure Drive, Masaki, Dar es Salaam',
        hintStyle: TextStyle(color: kSlate, fontSize: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kGold)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
    ),
  ]));

  Widget _buildStep2() => LCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Property Details', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600)),
    const SizedBox(height: 20),
    
    const Text('Monthly Price (TZS) *', style: TextStyle(color: kCream, fontSize: 13)),
    const SizedBox(height: 8),
    TextField(
      controller: _priceController,
      keyboardType: TextInputType.number,
      style: TextStyle(color: kCream, fontSize: 14),
      decoration: InputDecoration(
        hintText: 'e.g., 800000',
        hintStyle: TextStyle(color: kSlate, fontSize: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kGold)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
    ),
    const SizedBox(height: 16),

    const Text('Bedrooms & Bathrooms', style: TextStyle(color: kCream, fontSize: 13)),
    const SizedBox(height: 8),
    Row(children: [
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Bedrooms', style: TextStyle(color: kCream, fontSize: 12)),
        const SizedBox(height: 4),
        TextField(
          controller: _bedroomsController,
          keyboardType: TextInputType.number,
          style: TextStyle(color: kCream, fontSize: 14),
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kGold)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      ])),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Bathrooms', style: TextStyle(color: kCream, fontSize: 12)),
        const SizedBox(height: 4),
        TextField(
          controller: _bathroomsController,
          keyboardType: TextInputType.number,
          style: TextStyle(color: kCream, fontSize: 14),
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kGold)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      ])),
    ]),
    const SizedBox(height: 16),

    const Text('Location Coordinates (Optional)', style: TextStyle(color: kCream, fontSize: 13)),
    const SizedBox(height: 8),
    Row(children: [
      Expanded(child: TextField(
        controller: _latitudeController,
        keyboardType: TextInputType.number,
        style: TextStyle(color: kCream, fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Latitude',
          hintStyle: TextStyle(color: kSlate, fontSize: 12),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kGold)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        ),
      )),
      const SizedBox(width: 12),
      Expanded(child: TextField(
        controller: _longitudeController,
        keyboardType: TextInputType.number,
        style: TextStyle(color: kCream, fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Longitude',
          hintStyle: TextStyle(color: kSlate, fontSize: 12),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kBorder)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: kGold)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        ),
      )),
    ]),
  ]));

  Widget _buildStep3() => LCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Property Features', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600)),
    const SizedBox(height: 20),
    
    const Text('Amenities', style: TextStyle(color: kCream, fontSize: 13)),
    const SizedBox(height: 8),
    Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _commonAmenities.map((amenity) => InkWell(
        onTap: () => setState(() {
          if (_amenities.contains(amenity)) {
            _amenities.remove(amenity);
          } else {
            _amenities.add(amenity);
          }
        }),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: _amenities.contains(amenity) ? kGold.withOpacity(0.12) : kBg2,
            border: Border.all(color: _amenities.contains(amenity) ? kGold : kBorder),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            if (_amenities.contains(amenity)) ...[
              Icon(Icons.check_rounded, color: kGold, size: 14),
              const SizedBox(width: 4),
            ],
            Text(amenity, style: TextStyle(color: kCream, fontSize: 12)),
          ]),
        ),
      )).toList(),
    ),
    const SizedBox(height: 16),

    const Text('Property Images *', style: TextStyle(color: kCream, fontSize: 13)),
    const SizedBox(height: 8),
    GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 8,
      mainAxisSpacing: 8,
      childAspectRatio: 1,
      children: [
        ..._images.asMap().entries.map((entry) => Stack(children: [
          Container(
            decoration: BoxDecoration(
              color: kBg2,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: kBorder),
            ),
            child: Icon(Icons.image_rounded, color: kSlate, size: 32),
          ),
          Positioned(top: 4, right: 4,
            child: GestureDetector(
              onTap: () => setState(() => _images.removeAt(entry.key)),
              child: Container(
                width: 24, height: 24,
                decoration: BoxDecoration(color: kDanger, borderRadius: BorderRadius.circular(4)),
                child: Icon(Icons.close_rounded, color: kBg, size: 14),
              ),
            )),
        ])),
        InkWell(
          onTap: () {
            // TODO: Implement image picker
            setState(() => _images.add('placeholder'));
          },
          borderRadius: BorderRadius.circular(8),
          child: Container(
            decoration: BoxDecoration(
              color: kBg2,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: kBorder, style: BorderStyle.solid),
            ),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.add_rounded, color: kSlate, size: 32),
              const SizedBox(height: 4),
              Text('Upload', style: TextStyle(color: kSlate, fontSize: 10)),
            ]),
          ),
        ),
      ],
    ),
    const SizedBox(height: 16),

    Row(children: [
      Checkbox(
        value: _featured,
        onChanged: (v) => setState(() => _featured = v ?? false),
        activeColor: kGold,
      ),
      const Text('Featured Property', style: TextStyle(color: kCream, fontSize: 13)),
    ]),
  ]));
}

class _StepIndicator extends StatelessWidget {
  final int step;
  final int current;
  final String label;
  const _StepIndicator({required this.step, required this.current, required this.label});

  @override
  Widget build(BuildContext context) => Column(children: [
    Container(
      width: 32, height: 32,
      decoration: BoxDecoration(
        color: current >= step ? kGold : kBg2,
        shape: BoxShape.circle,
        border: Border.all(color: current >= step ? kGold : kBorder),
      ),
      child: Center(child: current > step
        ? Icon(Icons.check_rounded, color: kBg, size: 16)
        : Text('$step', style: TextStyle(color: current >= step ? kBg : kSlate, fontSize: 13, fontWeight: FontWeight.w600))),
    ),
    const SizedBox(height: 4),
    Text(label, style: TextStyle(color: current >= step ? kGold : kSlate, fontSize: 10)),
  ]);
}

class PropertyType {
  final String value;
  final String label;
  final IconData icon;
  PropertyType({required this.value, required this.label, required this.icon});
}
