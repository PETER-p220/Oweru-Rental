import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'tenant_theme.dart';
import 'property_detail_page.dart';
import '../../../../shared/services/tenant_api_service.dart';
import '../../../../shared/services/user_service.dart';

const String kApiBase = 'https://rental.oweru.com/api';
const int kItemsPerPage = 12;

// ── Types ────────────────────────────────────────────────────
typedef PropertyMap = Map<String, dynamic>;

enum ModalStep { none, auth, apply, payment, success }
enum SourceFilter { all, agent, landlord, admin }
enum ViewMode { grid, list }
enum ToastType { success, error, info, warning }

class _Toast {
  final String id;
  final ToastType type;
  final String title;
  final String? message;
  final int durationMs;
  _Toast({required this.id, required this.type, required this.title, this.message, this.durationMs = 5000});
}

// ── Helpers ──────────────────────────────────────────────────
String _formatPrice(dynamic p) {
  if (p == null) return 'Price on request';
  final num v = p is num ? p : (num.tryParse(p.toString()) ?? 0);
  if (v == 0) return 'Price on request';
  if (v >= 1000000) return 'TZS ${(v / 1000000).toStringAsFixed(1)}M';
  if (v >= 1000) return 'TZS ${(v / 1000).toStringAsFixed(0)}K';
  return 'TZS $v';
}

String _resolveUrl(String path) {
  if (path.isEmpty) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = 'https://rental.oweru.com';
  if (path.startsWith('/storage/')) return '$base$path';
  if (path.startsWith('storage/')) return '$base/$path';
  if (path.startsWith('/')) return '$base$path';
  return '$base/storage/$path';
}

String _getImageUrl(PropertyMap p) {
  final si = p['property_images'];
  if (si is List && si.isNotEmpty) {
    final primary = si.firstWhere((i) => i['is_primary'] == 1 || i['is_primary'] == true, orElse: () => si[0]);
    final path = primary['image_path'] ?? primary['url'] ?? '';
    if (path.toString().isNotEmpty) return _resolveUrl(path.toString());
  }
  final ci = p['propertyImages'];
  if (ci is List && ci.isNotEmpty) {
    final primary = ci.firstWhere((i) => i['is_primary'] == 1 || i['is_primary'] == true, orElse: () => ci[0]);
    final path = primary['image_path'] ?? primary['url'] ?? '';
    if (path.toString().isNotEmpty) return _resolveUrl(path.toString());
  }
  var imgs = p['images'];
  if (imgs is String) {
    try { imgs = jsonDecode(imgs); } catch (_) { imgs = null; }
  }
  if (imgs is List && imgs.isNotEmpty) {
    final first = imgs[0];
    if (first is String && first.trim().isNotEmpty) return _resolveUrl(first);
    final path = first['image_path'] ?? first['url'] ?? first['path'] ?? '';
    if (path.toString().isNotEmpty) return _resolveUrl(path.toString());
  }
  return '';
}

const _kCommercialTypes = ['office', 'retail', 'warehouse', 'commercial', 'industrial'];

SourceFilter _getSource(PropertyMap p) {
  if (p['agent_id'] != null) return SourceFilter.agent;
  if (p['type'] == 'oweru_rental') return SourceFilter.admin;
  final type = (p['type'] ?? '').toString().toLowerCase();
  if (_kCommercialTypes.contains(type)) return SourceFilter.admin;
  if (p['owner_id'] != null) return SourceFilter.landlord;
  return SourceFilter.landlord;
}

String _sourceLabel(SourceFilter s) {
  switch (s) {
    case SourceFilter.agent: return 'Agent';
    case SourceFilter.landlord: return 'Landlord';
    case SourceFilter.admin: return 'Oweru';
    case SourceFilter.all: return 'All';
  }
}

Color _sourceBadgeColor(SourceFilter s) {
  switch (s) {
    case SourceFilter.agent: return kGold;
    case SourceFilter.admin: return const Color(0xFF10B981);
    case SourceFilter.landlord: return kBg.withOpacity(0.85);
    case SourceFilter.all: return kBg;
  }
}

Color _sourceBadgeTextColor(SourceFilter s) {
  switch (s) {
    case SourceFilter.landlord: return kCream;
    default: return kBg;
  }
}

List<int?> _getPageNumbers(int current, int total) {
  if (total <= 7) return List.generate(total, (i) => i + 1);
  final pages = <int?>[1];
  if (current > 3) pages.add(null); // null = '...'
  final start = (current - 1).clamp(2, total - 1);
  final end = (current + 1).clamp(2, total - 1);
  for (int i = start; i <= end; i++) pages.add(i);
  if (current < total - 2) pages.add(null);
  pages.add(total);
  return pages;
}

// ── Main Page ────────────────────────────────────────────────
class PropertiesPage extends StatefulWidget {
  const PropertiesPage({super.key});
  @override
  State<PropertiesPage> createState() => _PropertiesPageState();
}

class _PropertiesPageState extends State<PropertiesPage> {
  // Data
  List<PropertyMap> _properties = [];
  bool _loading = true;
  String _error = '';
  Map<String, dynamic>? _pagination;

  // Filters
  String _search = '';
  String _selectedType = '';
  String _priceRange = '';
  int? _bedrooms;
  bool? _furnished;
  SourceFilter _sourceFilter = SourceFilter.all;
  bool _showFilters = false;

  // UI
  ViewMode _viewMode = ViewMode.grid;
  int _currentPage = 1;
  final Set<int> _savedIds = {};

  // Modal
  ModalStep _modal = ModalStep.none;
  PropertyMap? _selProp;
  bool _paying = false;
  String _paymentMethod = 'tigo';
  String _phoneNumber = '';

  // Toast
  final List<_Toast> _toasts = [];

  // Controllers
  final _searchCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _jumpCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  // Debounce
  String _debouncedSearch = '';
  DateTime? _lastSearchChange;

  @override
  void initState() {
    super.initState();
    // Reset enum fields — guards against hot-reload stale state
    _sourceFilter = SourceFilter.all;
    _modal = ModalStep.none;
    _viewMode = ViewMode.grid;
    _loadProperties();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _phoneCtrl.dispose();
    _jumpCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  // ── Toast ────────────────────────────────────────────────
  void _addToast(ToastType type, String title, {String? message, int durationMs = 5000}) {
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    setState(() => _toasts.add(_Toast(id: id, type: type, title: title, message: message, durationMs: durationMs)));
    Future.delayed(Duration(milliseconds: durationMs), () {
      if (mounted) setState(() => _toasts.removeWhere((t) => t.id == id));
    });
  }

  void _removeToast(String id) {
    if (mounted) setState(() => _toasts.removeWhere((t) => t.id == id));
  }

  // ── API ──────────────────────────────────────────────────
  Map<String, String> _buildParams(int page) {
    final p = <String, String>{
      'page': page.toString(),
      'per_page': kItemsPerPage.toString(),
    };
    if (_debouncedSearch.isNotEmpty) p['search'] = _debouncedSearch;
    if (_selectedType.isNotEmpty) p['type'] = _selectedType;
    if (_priceRange == '0-500') { p['min_price'] = '0'; p['max_price'] = '500000'; }
    if (_priceRange == '500-1000') { p['min_price'] = '500000'; p['max_price'] = '1000000'; }
    if (_priceRange == '1000+') p['min_price'] = '1000000';
    if (_bedrooms != null) p['bedrooms'] = _bedrooms.toString();
    if (_furnished != null) p['furnished'] = _furnished! ? 'true' : 'false';
    if (_sourceFilter is SourceFilter) {
      if (_sourceFilter == SourceFilter.agent) p['has_agent'] = 'true';
      if (_sourceFilter == SourceFilter.landlord) p['no_agent'] = 'true';
      if (_sourceFilter == SourceFilter.admin) p['admin_only'] = 'true';
    }
    return p;
  }

  Future<void> _loadProperties({int? page}) async {
    final pg = page ?? _currentPage;
    setState(() { _loading = true; _error = ''; });
    try {
      final uri = Uri.parse('$kApiBase/public/properties')
          .replace(queryParameters: _buildParams(pg));
      final res = await http.get(uri, headers: {'Accept': 'application/json'});
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final items = _extractList(data);
        final pag = _extractPagination(data);
        if (mounted) setState(() {
          _properties = items;
          _pagination = pag;
          _currentPage = pg;
          _loading = false;
        });
      } else {
        if (mounted) setState(() { _error = 'Failed to load properties.'; _loading = false; });
      }
    } catch (e) {
      if (mounted) setState(() { _error = 'Failed to load properties. Please try again.'; _loading = false; });
    }
  }

