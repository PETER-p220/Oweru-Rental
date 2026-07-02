import 'dart:async';
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

enum ModalStep { none, auth, apply, payment, pendingPayment, paymentFailed, success }
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

bool _requiresSiteVisitFee(PropertyMap p) => p['agent_id'] != null;

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
    case SourceFilter.landlord: return kBg.withValues(alpha: 0.85);
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
  if (current > 3) pages.add(null);
  final start = (current - 1).clamp(2, total - 1);
  final end = (current + 1).clamp(2, total - 1);
  for (int i = start; i <= end; i++) {
    pages.add(i);
  }
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
  bool _successWasSiteVisit = true;
  String _pendingOrderId = '';
  String _pollMessage = '';
  Timer? _pollTimer;
  int _pollAttempts = 0;
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
    _sourceFilter = SourceFilter.all;
    _modal = ModalStep.none;
    _viewMode = ViewMode.grid;
    _loadProperties();
  }

  @override
  void dispose() {
    _stopPolling();
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
    if (_sourceFilter == SourceFilter.agent) p['has_agent'] = 'true';
    if (_sourceFilter == SourceFilter.landlord) p['no_agent'] = 'true';
    if (_sourceFilter == SourceFilter.admin) p['admin_only'] = 'true';
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
        if (mounted) {
          setState(() {
          _properties = items;
          _pagination = pag;
          _currentPage = pg;
          _loading = false;
        });
        }
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
    if (_sourceFilter != SourceFilter.all) c++;
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
      _modal = ModalStep.apply;
    });
  }

  void _stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
    _pollAttempts = 0;
  }

  void _startPolling() {
    _stopPolling();
    _pollAttempts = 0;
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _pollPaymentStatus());
    _pollPaymentStatus();
  }

  Future<void> _pollPaymentStatus() async {
    if (_pendingOrderId.isEmpty) return;
    _pollAttempts += 1;
    final res = await TenantApiService.checkSiteVisitPaymentStatus(_pendingOrderId);
    final status = res['data']?['payment_status']?.toString();
    if (!mounted) return;

    if (status == 'paid') {
      _stopPolling();
      setState(() {
        _successWasSiteVisit = true;
        _modal = ModalStep.success;
      });
      _addToast(ToastType.success, 'Payment confirmed',
          message: 'Site visit fee received successfully.', durationMs: 6000);
    } else if (status == 'failed') {
      _stopPolling();
      setState(() => _modal = ModalStep.paymentFailed);
    } else if (_pollAttempts >= 40) {
      _stopPolling();
      setState(() => _pollMessage = 'Payment is taking longer than expected. Check My Applications for status.');
    }
  }

  void _closeModal() {
    if (_paying || _modal == ModalStep.pendingPayment) return;
    _stopPolling();
    setState(() {
      _modal = ModalStep.none;
      _selProp = null;
      _phoneNumber = '';
      _phoneCtrl.clear();
      _pendingOrderId = '';
      _pollMessage = '';
    });
  }

  void _cancelPendingPayment() {
    _stopPolling();
    setState(() {
      _pendingOrderId = '';
      _pollMessage = '';
      _modal = ModalStep.payment;
    });
  }

  Future<void> _handleProceedApply() async {
    if (_selProp == null) return;
    if (_requiresSiteVisitFee(_selProp!)) {
      setState(() => _modal = ModalStep.payment);
      return;
    }
    setState(() => _paying = true);
    try {
      final propertyId = _selProp!['id'] as int?;
      if (propertyId == null) {
        _addToast(ToastType.error, 'Application failed', message: 'Property information is missing.');
        return;
      }
      await TenantApiService.createApplication({
        'property_id': propertyId,
        'owner_id': _selProp!['owner_id'],
        'message': 'I am interested in renting ${_selProp!['title'] ?? 'this property'}.',
        'payment_status': 'waived',
      });
      if (mounted) {
        setState(() {
          _successWasSiteVisit = false;
          _modal = ModalStep.success;
        });
      }
    } catch (e) {
      _addToast(ToastType.error, 'Application failed',
          message: 'Could not submit application. Please try again.', durationMs: 7000);
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  Future<void> _handlePay() async {
    if (_phoneNumber.length < 10) {
      _addToast(ToastType.warning, 'Invalid phone number',
          message: 'Please enter a valid mobile money number (at least 10 digits).',
          durationMs: 5000);
      return;
    }
    final propertyId = _selProp?['id'] as int?;
    if (propertyId == null) {
      _addToast(ToastType.error, 'Payment failed', message: 'Property information is missing.');
      return;
    }

    setState(() => _paying = true);
    try {
      final result = await TenantApiService.initiateSiteVisitPayment(
        propertyId: propertyId,
        phoneNumber: _phoneNumber.trim(),
        provider: _paymentMethod,
      );

      final orderId = result['data']?['order_id']?.toString();
      if (result['success'] == true && orderId != null && orderId.isNotEmpty) {
        setState(() {
          _pendingOrderId = orderId;
          _pollMessage = '';
          _modal = ModalStep.pendingPayment;
        });
        _addToast(ToastType.info, 'Approve on your phone',
            message: result['message']?.toString() ??
                'Check your ${_paymentMethod.toUpperCase()} prompt and enter your PIN.',
            durationMs: 10000);
        _startPolling();
      } else {
        final errorMessage = result['message'] ?? 'Payment initiation failed';
        _addToast(ToastType.error, 'Payment failed', message: errorMessage, durationMs: 7000);
      }
    } catch (e) {
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
          headerSliverBuilder: (_, _) => [
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
          requiresFee: _requiresSiteVisitFee(_selProp!),
          processing: _paying,
          onClose: _closeModal,
          onProceed: _handleProceedApply,
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
      if (_modal == ModalStep.pendingPayment && _pendingOrderId.isNotEmpty)
        _PendingPaymentModal(
          provider: _paymentMethod,
          orderId: _pendingOrderId,
          message: _pollMessage,
          onCancel: _cancelPendingPayment,
        ),
      if (_modal == ModalStep.paymentFailed)
        _PaymentFailedModal(
          onClose: _closeModal,
          onRetry: () => setState(() => _modal = ModalStep.payment),
        ),
      if (_modal == ModalStep.success)
        _SuccessModal(
          isSiteVisit: _successWasSiteVisit,
          onClose: () {
            _closeModal();
            Navigator.of(context).pushNamed('/dashboard/tenant/applications');
          },
        ),
      // Toasts
      Positioned(
        top: MediaQuery.of(context).padding.top + 12,
        right: 12,
        left: 12,
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

  // ── Header ───────────────────────────────────────────────
  // FIX: Reduced expandedHeight, tightened padding, smaller text, safe pill wrapping
  Widget _buildHeader() => SliverAppBar(
    automaticallyImplyLeading: false,
    backgroundColor: kBg,
    expandedHeight: 155,
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
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              // Eyebrow
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: kGoldDim,
                  border: Border.all(color: kGoldBorder),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.list_rounded, color: kGold, size: 9),
                  SizedBox(width: 5),
                  Text('BROWSE LISTINGS',
                    style: TextStyle(color: kGold, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 1.4)),
                ]),
              ),
              const SizedBox(height: 7),
              // Title row
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  RichText(text: const TextSpan(
                    style: TextStyle(fontFamily: 'serif', fontSize: 24, fontWeight: FontWeight.w300, color: kCream, height: 1.1),
                    children: [
                      TextSpan(text: 'Available '),
                      TextSpan(text: 'Properties', style: TextStyle(color: kGold)),
                    ],
                  )),
                ],
              ),
              const SizedBox(height: 7),
              // Source pills in a scrollable row instead of Wrap to prevent overflow
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildHeaderPill('Agent listings', kGoldDim, kGold, kGoldBorder),
                    const SizedBox(width: 5),
                    _buildHeaderPill('Landlord listings',
                      Colors.white.withValues(alpha: 0.08), Colors.white.withValues(alpha: 0.65), Colors.white.withValues(alpha: 0.12)),
                    const SizedBox(width: 5),
                    _buildHeaderPill('Oweru Rentals',
                      const Color(0xFF10B981).withValues(alpha: 0.12), const Color(0xFF34D399), const Color(0xFF10B981).withValues(alpha: 0.25)),
                  ],
                ),
              ),
            ]),
          ),
        ),
      ),
      title: Padding(
        padding: const EdgeInsets.only(right: 8),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Properties', style: TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600)),
          Text(
            _loading ? 'Loading…' : '$_paginationTotal listings',
            style: const TextStyle(color: kSlate, fontSize: 11),
          ),
        ]),
      ),
    ),
  );

  Widget _buildHeaderPill(String label, Color bg, Color fg, Color border) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
    decoration: BoxDecoration(
      color: bg, border: Border.all(color: border), borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.w600)),
  );

  // ── Search Bar ───────────────────────────────────────────
  // FIX: Split into two rows to avoid overflow. Row 1: search + filter toggle + view.
  //      Row 2: type and price dropdowns (scrollable).
  Widget _buildSearchBar() => Container(
    color: kBg2,
    padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Row 1: search field + filter btn + view toggles
      Row(children: [
        // Search input — takes remaining space
        Expanded(
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
                    hintText: 'Search location or name…',
                    hintStyle: TextStyle(color: kSlateDim, fontSize: 13),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
              if (_search.isNotEmpty)
                GestureDetector(
                  onTap: () { _searchCtrl.clear(); _onSearchChanged(''); },
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8),
                    child: Icon(Icons.close_rounded, color: kSlate, size: 16),
                  ),
                ),
            ]),
          ),
        ),
        const SizedBox(width: 8),
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
              if (_activeFilterCount > 0) ...[
                const SizedBox(width: 4),
                Container(
                  width: 15, height: 15,
                  decoration: const BoxDecoration(color: kGold, shape: BoxShape.circle),
                  child: Center(child: Text('$_activeFilterCount',
                    style: const TextStyle(color: kBg, fontSize: 9, fontWeight: FontWeight.w700))),
                ),
              ],
            ]),
          ),
        ),
        const SizedBox(width: 6),
        // View toggle
        _buildViewBtn(Icons.grid_view_rounded, ViewMode.grid),
        const SizedBox(width: 4),
        _buildViewBtn(Icons.list_rounded, ViewMode.list),
      ]),
      const SizedBox(height: 8),
      // Row 2: dropdowns in a horizontal scroll
      SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(children: [
          _buildDropdown(
            value: _selectedType,
            hint: 'All types',
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
          const SizedBox(width: 8),
          _buildDropdown(
            value: _priceRange,
            hint: 'All prices',
            items: const [
              DropdownMenuItem(value: '', child: Text('All prices')),
              DropdownMenuItem(value: '0-500', child: Text('Under 500K')),
              DropdownMenuItem(value: '500-1000', child: Text('500K–1M')),
              DropdownMenuItem(value: '1000+', child: Text('Above 1M')),
            ],
            onChanged: (v) { setState(() => _priceRange = v ?? ''); _onFilterChanged(); },
          ),
        ]),
      ),
    ]),
  );

  Widget _buildDropdown({
    required String value,
    required String hint,
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
      width: 36, height: 36,
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
    padding: const EdgeInsets.fromLTRB(12, 6, 12, 6),
    child: SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(children: SourceFilter.values.map((s) {
        final sel = _sourceFilter == s;
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
          padding: const EdgeInsets.only(right: 6),
          child: GestureDetector(
            onTap: () { setState(() => _sourceFilter = s); _onFilterChanged(); },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: bg, border: Border.all(color: border), borderRadius: BorderRadius.circular(8)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(icons[s]!, size: 12, color: fg),
                const SizedBox(width: 5),
                Text(_sourceLabel(s), style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600)),
              ]),
            ),
          ),
        );
      }).toList()),
    ),
  );

  // ── Advanced filters ─────────────────────────────────────
  Widget _buildAdvancedFilters() => AnimatedCrossFade(
    firstChild: const SizedBox(height: 0),
    secondChild: Container(
      color: kBg2,
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('REFINE', style: TextStyle(
          color: kSlate, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 2)),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            _buildDropdown(
              value: _bedrooms?.toString() ?? '',
              hint: 'Bedrooms',
              items: const [
                DropdownMenuItem(value: '', child: Text('Any bedrooms')),
                DropdownMenuItem(value: '1', child: Text('1+ beds')),
                DropdownMenuItem(value: '2', child: Text('2+ beds')),
                DropdownMenuItem(value: '3', child: Text('3+ beds')),
                DropdownMenuItem(value: '4', child: Text('4+ beds')),
              ],
              onChanged: (v) {
                setState(() => _bedrooms = (v != null && v.isNotEmpty) ? int.tryParse(v) : null);
                _onFilterChanged();
              },
            ),
            const SizedBox(width: 8),
            _buildDropdown(
              value: _furnished == null ? '' : (_furnished! ? 'true' : 'false'),
              hint: 'Furnishing',
              items: const [
                DropdownMenuItem(value: '', child: Text('Any furnishing')),
                DropdownMenuItem(value: 'true', child: Text('Furnished')),
                DropdownMenuItem(value: 'false', child: Text('Unfurnished')),
              ],
              onChanged: (v) {
                setState(() => _furnished = v == null || v.isEmpty ? null : v == 'true');
                _onFilterChanged();
              },
            ),
            if (_activeFilterCount > 0 || _search.isNotEmpty) ...[
              const SizedBox(width: 10),
              GestureDetector(
                onTap: _clearFilters,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(8)),
                  child: const Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.close, color: kSlate, size: 11),
                    SizedBox(width: 4),
                    Text('Clear all', style: TextStyle(color: kSlate, fontSize: 12)),
                  ]),
                ),
              ),
            ],
          ]),
        ),
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
            padding: const EdgeInsets.fromLTRB(12, 14, 12, 0),
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
                    // FIX: Changed crossAxisCount to 1 for mobile so cards are full-width
                    // and are large enough. Uses LayoutBuilder for adaptive count.
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 1,
                      mainAxisSpacing: 14,
                      // FIX: childAspectRatio controls card height. Lower = taller card.
                      // With full width on ~360px screen, 0.9 gives a comfortable card.
                      childAspectRatio: 0.85,
                    ),
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
  Widget _buildSkeleton() => ListView.builder(
    padding: const EdgeInsets.fromLTRB(12, 14, 12, 28),
    itemCount: 6,
    itemBuilder: (_, _) => const Padding(
      padding: EdgeInsets.only(bottom: 14),
      child: _SkeletonCard(),
    ),
  );

  // ── Error banner ─────────────────────────────────────────
  Widget _buildErrorBanner() => Container(
    margin: const EdgeInsets.fromLTRB(12, 12, 12, 0),
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    decoration: BoxDecoration(
      color: const Color(0xFFEF4444).withValues(alpha: 0.08),
      border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.25)),
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
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          width: 60, height: 60,
          decoration: BoxDecoration(
            color: kGoldDim, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(16)),
          child: const Icon(Icons.search_rounded, color: kGold, size: 22),
        ),
        const SizedBox(height: 20),
        const Text('No properties found', style: TextStyle(
          color: kCream, fontSize: 20, fontWeight: FontWeight.w300)),
        const SizedBox(height: 6),
        const Text('Try adjusting your filters or search terms.',
          style: TextStyle(color: kSlate, fontSize: 13), textAlign: TextAlign.center),
        if (_activeFilterCount > 0 || _search.isNotEmpty) ...[
          const SizedBox(height: 24),
          GestureDetector(
            onTap: _clearFilters,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
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
    ),
  );

  // ── Pagination ───────────────────────────────────────────
  // FIX: Wrapped in SingleChildScrollView for horizontal overflow, plus
  //      page info and jump-to in their own rows to avoid overflow.
  Widget _buildPagination() => Padding(
    padding: const EdgeInsets.fromLTRB(12, 28, 12, 0),
    child: Column(children: [
      Text(
        'Showing $_pageStart–$_pageEnd of $_paginationTotal',
        style: const TextStyle(color: kSlate, fontSize: 12),
      ),
      const SizedBox(height: 12),
      // Prev / Next always visible, page numbers in horizontal scroll
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        _PagBtn(
          label: '←',
          disabled: _currentPage == 1,
          onTap: () => _goToPage(_currentPage - 1),
        ),
        const SizedBox(width: 6),
        Flexible(
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: _getPageNumbers(_currentPage, _totalPages).map((p) {
                if (p == null) {
                  return const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 2),
                  child: _PagBtn(label: '…', disabled: true, isDots: true),
                );
                }
                return Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: _PagBtn(
                    label: '$p',
                    active: p == _currentPage,
                    onTap: () => _goToPage(p),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
        const SizedBox(width: 6),
        _PagBtn(
          label: '→',
          disabled: _currentPage == _totalPages,
          onTap: () => _goToPage(_currentPage + 1),
        ),
      ]),
      const SizedBox(height: 12),
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
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kBorder)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGold, width: 1.5)),
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
        height: 36,
        constraints: const BoxConstraints(minWidth: 36),
        padding: const EdgeInsets.symmetric(horizontal: 8),
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
      height: 340,
      decoration: BoxDecoration(
        color: kBg2, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(16)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        // Image placeholder
        Container(
          height: 200,
          decoration: const BoxDecoration(
            color: kBg3, borderRadius: BorderRadius.vertical(top: Radius.circular(16)))),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(height: 10, width: 80, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
              const SizedBox(height: 8),
              Container(height: 14, width: double.infinity, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
              const SizedBox(height: 8),
              Container(height: 10, width: 120, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
              const SizedBox(height: 10),
              Row(children: [
                Container(height: 10, width: 50, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
                const SizedBox(width: 8),
                Container(height: 10, width: 50, decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(4))),
              ]),
            ]),
          ),
        ),
      ]),
    ),
  );
}

