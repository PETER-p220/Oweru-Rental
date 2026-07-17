import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import '../../../../shared/services/agent_api_service.dart';
import '../../../../shared/services/auth_service.dart';
import '../../../../core/constants/api_config.dart';
import '../../../../core/utils/payment_duration.dart';

class AgentAddListingPage extends StatefulWidget {
  const AgentAddListingPage({super.key});

  @override
  State<AgentAddListingPage> createState() => _AgentAddListingPageState();
}

class _AgentAddListingPageState extends State<AgentAddListingPage> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _location = TextEditingController();
  final _price = TextEditingController();
  final _bedrooms = TextEditingController(text: '1');
  final _bathrooms = TextEditingController(text: '1');
  final _area = TextEditingController(text: '1');
  final _landlordName = TextEditingController();
  final _landlordPhone = TextEditingController();

  String _propertyType = 'house';
  int _paymentDurationMonths = 3;
  bool _available = true;
  bool _featured = false;
  bool _saving = false;
  bool _success = false;
  String _error = '';
  int? _ownerId;

  final List<File> _uploadedImages = [];
  final List<String> _imagePreviews = [];
  final ImagePicker _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadUserId();
  }

  Future<void> _loadUserId() async {
    final user = await AuthService.getCurrentUser();
    if (user != null && user['id'] != null) {
      if (mounted) {
        setState(() => _ownerId = user['id']);
      }
    }
  }

  final List<Map<String, String>> _propertyTypes = [
    {'value': 'house', 'label': 'House'},
    {'value': 'Master-bedroom', 'label': 'Master-bedroom'},
    {'value': 'Single-room', 'label': 'Single room'},
    {'value': 'apartment', 'label': 'Apartment'},
    {'value': 'villa', 'label': 'Villa'},
    {'value': 'studio', 'label': 'Studio'},
    {'value': 'commercial', 'label': 'Commercial'},
  ];

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _location.dispose();
    _price.dispose();
    _bedrooms.dispose();
    _bathrooms.dispose();
    _area.dispose();
    _landlordName.dispose();
    _landlordPhone.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    if (_uploadedImages.length >= 6) {
      setState(() => _error = 'Max 6 images allowed');
      return;
    }
    
    final List<XFile> images = await _imagePicker.pickMultiImage();

    for (var image in images) {
      if (_uploadedImages.length >= 6) break;
      
      final file = File(image.path);
      if (await file.length() > 2 * 1024 * 1024) {
        setState(() => _error = '${image.name} exceeds 2MB.');
        continue;
      }
      
      setState(() {
        _uploadedImages.add(file);
        _imagePreviews.add(image.path);
      });
    }
  }

  void _removeImage(int index) {
    setState(() {
      _uploadedImages.removeAt(index);
      _imagePreviews.removeAt(index);
    });
  }

  String _validateForm() {
    if (_title.text.trim().isEmpty) return 'Title is required';
    if (_description.text.trim().isEmpty) return 'Description is required';
    if (_price.text.trim().isEmpty || double.tryParse(_price.text.trim()) == null) return 'Price must be greater than 0';
    if (_location.text.trim().isEmpty) return 'Location is required';
    if (_bedrooms.text.trim().isEmpty || int.tryParse(_bedrooms.text.trim()) == null) return 'Bedrooms must be > 0';
    if (_bathrooms.text.trim().isEmpty || int.tryParse(_bathrooms.text.trim()) == null) return 'Bathrooms must be > 0';
    if (_ownerId == null) return 'User ID not found. Please log in again.';
    return '';
  }

  Future<void> _submit() async {
    print('🔵 Submit button pressed');
    print('🔵 Owner ID: $_ownerId');
    print('🔵 Token: ${AuthService.token}');   

    final err = _validateForm();
    if (err.isNotEmpty) {
      print('🔴 Validation error: $err');
      setState(() => _error = err);
      return;
    }

    print('🟢 Validation passed');
    setState(() {
      _saving = true;
      _error = '';
    });

    try {
      final url = '${ApiConfig.apiPath}/agent/listings';
      print('🔵 API URL: $url');
      final request = http.MultipartRequest('POST', Uri.parse(url));

      // Add headers
      request.headers['Accept'] = 'application/json';
      request.headers['Authorization'] = 'Bearer ${AuthService.token}';
      print('🔵 Headers: ${request.headers}');

      // Add form fields
      request.fields['title'] = _title.text.trim();
      request.fields['description'] = _description.text.trim();
      request.fields['location'] = _location.text.trim();
      request.fields['address'] = _location.text.trim();
      request.fields['price'] = _price.text.trim();
      request.fields['payment_duration_months'] = _paymentDurationMonths.toString();
      request.fields['type'] = _propertyType;
      request.fields['bedrooms'] = _bedrooms.text.trim();
      request.fields['bathrooms'] = _bathrooms.text.trim();
      request.fields['area'] = _area.text.trim();
      request.fields['owner_id'] = _ownerId.toString();
      request.fields['available'] = _available.toString();
      request.fields['featured'] = _featured.toString();
      if (_landlordName.text.trim().isNotEmpty) {
        request.fields['landlord_name'] = _landlordName.text.trim();
      }
      if (_landlordPhone.text.trim().isNotEmpty) {
        request.fields['landlord_phone'] = _landlordPhone.text.trim();
      }
      print('🔵 Form fields: ${request.fields}');

      // Add images
      print('🔵 Uploading ${_uploadedImages.length} images');
      for (var i = 0; i < _uploadedImages.length; i++) {
        final file = _uploadedImages[i];
        final stream = http.ByteStream(file.openRead());
        final length = await file.length();
        final multipartFile = http.MultipartFile(
          'images[$i]',
          stream,
          length,
          filename: file.path.split('/').last,
        );
        request.files.add(multipartFile);
      }

      print('🔵 Sending request...');
      final response = await request.send();
      print('🔵 Response status: ${response.statusCode}');

      if (!mounted) return;

      if (response.statusCode >= 200 && response.statusCode < 300) {
        print('🟢 Success');
        setState(() => _success = true);
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) Navigator.pop(context);
        });
      } else {
        print('🔴 Failed with status: ${response.statusCode}');
        final responseBody = await response.stream.bytesToString();
        print('🔴 Response body: $responseBody');
        setState(() => _error = 'Failed to create listing. Status: ${response.statusCode}');
      }
    } catch (e) {
      print('🔴 Exception: $e');
      setState(() => _error = 'Failed to create listing: ${e.toString()}');
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_success) {
      return Scaffold(
        backgroundColor: const Color(0xFF0F1218),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.12),
                  border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3), width: 2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle, size: 36, color: Color(0xFF10B981)),
              ),
              const SizedBox(height: 24),
              const Text(
                'Listing Created Successfully!',
                style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 32, fontWeight: FontWeight.w300),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Redirecting to your listings…',
                style: TextStyle(color: Color(0xFF8B8680), fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0F1218),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1D26),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF8B8680)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Add Listing', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              margin: const EdgeInsets.only(bottom: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC9A84C).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: const Color(0xFF2A2418)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.apartment, size: 10, color: Color(0xFFC9A84C)),
                        SizedBox(width: 6),
                        Text('NEW LISTING', style: TextStyle(color: Color(0xFFC9A84C), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.22)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text('Add New Property', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 28, fontWeight: FontWeight.w300)),
                  const SizedBox(height: 8),
                  const Text(
                    'List your property for rent and reach potential tenants across Africa',
                    style: TextStyle(color: Color(0xFF8B8680), fontSize: 14),
                  ),
                ],
              ),
            ),
            // Error
            if (_error.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(bottom: 20),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.18)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.close, size: 15, color: Color(0xFFEF4444)),
                    const SizedBox(width: 10),
                    Expanded(child: Text(_error, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13))),
                  ],
                ),
              ),
            // Basic Info Section
            _buildSectionCard(
              icon: Icons.apartment,
              title: 'Basic Information',
              children: [
                _buildTextField('Property Title *', _title, 'e.g., Modern 2-Bedroom in Masaki'),
                const SizedBox(height: 18),
                _buildDropdownField('Property Type *', _propertyType, _propertyTypes, (value) => setState(() => _propertyType = value)),
                const SizedBox(height: 18),
                _buildTextArea('Description *', _description, 'Describe key features, amenities, and nearby attractions…'),
              ],
            ),
            const SizedBox(height: 20),
            // Location & Pricing Section
            _buildSectionCard(
              icon: Icons.location_on,
              title: 'Location & Pricing',
              children: [
                _buildTextField('Location *', _location, 'e.g., Masaki, Dar es Salaam'),
                const SizedBox(height: 18),
                _buildTextField('Monthly Rent (TZS) *', _price, '500000', keyboardType: TextInputType.number),
                const SizedBox(height: 18),
                _buildDurationDropdown(),
                if ((double.tryParse(_price.text.trim()) ?? 0) > 0) ...[
                  const SizedBox(height: 10),
                  Text(
                    'Tenant pays Tsh ${periodRentTotal(double.parse(_price.text.trim()), _paymentDurationMonths).toStringAsFixed(0)} ${formatPaymentPeriodLabel(_paymentDurationMonths)}',
                    style: const TextStyle(color: Color(0xFFC9A84C), fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 20),
            // Property Details Section
            _buildSectionCard(
              icon: Icons.home,
              title: 'Property Details',
              children: [
                Row(
                  children: [
                    Expanded(child: _buildTextField('Bedrooms *', _bedrooms, '1', keyboardType: TextInputType.number)),
                    const SizedBox(width: 18),
                    Expanded(child: _buildTextField('Bathrooms *', _bathrooms, '1', keyboardType: TextInputType.number)),
                    const SizedBox(width: 18),
                    Expanded(child: _buildTextField('Area (m²)', _area, '1', keyboardType: TextInputType.number)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Status Section
            _buildSectionCard(
              icon: Icons.description,
              title: 'Property Status',
              children: [
                _buildToggleRow('Available for Rent', 'Visible to tenants searching for rentals', _available, (value) => setState(() => _available = value)),
                const SizedBox(height: 10),
                _buildToggleRow('Featured Property', 'Highlighted in search results and homepage', _featured, (value) => setState(() => _featured = value)),
              ],
            ),
            const SizedBox(height: 20),
            // Landlord Info Section
            _buildSectionCard(
              icon: Icons.person,
              title: 'Landlord Information (private reference)',
              children: [
                Row(
                  children: [
                    Expanded(child: _buildTextField('Landlord Name', _landlordName, 'e.g., John Smith')),
                    const SizedBox(width: 18),
                    Expanded(child: _buildTextField('Landlord Phone', _landlordPhone, 'e.g., 0712 345 678', keyboardType: TextInputType.phone)),
                  ],
                ),
                const SizedBox(height: 14),
                const Text(
                  'This information is private — it helps you track which landlord owns this property and won\'t be shown to tenants.',
                  style: TextStyle(color: Color(0xFF8B8680), fontSize: 12, fontStyle: FontStyle.italic),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Images Section
            _buildSectionCard(
              icon: Icons.camera_alt,
              title: 'Property Images',
              children: [
                GestureDetector(
                  onTap: _pickImages,
                  child: Container(
                    padding: const EdgeInsets.all(36),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E2D4A),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF2A2418), style: BorderStyle.solid, width: 2),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.camera_alt, size: 38, color: Color(0xFFC9A84C)),
                        const SizedBox(height: 12),
                        const Text('Click to upload images', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 16, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 5),
                        const Text('PNG, JPG up to 2MB · Max 6 images', style: TextStyle(color: Color(0xFF8B8680), fontSize: 13)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                if (_imagePreviews.isNotEmpty)
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: _imagePreviews.length,
                    itemBuilder: (context, index) {
                      return Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.file(
                              File(_imagePreviews[index]),
                              width: double.infinity,
                              height: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          ),
                          Positioned(
                            top: 7,
                            right: 7,
                            child: GestureDetector(
                              onTap: () => _removeImage(index),
                              child: Container(
                                width: 26,
                                height: 26,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF090F1D),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.close, size: 12, color: Color(0xFFE8E1D5)),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F1218),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF2A2418)),
                    ),
                    child: const Center(
                      child: Text('No images yet. Add at least one to showcase your property.', style: TextStyle(color: Color(0xFF8B8680), fontSize: 13)),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            // Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF8B8680),
                    side: const BorderSide(color: Color(0xFF2A2418)),
                    padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 11),
                  ),
                  child: const Text('Cancel', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: _saving ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFC9A84C),
                    foregroundColor: const Color(0xFF0F1218),
                    padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 11),
                  ),
                  child: _saving
                      ? const SizedBox(width: 15, height: 15, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0F1218)))
                      : const Row(
                          children: [
                            Icon(Icons.save, size: 14),
                            SizedBox(width: 8),
                            Text('Create Listing', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                          ],
                        ),
                ),
              ],
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({required IconData icon, required String title, required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF162035),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF2A2418)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 18),
            decoration: BoxDecoration(
              color: const Color(0xFF0F1218),
              border: Border(bottom: BorderSide(color: const Color(0xFF2A2418), width: 1)),
            ),
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: const Color(0xFFC9A84C).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF2A2418)),
                  ),
                  child: Icon(icon, size: 16, color: const Color(0xFFC9A84C)),
                ),
                const SizedBox(width: 12),
                Text(title, style: const TextStyle(color: Color(0xFFE8E1D5), fontSize: 19, fontWeight: FontWeight.w400)),
              ],
            ),
          ),
          // Body
          Padding(
            padding: const EdgeInsets.all(26),
            child: Column(children: children),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, String placeholder, {TextInputType? keyboardType}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF8B8680), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          onChanged: label.contains('Rent') ? (_) => setState(() {}) : null,
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: TextStyle(color: const Color(0xFF8B8680).withValues(alpha: 0.4)),
            filled: true,
            fillColor: const Color(0xFF1E2D4A),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF2A2418)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF2A2418)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFC9A84C)),
            ),
          ),
          style: const TextStyle(color: Color(0xFFE8E1D5), fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildTextArea(String label, TextEditingController controller, String placeholder) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF8B8680), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          maxLines: 4,
          minLines: 4,
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: TextStyle(color: const Color(0xFF8B8680).withValues(alpha: 0.4)),
            filled: true,
            fillColor: const Color(0xFF1E2D4A),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF2A2418)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF2A2418)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFC9A84C)),
            ),
          ),
          style: const TextStyle(color: Color(0xFFE8E1D5), fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildDropdownField(String label, String value, List<Map<String, String>> items, Function(String) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF8B8680), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: const Color(0xFF1E2D4A),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF2A2418)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              dropdownColor: const Color(0xFF1E2D4A),
              style: const TextStyle(color: Color(0xFFE8E1D5), fontSize: 14),
              items: items.map((item) {
                return DropdownMenuItem<String>(
                  value: item['value'],
                  child: Text(item['label'] ?? ''),
                );
              }).toList(),
              onChanged: (newValue) {
                if (newValue != null) onChanged(newValue);
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDurationDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Payment Period *', style: TextStyle(color: Color(0xFF8B8680), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: const Color(0xFF1E2D4A),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF2A2418)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<int>(
              value: _paymentDurationMonths,
              isExpanded: true,
              dropdownColor: const Color(0xFF1E2D4A),
              style: const TextStyle(color: Color(0xFFE8E1D5), fontSize: 14),
              items: paymentDurationOptions.map((opt) => DropdownMenuItem(
                value: opt.value,
                child: Text(opt.label),
              )).toList(),
              onChanged: (v) { if (v != null) setState(() => _paymentDurationMonths = v); },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildToggleRow(String title, String subtitle, bool value, Function(bool) onChanged) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF1E2D4A),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFF2A2418)),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 24,
              decoration: BoxDecoration(
                color: value ? const Color(0xFFC9A84C) : const Color(0xFF0F1218),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF2A2418)),
              ),
              child: AnimatedAlign(
                duration: const Duration(milliseconds: 220),
                alignment: value ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  width: 16,
                  height: 16,
                  margin: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: value ? const Color(0xFF0F1218) : const Color(0xFF8B8680),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Color(0xFFE8E1D5), fontSize: 14, fontWeight: FontWeight.w600)),
                  Text(subtitle, style: const TextStyle(color: Color(0xFF8B8680), fontSize: 12, fontWeight: FontWeight.w300)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