  List<PropertyMap> _extractList(dynamic data) {
    if (data is List) return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    if (data is Map<String, dynamic>) {
      final d = data['data'];
      if (d is List) return d.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      if (d is Map<String, dynamic>) {
        final n = d['data'];
        if (n is List) return n.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      }
    }
    return [];
  }

  Map<String, dynamic>? _extractPagination(dynamic data) {
    if (data is Map<String, dynamic>) {
      if (data['pagination'] is Map) return Map<String, dynamic>.from(data['pagination'] as Map);
      final d = data['data'];
      if (d is Map<String, dynamic>) {
        return {
          'current_page': d['current_page'] ?? 1,
          'last_page': d['last_page'] ?? 1,
          'per_page': d['per_page'] ?? kItemsPerPage,
          'total': d['total'] ?? 0,
        };
      }
    }
    return null;
  }

  void _onSearchChanged(String val) {
    _search = val;
    _lastSearchChange = DateTime.now();
    Future.delayed(const Duration(milliseconds: 400), () {
      if (_lastSearchChange != null &&
          DateTime.now().difference(_lastSearchChange!).inMilliseconds >= 400) {
        _debouncedSearch = _search;
        _currentPage = 1;
        _loadProperties(page: 1);
      }
    });
  }

  void _onFilterChanged() {
    _currentPage = 1;
    _loadProperties(page: 1);
  }

  void _clearFilters() {
    _searchCtrl.clear();
    setState(() {
      _search = '';
      _debouncedSearch = '';
      _selectedType = '';
      _priceRange = '';
      _bedrooms = null;
      _furnished = null;
      _sourceFilter = SourceFilter.all;
      _currentPage = 1;
    });
    _loadProperties(page: 1);
  }

  int get _activeFilterCount {
    int c = 0;
    if (_selectedType.isNotEmpty) c++;
    if (_priceRange.isNotEmpty) c++;
    if (_bedrooms != null) c++;
    if (_furnished != null) c++;
    if (_sourceFilter is SourceFilter && _sourceFilter != SourceFilter.all) c++;
    return c;
  }

  // ── Pagination ───────────────────────────────────────────
  int get _totalPages => (_pagination?['last_page'] as int?) ?? 1;
  int get _pageStart {
    final cur = (_pagination?['current_page'] as int?) ?? 1;
    final per = (_pagination?['per_page'] as int?) ?? kItemsPerPage;
    return (cur - 1) * per + 1;
  }
  int get _pageEnd {
    final cur = (_pagination?['current_page'] as int?) ?? 1;
    final per = (_pagination?['per_page'] as int?) ?? kItemsPerPage;
    final tot = (_pagination?['total'] as int?) ?? 0;
    return (cur * per).clamp(0, tot);
  }
  int get _paginationTotal => (_pagination?['total'] as int?) ?? _properties.length;

  void _goToPage(int page) {
    if (page < 1 || page > _totalPages) return;
    _loadProperties(page: page);
    _scrollCtrl.animateTo(0, duration: const Duration(milliseconds: 400), curve: Curves.easeOut);
  }

  // ── Modal actions ────────────────────────────────────────
  void _handleApply(PropertyMap property) {
    setState(() {
      _selProp = property;
      // In real app: check token. For now always show apply (logged in flow).
      _modal = ModalStep.apply;
    });
  }

  void _closeModal() {
    if (_paying) return;
    setState(() {
      _modal = ModalStep.none;
      _selProp = null;
      _phoneNumber = '';
      _phoneCtrl.clear();
    });
  }