// ── Property Card ─────────────────────────────────────────────
// FIX: Completely reworked grid card layout. No more tiny text (7px, 9px).
//      Uses a fixed image height instead of Expanded/flex ratio (which causes
//      RenderFlex overflow in grid cells with tight constraints).
//      Info section uses Column with proper sizing — no more Expanded causing
//      unbounded height issues.
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

  // FIX: Grid card now uses a Column with a fixed-height image section (200px)
  //      and an intrinsic-height info section — no Expanded in a Column that
  //      sits inside a grid cell with constrained height.
  Widget _buildGridCard() => GestureDetector(
    onTap: onTap,
    child: Container(
      decoration: BoxDecoration(
        color: kBg2,
        border: Border.all(color: kBorder),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 16, offset: const Offset(0, 4))],
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Image — fixed height, no Expanded
          SizedBox(height: 200, child: _buildImageSection(imageHeight: 200)),
          // Info section — intrinsic height, no overflow
          _buildGridInfoSection(),
        ],
      ),
    ),
  );

  Widget _buildListCard() => GestureDetector(
    onTap: onTap,
    child: Container(
      decoration: BoxDecoration(
        color: kBg2,
        border: Border.all(color: kBorder),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 16, offset: const Offset(0, 4))],
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // In list mode, image is at top, full width but shorter
          SizedBox(height: 180, child: _buildImageSection(imageHeight: 180)),
          _buildListInfoSection(),
        ],
      ),
    ),
  );

  Widget _buildImageSection({required double imageHeight}) => Stack(
    fit: StackFit.expand,
    children: [
      _imageUrl.isNotEmpty
          ? Image.network(
              _imageUrl,
              fit: BoxFit.cover,
              frameBuilder: (_, child, frame, _) => frame == null
                  ? Container(color: kBg3, child: const Center(child: Icon(Icons.image_rounded, color: kSlateDim, size: 40)))
                  : child,
              errorBuilder: (_, _, _) =>
                  Container(color: kBg3, child: const Center(child: Icon(Icons.image_rounded, color: kSlateDim, size: 40))),
            )
          : Container(color: kBg3, child: const Center(child: Icon(Icons.image_rounded, color: kSlateDim, size: 40))),

      // Gradient overlay
      Container(decoration: const BoxDecoration(gradient: LinearGradient(
        begin: Alignment.topCenter, end: Alignment.bottomCenter,
        colors: [Colors.transparent, Color(0xCC0A0F1E)], stops: [0.4, 1.0]))),

      // Featured badge
      if (_featured)
        Positioned(top: 10, left: 10,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: kGold, borderRadius: BorderRadius.circular(5)),
            child: const Text('FEATURED', style: TextStyle(color: kBg, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
          )),

      // Source badge
      Positioned(top: 10, right: 10,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: _sourceBadgeColor(_source).withValues(alpha: 0.9), borderRadius: BorderRadius.circular(5)),
          child: Text(
            _source == SourceFilter.agent ? 'AGENT' :
            _source == SourceFilter.admin ? 'OWERU' : 'LANDLORD',
            style: TextStyle(color: _sourceBadgeTextColor(_source), fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5),
          ),
        )),

      // Type badge (bottom left)
      if (_type.isNotEmpty)
        Positioned(bottom: 10, left: 10,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.7), borderRadius: BorderRadius.circular(5)),
            child: Text(
              _type[0].toUpperCase() + _type.substring(1),
              style: const TextStyle(color: kCream, fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 0.8)),
          )),

      // Price (bottom right)
      Positioned(bottom: 8, right: 10,
        child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(_formatPrice(property['price']),
            style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w500,
              shadows: [Shadow(color: Colors.black54, blurRadius: 8)])),
          const Text('/mo', style: TextStyle(color: Color(0xAAFFFFFF), fontSize: 10)),
        ])),
    ],
  );

  // FIX: Grid info section with proper readable font sizes (no 7px or 9px text)
  Widget _buildGridInfoSection() => Padding(
    padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Location
        if (_location.isNotEmpty)
          Row(children: [
            const Icon(Icons.location_on_rounded, color: kGold, size: 11),
            const SizedBox(width: 3),
            Expanded(child: Text(_location,
              style: const TextStyle(color: kSlate, fontSize: 11),
              maxLines: 1, overflow: TextOverflow.ellipsis)),
          ]),
        const SizedBox(height: 5),
        // Title
        Text((property['title'] ?? 'Untitled Property').toString(),
          style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w700),
          maxLines: 2, overflow: TextOverflow.ellipsis),
        const SizedBox(height: 10),
        // Specs row
        Wrap(
          spacing: 10,
          runSpacing: 4,
          children: [
            if (_beds > 0) _spec(Icons.bed_rounded, '$_beds bed'),
            if (_baths > 0) _spec(Icons.bathtub_rounded, '$_baths bath'),
            if (_size > 0) _spec(Icons.square_foot_rounded, '${_size}m²'),
          ],
        ),
        const SizedBox(height: 10),
        // Furnished tag
        if (_furnished)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: kGoldDim, border: Border.all(color: kGoldBorder), borderRadius: BorderRadius.circular(4)),
              child: const Text('Furnished', style: TextStyle(color: kGold, fontSize: 10, fontWeight: FontWeight.w600)),
            ),
          ),
        // Action buttons — no overflow because they're in a Row with defined widths
        Row(children: [
          // Save button
          GestureDetector(
            onTap: onSave,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: isSaved ? kGold : Colors.transparent,
                border: Border.all(color: isSaved ? kGold : kBorder),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Icon(
                isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                color: isSaved ? kBg : kSlate, size: 14),
            ),
          ),
          const SizedBox(width: 6),
          // Share button
          GestureDetector(
            onTap: onShare,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(6)),
              child: const Icon(Icons.share_rounded, color: kSlate, size: 14),
            ),
          ),
          const Spacer(),
          // Visit / Apply button — uses IntrinsicWidth, won't overflow
          GestureDetector(
            onTap: onApply,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(color: kGold, borderRadius: BorderRadius.circular(6)),
              child: Text(_requiresSiteVisitFee(property) ? 'Visit Site' : 'Apply',
                style: const TextStyle(color: kBg, fontSize: 12, fontWeight: FontWeight.w700)),
            ),
          ),
        ]),
      ],
    ),
  );

  Widget _buildListInfoSection() => Padding(
    padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (_location.isNotEmpty)
          Row(children: [
            const Icon(Icons.location_on_rounded, color: kGold, size: 12),
            const SizedBox(width: 4),
            Expanded(child: Text(_location,
              style: const TextStyle(color: kSlate, fontSize: 12),
              maxLines: 1, overflow: TextOverflow.ellipsis)),
          ]),
        const SizedBox(height: 6),
        Text((property['title'] ?? 'Untitled Property').toString(),
          style: const TextStyle(color: kCream, fontSize: 17, fontWeight: FontWeight.w700),
          maxLines: 2, overflow: TextOverflow.ellipsis),
        if (property['description'] != null && property['description'].toString().isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(property['description'].toString(),
            style: const TextStyle(color: kSlate, fontSize: 12, height: 1.5),
            maxLines: 2, overflow: TextOverflow.ellipsis),
        ],
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Divider(color: kGold.withValues(alpha: 0.12), height: 1)),
        Wrap(
          spacing: 12,
          runSpacing: 4,
          children: [
            if (_beds > 0) _spec(Icons.bed_rounded, '$_beds bed'),
            if (_baths > 0) _spec(Icons.bathtub_rounded, '$_baths bath'),
            if (_size > 0) _spec(Icons.square_foot_rounded, '${_size}m²'),
          ],
        ),
        const SizedBox(height: 10),
        Row(children: [
          if (_furnished)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: kGoldDim, border: Border.all(color: kGoldBorder), borderRadius: BorderRadius.circular(4)),
              child: const Text('Furnished', style: TextStyle(color: kGold, fontSize: 10, fontWeight: FontWeight.w600)),
            ),
          const Spacer(),
          GestureDetector(
            onTap: onSave,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: isSaved ? kGold : Colors.transparent,
                border: Border.all(color: isSaved ? kGold : kBorder),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                  color: isSaved ? kBg : kSlate, size: 13),
                const SizedBox(width: 4),
                Text(isSaved ? 'Saved' : 'Save',
                  style: TextStyle(color: isSaved ? kBg : kSlate, fontSize: 12, fontWeight: FontWeight.w600)),
              ]),
            ),
          ),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: onShare,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(6)),
              child: const Icon(Icons.share_rounded, color: kSlate, size: 14),
            ),
          ),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: onApply,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(color: kGold, borderRadius: BorderRadius.circular(6)),
              child: Text(_requiresSiteVisitFee(property) ? 'Book Visit' : 'Apply',
                style: const TextStyle(color: kBg, fontSize: 13, fontWeight: FontWeight.w700)),
            ),
          ),
        ]),
      ],
    ),
  );

  Widget _spec(IconData icon, String label) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, color: kGold, size: 13),
      const SizedBox(width: 4),
      Text(label, style: const TextStyle(color: kSlate, fontSize: 12)),
    ],
  );
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
    margin: const EdgeInsets.only(bottom: 8),
    // FIX: use double.infinity constrained by parent Positioned (left+right=12+12)
    // instead of a fixed maxWidth that could overflow narrow screens
    width: double.infinity,
    decoration: BoxDecoration(
      color: kBg2,
      border: Border.all(color: kBorder),
      borderRadius: BorderRadius.circular(12),
      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.4), blurRadius: 20)],
    ),
    child: Stack(children: [
      Positioned(left: 0, top: 0, bottom: 0, child: Container(
        width: 3, decoration: BoxDecoration(
          color: _color, borderRadius: const BorderRadius.horizontal(left: Radius.circular(12))))),
      Padding(
        padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(color: _color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(9)),
            child: Icon(_icon, color: _color, size: 15),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(toast.title, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
            if (toast.message != null) ...[
              const SizedBox(height: 2),
              Text(toast.message!, style: const TextStyle(color: kSlate, fontSize: 12, height: 1.4)),
            ],
          ])),
          GestureDetector(
            onTap: onDismiss,
            child: const Padding(
              padding: EdgeInsets.only(left: 4),
              child: Icon(Icons.close, color: kSlate, size: 14),
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
      color: Colors.black.withValues(alpha: 0.82),
      child: Center(
        child: GestureDetector(
          onTap: () {},
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 40),
            constraints: const BoxConstraints(maxWidth: 460),
            decoration: BoxDecoration(
              color: kBg2,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: kBorder),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 60)],
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
    padding: const EdgeInsets.fromLTRB(20, 20, 12, 16),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFF0F172A), Color(0xFF1E2D4A)],
        begin: Alignment.topLeft, end: Alignment.bottomRight),
      border: Border(bottom: BorderSide(color: kBorder)),
    ),
    child: Stack(children: [
      Positioned(top: -20, left: -20, right: -12, child: Container(height: 2, color: kGold)),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(
          color: kCream, fontSize: 18, fontWeight: FontWeight.w300, letterSpacing: -0.01)),
        if (subtitle != null) ...[
          const SizedBox(height: 3),
          Text(subtitle!, style: const TextStyle(color: kSlate, fontSize: 12)),
        ],
      ]),
      Positioned(top: 0, right: 0,
        child: GestureDetector(
          onTap: onClose,
          child: Container(
            width: 30, height: 30,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(8)),
            child: const Icon(Icons.close, color: kSlate, size: 14),
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
    child: SingleChildScrollView(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0F172A), Color(0xFF1E2D4A)],
              begin: Alignment.topLeft, end: Alignment.bottomRight),
          ),
          child: Stack(children: [
            Positioned(top: -28, left: -24, right: -24, child: Container(height: 2, color: kGold)),
            Column(children: [
              GestureDetector(onTap: onClose, child: Align(alignment: Alignment.centerRight,
                child: Container(width: 30, height: 30,
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.08), border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.close, color: kSlate, size: 14)))),
              const SizedBox(height: 10),
              Container(
                width: 54, height: 54,
                decoration: BoxDecoration(color: kGoldDim, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(15)),
                child: const Icon(Icons.shield_outlined, color: kGold, size: 22)),
              const SizedBox(height: 14),
              const Text('Sign in to Book Visit',
                style: TextStyle(color: kCream, fontSize: 19, fontWeight: FontWeight.w300, letterSpacing: -0.01)),
              const SizedBox(height: 6),
              const Text('You need an account to book a site visit and connect with agents.',
                textAlign: TextAlign.center,
                style: TextStyle(color: kSlate, fontSize: 12, height: 1.55)),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.06),
                  border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(8)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.location_on_rounded, color: kGold, size: 11),
                  const SizedBox(width: 6),
                  Flexible(child: Text(
                    (property['title'] ?? 'Property').toString(),
                    style: const TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 12),
                    overflow: TextOverflow.ellipsis,
                  )),
                ]),
              ),
            ]),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.all(18),
          child: Column(children: [
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('CHOOSE AN OPTION',
                style: TextStyle(color: kSlate, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.6))),
            const SizedBox(height: 10),
            _AuthOption(icon: Icons.login_rounded, iconBg: kGoldDim, iconColor: kGold,
              title: 'Sign in to my account', subtitle: 'I already have an account', onTap: onLogin),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Row(children: [
                Expanded(child: Divider(color: kBorder)),
                Padding(padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text('or', style: TextStyle(color: kSlate, fontSize: 11))),
                Expanded(child: Divider(color: kBorder)),
              ])),
            _AuthOption(
              icon: Icons.person_add_rounded,
              iconBg: const Color(0xFF10B981).withValues(alpha: 0.1),
              iconColor: const Color(0xFF10B981),
              title: 'Create a free account',
              subtitle: 'Sign up takes under a minute',
              onTap: onSignup),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(0, 0, 0, 14),
          child: TextButton(
            onPressed: onClose,
            child: const Text('Continue browsing', style: TextStyle(color: kSlate, fontSize: 12)),
          ),
        ),
      ]),
    ),
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
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: kBg3, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: iconColor, size: 17)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(color: kSlate, fontSize: 11)),
        ])),
        const Icon(Icons.arrow_forward_rounded, color: kSlate, size: 14),
      ]),
    ),
  );
}

