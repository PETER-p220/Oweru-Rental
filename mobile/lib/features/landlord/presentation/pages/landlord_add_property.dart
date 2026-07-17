import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../../shared/services/landlord_api_service.dart';
import '../../../../core/utils/payment_duration.dart';
import 'landlord_theme.dart';

class LandlordAddPropertyPage extends StatefulWidget {
  const LandlordAddPropertyPage({super.key});

  @override
  State<LandlordAddPropertyPage> createState() => _LandlordAddPropertyPageState();
}

class _LandlordAddPropertyPageState extends State<LandlordAddPropertyPage> {
  int _currentStep = 1;
  bool _isLoading = false;
  List<String> _errors = [];

  // Form data
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
  int _paymentDurationMonths = 3;
  final List<String> _amenities = [];
  final List<File> _images = [];
  bool _featured = false;

  final ImagePicker _imagePicker = ImagePicker();

  final List<String> _propertyTypes = ['house', 'Master-bedroom', 'Single-room'];
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
    final errs = <String>[];

    if (_currentStep == 1) {
      if (_titleController.text.trim().isEmpty) {
        errs.add('Property title is required');
      }
      if (_descriptionController.text.trim().isEmpty) {
        errs.add('Description is required');
      }
      if (_locationController.text.trim().isEmpty) {
        errs.add('Location is required');
      }
      if (_addressController.text.trim().isEmpty) {
        errs.add('Address is required');
      }
    }

    if (_currentStep == 2) {
      final price = double.tryParse(_priceController.text.trim());
      if (price == null || price <= 0) {
        errs.add('Price must be greater than 0');
      }
    }

    if (_currentStep == 3) {
      if (_images.isEmpty) {
        errs.add('At least one image is required');
      }
    }