  Future<void> _handlePay() async {
    if (_phoneNumber.length < 10) {
      _addToast(ToastType.warning, 'Invalid phone number',
          message: 'Please enter a valid mobile money number (at least 10 digits).',
          durationMs: 5000);
      return;
    }
    setState(() => _paying = true);
    try {
      final propertyId = _selProp?['id'] as int?;
      if (propertyId == null) {
        _addToast(ToastType.error, 'Payment failed',
            message: 'Property information is missing.', durationMs: 7000);
        return;
      }

      // Get user data from backend for payment
      final userService = UserService();
      await userService.ensureLoaded();
      final token = userService.token;
      print('Token from UserService: $token');
      
      if (token == null) {
        _addToast(ToastType.error, 'Authentication required',
            message: 'Please log in to continue.', durationMs: 7000);
        setState(() => _paying = false);
        return;
      }

      // Fetch user data using the token
      final response = await http.get(
        Uri.parse('$kApiBase/user'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('User data response status: ${response.statusCode}');
      print('User data response body: ${response.body}');

      Map<String, dynamic>? userData;
      if (response.statusCode == 200) {
        userData = jsonDecode(response.body);
      }

      final tenantId = userData?['id'] ?? 0;
      final customerEmail = userData?['email'] ?? 'tenant@oweru.com';
      final firstName = userData?['first_name'] ?? '';
      final lastName = userData?['last_name'] ?? '';
      final customerName = (firstName.isNotEmpty && lastName.isNotEmpty)
          ? '$firstName $lastName'
          : (firstName.isNotEmpty ? firstName : 'Customer');

      print('Payment parameters: tenantId=$tenantId, customerEmail=$customerEmail, customerName=$customerName');

      // Initiate real Selcom payment - backend will handle authentication via token in headers
      final paymentResponse = await TenantApiService.initiateSelcomPayment(
        amount: 20000.0, // TZS 20,000 site visit fee
        phoneNumber: _phoneNumber,
        provider: _paymentMethod,
        propertyId: propertyId,
        tenantId: tenantId, // Use actual tenant ID from backend
        paymentType: 'site_visit',
        customerEmail: customerEmail,
        customerName: customerName,
      );

      print('Payment response: $paymentResponse');

      if (paymentResponse['success'] == true) {
        final transactionId = paymentResponse['data']?['transaction_id'] ?? paymentResponse['transaction_id'];
        _addToast(ToastType.success, 'Payment initiated',
            message: 'Check your ${_paymentMethod.toUpperCase()} prompt. Ref: $transactionId', durationMs: 8000);

        // Create application after successful payment initiation
        final applicationData = {
          'property_id': propertyId,
          'status': 'pending',
          'payment_status': 'paid',
          'payment_method': _paymentMethod,
          'transaction_id': transactionId,
        };

        await TenantApiService.createApplication(applicationData);

        if (mounted) setState(() { _modal = ModalStep.success; });
      } else {
        final errorMessage = paymentResponse['message'] ?? paymentResponse['error'] ?? 'Payment initiation failed';
        _addToast(ToastType.error, 'Payment failed',
            message: errorMessage, durationMs: 7000);
      }
    } catch (e) {
      print('Payment error: $e');
      _addToast(ToastType.error, 'Payment failed',
          message: 'Something went wrong. Please try again.', durationMs: 7000);
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  void _handleSave(PropertyMap property) {
    final id = property['id'] as int?;
    if (id == null) return;
    setState(() {
      if (_savedIds.contains(id)) {
        _savedIds.remove(id);
        _addToast(ToastType.info, 'Removed from saved', durationMs: 3000);
      } else {
        _savedIds.add(id);
        _addToast(ToastType.success, 'Property saved',
            message: 'You can view saved properties in your dashboard.', durationMs: 3500);
      }
    });
  }

  void _handleShare(PropertyMap property) {
    final id = property['id'];
    Clipboard.setData(ClipboardData(text: 'https://rental.oweru.com/property/$id'));
    _addToast(ToastType.info, 'Link copied', message: 'Property link copied to clipboard.', durationMs: 3000);
  }

  // ── Build ────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      Scaffold(
        backgroundColor: kBg,
        body: NestedScrollView(
          controller: _scrollCtrl,
          headerSliverBuilder: (_, __) => [
            _buildHeader(),
            SliverToBoxAdapter(child: _buildSearchBar()),
            SliverToBoxAdapter(child: _buildSourceTabs()),
            SliverToBoxAdapter(child: _buildAdvancedFilters()),
          ],
          body: _buildBody(),
        ),
      ),
      // Modals
      if (_modal == ModalStep.auth && _selProp != null)
        _AuthModal(
          property: _selProp!,
          onClose: _closeModal,
          onLogin: () { _closeModal(); Navigator.of(context).pushNamed('/login'); },
          onSignup: () { _closeModal(); Navigator.of(context).pushNamed('/register'); },
        ),
      if (_modal == ModalStep.apply && _selProp != null)
        _ApplyModal(
          property: _selProp!,
          onClose: _closeModal,
          onProceed: () => setState(() => _modal = ModalStep.payment),
        ),
      if (_modal == ModalStep.payment && _selProp != null)
        _PaymentModal(
          processing: _paying,
          onClose: _closeModal,
          onPay: _handlePay,
          phoneNumber: _phoneNumber,
          onPhoneChanged: (v) => setState(() => _phoneNumber = v),
          phoneCtrl: _phoneCtrl,
          paymentMethod: _paymentMethod,
          onMethodChanged: (v) => setState(() => _paymentMethod = v),
        ),
      if (_modal == ModalStep.success)
        _SuccessModal(
          onClose: () {
            _closeModal();
            Navigator.of(context).pushNamed('/dashboard/tenant/applications');
          },
        ),
      // Toasts
      Positioned(
        top: MediaQuery.of(context).padding.top + 12,
        right: 16,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: _toasts.map((t) => _ToastItem(
            toast: t,
            onDismiss: () => _removeToast(t.id),
          )).toList(),
        ),
      ),
    ]);
  }

  // ── Header (sliver) ──────────────────────────────────────
  Widget _buildHeader() => SliverAppBar(
    automaticallyImplyLeading: false,
    backgroundColor: kBg,
    expandedHeight: 170,
    pinned: true,
    flexibleSpace: FlexibleSpaceBar(
      background: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0A0F1E), kBg2],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // Eyebrow
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: kGoldDim,
                  border: Border.all(color: kGoldBorder),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.list_rounded, color: kGold, size: 10),
                  SizedBox(width: 6),
                  Text('BROWSE LISTINGS',
                    style: TextStyle(color: kGold, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
                ]),
              ),
              const SizedBox(height: 10),
              // Title
              RichText(text: const TextSpan(
                style: TextStyle(fontFamily: 'serif', fontSize: 28, fontWeight: FontWeight.w300, color: kCream, height: 1.1),
                children: [
                  TextSpan(text: 'Available\n'),
                  TextSpan(text: 'Properties', style: TextStyle(color: kGold, fontStyle: FontStyle.italic)),
                ],
              )),
              const SizedBox(height: 10),
              // Source pills
              Wrap(spacing: 6, children: [
                _buildHeaderPill('Agent listings', kGoldDim, kGold, kGoldBorder),
                _buildHeaderPill('Landlord listings',
                  Colors.white.withOpacity(0.08), Colors.white.withOpacity(0.65), Colors.white.withOpacity(0.12)),
                _buildHeaderPill('Oweru Rentals',
                  const Color(0xFF10B981).withOpacity(0.12), const Color(0xFF34D399), const Color(0xFF10B981).withOpacity(0.25)),
              ]),
            ]),
          ),
        ),
      ),
      title: Padding(
        padding: const EdgeInsets.only(right: 8),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Properties', style: TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
          Text(
            _loading ? 'Loading…' : '${_paginationTotal} listings',
            style: const TextStyle(color: kSlate, fontSize: 12),
          ),
        ]),
      ),
    ),
  );

  Widget _buildHeaderPill(String label, Color bg, Color fg, Color border) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: bg, border: Border.all(color: border), borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 0.1)),
  );

  // ── Search Bar ───────────────────────────────────────────
  Widget _buildSearchBar() => Container(
    color: kBg2,
    padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
    child: Column(children: [
      Wrap(
        spacing: 8,
        runSpacing: 8,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          // Search input
          SizedBox(
            width: 200,
            child: Container(
              decoration: BoxDecoration(
                color: kBg3,
                border: Border.all(color: kBorder),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 10),
                  child: Icon(Icons.search_rounded, color: kSlate, size: 16),
                ),
                Expanded(
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: _onSearchChanged,
                    style: const TextStyle(color: kCream, fontSize: 13),
                    decoration: const InputDecoration(
                      hintText: 'Location or property name…',
                      hintStyle: TextStyle(color: kSlateDim, fontSize: 13),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
                if (_search.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: kSlate, size: 16),
                    onPressed: () {
                      _searchCtrl.clear();
                      _onSearchChanged('');
                    },
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                  ),
              ]),
            ),
          ),
          // Type dropdown
          _buildDropdown(
            value: _selectedType,
            items: const [
              DropdownMenuItem(value: '', child: Text('All types')),
              DropdownMenuItem(value: 'house', child: Text('House')),
              DropdownMenuItem(value: 'Master-bedroom', child: Text('Master-bedroom')),
              DropdownMenuItem(value: 'Single-room', child: Text('Single room')),
              DropdownMenuItem(value: 'apartment', child: Text('Apartment')),
              DropdownMenuItem(value: 'villa', child: Text('Villa')),
              DropdownMenuItem(value: 'studio', child: Text('Studio')),
            ],
            onChanged: (v) { setState(() => _selectedType = v ?? ''); _onFilterChanged(); },
          ),
          // Price dropdown
          _buildDropdown(
            value: _priceRange,
            items: const [
              DropdownMenuItem(value: '', child: Text('All prices')),
              DropdownMenuItem(value: '0-500', child: Text('Under 500K')),
              DropdownMenuItem(value: '500-1000', child: Text('500K–1M')),
              DropdownMenuItem(value: '1000+', child: Text('Above 1M')),
            ],
            onChanged: (v) { setState(() => _priceRange = v ?? ''); _onFilterChanged(); },
          ),
          // Filter toggle
          GestureDetector(
            onTap: () => setState(() => _showFilters = !_showFilters),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
              decoration: BoxDecoration(
                color: _showFilters ? kGoldDim : kBg3,
                border: Border.all(color: _showFilters ? kGold : kBorder),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.tune_rounded, color: _showFilters ? kGold : kSlate, size: 14),
                const SizedBox(width: 5),
                Text('Filters', style: TextStyle(color: _showFilters ? kGold : kSlate, fontSize: 12, fontWeight: FontWeight.w600)),
                if (_activeFilterCount > 0) ...[
                  const SizedBox(width: 6),
                  Container(
                    width: 16, height: 16,
                  decoration: const BoxDecoration(color: kGold, shape: BoxShape.circle),
                  child: Center(child: Text('$_activeFilterCount',
                    style: const TextStyle(color: kBg, fontSize: 9, fontWeight: FontWeight.w700))),
                ),
              ],
            ]),
          ),
        ),
        const SizedBox(width: 8),
        // View toggle
        _buildViewBtn(Icons.grid_view_rounded, ViewMode.grid),
        const SizedBox(width: 4),
        _buildViewBtn(Icons.list_rounded, ViewMode.list),
      ]),
    ]),
  );

  Widget _buildDropdown({
    required String value,
    required List<DropdownMenuItem<String>> items,
    required ValueChanged<String?> onChanged,
  }) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10),
    decoration: BoxDecoration(
      color: kBg3, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(8)),
    child: DropdownButton<String>(
      value: value,
      items: items,
      onChanged: onChanged,
      dropdownColor: kBg2,
      style: const TextStyle(color: kSlate, fontSize: 12, fontFamily: 'sans-serif'),
      underline: const SizedBox(),
      icon: const Icon(Icons.keyboard_arrow_down_rounded, color: kSlate, size: 16),
      isDense: true,
    ),
  );

  Widget _buildViewBtn(IconData icon, ViewMode mode) => GestureDetector(
    onTap: () => setState(() => _viewMode = mode),
    child: Container(
      width: 34, height: 34,
      decoration: BoxDecoration(
        color: _viewMode == mode ? kGold : kBg3,
        border: Border.all(color: _viewMode == mode ? kGold : kBorder),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, color: _viewMode == mode ? kBg : kSlate, size: 16),
    ),
  );

  // ── Source tabs ──────────────────────────────────────────
  Widget _buildSourceTabs() => Container(
    color: kBg2,
    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
    child: SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(children: SourceFilter.values.map((s) {
        final sel = (_sourceFilter is SourceFilter) && _sourceFilter == s;
        Color bg, border, fg;
        if (!sel) {
          bg = kBg3; border = kBorder; fg = kSlate;
        } else if (s == SourceFilter.agent) {
          bg = kGold; border = kGold; fg = kBg;
        } else if (s == SourceFilter.admin) {
          bg = const Color(0xFF0F6E56); border = const Color(0xFF0F6E56); fg = Colors.white;
        } else {
          bg = kBg3; border = kGold; fg = kCream;
        }
        final icons = {
          SourceFilter.all: Icons.list_rounded,
          SourceFilter.agent: Icons.people_rounded,
          SourceFilter.landlord: Icons.home_rounded,
          SourceFilter.admin: Icons.business_rounded,
        };
        return Padding(
          padding: const EdgeInsets.only(right: 4),
          child: GestureDetector(
            onTap: () { setState(() => _sourceFilter = s); _onFilterChanged(); },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: bg, border: Border.all(color: border), borderRadius: BorderRadius.circular(8)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(icons[s]!, size: 12, color: fg),
                const SizedBox(width: 5),
                Text(_sourceLabel(s), style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w600)),
              ]),
            ),
          ),
        );
      }).toList()),
    ),
  );

  // ── Advanced filters ─────────────────────────────────────
  Widget _buildAdvancedFilters() => AnimatedCrossFade(
    firstChild: const SizedBox(height: 12),
    secondChild: Container(
      color: kBg2,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: Row(children: [
        const Text('REFINE', style: TextStyle(
          color: kSlate, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 2)),
        const SizedBox(width: 12),
        _buildDropdown(
          value: _bedrooms?.toString() ?? '',
          items: const [
            DropdownMenuItem(value: '', child: Text('Bedrooms')),
            DropdownMenuItem(value: '1', child: Text('1+')),
            DropdownMenuItem(value: '2', child: Text('2+')),
            DropdownMenuItem(value: '3', child: Text('3+')),
            DropdownMenuItem(value: '4', child: Text('4+')),
          ],
          onChanged: (v) {
            setState(() => _bedrooms = (v != null && v.isNotEmpty) ? int.tryParse(v) : null);
            _onFilterChanged();
          },
        ),
        const SizedBox(width: 8),
        _buildDropdown(
          value: _furnished == null ? '' : (_furnished! ? 'true' : 'false'),
          items: const [
            DropdownMenuItem(value: '', child: Text('Furnishing')),
            DropdownMenuItem(value: 'true', child: Text('Furnished')),
            DropdownMenuItem(value: 'false', child: Text('Unfurnished')),
          ],
          onChanged: (v) {
            setState(() => _furnished = v == null || v.isEmpty ? null : v == 'true');
            _onFilterChanged();
          },
        ),
        if (_activeFilterCount > 0 || _search.isNotEmpty) ...[
          const Spacer(),
          GestureDetector(
            onTap: _clearFilters,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(8)),
              child: const Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.close, color: kSlate, size: 11),
                SizedBox(width: 5),
                Text('Clear all', style: TextStyle(color: kSlate, fontSize: 12)),
              ]),
            ),
          ),
        ],
      ]),
    ),
    crossFadeState: _showFilters ? CrossFadeState.showSecond : CrossFadeState.showFirst,
    duration: const Duration(milliseconds: 250),
  );

  // ── Body ─────────────────────────────────────────────────
  Widget _buildBody() {
    if (_loading) return _buildSkeleton();
    return RefreshIndicator(
      onRefresh: () => _loadProperties(),
      color: kGold,
      backgroundColor: kBg2,
      child: CustomScrollView(slivers: [
        if (_error.isNotEmpty)
          SliverToBoxAdapter(child: _buildErrorBanner()),
        if (_properties.isEmpty)
          SliverFillRemaining(child: _buildEmpty())
        else ...[
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            sliver: _viewMode == ViewMode.grid
                ? SliverGrid(
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => _PropertyCard(
                        property: _properties[i],
                        isSaved: _savedIds.contains(_properties[i]['id']),
                        onSave: () => _handleSave(_properties[i]),
                        onApply: () => _handleApply(_properties[i]),
                        onShare: () => _handleShare(_properties[i]),
                        onTap: () => Navigator.push(context, MaterialPageRoute(
                          builder: (_) => PropertyDetailPage(property: _properties[i]))),
                      ),
                      childCount: _properties.length,
                    ),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2, crossAxisSpacing: 16, mainAxisSpacing: 16, childAspectRatio: 0.95),
                  )
                : SliverList(delegate: SliverChildBuilderDelegate(
                    (_, i) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _PropertyCard(
                        property: _properties[i],
                        isSaved: _savedIds.contains(_properties[i]['id']),
                        onSave: () => _handleSave(_properties[i]),
                        onApply: () => _handleApply(_properties[i]),
                        onShare: () => _handleShare(_properties[i]),
                        onTap: () => Navigator.push(context, MaterialPageRoute(
                          builder: (_) => PropertyDetailPage(property: _properties[i]))),
                        isList: true,
                      ),
                    ),
                    childCount: _properties.length,
                  )),
          ),
          if (_totalPages > 1)
            SliverToBoxAdapter(child: _buildPagination()),
          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ]),
    );
  }

  // ── Skeleton ─────────────────────────────────────────────
  Widget _buildSkeleton() => GridView.builder(
    padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: 2, crossAxisSpacing: 16, mainAxisSpacing: 16, childAspectRatio: 0.95),
    itemCount: kItemsPerPage,
    itemBuilder: (_, __) => const _SkeletonCard(),
  );

  // ── Error banner ─────────────────────────────────────────
  Widget _buildErrorBanner() => Container(
    margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    decoration: BoxDecoration(
      color: const Color(0xFFEF4444).withOpacity(0.08),
      border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.25)),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(children: [
      Expanded(child: Text(_error, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13))),
      TextButton(
        onPressed: _loadProperties,
        child: const Text('Retry', style: TextStyle(color: Color(0xFFEF4444), fontSize: 12)),
      ),
    ]),
  );

  // ── Empty ────────────────────────────────────────────────
  Widget _buildEmpty() => Center(
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Container(
        width: 60, height: 60,
        decoration: BoxDecoration(
          color: kGoldDim, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.search_rounded, color: kGold, size: 22),
      ),
      const SizedBox(height: 20),
      const Text('No properties found', style: TextStyle(
        color: kCream, fontSize: 22, fontWeight: FontWeight.w300)),
      const SizedBox(height: 6),
      const Text('Try adjusting your filters or search terms.',
        style: TextStyle(color: kSlate, fontSize: 14)),
      if (_activeFilterCount > 0 || _search.isNotEmpty) ...[
        const SizedBox(height: 24),
        GestureDetector(
          onTap: _clearFilters,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
            decoration: BoxDecoration(
              border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(8)),
            child: const Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.close, color: kSlate, size: 13),
              SizedBox(width: 6),
              Text('Clear filters', style: TextStyle(color: kSlate, fontSize: 13)),
            ]),
          ),
        ),
      ],
    ]),
  );

  // ── Pagination ───────────────────────────────────────────
  Widget _buildPagination() => Padding(
    padding: const EdgeInsets.fromLTRB(16, 32, 16, 0),
    child: Column(children: [
      Text(
        'Showing $_pageStart–$_pageEnd of $_paginationTotal properties',
        style: const TextStyle(color: kSlate, fontSize: 13),
      ),
      const SizedBox(height: 14),
      Wrap(
        alignment: WrapAlignment.center,
        spacing: 4,
        runSpacing: 4,
        children: [
          // Prev
          _PagBtn(
            label: '← Prev',
            disabled: _currentPage == 1,
            onTap: () => _goToPage(_currentPage - 1),
          ),
          // Page numbers
          ..._getPageNumbers(_currentPage, _totalPages).map((p) {
            if (p == null) return const _PagBtn(label: '…', disabled: true, isDots: true);
            return _PagBtn(
              label: '$p',
              active: p == _currentPage,
              onTap: () => _goToPage(p),
            );
          }),
          // Next
          _PagBtn(
            label: 'Next →',
            disabled: _currentPage == _totalPages,
            onTap: () => _goToPage(_currentPage + 1),
          ),
        ],
      ),
      const SizedBox(height: 14),
      // Jump to page
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Text('Go to page', style: TextStyle(color: kSlate, fontSize: 13)),
        const SizedBox(width: 8),
        SizedBox(
          width: 56,
          child: TextField(
            controller: _jumpCtrl,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            style: const TextStyle(color: kCream, fontSize: 13),
            decoration: InputDecoration(
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
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
                borderSide: const BorderSide(color: kGold, width: 1.5),
              ),
              fillColor: kBg3,
              filled: true,
            ),
            onSubmitted: (v) {
              final pg = int.tryParse(v);
              if (pg != null) _goToPage(pg);
            },
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: () {
            final pg = int.tryParse(_jumpCtrl.text);
            if (pg != null) _goToPage(pg);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            decoration: BoxDecoration(
              color: kBg3, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(8)),
            child: const Text('Go', style: TextStyle(color: kSlate, fontSize: 13)),
          ),
        ),
      ]),
    ]),
  );
}

