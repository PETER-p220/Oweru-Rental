import 'package:flutter/material.dart';
import '../../../shared/services/commercial_api_service.dart';

const Color kWhite = Color(0xFFFFFFFF);
const Color kBg = Color(0xFFF8FAFC);
const Color kBorder = Color(0xFFE2E8F0);
const Color kSlate800 = Color(0xFF1E293B);
const Color kSlate500 = Color(0xFF64748B);

class CommercialProfilePage extends StatefulWidget {
  const CommercialProfilePage({super.key});

  @override
  State<CommercialProfilePage> createState() => _CommercialProfilePageState();
}

class _CommercialProfilePageState extends State<CommercialProfilePage> {
  Map<String, dynamic> _user = {};
  bool _loading = true;
  bool _saving = false;
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _company = TextEditingController();
  final _license = TextEditingController();
  final _address = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _company.dispose();
    _license.dispose();
    _address.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await CommercialApiService.getProfile();
      final user = (data['user'] as Map<String, dynamic>?) ?? data;
      _user = user;
      _name.text = user['name']?.toString() ?? '';
      _phone.text = user['phone']?.toString() ?? '';
      _company.text = user['company_name']?.toString() ?? '';
      _license.text = user['business_license']?.toString() ?? '';
      _address.text = user['address']?.toString() ?? '';
      setState(() => _loading = false);
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final res = await CommercialApiService.updateProfile({
      'name': _name.text.trim(),
      'phone': _phone.text.trim(),
      'company_name': _company.text.trim(),
      'business_license': _license.text.trim(),
      'address': _address.text.trim(),
    });
    setState(() => _saving = false);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(res['success'] == true ? 'Profile updated' : (res['message']?.toString() ?? 'Failed')),
    ));
    if (res['success'] == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(backgroundColor: kWhite, foregroundColor: kSlate800, title: const Text('Profile')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                _field('Full name', _name),
                _field('Phone', _phone),
                _field('Company', _company),
                _field('Business license', _license),
                _field('Address', _address),
                if (_user['email'] != null) Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text('Email: ${_user['email']}', style: const TextStyle(color: kSlate500)),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _save,
                    child: _saving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save profile'),
                  ),
                ),
              ]),
            ),
    );
  }

  Widget _field(String label, TextEditingController c) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextField(controller: c, decoration: InputDecoration(labelText: label, filled: true, fillColor: kWhite, border: const OutlineInputBorder())),
      );
}