// ── Apply Modal ──────────────────────────────────────────────
class _ApplyModal extends StatelessWidget {
  final PropertyMap property;
  final bool requiresFee;
  final bool processing;
  final VoidCallback onClose;
  final VoidCallback onProceed;
  const _ApplyModal({
    required this.property,
    required this.requiresFee,
    this.processing = false,
    required this.onClose,
    required this.onProceed,
  });

  @override
  Widget build(BuildContext context) => _ModalShell(
    onClose: onClose,
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      _ModalHeader(
        title: requiresFee ? 'Book Site Visit' : 'Apply for Property',
        subtitle: requiresFee ? 'Review before proceeding' : 'Submit to the landlord',
        onClose: onClose,
      ),
      Flexible(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(18),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: kBg3, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(12)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text((property['title'] ?? 'Property').toString(),
                  style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w500)),
                const SizedBox(height: 10),
                if ((property['location'] ?? property['address']) != null)
                  _InfoRow(Icons.location_on_rounded, (property['location'] ?? property['address']).toString()),
                _InfoRow(Icons.credit_card_rounded, 'Monthly rent: ${_formatPrice(property['price'])}'),
                if (property['bedrooms'] != null)
                  _InfoRow(Icons.bed_rounded, 'Bedrooms: ${property['bedrooms']}'),
                if (property['furnished'] == true)
                  _InfoRow(Icons.check_circle_outline_rounded, 'Furnished', color: const Color(0xFF10B981)),
              ]),
            ),
            const SizedBox(height: 14),
            if (requiresFee) ...[
              _FeeBlock(),
              const SizedBox(height: 12),
              const Text(
                'This fee covers the site visit arrangement. Once paid, the agent is notified immediately and will contact you within 24 hours.',
                style: TextStyle(color: kSlate, fontSize: 12, height: 1.6)),
            ] else ...[
              const Text(
                'No service charge is required for landlord-listed properties. Your application goes directly to the property owner.',
                style: TextStyle(color: kSlate, fontSize: 12, height: 1.6)),
            ],
          ]),
        ),
      ),
      Container(
        padding: const EdgeInsets.fromLTRB(18, 10, 18, 18),
        decoration: BoxDecoration(border: Border(top: BorderSide(color: kBorder))),
        child: Row(children: [
          Expanded(child: _ModalBtn(label: 'Cancel', onTap: processing ? () {} : onClose)),
          const SizedBox(width: 10),
          Expanded(child: _ModalBtn(
            label: processing
                ? 'Submitting…'
                : (requiresFee ? 'Proceed to Payment' : 'Submit Application'),
            primary: true,
            onTap: processing ? () {} : onProceed,
          )),
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
      {'value': 'tigo',     'label': 'Tigo Pesa',   'color': const Color(0xFF00D4AA)},
      {'value': 'mpesa',    'label': 'M-Pesa',       'color': const Color(0xFF00C853)},
      {'value': 'airtel',   'label': 'Airtel',       'color': const Color(0xFFFF6B35)},
      {'value': 'halopesa', 'label': 'Halopesa',     'color': const Color(0xFF9C27B0)},
    ];

    return _ModalShell(
      onClose: processing ? () {} : onClose,
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        _ModalHeader(title: 'Complete Payment', subtitle: 'Secure checkout · TZS 20,000', onClose: processing ? () {} : onClose),
        Flexible(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(18),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _FeeBlock(),
              const SizedBox(height: 16),
              const Text('MOBILE MONEY PROVIDER', style: TextStyle(
                color: kSlate, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
              const SizedBox(height: 8),
              // FIX: 2x2 grid for providers instead of a single row that overflows
              GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
                childAspectRatio: 3,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: providers.map((p) {
                  final sel = paymentMethod == p['value'];
                  final col = p['color'] as Color;
                  return GestureDetector(
                    onTap: processing ? null : () => onMethodChanged(p['value'] as String),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      decoration: BoxDecoration(
                        color: sel ? col.withValues(alpha: 0.1) : kBg3,
                        border: Border.all(color: sel ? col : kBorder, width: sel ? 1.5 : 1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Text(
                          p['label'] as String,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: sel ? col : kSlate,
                            fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              const Text('PHONE NUMBER', style: TextStyle(
                color: kSlate, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
              const SizedBox(height: 8),
              TextField(
                controller: phoneCtrl,
                enabled: !processing,
                onChanged: onPhoneChanged,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: kCream, fontSize: 14),
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
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.08),
                  border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.2)),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: const Row(children: [
                  Icon(Icons.shield_outlined, color: Color(0xFF10B981), size: 13),
                  SizedBox(width: 8),
                  Expanded(child: Text('Powered by Selcom · 256-bit encrypted',
                    style: TextStyle(color: Color(0xFF10B981), fontSize: 12))),
                ]),
              ),
            ]),
          ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(18, 10, 18, 18),
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

// ── Pending Payment Modal ────────────────────────────────────
class _PendingPaymentModal extends StatelessWidget {
  final String provider;
  final String orderId;
  final String message;
  final VoidCallback onCancel;
  const _PendingPaymentModal({
    required this.provider,
    required this.orderId,
    this.message = '',
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) => _ModalShell(
    onClose: () {},
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      _ModalHeader(
        title: 'Waiting for Payment',
        subtitle: 'Approve the ${provider.toUpperCase()} prompt on your phone',
        onClose: () {},
      ),
      Padding(
        padding: const EdgeInsets.all(24),
        child: Column(children: [
          const SizedBox(
            width: 36, height: 36,
            child: CircularProgressIndicator(strokeWidth: 2.5, color: kGold),
          ),
          const SizedBox(height: 16),
          const Text('Check your phone and enter your PIN',
            textAlign: TextAlign.center,
            style: TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text('Ref: $orderId',
            textAlign: TextAlign.center,
            style: const TextStyle(color: kSlate, fontSize: 11)),
          if (message.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center,
              style: const TextStyle(color: kGold, fontSize: 12)),
          ],
        ]),
      ),
      Container(
        padding: const EdgeInsets.fromLTRB(18, 10, 18, 18),
        decoration: BoxDecoration(border: Border(top: BorderSide(color: kBorder))),
        child: _ModalBtn(label: 'Cancel and try again', onTap: onCancel),
      ),
    ]),
  );
}

// ── Payment Failed Modal ─────────────────────────────────────
class _PaymentFailedModal extends StatelessWidget {
  final VoidCallback onClose;
  final VoidCallback onRetry;
  const _PaymentFailedModal({required this.onClose, required this.onRetry});

  @override
  Widget build(BuildContext context) => _ModalShell(
    onClose: onClose,
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      _ModalHeader(title: 'Payment Not Completed', subtitle: 'Site visit fee was not received', onClose: onClose),
      const Padding(
        padding: EdgeInsets.all(18),
        child: Text(
          'Your application was not confirmed because payment was not completed. Try again or choose another provider (including Halopesa).',
          style: TextStyle(color: kSlate, fontSize: 12, height: 1.6),
        ),
      ),
      Container(
        padding: const EdgeInsets.fromLTRB(18, 10, 18, 18),
        decoration: BoxDecoration(border: Border(top: BorderSide(color: kBorder))),
        child: Row(children: [
          Expanded(child: _ModalBtn(label: 'Close', onTap: onClose)),
          const SizedBox(width: 10),
          Expanded(child: _ModalBtn(label: 'Try Again', primary: true, onTap: onRetry)),
        ]),
      ),
    ]),
  );
}

// ── Success Modal ────────────────────────────────────────────
class _SuccessModal extends StatelessWidget {
  final bool isSiteVisit;
  final VoidCallback onClose;
  const _SuccessModal({required this.isSiteVisit, required this.onClose});

  @override
  Widget build(BuildContext context) => _ModalShell(
    onClose: onClose,
    child: SingleChildScrollView(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 22),
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF064E3B), Color(0xFF065F46)]),
          ),
          child: Column(children: [
            Container(
              width: 60, height: 60,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.14),
                border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
                shape: BoxShape.circle),
              child: const Icon(Icons.check_circle_outline_rounded, color: Colors.white, size: 26)),
            const SizedBox(height: 14),
            Text(isSiteVisit ? 'Site Visit Booked!' : 'Application Submitted!',
              style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w300, letterSpacing: -0.01)),
            const SizedBox(height: 6),
            Text(
              isSiteVisit
                  ? 'Payment confirmed. The agent has been notified and will contact you shortly.'
                  : 'Your application has been sent to the landlord. You will be notified once they respond.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0x8CFFFFFF), fontSize: 12, height: 1.55)),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 8),
          child: Container(
            decoration: BoxDecoration(
              color: kBg3, border: Border.all(color: kBorder), borderRadius: BorderRadius.circular(12)),
            child: Column(children: isSiteVisit
                ? [
                    _SuccessStep(Icons.check_rounded, 'Site visit fee received & confirmed'),
                    Divider(height: 1, color: kBorder),
                    _SuccessStep(Icons.auto_awesome_rounded, 'Agent notified via SMS & email'),
                    Divider(height: 1, color: kBorder),
                    _SuccessStep(Icons.check_circle_outline_rounded, 'Expect a call within 24 hours'),
                  ]
                : [
                    _SuccessStep(Icons.check_rounded, 'Application submitted successfully'),
                    Divider(height: 1, color: kBorder),
                    _SuccessStep(Icons.auto_awesome_rounded, 'Landlord notified of your interest'),
                    Divider(height: 1, color: kBorder),
                    _SuccessStep(Icons.check_circle_outline_rounded, 'Track status in My Applications'),
                  ]),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 20),
          child: _ModalBtn(label: 'View My Applications', primary: true, fullWidth: true, onTap: onClose),
        ),
      ]),
    ),
  );
}

class _SuccessStep extends StatelessWidget {
  final IconData icon;
  final String label;
  const _SuccessStep(this.icon, this.label);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    child: Row(children: [
      Container(
        width: 28, height: 28,
        decoration: BoxDecoration(
          color: const Color(0xFF10B981).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: const Color(0xFF10B981), size: 13)),
      const SizedBox(width: 10),
      Expanded(child: Text(label, style: const TextStyle(color: kCream, fontSize: 12))),
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
    padding: const EdgeInsets.symmetric(vertical: 18),
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
          color: kGold, fontSize: 26, fontWeight: FontWeight.w300, letterSpacing: -0.02)),
        SizedBox(height: 4),
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
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
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