// ── Pagination Button ────────────────────────────────────────
class _PagBtn extends StatelessWidget {
  final String label;
  final bool active;
  final bool disabled;
  final bool isDots;
  final VoidCallback? onTap;
  const _PagBtn({required this.label, this.active = false, this.disabled = false, this.isDots = false, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: (disabled || isDots) ? null : onTap,
      child: Container(
        height: 38,
        constraints: const BoxConstraints(minWidth: 38),
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: active ? kGold : kBg2,
          border: Border.all(color: active ? kGold : (isDots ? Colors.transparent : kBorder)),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Text(label, style: TextStyle(
            color: active ? kBg : (disabled ? kSlateDim : kSlate),
            fontSize: isDots ? 16 : 13,
            fontWeight: FontWeight.w500,
          )),
        ),
      ),
    );
  }
}

// ── Skeleton Card ─────────────────────────────────────────────
class _SkeletonCard extends StatefulWidget {
  const _SkeletonCard();
  @override State<_SkeletonCard> createState() => _SkeletonCardState();
}
class _SkeletonCardState extends State<_SkeletonCard> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))..repeat(reverse: true);
  }
  @override void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: Tween<double>(begin: 0.25, end: 0.6).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut)),
    child: Container(
      decoration: BoxDecoration(
        color: kBg2, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(12)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Expanded(
          flex: 5,
          child: Container(
            decoration: const BoxDecoration(
              color: kBg3, borderRadius: BorderRadius.vertical(top: Radius.circular(12)))),
        ),
        Expanded(
          flex: 4,
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(height: 10, width: 80, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
              const SizedBox(height: 6),
              Container(height: 12, width: 120, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
              const SizedBox(height: 6),
              Container(height: 8, width: 90, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
              const SizedBox(height: 8),
              Row(children: [
                Container(height: 8, width: 40, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
                const SizedBox(width: 6),
                Container(height: 8, width: 40, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
              ]),
            ]),
          ),
        ),
      ]),
    ),
  );
}

