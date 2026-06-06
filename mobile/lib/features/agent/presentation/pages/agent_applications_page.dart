import 'package:flutter/material.dart';
import '../../../shared/services/agent_api_service.dart';

const Color kGold = Color(0xFFC89128);
const Color kBg = Color(0xFF0A0F1E);
const Color kBg2 = Color(0xFF0F172A);
const Color kBg3 = Color(0xFF162035);
const Color kCream = Color(0xFFF1F5F9);
const Color kSlate = Color(0xFF94A3B8);
const Color kBorder = Color(0x26C89128);

class AgentApplicationsPage extends StatefulWidget {
  const AgentApplicationsPage({super.key});

  @override
  State<AgentApplicationsPage> createState() => _AgentApplicationsPageState();
}

class _AgentApplicationsPageState extends State<AgentApplicationsPage> {
  List<Map<String, dynamic>> _applications = [];
  bool _isLoading = true;
  String _error = '';
  int? _actionLoading;
  String _rejectReason = '';
  int? _showRejectModal;

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
      final applications = await AgentApiService.getApplications();
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

  Future<void> _handleApprove(int applicationId) async {
    try {
      setState(() => _actionLoading = applicationId);
      await AgentApiService.approveApplication(applicationId);
      
      setState(() {
        _applications = _applications.map((item) => 
          item['id'] == applicationId ? {...item, 'status': 'approved'} : item
        ).toList();
        _actionLoading = null;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Application approved successfully!')),
        );
      }
    } catch (e) {
      setState(() => _actionLoading = null);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to approve application.')),
        );
      }
    }
  }

  Future<void> _handleReject(int applicationId) async {
    if (_rejectReason.trim().isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please provide a reason for rejection.')),
        );
      }
      return;
    }

    try {
      setState(() => _actionLoading = applicationId);
      await AgentApiService.rejectApplication(applicationId, _rejectReason);
      
      setState(() {
        _applications = _applications.map((item) => 
          item['id'] == applicationId ? {...item, 'status': 'rejected', 'rejection_reason': _rejectReason} : item
        ).toList();
        _actionLoading = null;
        _showRejectModal = null;
        _rejectReason = '';
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Application rejected successfully.')),
        );
      }
    } catch (e) {
      setState(() => _actionLoading = null);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to reject application.')),
        );
      }
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'approved':
        return const Color(0xFF059669);
      case 'rejected':
        return const Color(0xFFDC2626);
      case 'pending':
        return const Color(0xFFD97706);
      default:
        return const Color(0xFF64748B);
    }
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

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '—';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '—';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        title: const Text('Applications', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header Section
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kBg2,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Agent Workspace', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.1)),
                const SizedBox(height: 8),
                const Text('Applications', style: TextStyle(color: kCream, fontSize: 24, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                const Text('Applications submitted for properties assigned to you.', style: TextStyle(color: kSlate, fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Applications List
          if (_error.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFE07070).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(_error, style: const TextStyle(color: Color(0xFFE07070))),
            ),
          if (_isLoading)
            const Center(child: CircularProgressIndicator(color: kGold))
          else if (_applications.isEmpty)
            Container(
              padding: const EdgeInsets.all(40),
              decoration: BoxDecoration(
                color: kBg2,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: kBorder),
              ),
              child: const Center(child: Text('No applications found.', style: TextStyle(color: kSlate))),
            )
          else
            ..._applications.map((app) => _buildApplicationCard(app)),
        ],
      ),
    );
  }

  Widget _buildApplicationCard(Map<String, dynamic> item) {
    final user = item['user'] as Map<String, dynamic>?;
    final property = item['property'] as Map<String, dynamic>?;
    final status = item['status'] as String? ?? 'pending';
    final paymentStatus = item['payment_status'] as String? ?? 'pending';
    final rejectionReason = item['rejection_reason'] as String?;
    final createdAt = item['created_at'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kBg2,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Applicant Info
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: kGold.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    (user?['first_name'] as String? ?? 'A')[0].toUpperCase(),
                    style: const TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${user?['first_name'] ?? ''} ${user?['last_name'] ?? ''}', style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
                    if (user?['email'] != null) ...[
                      const SizedBox(height: 2),
                      Text(user?['email'] ?? '', style: const TextStyle(color: kSlate, fontSize: 12)),
                    ],
                    if (user?['phone'] != null) ...[
                      const SizedBox(height: 2),
                      Text(user?['phone'] ?? '', style: const TextStyle(color: kSlate, fontSize: 12)),
                    ],
                  ],
                ),
              ),
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
                Text(property?['title'] ?? 'Property', style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w500)),
                const SizedBox(height: 4),
                Text('${_formatCurrency(property?['price'])}/month', style: const TextStyle(color: kSlate, fontSize: 12)),
                const SizedBox(height: 2),
                Text(property?['location'] ?? '', style: const TextStyle(color: kSlate, fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Status & Payment
          Row(
            children: [
              _buildStatusBadge(status),
              const SizedBox(width: 8),
              _buildStatusBadge(paymentStatus == 'paid' ? 'approved' : 'pending', label: paymentStatus),
            ],
          ),
          if (rejectionReason != null) ...[
            const SizedBox(height: 8),
            Text(rejectionReason, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 11)),
          ],
          if (paymentStatus == 'paid') ...[
            const SizedBox(height: 8),
            const Text('✓ Site visit paid', style: TextStyle(color: Color(0xFF059669), fontSize: 11)),
          ],
          const SizedBox(height: 16),
          // Date
          Text('Applied: ${_formatDate(createdAt)}', style: const TextStyle(color: kSlate, fontSize: 11)),
          const SizedBox(height: 16),
          // Actions
          if (status == 'pending' && paymentStatus == 'paid')
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _actionLoading == item['id'] ? null : () => _handleApprove(item['id']),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text(_actionLoading == item['id'] ? 'Approving...' : 'Approve', style: const TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _actionLoading == item['id'] ? null : () => setState(() => _showRejectModal = item['id']),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFDC2626),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Reject', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            )
          else if (status == 'pending' && paymentStatus != 'paid')
            const Text('Awaiting payment', style: TextStyle(color: Color(0xFFD97706), fontSize: 11))
          else if (status == 'approved')
            const Text('✓ Approved', style: TextStyle(color: Color(0xFF059669), fontSize: 11))
          else if (status == 'rejected')
            const Text('✗ Rejected', style: TextStyle(color: Color(0xFFDC2626), fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status, {String? label}) {
    final displayLabel = label ?? status;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: _getStatusColor(status).withValues(alpha: 0.3)),
      ),
      child: Text(
        displayLabel.toUpperCase(),
        style: TextStyle(
          color: _getStatusColor(status),
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildRejectModal() {
    return Dialog(
      backgroundColor: kBg2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        padding: const EdgeInsets.all(24),
        width: 400,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Reject Application', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            const Text('Please provide a reason for rejecting this application.', style: TextStyle(color: kSlate, fontSize: 14)),
            const SizedBox(height: 16),
            TextField(
              decoration: InputDecoration(
                hintText: 'Enter rejection reason...',
                hintStyle: const TextStyle(color: kSlate),
                filled: true,
                fillColor: kBg3,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: kBorder),
                ),
                contentPadding: const EdgeInsets.all(12),
              ),
              maxLines: 3,
              style: const TextStyle(color: kCream),
              onChanged: (value) => setState(() => _rejectReason = value),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () {
                    setState(() {
                      _showRejectModal = null;
                      _rejectReason = '';
                    });
                  },
                  child: const Text('Cancel', style: TextStyle(color: kSlate)),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: _rejectReason.trim().isEmpty ? null : () => _handleReject(_showRejectModal!),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFDC2626),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(_actionLoading == _showRejectModal ? 'Rejecting...' : 'Reject Application', style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
