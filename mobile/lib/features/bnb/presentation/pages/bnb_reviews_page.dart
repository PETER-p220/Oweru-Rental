import 'package:flutter/material.dart';
import '../../../shared/services/bnb_api_service.dart';

const Color kGold = Color(0xFFC89128);
const Color kBg = Color(0xFF0A0F1E);
const Color kBg2 = Color(0xFF0F172A);
const Color kBg3 = Color(0xFF162035);
const Color kCream = Color(0xFFF1F5F9);
const Color kSlate = Color(0xFF94A3B8);
const Color kBorder = Color(0x26C89128);

class BnbReviewsPage extends StatefulWidget {
  const BnbReviewsPage({super.key});

  @override
  State<BnbReviewsPage> createState() => _BnbReviewsPageState();
}

class _BnbReviewsPageState extends State<BnbReviewsPage> {
  List<Map<String, dynamic>> _reviews = [];
  bool _isLoading = true;
  String _error = '';
  String _searchQuery = '';
  String _ratingFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadReviews();
  }

  Future<void> _loadReviews() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final reviews = await BnbApiService.getReviews();
      setState(() {
        _reviews = reviews;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load reviews.';
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredReviews {
    var filtered = _reviews;

    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((item) {
        final propertyTitle = (item['property_title'] as String? ?? '').toLowerCase();
        final guestName = (item['guest_name'] as String? ?? '').toLowerCase();
        final comment = (item['comment'] as String? ?? '').toLowerCase();
        return propertyTitle.contains(_searchQuery.toLowerCase()) ||
               guestName.contains(_searchQuery.toLowerCase()) ||
               comment.contains(_searchQuery.toLowerCase());
      }).toList();
    }

    if (_ratingFilter != 'all') {
      final rating = int.tryParse(_ratingFilter);
      if (rating != null) {
        filtered = filtered.where((item) => (item['rating'] as int?) == rating).toList();
      }
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

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredReviews;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        title: const Text('Reviews', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
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
                          hintText: 'Search reviews...',
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
                    _buildFilterChip('5 Stars', '5'),
                    const SizedBox(width: 8),
                    _buildFilterChip('4 Stars', '4'),
                    const SizedBox(width: 8),
                    _buildFilterChip('3 Stars', '3'),
                    const SizedBox(width: 8),
                    _buildFilterChip('2 Stars', '2'),
                    const SizedBox(width: 8),
                    _buildFilterChip('1 Star', '1'),
                  ],
                ),
              ],
            ),
          ),
          // Reviews List
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
                                const Icon(Icons.rate_review_outlined, size: 48, color: kSlate),
                                const SizedBox(height: 16),
                                const Text('No reviews found', style: TextStyle(color: kCream, fontSize: 16)),
                                const SizedBox(height: 8),
                                const Text('Guest reviews will appear here.', style: TextStyle(color: kSlate, fontSize: 13)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: filtered.length,
                            itemBuilder: (context, index) => _buildReviewCard(filtered[index]),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _ratingFilter == value;
    return InkWell(
      onTap: () => setState(() => _ratingFilter = value),
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

  Widget _buildReviewCard(Map<String, dynamic> review) {
    final propertyTitle = review['property_title'] as String? ?? 'Property';
    final guestName = review['guest_name'] as String? ?? 'Guest';
    final rating = review['rating'] as int? ?? 0;
    final comment = review['comment'] as String? ?? '';
    final response = review['response'] as String?;
    final createdAt = review['created_at'] as String?;

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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(propertyTitle, style: const TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(guestName, style: const TextStyle(color: kSlate, fontSize: 14)),
                  ],
                ),
              ),
              Row(
                children: [
                  _buildStars(rating),
                  const SizedBox(width: 8),
                  Text('$rating.0', style: const TextStyle(color: kCream, fontSize: 14)),
                ],
              ),
            ],
          ),
          // Comment
          const SizedBox(height: 12),
          Text(comment, style: const TextStyle(color: kCream, fontSize: 14, height: 1.5)),
          // Response
          if (response != null && response.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Response:', style: TextStyle(color: Color(0xFF10B981), fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(response, style: const TextStyle(color: kCream, fontSize: 13)),
                ],
              ),
            ),
          ],
          // Footer
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(_formatDate(createdAt ?? ''), style: const TextStyle(color: kSlate, fontSize: 12)),
              TextButton.icon(
                onPressed: () => _showReplyDialog(review),
                icon: const Icon(Icons.reply, size: 14),
                label: const Text('Reply', style: TextStyle(fontSize: 12)),
                style: TextButton.styleFrom(
                  foregroundColor: kSlate,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStars(int rating) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        return Icon(
          index < rating ? Icons.star : Icons.star_border,
          size: 14,
          color: const Color(0xFFF59E0B),
        );
      }),
    );
  }

  void _showReplyDialog(Map<String, dynamic> review) {
    final responseController = TextEditingController(text: review['response'] as String? ?? '');

    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: kBg2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Container(
          padding: const EdgeInsets.all(24),
          width: 500,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Reply to Review', style: TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              Text(
                review['comment'] as String? ?? '',
                style: const TextStyle(color: kSlate, fontSize: 13),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: responseController,
                maxLines: 4,
                decoration: InputDecoration(
                  hintText: 'Write your response...',
                  hintStyle: const TextStyle(color: kSlate),
                  filled: true,
                  fillColor: kBg3,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: kBorder),
                  ),
                  contentPadding: const EdgeInsets.all(12),
                ),
                style: const TextStyle(color: kCream),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel', style: TextStyle(color: kSlate)),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      // TODO: Implement reply submission
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kGold,
                      foregroundColor: kBg,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Submit', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