// ── Property Card ─────────────────────────────────────────────
class _PropertyCard extends StatelessWidget {
  final PropertyMap property;
  final bool isSaved;
  final VoidCallback onSave;
  final VoidCallback onApply;
  final VoidCallback onShare;
  final VoidCallback onTap;
  final bool isList;
  const _PropertyCard({
    required this.property, 
    required this.isSaved,
    required this.onSave,
    required this.onApply,
    required this.onShare,
    required this.onTap,
    this.isList = false,
  });

  String get _imageUrl => _getImageUrl(property);
  String get _location => (property['location'] ?? property['address'] ?? '').toString();
  String get _type => (property['type'] ?? '').toString();
  bool get _featured => property['featured'] == true;
  bool get _furnished => property['furnished'] == true;
  SourceFilter get _source => _getSource(property);
  int get _beds => _toInt(property['bedrooms']);
  int get _baths => _toInt(property['bathrooms']);
  int get _size => _toInt(property['size'] ?? property['area']);

  int _toInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    if (isList) return _buildListCard();
    return _buildGridCard();
  }

  Widget _buildGridCard() => GestureDetector(
    onTap: onTap,
    child: Container(
      decoration: BoxDecoration(
        color: kBg2, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.18), blurRadius: 14, offset: const Offset(0, 4))]),
      clipBehavior: Clip.hardEdge,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Expanded(
          flex: 4,
          child: _buildImageSection(),          
        ),
        Expanded(
          flex: 5,
          child: _buildInfoSection(),
        ),
      ]),
    ),
  );

  Widget _buildListCard() => GestureDetector(
    onTap: onTap,
    child: Container(
      decoration: BoxDecoration(
        color: kBg2, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.18), blurRadius: 14, offset: const Offset(0, 4))]),
      clipBehavior: Clip.hardEdge,
      child: Row(children: [
        SizedBox(width: 200, child: _buildImageSection()),
        Expanded(child: _buildInfoSection()),
      ]),
    ),
  );

  Widget _buildImageSection() => SizedBox(
    child: AspectRatio(
      aspectRatio: isList ? 0.75 : 4 / 3,
      child: Stack(fit: StackFit.expand, children: [
        _imageUrl.isNotEmpty
            ? Image.network(
                _imageUrl,
                fit: BoxFit.cover,
                frameBuilder: (_, child, frame, __) => frame == null
                    ? Container(color: kBg3, child: const Icon(Icons.image_rounded, color: kSlateDim, size: 32))
                    : child,
                errorBuilder: (_, __, ___) =>
                    Container(color: kBg3, child: const Icon(Icons.image_rounded, color: kSlateDim, size: 32)),
              )
            : Container(color: kBg3, child: const Icon(Icons.image_rounded, color: kSlateDim, size: 32)),

        // Gradient overlay
        Container(decoration: const BoxDecoration(gradient: LinearGradient(
          begin: Alignment.topCenter, end: Alignment.bottomCenter,
          colors: [Colors.transparent, Color(0xEE0A0F1E)], stops: [0.3, 1.0]))),

        // Featured badge
        if (_featured)
          Positioned(top: 10, left: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: kGold, borderRadius: BorderRadius.circular(4)),
              child: const Text('Featured', style: TextStyle(color: kBg, fontSize: 9, fontWeight: FontWeight.w700)),
            )),

        // Source badge
        Positioned(top: 10, right: 10,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: _sourceBadgeColor(_source).withOpacity(0.9), borderRadius: BorderRadius.circular(4)),
            child: Text(
              _source == SourceFilter.agent ? 'AGENT' :
              _source == SourceFilter.admin ? 'OWERU' : 'LANDLORD',
              style: TextStyle(color: _sourceBadgeTextColor(_source), fontSize: 8, fontWeight: FontWeight.w700, letterSpacing: 0.5),
            ),
          )),

        // Type badge
        if (_type.isNotEmpty)
          Positioned(bottom: 10, left: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.75), borderRadius: BorderRadius.circular(4)),
              child: Text(
                _type[0].toUpperCase() + _type.substring(1),
                style: const TextStyle(color: kCream, fontSize: 9, fontWeight: FontWeight.w600, letterSpacing: 1)),
            )),

        // Price
        Positioned(bottom: 10, right: 10,
          child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(_formatPrice(property['price']),
              style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w400)),
            const Text('/month', style: TextStyle(color: kSlateDim, fontSize: 10)),
          ])),
      ]),
    ),
  );

  Widget _buildInfoSection() => Padding(
    padding: EdgeInsets.fromLTRB(isList ? 16 : 8, isList ? 16 : 6, isList ? 16 : 8, isList ? 16 : 6),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: _buildInfoContent(),
    ),
  );

  List<Widget> _buildInfoContent() => [
    if (_location.isNotEmpty)
      Row(children: [
        const Icon(Icons.location_on_rounded, color: kGold, size: 8),
        const SizedBox(width: 2),
        Expanded(child: Text(_location,
          style: TextStyle(color: kSlate, fontSize: isList ? 12 : 7),
          maxLines: 1, overflow: TextOverflow.ellipsis)),
      ]),
    SizedBox(height: isList ? 6 : 1),
    Text((property['title'] ?? 'Untitled Property').toString(),
      style: TextStyle(color: kCream, fontSize: isList ? 16 : 10, fontWeight: FontWeight.w700),
      maxLines: isList ? 2 : 1, overflow: TextOverflow.ellipsis),
    if (isList && property['description'] != null && property['description'].toString().isNotEmpty) ...[
      const SizedBox(height: 5),
      Text(property['description'].toString(),
        style: const TextStyle(color: kSlate, fontSize: 12, fontWeight: FontWeight.w300, height: 1.4),
        maxLines: 3, overflow: TextOverflow.ellipsis),
    ],
    // Specs divider - only for list view
    if (isList)
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Divider(color: kGold.withOpacity(0.1), height: 1)),
    // Specs row - use Wrap for overflow handling
    Wrap(
      spacing: 3,
      runSpacing: 1,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        if (_beds > 0) _spec(Icons.bed_rounded, '$_beds'),
        if (_baths > 0) _spec(Icons.bathtub_rounded, '$_baths'),
        if (_size > 0) _spec(Icons.square_foot_rounded, '$_size'),
      ],
    ),
    SizedBox(height: isList ? 12 : 2),
    // Footer: furnished tag + action buttons - use Wrap for overflow handling
    Wrap(
      spacing: 2,
      runSpacing: 2,
      alignment: WrapAlignment.spaceBetween,
      children: [
        if (_furnished && isList)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: kGoldDim, border: Border.all(color: kGoldBorder), borderRadius: BorderRadius.circular(4)),
            child: const Text('Furnished', style: TextStyle(color: kGold, fontSize: 9, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
          ),
        // Save
        GestureDetector(
          onTap: onSave,
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: isList ? 10 : 4, vertical: isList ? 6 : 2),
            decoration: BoxDecoration(
              color: isSaved ? kGold : Colors.transparent,
              border: Border.all(color: isSaved ? kGold : kBorder),
              borderRadius: BorderRadius.circular(3),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                color: isSaved ? kBg : kSlate, size: isList ? 12 : 7),
              if (isList) const SizedBox(width: 4),
              if (isList) Text(isSaved ? 'Saved' : 'Save',
                style: TextStyle(color: isSaved ? kBg : kSlate, fontSize: 11, fontWeight: FontWeight.w600)),
            ]),
          ),
        ),
        // Share
        GestureDetector(
          onTap: onShare,
          child: Container(
            width: isList ? 30 : 22, height: isList ? 30 : 22,
            decoration: BoxDecoration(border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(3)),
            child: Icon(Icons.share_rounded, color: kSlate, size: isList ? 14 : 8),
          ),
        ),
        // Apply
        GestureDetector(
          onTap: onApply,
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: isList ? 14 : 5, vertical: isList ? 6 : 2),
            decoration: BoxDecoration(color: kGold, borderRadius: BorderRadius.circular(3)),
            child: Text('Visit', style: TextStyle(color: kBg, fontSize: isList ? 12 : 7, fontWeight: FontWeight.w700)),
          ),
        ),
      ],
    ),
  ];

  Widget _spec(IconData icon, String label) => Row(children: [
    Icon(icon, color: kGold, size: isList ? 12 : 10),
    SizedBox(width: isList ? 4 : 2),
    Text(label, style: TextStyle(color: kSlate, fontSize: isList ? 11 : 9)),
  ]);
}

