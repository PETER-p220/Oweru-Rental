import 'package:flutter/material.dart';
import '../../../shared/services/commercial_api_service.dart';

const Color kGold = Color(0xFFC89128);
const Color kBg = Color(0xFF0A0F1E);
const Color kBg2 = Color(0xFF0F172A);
const Color kBg3 = Color(0xFF162035);
const Color kCream = Color(0xFFF1F5F9);
const Color kSlate = Color(0xFF94A3B8);
const Color kBorder = Color(0x26C89128);

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
  final int _currentPage = 1;
  final int _lastPage = 1;
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _loadApplications();
  }

  Future<void> _loadApplications() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final applications = await CommercialApiService.getApplications();
      setState(() {
        _applications = applications;
        _total = applications.length;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load applications.';
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredApplications {
    var filtered = _applications;

    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((item) {
        final propertyTitle = (item['property_title'] as String? ?? '').toLowerCase();
        final applicantName = (item['applicant_name'] as String? ?? '').toLowerCase();
        final applicantEmail = (item['applicant_email'] as String? ?? '').toLowerCase();
        return propertyTitle.contains(_searchQuery.toLowerCase()) ||
               applicantName.contains(_searchQuery.toLowerCase()) ||
               applicantEmail.contains(_searchQuery.toLowerCase());
      }).toList();
    }

    if (_statusFilter != 'all') {
      filtered = filtered.where((item) => item['status'] == _statusFilter).toList();
    }

    return filtered;
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '—';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'approved':
        return const Color(0xFF10B981);
      case 'rejected':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return Icons.access_time;
      case 'approved':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel;
      default:
        return Icons.access_time;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredApplications;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        title: const Text('Property Applications', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
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
                          hintText: 'Search applications...',
                          hintStyle: const TextStyle(color: kSlate),
                          filled: true,
                          fillColor: kBg3,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                          prefixIcon: const Icon(Icons.search, color: kSlate, size: 14),
                        ),
                        style: const TextStyle(color: kCream),
                        onChanged: (value) {
                          setState(() => _searchQuery = value);
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _statusFilter,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: kBg3,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                      ),
                      style: const TextStyle(color: kCream, fontSize: 13),
                      items: const [
                        DropdownMenuItem(value: 'all', child: Text('All Status')),
                        DropdownMenuItem(value: 'pending', child: Text('Pending')),
                        DropdownMenuItem(value: 'approved', child: Text('Approved')),
                        DropdownMenuItem(value: 'rejected', child: Text('Rejected')),
                      ],
                      onChanged: (value) => setState(() => _statusFilter = value ?? 'all'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Applications List
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
                                const Icon(Icons.assignment_outlined, size: 48, color: kSlate),
                                const SizedBox(height: 16),
                                const Text('No applications found', style: TextStyle(color: kCream, fontSize: 16)),
                                const SizedBox(height: 8),
                                Text(
                                  _searchQuery.isNotEmpty || _statusFilter != 'all'
                                      ? 'Try adjusting your filters'
                                      : 'Applications will appear here when tenants apply for your properties',
                                  style: const TextStyle(color: kSlate, fontSize: 13),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: filtered.length,
                            itemBuilder: (context, index) => _buildApplicationCard(filtered[index]),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildApplicationCard(Map<String, dynamic> application) {
    final propertyTitle = application['property_title'] as String? ?? 'Property';
    final propertyType = application['property_type'] as String? ?? 'Commercial';
    final propertyLocation = application['property_location'] as String? ?? '';
    final applicantName = application['applicant_name'] as String? ?? 'Applicant';
    final applicantEmail = application['applicant_email'] as String? ?? '';
    final applicantPhone = application['applicant_phone'] as String? ?? '';
    final status = application['status'] as String? ?? 'pending';
    final message = application['message'] as String?;
    final createdAt = application['created_at'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kBg2,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: kGold.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: kBorder),
                ),
                child: const Icon(Icons.business, color: kGold, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(propertyTitle, style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600)),
                        ),
                        const SizedBox(width: 8),
                        _buildStatusBadge(status),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text('$propertyType · $propertyLocation', style: const TextStyle(color: kSlate, fontSize: 12)),
                    const SizedBox(height: 2),
                    Text('Applied ${_formatDate(createdAt ?? '')}', style: const TextStyle(color: kSlate, fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
          // Applicant Info
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(applicantName, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w600)),
                  Text(applicantEmail, style: const TextStyle(color: kSlate, fontSize: 11)),
                  Text(applicantPhone, style: const TextStyle(color: kSlate, fontSize: 11)),
                ],
              ),
              // Actions
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.visibility, size: 14),
                    onPressed: () {},
                    style: IconButton.styleFrom(
                      backgroundColor: kGold.withOpacity(0.06),
                      foregroundColor: kGold,
                      padding: const EdgeInsets.all(8),
                      minimumSize: const Size(36, 36),
                    ),
                  ),
                  if (status == 'pending') ...[
                    const SizedBox(width: 6),
                    IconButton(
                      icon: const Icon(Icons.check, size: 14),
                      onPressed: () => _handleApprove(application['id']),
                      style: IconButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981).withOpacity(0.1),
                        foregroundColor: const Color(0xFF10B981),
                        padding: const EdgeInsets.all(8),
                        minimumSize: const Size(36, 36),
                      ),
                    ),
                    const SizedBox(width: 6),
                    IconButton(
                      icon: const Icon(Icons.close, size: 14),
                      onPressed: () => _handleReject(application['id']),
                      style: IconButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444).withOpacity(0.1),
                        foregroundColor: const Color(0xFFEF4444),
                        padding: const EdgeInsets.all(8),
                        minimumSize: const Size(36, 36),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
          // Message
          if (message != null && message.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.only(top: 12),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: kBorder)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Message:', style: TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(message, style: const TextStyle(color: kSlate, fontSize: 12)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _getStatusColor(status).withOpacity(0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_getStatusIcon(status), size: 11, color: _getStatusColor(status)),
          const SizedBox(width: 5),
          Text(
            status[0].toUpperCase() + status.substring(1),
            style: TextStyle(color: _getStatusColor(status), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5),
          ),
        ],
      ),
    );
  }

  void _handleApprove(int id) {
    // TODO: Implement approve action
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Approve action to be implemented')),
    );
  }

  void _handleReject(int id) {
    // TODO: Implement reject action
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Reject action to be implemented')),
    );
  }
}