    setState(() => _errors = errs);
    return errs.isEmpty;
  }

  void _nextStep() {
    if (_validateStep()) {
      setState(() {
        _errors = [];
        _currentStep++;
      });
    }
  }

  void _previousStep() {
    setState(() {
      _errors = [];
      _currentStep--;
    });
  }

  Future<void> _pickImages() async {
    try {
      final List<XFile> pickedFiles = await _imagePicker.pickMultiImage();
      if (pickedFiles.isNotEmpty) {
        setState(() {
          _images.addAll(pickedFiles.map((xFile) => File(xFile.path)));
        });
      }
    } catch (e) {
      setState(() => _errors = ['Failed to pick images']);
    }
  }

  void _removeImage(int index) {
    setState(() {
      _images.removeAt(index);
    });
  }

  void _toggleAmenity(String amenity) {
    setState(() {
      if (_amenities.contains(amenity)) {
        _amenities.remove(amenity);
      } else {
        _amenities.add(amenity);
      }
    });
  }

  Future<void> _submit() async {
    if (!_validateStep()) return;

    setState(() {
      _isLoading = true;
      _errors = [];
    });

    try {
      // Upload images first if there are any
      List<String> uploadedImageUrls = [];
      if (_images.isNotEmpty) {
        final imagePaths = _images.map((file) => file.path).toList();
        final uploadedImages = await LandlordApiService.uploadPropertyImages(imagePaths);
        if (uploadedImages != null) {
          uploadedImageUrls = uploadedImages;
        } else {
          setState(() {
            _errors = ['Failed to upload images. Please try again.'];
            _isLoading = false;
          });
          return;
        }
      }

      await LandlordApiService.createProperty({
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'location': _locationController.text.trim(),
        'address': _addressController.text.trim(),
        'price': double.tryParse(_priceController.text.trim()) ?? 0,
        'payment_duration_months': _paymentDurationMonths,
        'type': _propertyType,
        'bedrooms': int.tryParse(_bedroomsController.text.trim()) ?? 1,
        'bathrooms': int.tryParse(_bathroomsController.text.trim()) ?? 1,
        'amenities': _amenities,
        'featured': _featured,
        'latitude': _latitudeController.text.trim(),
        'longitude': _longitudeController.text.trim(),
        'images': uploadedImageUrls,
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Property created successfully')),
      );
      Navigator.pop(context);
    } catch (e) {
      setState(() {
        _errors = ['Failed to create property. Please try again.'];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kPageBg,
      appBar: AppBar(
        backgroundColor: kHeaderBg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: kWhite),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Add New Property', style: TextStyle(color: kWhite, fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          // Steps Indicator
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
            color: kHeaderBg,
            child: Row(
              children: [
                _buildStepIndicator(1, 'Basic Info'),
                _buildStepLine(1),
                _buildStepIndicator(2, 'Details'),
                _buildStepLine(2),
                _buildStepIndicator(3, 'Features'),
              ],
            ),
          ),
          // Error Display
          if (_errors.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              decoration: BoxDecoration(
                color: kDanger.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: kDanger.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: _errors.map((error) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      const Icon(Icons.error, size: 16, color: kDanger),
                      const SizedBox(width: 8),
                      Expanded(child: Text(error, style: const TextStyle(color: kDanger, fontSize: 13))),
                    ],
                  ),
                )).toList(),
              ),
            ),
          // Form Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _buildCurrentStep(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int step, String label) {
    final isCompleted = _currentStep > step;
    final isActive = _currentStep == step;

    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: kSlate800, width: 2),
            color: isActive ? kSlate800 : isCompleted ? kSlate800.withValues(alpha: 0.3) : kSlate100,
          ),
          child: Center(
            child: isCompleted
                ? const Icon(Icons.check, color: kWhite, size: 16)
                : Text(
                    '$step',
                    style: TextStyle(
                      color: isActive ? kWhite : kSlate600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: isActive ? kSlate800 : kSlate500,
            fontSize: 11,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ],
    );
  }

  Widget _buildStepLine(int step) {
    final isCompleted = _currentStep > step;
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.symmetric(horizontal: 8),
        decoration: BoxDecoration(
          color: isCompleted ? kSlate800 : kBorder,
        ),
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 1:
        return _buildStep1();
      case 2:
        return _buildStep2();
      case 3:
        return _buildStep3();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildStep1() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kCardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Basic Information', style: TextStyle(color: kSlate800, fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 20),
          _buildTextField('Property Title *', _titleController, 'e.g., Modern 2BR Apartment in Masaki'),
          const SizedBox(height: 16),
          _buildTextArea('Description *', _descriptionController, 'Describe your property, highlighting key features and amenities...'),
          const SizedBox(height: 16),
          const Text('Property Type *', style: TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          _buildPropertyTypeSelector(),
          const SizedBox(height: 16),
          _buildTextField('Location *', _locationController, 'e.g., Dar es Salaam, Masaki'),
          const SizedBox(height: 16),
          _buildTextField('Full Address *', _addressController, 'e.g., 34 Toure Drive, Masaki, Dar es Salaam'),
          const SizedBox(height: 24),
          _buildStepActions(showBack: false),
        ],
      ),
    );
  }

  Widget _buildStep2() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kCardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Property Details', style: TextStyle(color: kSlate800, fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 20),
          _buildTextField('Monthly Price (TZS) *', _priceController, 'e.g., 800000', keyboardType: TextInputType.number),
          const SizedBox(height: 8),
          const Text(
            'This is the rent per month. Tenants pay for the payment period you set below.',
            style: TextStyle(color: kSlate500, fontSize: 12),
          ),
          const SizedBox(height: 16),
          const Text('Payment Period *', style: TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          _buildPaymentDurationDropdown(),
          if ((double.tryParse(_priceController.text.trim()) ?? 0) > 0) ...[
            const SizedBox(height: 8),
            Text(
              'Tenant pays TZS ${periodRentTotal(double.parse(_priceController.text.trim()), _paymentDurationMonths).toStringAsFixed(0)} ${formatPaymentPeriodLabel(_paymentDurationMonths)}',
              style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Bedrooms', style: TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    _buildNumberField(_bedroomsController),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Bathrooms', style: TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    _buildNumberField(_bathroomsController),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Location Coordinates (Optional)', style: TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildTextField('Latitude', _latitudeController, 'Latitude', keyboardType: TextInputType.number),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildTextField('Longitude', _longitudeController, 'Longitude', keyboardType: TextInputType.number),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _buildStepActions(showBack: true),
        ],
      ),
    );
  }

  Widget _buildStep3() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kCardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Property Features', style: TextStyle(color: kSlate800, fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 20),
          const Text('Amenities', style: TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          _buildAmenitiesGrid(),
          const SizedBox(height: 16),
          const Text('Property Images *', style: TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          _buildImageUploadSection(),
          const SizedBox(height: 16),
          _buildFeaturedCheckbox(),
          const SizedBox(height: 24),
          _buildStepActions(showBack: true, isSubmit: true),
        ],
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, String placeholder, {TextInputType? keyboardType}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          onChanged: label.contains('Price') || label.contains('Rent') ? (_) => setState(() {}) : null,
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: const TextStyle(color: kSlate400),
            filled: true,
            fillColor: kSlate100,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: kBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: kBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: kSlate800),
            ),
          ),
          style: const TextStyle(color: kSlate800),
        ),
      ],
    );
  }

  Widget _buildTextArea(String label, TextEditingController controller, String placeholder) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          maxLines: 4,
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: const TextStyle(color: kSlate400),
            filled: true,
            fillColor: kSlate100,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: kBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: kBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: kSlate800),
            ),
          ),
          style: const TextStyle(color: kSlate800),
        ),
      ],
    );
  }

  Widget _buildPaymentDurationDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: kSlate100,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: kBorder),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: _paymentDurationMonths,
          isExpanded: true,
          items: paymentDurationOptions.map((opt) => DropdownMenuItem(
            value: opt.value,
            child: Text(opt.label, style: const TextStyle(color: kSlate800)),
          )).toList(),
          onChanged: (v) { if (v != null) setState(() => _paymentDurationMonths = v); },
        ),
      ),
    );
  }

  Widget _buildNumberField(TextEditingController controller) {
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(
        filled: true,
        fillColor: kSlate100,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: kBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: kBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: kSlate800),
        ),
      ),
      style: const TextStyle(color: kSlate800),
    );
  }

  Widget _buildPropertyTypeSelector() {
    return GridView.builder(
      shrinkWrap: true,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 2.5,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: _propertyTypes.length,
      itemBuilder: (context, index) {
        final type = _propertyTypes[index];
        final isSelected = _propertyType == type;
        return GestureDetector(
          onTap: () => setState(() => _propertyType = type),
          child: Container(
            decoration: BoxDecoration(
              color: isSelected ? kSlate800.withValues(alpha: 0.1) : kSlate100,
              border: Border.all(
                color: isSelected ? kSlate800 : kBorder,
                width: isSelected ? 2 : 1,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                type,
                style: TextStyle(
                  color: isSelected ? kSlate800 : kSlate600,
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAmenitiesGrid() {
    return GridView.builder(
      shrinkWrap: true,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 4,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: _commonAmenities.length,
      itemBuilder: (context, index) {
        final amenity = _commonAmenities[index];
        final isSelected = _amenities.contains(amenity);
        return GestureDetector(
          onTap: () => _toggleAmenity(amenity),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? kSlate800.withValues(alpha: 0.1) : kSlate100,
              border: Border.all(
                color: isSelected ? kSlate800 : kBorder,
                width: isSelected ? 2 : 1,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    border: Border.all(color: kSlate800, width: 2),
                    borderRadius: BorderRadius.circular(4),
                    color: isSelected ? kSlate800 : Colors.transparent,
                  ),
                  child: isSelected
                      ? const Icon(Icons.check, color: kWhite, size: 14)
                      : null,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    amenity,
                    style: TextStyle(
                      color: isSelected ? kSlate800 : kSlate600,
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildImageUploadSection() {
    return Column(
      children: [
        if (_images.isNotEmpty)
          GridView.builder(
            shrinkWrap: true,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: _images.length,
            itemBuilder: (context, index) {
              return Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      _images[index],
                      width: double.infinity,
                      height: 100,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    top: 4,
                    right: 4,
                    child: GestureDetector(
                      onTap: () => _removeImage(index),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.7),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.close, color: Colors.white, size: 16),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: _pickImages,
          child: Container(
            height: 150,
            decoration: BoxDecoration(
              color: kSlate100,
              border: Border.all(color: kBorder, width: 2, style: BorderStyle.solid),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.cloud_upload, color: kSlate400, size: 32),
                const SizedBox(height: 8),
                Text(
                  'Upload Images',
                  style: TextStyle(color: kSlate600, fontSize: 14),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFeaturedCheckbox() {
    return Row(
      children: [
        Checkbox(
          value: _featured,
          onChanged: (value) => setState(() => _featured = value ?? false),
          activeColor: kSlate800,
        ),
        const SizedBox(width: 8),
        const Text('Feature this property', style: TextStyle(color: kSlate800, fontSize: 14)),
      ],
    );
  }

  Widget _buildStepActions({required bool showBack, bool isSubmit = false}) {
    return Row(
      children: [
        if (showBack)
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _previousStep,
              icon: const Icon(Icons.arrow_back, size: 16),
              label: const Text('Back'),
              style: OutlinedButton.styleFrom(
                foregroundColor: kSlate800,
                side: const BorderSide(color: kBorder),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        if (showBack) const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: isSubmit ? (_isLoading ? null : _submit) : _nextStep,
            icon: isSubmit
                ? (_isLoading ? const SizedBox() : const Icon(Icons.add, size: 16))
                : const Icon(Icons.arrow_forward, size: 16),
            label: Text(isSubmit
                ? (_isLoading ? 'Creating...' : 'Create Property')
                : 'Next'),
            style: ElevatedButton.styleFrom(
              backgroundColor: kSlate800,
              foregroundColor: kWhite,
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
      ],
    );
  }
}