class _SpecDiv extends StatelessWidget {
  const _SpecDiv();
  @override
  Widget build(BuildContext context) => Container(
    width: 1, height: 12, margin: const EdgeInsets.symmetric(horizontal: 8), color: kBorder);
}

// ── Toast Item ───────────────────────────────────────────────
class _ToastItem extends StatelessWidget {
  final _Toast toast;
  final VoidCallback onDismiss;
  const _ToastItem({required this.toast, required this.onDismiss});

  Color get _color {
    switch (toast.type) {
      case ToastType.success: return const Color(0xFF10B981);
      case ToastType.error:   return const Color(0xFFEF4444);
      case ToastType.warning: return const Color(0xFFF59E0B);
      case ToastType.info:    return kGold;
    }
  }

  IconData get _icon {
    switch (toast.type) {
      case ToastType.success: return Icons.check_circle_outline_rounded;
      case ToastType.error:   return Icons.error_outline_rounded;
      case ToastType.warning: return Icons.warning_amber_rounded;
      case ToastType.info:    return Icons.info_outline_rounded;
    }
  }

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    constraints: const BoxConstraints(maxWidth: 340, minWidth: 240),
    decoration: BoxDecoration(
      color: kBg2,
      border: Border.all(color: kBorder),
      borderRadius: BorderRadius.circular(14),
      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.4), blurRadius: 24)],
    ),
    child: Stack(children: [
      // Left color bar
      Positioned(left: 0, top: 0, bottom: 0, child: Container(
        width: 3, decoration: BoxDecoration(
          color: _color, borderRadius: const BorderRadius.horizontal(left: Radius.circular(14))))),
      Padding(
        padding: const EdgeInsets.fromLTRB(14, 13, 12, 13),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 34, height: 34,
            decoration: BoxDecoration(color: _color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
            child: Icon(_icon, color: _color, size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(toast.title, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
            if (toast.message != null) ...[
              const SizedBox(height: 2),
              Text(toast.message!, style: const TextStyle(color: kSlate, fontSize: 12, height: 1.5)),
            ],
          ])),
          GestureDetector(
            onTap: onDismiss,
            child: Container(
              width: 24, height: 24,
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(6)),
              child: const Icon(Icons.close, color: kSlate, size: 13),
            ),
          ),
        ]),
      ),
    ]),
  );
}

// ── Shared modal shell ────────────────────────────────────────
class _ModalShell extends StatelessWidget {
  final Widget child;
  final VoidCallback onClose;
  const _ModalShell({required this.child, required this.onClose});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onClose,
    child: Container(
      color: Colors.black.withOpacity(0.82),
      child: Center(
        child: GestureDetector(
          onTap: () {},
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            constraints: const BoxConstraints(maxWidth: 460, maxHeight: 680),
            decoration: BoxDecoration(
              color: kBg2,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: kBorder),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 60)],
            ),
            clipBehavior: Clip.hardEdge,
            child: child,
          ),
        ),
      ),
    ),
  );
}

