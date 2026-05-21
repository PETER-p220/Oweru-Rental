import 'package:flutter/material.dart';
import '../../../shared/services/bnb_api_service.dart';

const Color kGold = Color(0xFFC89128);
const Color kBg = Color(0xFF0A0F1E);
const Color kBg2 = Color(0xFF0F172A);
const Color kBg3 = Color(0xFF162035);
const Color kCream = Color(0xFFF1F5F9);
const Color kSlate = Color(0xFF94A3B8);
const Color kBorder = Color(0x26C89128);

class BnbBookingsPage extends StatefulWidget {
  const BnbBookingsPage({super.key});

  @override
  State<BnbBookingsPage> createState() => _BnbBookingsPageState();
}

class _BnbBookingsPageState extends State<BnbBookingsPage> {
  List<Map<String, dynamic>> _bookings = [];
  bool _isLoading = true;
  String _error = '';
  String _searchQuery = '';
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final bookings = await BnbApiService.getBookings();
      setState(() {
        _bookings = bookings;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load bookings.';
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredBookings {
    var filtered = _bookings;

    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((item) {
        final propertyTitle = (item['property']?['title'] as String? ?? '').toLowerCase();
        final guestName = _getGuestName(item).toLowerCase();
        return propertyTitle.contains(_searchQuery.toLowerCase()) || guestName.contains(_searchQuery.toLowerCase());
      }).toList();
    }

    if (_statusFilter != 'all') {
      filtered = filtered.where((item) => item['status'] == _statusFilter).toList();
    }

    return filtered;
  }

  String _getGuestName(Map<String, dynamic> booking) {
    if (booking['guest'] != null) {
      return booking['guest']['name'] as String? ?? 'Guest';
    }
    final notes = booking['notes'] as String?;
    if (notes != null && notes.contains('by:')) {
      final match = RegExp(r'by:\s*(.+?)\s*\(').firstMatch(notes);
      if (match != null) return match.group(1)?.trim() ?? 'Guest';
    }
    return 'Guest';
  }

  String _getGuestEmail(Map<String, dynamic> booking) {
    if (booking['guest'] != null) {
      return booking['guest']['email'] as String? ?? '';
    }
    final notes = booking['notes'] as String?;
    if (notes != null) {
      final match = RegExp(r'\(([^,]+),\s*[^)]+\)').firstMatch(notes);
      if (match != null) return match.group(1)?.trim() ?? '';
    }
    return '';
  }

  String _getGuestPhone(Map<String, dynamic> booking) {
    final notes = booking['notes'] as String?;
    if (notes != null) {
      final match = RegExp(r',\s*([^)]+)\)').firstMatch(notes);
      if (match != null) return match.group(1)?.trim() ?? '';
    }
    return '';
  }

  int _getNights(String checkIn, String checkOut) {
    try {
      final inDate = DateTime.parse(checkIn);
      final outDate = DateTime.parse(checkOut);
      return (outDate.difference(inDate).inDays).clamp(1, 999);
    } catch (_) {
      return 1;
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
      case 'confirmed':
        return const Color(0xFF10B981);
      case 'cancelled':
        return const Color(0xFFEF4444);
      case 'completed':
        return const Color(0xFF6366F1);
      default:
        return const Color(0xFF6B7280);
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return Icons.access_time;
      case 'confirmed':
        return Icons.check_circle;
      case 'cancelled':
        return Icons.cancel;
      case 'completed':
        return Icons.check_circle;
      default:
        return Icons.access_time;
    }
  }

  Map<String, int> _getStatusCounts() {
    final counts = <String, int>{};
    for (final booking in _bookings) {
      final status = booking['status'] as String? ?? 'unknown';
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredBookings;
    final counts = _getStatusCounts();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        title: const Text('BNB Bookings', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          // Stats Section
          if (!_isLoading && _bookings.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              color: kBg2,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildStatPill('Total', '${_bookings.length}', kCream),
                    const SizedBox(width: 12),
                    _buildStatPill('Pending', '${counts['pending'] ?? 0}', const Color(0xFFF59E0B)),
                    const SizedBox(width: 12),
                    _buildStatPill('Confirmed', '${counts['confirmed'] ?? 0}', const Color(0xFF10B981)),
                    const SizedBox(width: 12),
                    _buildStatPill('Cancelled', '${counts['cancelled'] ?? 0}', const Color(0xFFEF4444)),
                    const SizedBox(width: 12),
                    _buildStatPill('Completed', '${counts['completed'] ?? 0}', const Color(0xFF6366F1)),
                  ],
                ),
              ),
            ),
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
                          hintText: 'Search by property or guest...',
                          hintStyle: const TextStyle(color: kSlate),
                          filled: true,
                          fillColor: kBg3,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          prefixIcon: const Icon(Icons.search, color: kSlate, size: 20),
                        ),
                        style: const TextStyle(color: kCream),
                        onChanged: (value) {
                          setState(() => _searchQuery = value);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildFilterChip('All', 'all'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Pending', 'pending'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Confirmed', 'confirmed'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Cancelled', 'cancelled'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Completed', 'completed'),
                  ],
                ),
              ],
            ),
          ),
          // Bookings List
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
                                const Icon(Icons.calendar_month_outlined, size: 48, color: kSlate),
                                const SizedBox(height: 16),
                                const Text('No bookings found', style: TextStyle(color: kCream, fontSize: 16)),
                                const SizedBox(height: 8),
                                const Text('Bookings will appear here once guests submit requests.', style: TextStyle(color: kSlate, fontSize: 13)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: filtered.length,
                            itemBuilder: (context, index) => _buildBookingCard(filtered[index]),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatPill(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      decoration: BoxDecoration(
        color: kBg3,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(color: kSlate, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _statusFilter == value;
    return InkWell(
      onTap: () => setState(() => _statusFilter = value),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? kGold : kBg3,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? kGold : kBorder),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? kBg : kSlate,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }

  Widget _buildBookingCard(Map<String, dynamic> booking) {
    final property = booking['property'] as Map<String, dynamic>?;
    final propertyTitle = property?['title'] as String? ?? 'Property #${booking['property_id']}';
    final guestName = _getGuestName(booking);
    final guestEmail = _getGuestEmail(booking);
    final guestPhone = _getGuestPhone(booking);
    final status = booking['status'] as String? ?? 'pending';
    final checkIn = booking['check_in'] as String? ?? '';
    final checkOut = booking['check_out'] as String? ?? '';
    final totalPrice = booking['total_price'];
    final guests = booking['guests'] ?? 1;
    final nights = _getNights(checkIn, checkOut);
    final specialRequests = booking['special_requests'] as List?;

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
          // Header
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(propertyTitle, style: const TextStyle(color: kGold, fontSize: 15, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(Icons.people, size: 12, color: kSlate),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(guestName, style: const TextStyle(color: kSlate, fontSize: 13), overflow: TextOverflow.ellipsis),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              _buildStatusBadge(status),
            ],
          ),
          // Contact chips
          if (guestEmail.isNotEmpty || guestPhone.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (guestEmail.isNotEmpty)
                  _buildContactChip(Icons.email, guestEmail),
                if (guestPhone.isNotEmpty)
                  _buildContactChip(Icons.phone, guestPhone),
              ],
            ),
          ],
          // Dates
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildDateBox('Check-in', _formatDate(checkIn)),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildDateBox('Check-out', _formatDate(checkOut)),
              ),
            ],
          ),
          // Footer
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_formatCurrency(totalPrice), style: const TextStyle(color: Color(0xFF10B981), fontSize: 18, fontWeight: FontWeight.w700)),
                  Text('$nights night${nights != 1 ? 's' : ''} · $guests guest${guests != 1 ? 's' : ''}', style: const TextStyle(color: kSlate, fontSize: 11)),
                ],
              ),
              _buildStatusBadge(status),
            ],
          ),
          // Special requests
          if (specialRequests != null && specialRequests.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: kBg3,
                borderRadius: BorderRadius.circular(7),
              ),
              child: Row(
                children: [
                  const Icon(Icons.message, size: 12, color: kSlate),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      specialRequests.join(', '),
                      style: const TextStyle(color: kSlate, fontSize: 12),
                    ),
                  ),
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _getStatusColor(status).withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_getStatusIcon(status), size: 11, color: _getStatusColor(status)),
          const SizedBox(width: 5),
          Text(
            status.toUpperCase(),
            style: TextStyle(color: _getStatusColor(status), fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.04),
          ),
        ],
      ),
    );
  }

  Widget _buildContactChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: kBg3,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: kSlate),
          const SizedBox(width: 4),
          Text(text, style: const TextStyle(color: kSlate, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildDateBox(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: kBg3,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: kSlate, fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 0.08)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
