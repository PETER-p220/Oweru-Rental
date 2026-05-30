import 'package:flutter/material.dart';
import '../../../shared/services/commercial_api_service.dart';

// ── Palette (matches CommercialDashboard) ─────────────────────────────────────
const Color kWhite    = Color(0xFFFFFFFF);
const Color kBg       = Color(0xFFF8FAFC);
const Color kSurface  = Color(0xFFFFFFFF);
const Color kSurface2 = Color(0xFFF1F5F9);
const Color kBorder   = Color(0xFFE2E8F0);
const Color kSlate900 = Color(0xFF0F172A);
const Color kSlate700 = Color(0xFF334155);
const Color kSlate500 = Color(0xFF64748B);
const Color kSlate300 = Color(0xFFCBD5E1);
const Color kSlate100 = Color(0xFFF1F5F9);

const Color kEmerald  = Color(0xFF10B981);
const Color kAmber    = Color(0xFFF59E0B);
const Color kRose     = Color(0xFFF43F5E);

class CommercialApplicationsPage extends StatefulWidget {
  const CommercialApplicationsPage({super.key});

  @override
  State<CommercialApplicationsPage> createState() => _CommercialApplicationsPageState();
}

class _CommercialApplicationsPageState extends State<CommercialApplicationsPage> {
  List<Map<String, dynamic>> _applications = [];
  bool _isLoading = true;
  String _error = '';
  String _searchQuery = '';
  String _statusFilter = 'all';
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _loadApplications();
  }

  Future<void> _loadApplications() async {
    setState(() { _isLoading = true; _error = ''; });
    try {
      final applications = await CommercialApiService.getApplications();
      setState(() {
        _applications = applications;
        _total = applications.length;
        _isLoading = false;
      });
    } catch (_) {
      setState(() { _error = 'Unable to load applications.'; _isLoading = false; });
    }
  }

  List<Map<String, dynamic>> get _filteredApplications {
    var filtered = _applications;
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((item) {
        final t = (item['property_title'] as String? ?? '').toLowerCase();
        final n = (item['applicant_name']  as String? ?? '').toLowerCase();
        final e = (item['applicant_email'] as String? ?? '').toLowerCase();
        final q = _searchQuery.toLowerCase();
        return t.contains(q) || n.contains(q) || e.contains(q);
      }).toList();
    }
    if (_statusFilter != 'all') {
      filtered = filtered.where((item) => item['status'] == _statusFilter).toList();
    }
    return filtered;
  }

  String _formatDate(String dateStr) {
    try {
      final d = DateTime.parse(dateStr);
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) { return '—'; }
  }

  Color _statusColor(String? s) {
    switch (s?.toLowerCase()) {
      case 'approved': return kEmerald;
      case 'rejected': return kRose;
      case 'pending':  return kAmber;
      default:         return kSlate500;
    }
  }

  IconData _statusIcon(String? s) {
    switch (s?.toLowerCase()) {
      case 'approved': return Icons.check_circle_rounded;
      case 'rejected': return Icons.cancel_rounded;
      default:         return Icons.access_time_rounded;
    }
  }

  // ── Build ──────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final filtered = _filteredApplications;

    return Scaffold(
      backgroundColor: kBg,
      body: Column(children: [
        _buildSearchBar(),
        _buildFilterChips(),
        Expanded(child: _buildBody(filtered)),
      ]),
    );
  }

  // ── Search bar ─────────────────────────────────────────────────────────────
  Widget _buildSearchBar() {
    return Container(
      color: kSurface,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: TextField(
        onChanged: (v) => setState(() => _searchQuery = v),
        style: const TextStyle(color: kSlate900, fontSize: 13),
        decoration: InputDecoration(
          hintText: 'Search by property, name or email…',
          hintStyle: const TextStyle(color: kSlate300, fontSize: 13),
          prefixIcon: const Icon(Icons.search_rounded, color: kSlate300, size: 18),
          filled: true,
          fillColor: kSurface2,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: kBorder)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: kSlate900, width: 1.5)),
        ),
      ),
    );
  }

  // ── Filter chips ───────────────────────────────────────────────────────────
  Widget _buildFilterChips() {
    final filters = ['all', 'pending', 'approved', 'rejected'];
    final labels  = {'all': 'All', 'pending': 'Pending', 'approved': 'Approved', 'rejected': 'Rejected'};

    return Container(
      color: kSurface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(children: [
        ...filters.map((f) {
          final selected = _statusFilter == f;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => setState(() => _statusFilter = f),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: selected ? kSlate900 : kSurface2,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: selected ? kSlate900 : kBorder),
                ),
                child: Text(labels[f]!, style: TextStyle(
                  color: selected ? kWhite : kSlate500,
                  fontSize: 11,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                )),
              ),
            ),
          );
        }),
        const Spacer(),
        Text('${_filteredApplications.length} result${_filteredApplications.length == 1 ? '' : 's'}',
          style: const TextStyle(color: kSlate300, fontSize: 11)),
      ]),
    );
  }

  // ── Body ───────────────────────────────────────────────────────────────────
  Widget _buildBody(List<Map<String, dynamic>> filtered) {
    if (_isLoading) return const Center(child: CircularProgressIndicator(color: kSlate900, strokeWidth: 2));
    if (_error.isNotEmpty) return Center(child: Text(_error, style: const TextStyle(color: kRose, fontSize: 13)));
    if (filtered.isEmpty) return _buildEmpty();

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final app = filtered[index];
        return Container(
          key: ValueKey('app_${app['id'] ?? index}'),
          child: _buildCard(app),
        );
      },
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  Widget _buildEmpty() {
    return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Container(
        width: 56, height: 56,
        decoration: BoxDecoration(color: kSurface2, borderRadius: BorderRadius.circular(14), border: Border.all(color: kBorder)),
        child: const Icon(Icons.assignment_outlined, color: kSlate300, size: 24),
      ),
      const SizedBox(height: 14),
      const Text('No applications found', style: TextStyle(color: kSlate900, fontSize: 14, fontWeight: FontWeight.w700)),
      const SizedBox(height: 4),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Text(
          _searchQuery.isNotEmpty || _statusFilter != 'all'
              ? 'Try adjusting your search or filters.'
              : 'Applications will appear here when tenants apply.',
          style: const TextStyle(color: kSlate500, fontSize: 12),
          textAlign: TextAlign.center,
        ),
      ),
    ]));
  }

  // ── Application card ───────────────────────────────────────────────────────
  Widget _buildCard(Map<String, dynamic> app) {
    final propertyTitle    = app['property_title']    as String? ?? 'Property';
    final propertyType     = app['property_type']     as String? ?? 'Commercial';
    final propertyLocation = app['property_location'] as String? ?? '';
    final applicantName    = app['applicant_name']    as String? ?? 'Applicant';
    final applicantEmail   = app['applicant_email']   as String? ?? '';
    final applicantPhone   = app['applicant_phone']   as String? ?? '';
    final status           = app['status']            as String? ?? 'pending';
    final message          = app['message']           as String?;
    final createdAt        = app['created_at']        as String?;
    final isPending        = status == 'pending';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: kSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 4, offset: const Offset(0, 1))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // ── Top section ──────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Icon
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(color: kSurface2, borderRadius: BorderRadius.circular(10), border: Border.all(color: kBorder)),
              child: const Icon(Icons.apartment_rounded, color: kSlate500, size: 18),
            ),
            const SizedBox(width: 12),
            // Property info
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(propertyTitle,
                  style: const TextStyle(color: kSlate900, fontSize: 13, fontWeight: FontWeight.w700),
                  maxLines: 1, overflow: TextOverflow.ellipsis)),
                const SizedBox(width: 8),
                _buildStatusBadge(status),
              ]),
              const SizedBox(height: 2),
              Text('$propertyType · $propertyLocation',
                style: const TextStyle(color: kSlate500, fontSize: 11),
                maxLines: 1, overflow: TextOverflow.ellipsis),
            ])),
          ]),
        ),

        // ── Divider ──────────────────────────────────────────────────────────
        Divider(height: 1, color: kBorder),

        // ── Applicant row ─────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 10, 10),
          child: Row(children: [
            // Avatar initial
            Container(
              width: 30, height: 30,
              decoration: BoxDecoration(color: kSlate100, shape: BoxShape.circle),
              child: Center(child: Text(
                applicantName.isNotEmpty ? applicantName[0].toUpperCase() : 'A',
                style: const TextStyle(color: kSlate700, fontSize: 12, fontWeight: FontWeight.w700),
              )),
            ),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(applicantName, style: const TextStyle(color: kSlate900, fontSize: 12, fontWeight: FontWeight.w600)),
              Text(applicantEmail.isNotEmpty ? applicantEmail : applicantPhone,
                style: const TextStyle(color: kSlate500, fontSize: 11),
                maxLines: 1, overflow: TextOverflow.ellipsis),
            ])),
            // Date
            Text('${_formatDate(createdAt ?? '')}',
              style: const TextStyle(color: kSlate300, fontSize: 10)),
            const SizedBox(width: 8),
            // Action buttons
            _actionBtn(Icons.visibility_rounded, kSlate500, () {}),
            if (isPending) ...[
              const SizedBox(width: 6),
              _actionBtn(Icons.check_rounded, kEmerald, () => _handleApprove(app['id'])),
              const SizedBox(width: 6),
              _actionBtn(Icons.close_rounded, kRose, () => _handleReject(app['id'])),
            ],
          ]),
        ),

        // ── Message ───────────────────────────────────────────────────────────
        if (message != null && message.isNotEmpty) ...[
          Container(
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(14, 0, 14, 12),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: kSurface2,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(message,
              style: const TextStyle(color: kSlate700, fontSize: 11, height: 1.4),
              maxLines: 3, overflow: TextOverflow.ellipsis),
          ),
        ],
      ]),
    );
  }

  Widget _actionBtn(IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 30, height: 30,
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Icon(icon, color: color, size: 14),
      ),
    );
  }

  // ── Status badge ───────────────────────────────────────────────────────────
  Widget _buildStatusBadge(String status) {
    final color = _statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(_statusIcon(status), size: 10, color: color),
        const SizedBox(width: 4),
        Text(
          status[0].toUpperCase() + status.substring(1),
          style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.3),
        ),
      ]),
    );
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  void _handleApprove(dynamic id) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Approve action to be implemented')));
  }

  void _handleReject(dynamic id) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Reject action to be implemented')));
  }
}