// ── Modal header ─────────────────────────────────────────────
class _ModalHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final VoidCallback onClose;
  const _ModalHeader({required this.title, this.subtitle, required this.onClose});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(24, 24, 14, 20),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFF0F172A), Color(0xFF1E2D4A)],
        begin: Alignment.topLeft, end: Alignment.bottomRight),
      border: Border(bottom: BorderSide(color: kBorder)),
    ),
    child: Stack(children: [
      // Gold top bar
      Positioned(top: -24, left: -24, right: -14, child: Container(height: 2, color: kGold)),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(
          color: kCream, fontSize: 20, fontWeight: FontWeight.w300, letterSpacing: -0.01)),
        if (subtitle != null) ...[
          const SizedBox(height: 3),
          Text(subtitle!, style: const TextStyle(color: kSlate, fontSize: 12)),
        ],
      ]),
      Positioned(top: 0, right: 0,
        child: GestureDetector(
          onTap: onClose,
          child: Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.08),
              border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(9)),
            child: const Icon(Icons.close, color: kSlate, size: 15),
          ),
        )),
    ]),
  );
}

// ── Auth Modal ───────────────────────────────────────────────
class _AuthModal extends StatelessWidget {
  final PropertyMap property;
  final VoidCallback onClose;
  final VoidCallback onLogin;
  final VoidCallback onSignup;
  const _AuthModal({required this.property, required this.onClose, required this.onLogin, required this.onSignup});

  @override
  Widget build(BuildContext context) => _ModalShell(
    onClose: onClose,
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      // Hero
      Container(
        padding: const EdgeInsets.fromLTRB(28, 34, 28, 24),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F172A), Color(0xFF1E2D4A)],
            begin: Alignment.topLeft, end: Alignment.bottomRight),
        ),
        child: Stack(children: [
          Positioned(top: -34, left: -28, right: -28, child: Container(height: 2, color: kGold)),
          Column(children: [
            GestureDetector(onTap: onClose, child: Align(alignment: Alignment.centerRight,
              child: Container(width: 32, height: 32,
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.08), border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(9)),
                child: const Icon(Icons.close, color: kSlate, size: 15)))),
            const SizedBox(height: 8),
            Container(
              width: 58, height: 58,
              decoration: BoxDecoration(color: kGoldDim, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(17)),
              child: const Icon(Icons.shield_outlined, color: kGold, size: 24)),
            const SizedBox(height: 18),
            const Text('Sign in to Book Visit',
              style: TextStyle(color: kCream, fontSize: 21, fontWeight: FontWeight.w300, letterSpacing: -0.01)),
            const SizedBox(height: 7),
            const Text('You need an account to book a site visit and connect with agents.',
              textAlign: TextAlign.center,
              style: TextStyle(color: kSlate, fontSize: 13, height: 1.55)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.06),
                border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(9)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.location_on_rounded, color: kGold, size: 11),
                const SizedBox(width: 6),
                const Text('Visiting '),
                Text((property['title'] ?? 'Property').toString(),
                  style: const TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 12)),
              ].map((w) => DefaultTextStyle(style: const TextStyle(color: kSlate, fontSize: 12), child: w)).toList()),
            ),
          ]),
        ]),
      ),
      // Options
      Padding(
        padding: const EdgeInsets.all(22),
        child: Column(children: [
          const Align(
            alignment: Alignment.centerLeft,
            child: Text('CHOOSE AN OPTION TO CONTINUE',
              style: TextStyle(color: kSlate, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.6))),
          const SizedBox(height: 12),
          _AuthOption(icon: Icons.login_rounded, iconBg: kGoldDim, iconColor: kGold,
            title: 'Sign in to my account', subtitle: 'I already have an account', onTap: onLogin),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(children: [
              Expanded(child: Divider(color: kBorder)),
              Padding(padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text('or', style: TextStyle(color: kSlate, fontSize: 11))),
              Expanded(child: Divider(color: kBorder)),
            ])),
          _AuthOption(
            icon: Icons.person_add_rounded,
            iconBg: const Color(0xFF10B981).withOpacity(0.1),
            iconColor: const Color(0xFF10B981),
            title: 'Create a free account',
            subtitle: 'New here? Sign up takes under a minute',
            onTap: onSignup),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(0, 0, 0, 16),
        child: TextButton(
          onPressed: onClose,
          child: const Text('Continue browsing', style: TextStyle(color: kSlate, fontSize: 12)),
        ),
      ),
    ]),
  );
}

class _AuthOption extends StatelessWidget {
  final IconData icon;
  final Color iconBg, iconColor;
  final String title, subtitle;
  final VoidCallback onTap;
  const _AuthOption({required this.icon, required this.iconBg, required this.iconColor, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: kBg3, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        Container(
          width: 42, height: 42,
          decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(11)),
          child: Icon(icon, color: iconColor, size: 18)),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(color: kSlate, fontSize: 11)),
        ])),
        const Icon(Icons.arrow_forward_rounded, color: kSlate, size: 15),
      ]),
    ),
  );
}

// ── Apply Modal ──────────────────────────────────────────────
class _ApplyModal extends StatelessWidget {
  final PropertyMap property;
  final VoidCallback onClose;
  final VoidCallback onProceed;
  const _ApplyModal({required this.property, required this.onClose, required this.onProceed});

  @override
  Widget build(BuildContext context) => _ModalShell(
    onClose: onClose,
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      _ModalHeader(title: 'Book Property Site Visit', subtitle: 'Review the details before proceeding', onClose: onClose),
      Flexible(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(22),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Property info card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: kBg3, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(12)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text((property['title'] ?? 'Property').toString(),
                  style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w400)),
                const SizedBox(height: 12),
                if ((property['location'] ?? property['address']) != null)
                  _InfoRow(Icons.location_on_rounded, (property['location'] ?? property['address']).toString()),
                _InfoRow(Icons.credit_card_rounded, 'Monthly rent: ${_formatPrice(property['price'])}'),
                if (property['bedrooms'] != null)
                  _InfoRow(Icons.bed_rounded, 'Bedrooms: ${property['bedrooms']}'),
                if (property['furnished'] == true)
                  _InfoRow(Icons.check_circle_outline_rounded, 'Furnished', color: const Color(0xFF10B981)),
              ]),
            ),
            const SizedBox(height: 16),
            // Fee block
            _FeeBlock(),
            const SizedBox(height: 14),
            const Text(
              'This fee covers the site visit arrangement. Once paid, the agent is notified immediately and will contact you within 24 hours to schedule the visit.',
              style: TextStyle(color: kSlate, fontSize: 12, height: 1.65)),
          ]),
        ),
      ),
      // Footer
      Container(
        padding: const EdgeInsets.fromLTRB(22, 12, 22, 22),
        decoration: BoxDecoration(border: Border(top: BorderSide(color: kBorder))),
        child: Row(children: [
          Expanded(child: _ModalBtn(label: 'Cancel', onTap: onClose)),
          const SizedBox(width: 10),
          Expanded(child: _ModalBtn(label: 'Proceed to Payment', primary: true, onTap: onProceed)),
        ]),
      ),
    ]),
  );
}

// ── Payment Modal ────────────────────────────────────────────
class _PaymentModal extends StatelessWidget {
  final bool processing;
  final VoidCallback onClose;
  final VoidCallback onPay;
  final String phoneNumber;
  final ValueChanged<String> onPhoneChanged;
  final TextEditingController phoneCtrl;
  final String paymentMethod;
  final ValueChanged<String> onMethodChanged;

  const _PaymentModal({
    required this.processing,
    required this.onClose,
    required this.onPay,
    required this.phoneNumber,
    required this.onPhoneChanged,
    required this.phoneCtrl,
    required this.paymentMethod,
    required this.onMethodChanged,
  });

