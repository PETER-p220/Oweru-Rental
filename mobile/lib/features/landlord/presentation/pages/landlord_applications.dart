import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordApplicationsPage extends StatefulWidget {
  const LandlordApplicationsPage({super.key});

  @override
  State<LandlordApplicationsPage> createState() => _LandlordApplicationsPageState();
}

class _LandlordApplicationsPageState extends State<LandlordApplicationsPage> {
  List<Map<String, dynamic>> _applications = [];
  bool _isLoading = true;
  String _error = '';
  String _success = '';
  int? _busyId;
  Map<int, String> _rejectionReasons = {};

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
      final applications = await LandlordApiService.getApplications();
      setState(() {
        _applications = applications;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load applications.';
        _isLoading = false;
      });
    }
  }

  Map<String, int> get _stats {
    return {
      'total': _applications.length,
      'pending': _applications.where((a) => a['status'] == 'pending').length,
      'approved': _applications.where((a) => a['status'] == 'approved').length,
      'rejected': _applications.where((a) => a['status'] == 'rejected').length,
    };
  }

  String _formatCurrency(dynamic value) {
    if (value == null) return 'TZS 0';
    final double numericValue = value is double ? value : (double.tryParse(value.toString()) ?? 0);
    if (numericValue >= 1000000) {
      return 'TZS ${(numericValue / 1000000).toStringAsFixed(1)}M';
    } else if (numericValue >= 1000) {
      return 'TZS ${(numericValue / 1000).toStringAsFixed(1)}K';
    }
    return 'TZS ${numericValue.toStringAsFixed(0)}';
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
        return const Color(0xFF6B7280);
    }
  }

  Future<void> _handleApprove(int id) async {
    setState(() {
      _busyId = id;
      _error = '';
      _success = '';
    });

    try {
      await LandlordApiService.approveApplication(id);
      await _loadApplications();
      setState(() {
        _success = 'Application approved successfully.';
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to approve application.';
      });
    } finally {
      setState(() {
        _busyId = null;
      });
    }
  }

  Future<void> _handleReject(int id) async {
    final reason = _rejectionReasons[id]?.trim();
    if (reason == null || reason.isEmpty) {
      setState(() {
        _error = 'Add a rejection reason before rejecting an application.';
      });
      return;
    }

    setState(() {
      _busyId = id;
      _error = '';
      _success = '';
    });

    try {
      await LandlordApiService.rejectApplication(id, reason);
      await _loadApplications();
      setState(() {
        _success = 'Application rejected successfully.';             
        _rejectionReasons.remove(id);
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to reject application.';
      });
    } finally {
      setState(() {
        _busyId = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final stats = _stats;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        title: const Text('Applications', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          // Stats Section
          Container(
            padding: const EdgeInsets.all(16),
            color: kBg2,
            child: Row(
              children: [
                Expanded(child: _buildStatCard('Total', '${stats['total']}', kGold)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('Pending', '${stats['pending']}', const Color(0xFFF59E0B))),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('Approved', '${stats['approved']}', const Color(0xFF10B981))),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('Rejected', '${stats['rejected']}', const Color(0xFFEF4444))),
              ],
            ),
          ),
          // Error/Success Alerts
          if (_error.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withOpacity(0.06),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.18)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error, size: 16, color: Color(0xFFEF4444)),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_error, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 14))),
                ],
              ),
            ),
          if (_success.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.22)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, size: 16, color: Color(0xFF10B981)),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_success, style: const TextStyle(color: Color(0xFF10B981), fontSize: 14))),
                ],
              ),
            ),
          // Applications List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: kGold))
                : _applications.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.people, size: 48, color: kSlate),
                            const SizedBox(height: 16),
                            const Text('No applications yet', style: TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 4),
                            const Text('Applications from tenants will appear here.', style: TextStyle(color: kSlate, fontSize: 13)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _applications.length,
                        itemBuilder: (context, index) => _buildApplicationCard(_applications[index]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      decoration: BoxDecoration(
        color: kBg3,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(color: color, fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: -0.02)),
        ],
      ),
    );
  }

  Widget _buildApplicationCard(Map<String, dynamic> application) {
    final user = application['user'] as Map<String, dynamic>?;
    final property = application['property'] as Map<String, dynamic>?;
    final status = application['status'] as String? ?? 'pending';
    final message = application['message'] as String?;
    final rejectionReason = application['rejection_reason'] as String?;
    final createdAt = application['created_at'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kBg2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${user?['first_name'] ?? ''} ${user?['last_name'] ?? ''}',
                      style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(user?['email'] ?? 'No email', style: const TextStyle(color: kSlate, fontSize: 13)),
                    const SizedBox(height: 2),
                    Text(user?['phone'] ?? 'No phone', style: const TextStyle(color: kSlate, fontSize: 13)),
                  ],
                ),
              ),
              _buildStatusBadge(status),
            ],
          ),
          const SizedBox(height: 16),
          // Property Info
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: kBg3,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(property?['title'] ?? 'Untitled property', style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w500)),
                const SizedBox(height: 4),
                Text(property?['location'] ?? 'No location', style: const TextStyle(color: kSlate, fontSize: 13)),
                const SizedBox(height: 4),
                Text(_formatCurrency(property?['price']), style: const TextStyle(color: kGold, fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text('Applied ${_formatDate(createdAt ?? '')}', style: const TextStyle(color: kSlate, fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Message
          if (message != null && message.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: kBg3,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Message:', style: TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(message, style: const TextStyle(color: kSlate, fontSize: 13, height: 1.6)),
                ],
              ),
            ),
          if (message != null && message.isNotEmpty) const SizedBox(height: 16),
          // Rejection Reason
          if (rejectionReason != null && rejectionReason.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Rejection Reason:', style: TextStyle(color: Color(0xFFEF4444), fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(rejectionReason, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13, height: 1.5)),
                ],
              ),
            ),
          if (rejectionReason != null && rejectionReason.isNotEmpty) const SizedBox(height: 16),
          // Actions
          if (status == 'pending')
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ElevatedButton(
                  onPressed: _busyId == application['id'] ? null : () => _handleApprove(application['id']),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kGold,
                    foregroundColor: kBg,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(_busyId == application['id'] ? 'Working...' : '✓ Approve', style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
                const SizedBox(height: 12),
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Rejection reason...',
                    hintStyle: const TextStyle(color: kSlate),
                    filled: true,
                    fillColor: kBg3,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: kBorder),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                  style: const TextStyle(color: kCream),
                  onChanged: (value) {
                    setState(() {
                      _rejectionReasons[application['id']] = value;
                    });
                  },
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _busyId == application['id'] ? null : () => _handleReject(application['id']),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEF4444),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(_busyId == application['id'] ? 'Working...' : '✕ Reject', style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
              ],
            )
          else
            const Text('No further action needed.', style: TextStyle(color: kSlate, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _getStatusColor(status).withOpacity(0.3)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: _getStatusColor(status), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.14),
      ),
    );
  }
}