  @override
  Widget build(BuildContext context) {
    final providers = [
      {'value': 'tigo',     'label': 'Tigo Pesa',    'color': const Color(0xFF00D4AA)},
      {'value': 'mpesa',    'label': 'M-Pesa',        'color': const Color(0xFF00C853)},
      {'value': 'airtel',   'label': 'Airtel Money',  'color': const Color(0xFFFF6B35)},
      {'value': 'halopesa', 'label': 'Halopesa',      'color': const Color(0xFF9C27B0)},
    ];

    return _ModalShell(
      onClose: processing ? () {} : onClose,
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        _ModalHeader(title: 'Complete Payment', subtitle: 'Secure checkout · TZS 20,000', onClose: processing ? () {} : onClose),
        Flexible(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(22),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _FeeBlock(),
              const SizedBox(height: 18),
              // Provider label
              const Text('MOBILE MONEY PROVIDER', style: TextStyle(
                color: kSlate, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.6)),
              const SizedBox(height: 10),
              // Provider buttons
              Row(children: providers.map((p) {
                final sel = paymentMethod == p['value'];
                final col = p['color'] as Color;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: GestureDetector(
                      onTap: processing ? null : () => onMethodChanged(p['value'] as String),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        decoration: BoxDecoration(
                          color: sel ? col.withOpacity(0.1) : kBg3,
                          border: Border.all(color: sel ? col : kBorder, width: sel ? 1.5 : 1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          p['label'] as String,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: sel ? col : kSlate,
                            fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList()),
              const SizedBox(height: 18),
              // Phone label
              const Text('PHONE NUMBER', style: TextStyle(
                color: kSlate, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.6)),
              const SizedBox(height: 8),
              TextField(
                controller: phoneCtrl,
                enabled: !processing,
                onChanged: onPhoneChanged,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: kCream, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'e.g. 0712 345 678',
                  hintStyle: const TextStyle(color: kSlateDim),
                  filled: true,
                  fillColor: kBg3,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(9), borderSide: const BorderSide(color: kBorder)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(9), borderSide: const BorderSide(color: kBorder)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(9), borderSide: const BorderSide(color: kGold, width: 1.5)),
                ),
              ),
              const SizedBox(height: 14),
              // Secure badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.08),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2)),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: const Row(children: [
                  Icon(Icons.shield_outlined, color: Color(0xFF10B981), size: 14),
                  SizedBox(width: 8),
                  Text('Powered by Selcom · 256-bit encrypted',
                    style: TextStyle(color: Color(0xFF10B981), fontSize: 12)),
                ]),
              ),
            ]),
          ),
        ),
        // Footer
        Container(
          padding: const EdgeInsets.fromLTRB(22, 12, 22, 22),
          decoration: BoxDecoration(border: Border(top: BorderSide(color: kBorder))),
          child: Row(children: [
            Expanded(child: _ModalBtn(label: 'Cancel', onTap: processing ? null : onClose, disabled: processing)),
            const SizedBox(width: 10),
            Expanded(child: _ModalBtn(
              label: processing ? '' : 'Pay TZS 20,000',
              primary: true,
              loading: processing,
              disabled: processing || phoneNumber.length < 10,
              onTap: onPay,
            )),
          ]),
        ),
      ]),
    );
  }
}

// ── Success Modal ────────────────────────────────────────────
class _SuccessModal extends StatelessWidget {
  final VoidCallback onClose;
  const _SuccessModal({required this.onClose});

  @override
  Widget build(BuildContext context) => _ModalShell(
    onClose: onClose,
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      // Green hero
      Container(
        padding: const EdgeInsets.fromLTRB(28, 34, 28, 26),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF064E3B), Color(0xFF065F46)]),
        ),
        child: Column(children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.14),
              border: Border.all(color: Colors.white.withOpacity(0.22)),
              shape: BoxShape.circle),
            child: const Icon(Icons.check_circle_outline_rounded, color: Colors.white, size: 28)),
          const SizedBox(height: 18),
          const Text('Site Visit Booked!',
            style: TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w300, letterSpacing: -0.01)),
          const SizedBox(height: 7),
          const Text(
            'Payment confirmed. The agent has been notified and will contact you shortly.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0x8CFFFFFF), fontSize: 13, height: 1.55)),
        ]),
      ),
      // Steps
      Padding(
        padding: const EdgeInsets.fromLTRB(22, 18, 22, 8),
        child: Container(
          decoration: BoxDecoration(
            color: kBg3, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(12)),
          child: Column(children: [
            _SuccessStep(Icons.check_rounded, 'Site visit fee received & confirmed'),
            Divider(height: 1, color: kBorder),
            _SuccessStep(Icons.auto_awesome_rounded, 'Agent notified instantly via SMS & email'),
            Divider(height: 1, color: kBorder),
            _SuccessStep(Icons.check_circle_outline_rounded, 'Expect a call or message within 24 hours'),
          ]),
        ),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(22, 8, 22, 22),
        child: _ModalBtn(label: 'View My Applications', primary: true, fullWidth: true, onTap: onClose),
      ),
    ]),
  );
}

class _SuccessStep extends StatelessWidget {
  final IconData icon;
  final String label;
  const _SuccessStep(this.icon, this.label);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
    child: Row(children: [
      Container(
        width: 28, height: 28,
        decoration: BoxDecoration(
          color: const Color(0xFF10B981).withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: const Color(0xFF10B981), size: 14)),
      const SizedBox(width: 12),
      Expanded(child: Text(label, style: const TextStyle(color: kCream, fontSize: 13))),
    ]),
  );
}

// ── Shared widgets ────────────────────────────────────────────
class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color? color;
  const _InfoRow(this.icon, this.text, {this.color});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Row(children: [
      Icon(icon, color: color ?? kGold, size: 12),
      const SizedBox(width: 7),
      Expanded(child: Text(text, style: TextStyle(color: color ?? kSlate, fontSize: 12))),
    ]),
  );
}

class _FeeBlock extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.symmetric(vertical: 20),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFF0F172A), Color(0xFF1E2D4A)],
        begin: Alignment.topLeft, end: Alignment.bottomRight),
      border: Border.all(color: kBorder),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Stack(alignment: Alignment.center, children: [
      Positioned(top: 0, left: 0, right: 0, child: Container(
        height: 2,
        decoration: const BoxDecoration(
          gradient: LinearGradient(colors: [kGold, Color(0xFFD4A843)]),
          borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
        ),
      )),
      Column(children: const [
        Text('TZS 20,000', style: TextStyle(
          color: kGold, fontSize: 28, fontWeight: FontWeight.w300, letterSpacing: -0.02)),
        SizedBox(height: 5),
        Text('Site visit fee · non-refundable', style: TextStyle(color: kSlate, fontSize: 11)),
      ]),
    ]),
  );
}

class _ModalBtn extends StatelessWidget {    
  final String label;
  final bool primary;
  final bool loading;
  final bool disabled;
  final bool fullWidth;
  final VoidCallback? onTap;
  const _ModalBtn({
    required this.label,
    this.primary = false,
    this.loading = false,
    this.disabled = false,
    this.fullWidth = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: (disabled || loading) ? null : onTap,
    child: Container(
      width: fullWidth ? double.infinity : null,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 18),
      decoration: BoxDecoration(
        color: loading ? kGoldDim : (primary ? kGold : kBg3),
        border: Border.all(color: primary ? kGold : kBorder),
        borderRadius: BorderRadius.circular(10),
      ),
      child: loading
          ? const Center(child: SizedBox(width: 18, height: 18,
              child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(kGold))))
          : Center(child: Text(label, style: TextStyle(
              color: primary ? kBg : (disabled ? kSlateDim : kSlate),
              fontSize: 13, fontWeight: FontWeight.w600))),
    ),
  );
}