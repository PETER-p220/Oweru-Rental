import 'package:flutter/material.dart';
import '../../../shared/services/bnb_api_service.dart';

// ── Design tokens ────────────────────────────────────────────────
const Color kGold = Color(0xFFC89128);
const Color kGoldLight = Color(0xFFE8B84B);
const Color kBg = Color(0xFF0A0F1E);
const Color kBg2 = Color(0xFF0F172A);
const Color kBg3 = Color(0xFF162035);
const Color kCard = Color(0xFF131C30);
const Color kCardBorder = Color(0xFF1E2D45);
const Color kCream = Color(0xFFECE8E1);
const Color kSlate = Color(0xFF7A8AA0);
const Color kMuted = Color(0xFF3D4F63);
const Color kGreen = Color(0xFF10B981);
const Color kAmber = Color(0xFFF59E0B);
const Color kRed = Color(0xFFEF4444);
// ────────────────────────────────────────────────────────────────

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
        _error = 'Unable to load reviews. Please try again.';
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredReviews {
    var filtered = _reviews;
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      filtered = filtered.where((item) {
        final title = (item['property_title'] as String? ?? '').toLowerCase();
        final guest = (item['guest_name'] as String? ?? '').toLowerCase();
        final comment = (item['comment'] as String? ?? '').toLowerCase();
        return title.contains(q) || guest.contains(q) || comment.contains(q);
      }).toList();
    }
    if (_ratingFilter != 'all') {
      final rating = int.tryParse(_ratingFilter);
      if (rating != null) {
        filtered = filtered
            .where((item) => (item['rating'] as int?) == rating)
            .toList();
      }
    }
    return filtered;
  }

  // Aggregate stats
  double get _avgRating {
    if (_reviews.isEmpty) return 0;
    final total = _reviews.fold<int>(
        0, (sum, r) => sum + ((r['rating'] as int?) ?? 0));
    return total / _reviews.length;
  }

  int _countByRating(int star) =>
      _reviews.where((r) => (r['rating'] as int?) == star).length;

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '—';
    try {
      final d = DateTime.parse(dateStr);
      const months = [
        'Jan','Feb','Mar','Apr','May','Jun',
        'Jul','Aug','Sep','Oct','Nov','Dec',
      ];
      return '${months[d.month - 1]} ${d.day}, ${d.year}';
    } catch (_) {
      return '—';
    }
  }

  // ── Build ──────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredReviews;

    return Scaffold(
      backgroundColor: kBg,
      appBar: _buildAppBar(),
      body: Column(
        children: [
          // Summary + search + filters
          _buildTopSection(),
          if (_error.isNotEmpty) _buildErrorBanner(),
          // List
          Expanded(
            child: _isLoading
                ? _buildSkeletonList()
                : filtered.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                        itemCount: filtered.length,
                        itemBuilder: (_, i) => _buildReviewCard(filtered[i]),
                      ),
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: kBg2,
      elevation: 0,
      centerTitle: false,
      titleSpacing: 20,
      title: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [kGold, kGoldLight],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
                Icons.rate_review_rounded, size: 16, color: Colors.black),
          ),
          const SizedBox(width: 12),
          const Text(
            'Guest Reviews',
            style: TextStyle(
              color: kCream,
              fontSize: 17,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.3,
            ),
          ),
        ],
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: kCardBorder),
      ),
    );
  }

  Widget _buildTopSection() {
    return Container(
      color: kBg2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Rating summary bar
          if (!_isLoading && _reviews.isNotEmpty) _buildRatingSummary(),
          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: kBg3,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kCardBorder),
              ),
              child: TextField(
                onChanged: (v) => setState(() => _searchQuery = v),
                style: const TextStyle(color: kCream, fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'Search by property, guest, or comment...',
                  hintStyle: TextStyle(color: kMuted, fontSize: 13),
                  prefixIcon: Icon(Icons.search_rounded, color: kMuted, size: 18),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
          // Filter chips — scrollable so they never overflow
          SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              children: [
                _buildFilterChip('All', 'all', Icons.grid_view_rounded),
                _buildFilterChip('5 ★', '5', null),
                _buildFilterChip('4 ★', '4', null),
                _buildFilterChip('3 ★', '3', null),
                _buildFilterChip('2 ★', '2', null),
                _buildFilterChip('1 ★', '1', null),
              ],
            ),
          ),
          Container(height: 1, color: kCardBorder),
        ],
      ),
    );
  }

  Widget _buildRatingSummary() {
    final avg = _avgRating;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: kCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: kCardBorder),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Big average
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  avg.toStringAsFixed(1),
                  style: const TextStyle(
                    color: kGold,
                    fontSize: 38,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -1,
                  ),
                ),
                _buildStars(avg.round()),
                const SizedBox(height: 4),
                Text(
                  '${_reviews.length} review${_reviews.length == 1 ? '' : 's'}',
                  style: const TextStyle(color: kSlate, fontSize: 11),
                ),
              ],
            ),
            const SizedBox(width: 20),
            // Bar breakdown
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(5, (i) {
                  final star = 5 - i;
                  final count = _countByRating(star);
                  final pct =
                      _reviews.isEmpty ? 0.0 : count / _reviews.length;
                  return _buildRatingBar(star, count, pct);
                }),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRatingBar(int star, int count, double pct) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text(
            '$star',
            style: const TextStyle(color: kSlate, fontSize: 11, fontWeight: FontWeight.w600),
          ),
          const SizedBox(width: 4),
          const Icon(Icons.star_rounded, size: 10, color: kAmber),
          const SizedBox(width: 6),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: pct,
                minHeight: 6,
                backgroundColor: kBg3,
                valueColor: const AlwaysStoppedAnimation<Color>(kGold),
              ),
            ),
          ),
          const SizedBox(width: 6),
          SizedBox(
            width: 20,
            child: Text(
              '$count',
              style: const TextStyle(color: kSlate, fontSize: 11),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, IconData? icon) {
    final isSelected = _ratingFilter == value;
    return GestureDetector(
      onTap: () => setState(() => _ratingFilter = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? kGold.withValues(alpha: 0.15) : kBg3,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? kGold.withValues(alpha: 0.6) : kCardBorder,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 12, color: isSelected ? kGold : kSlate),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: TextStyle(
                color: isSelected ? kGold : kSlate,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Review card ──────────────────────────────────────────────

  Widget _buildReviewCard(Map<String, dynamic> review) {
    final title = review['property_title'] as String? ?? 'Property';
    final guest = review['guest_name'] as String? ?? 'Guest';
    final rating = review['rating'] as int? ?? 0;
    final comment = review['comment'] as String? ?? '';
    final response = review['response'] as String?;
    final createdAt = review['created_at'] as String?;
    final hasResponse = response != null && response.isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kCardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.18),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Card header ──
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: kGold.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                    border: Border.all(color: kGold.withValues(alpha: 0.25)),
                  ),
                  child: Center(
                    child: Text(
                      guest.isNotEmpty ? guest[0].toUpperCase() : '?',
                      style: const TextStyle(
                        color: kGold,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        guest,
                        style: const TextStyle(
                          color: kCream,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        title,
                        style: const TextStyle(color: kSlate, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                // Rating pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _ratingColor(rating).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: _ratingColor(rating).withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.star_rounded,
                          size: 13, color: _ratingColor(rating)),
                      const SizedBox(width: 4),
                      Text(
                        '$rating.0',
                        style: TextStyle(
                          color: _ratingColor(rating),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Stars row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: _buildStars(rating),
          ),

          // Divider
          Container(height: 1, color: kCardBorder),

          // Comment
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Text(
              comment,
              style: const TextStyle(
                color: kCream,
                fontSize: 13,
                height: 1.6,
              ),
            ),
          ),

          // Response block
          if (hasResponse) ...[
            Container(height: 1, color: kCardBorder),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: kGreen.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: kGreen.withValues(alpha: 0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.reply_rounded, size: 13, color: kGreen),
                        SizedBox(width: 6),
                        Text(
                          'Host Response',
                          style: TextStyle(
                            color: kGreen,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      response,
                      style: const TextStyle(
                          color: kCream, fontSize: 13, height: 1.5),
                    ),
                  ],
                ),
              ),
            ),
          ],

          // Footer
          Container(height: 1, color: kCardBorder),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 12, 10),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_rounded,
                    size: 11, color: kMuted),
                const SizedBox(width: 5),
                Text(
                  _formatDate(createdAt),
                  style: const TextStyle(color: kMuted, fontSize: 11),
                ),
                const Spacer(),
                _buildReplyButton(review, hasResponse),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReplyButton(Map<String, dynamic> review, bool hasResponse) {
    return GestureDetector(
      onTap: () => _showReplyDialog(review),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: hasResponse
              ? kGreen.withValues(alpha: 0.08)
              : kGold.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(7),
          border: Border.all(
            color: hasResponse
                ? kGreen.withValues(alpha: 0.25)
                : kGold.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              hasResponse ? Icons.edit_rounded : Icons.reply_rounded,
              size: 12,
              color: hasResponse ? kGreen : kGold,
            ),
            const SizedBox(width: 5),
            Text(
              hasResponse ? 'Edit Reply' : 'Reply',
              style: TextStyle(
                color: hasResponse ? kGreen : kGold,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _ratingColor(int rating) {
    if (rating >= 5) return kGreen;
    if (rating >= 4) return kGold;
    if (rating >= 3) return kAmber;
    return kRed;
  }

  Widget _buildStars(int rating) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        return Icon(
          i < rating ? Icons.star_rounded : Icons.star_border_rounded,
          size: 14,
          color: i < rating ? kAmber : kMuted,
        );
      }),
    );
  }

  // ── Reply dialog ───────────────────────────────────────────────

  void _showReplyDialog(Map<String, dynamic> review) {
    final controller =
        TextEditingController(text: review['response'] as String? ?? '');

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: kBg2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Dialog header
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: kGold.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.reply_rounded,
                        size: 18, color: kGold),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Reply to Review',
                    style: TextStyle(
                      color: kCream,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Guest comment preview
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: kBg3,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: kCardBorder),
                ),
                child: Text(
                  review['comment'] as String? ?? '',
                  style: const TextStyle(
                    color: kSlate,
                    fontSize: 13,
                    height: 1.5,
                  ),
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: 14),
              // Response field
              TextField(
                controller: controller,
                maxLines: 4,
                style: const TextStyle(color: kCream, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Write your response...',
                  hintStyle: const TextStyle(color: kMuted),
                  filled: true,
                  fillColor: kBg3,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: kCardBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: kCardBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide:
                        BorderSide(color: kGold.withValues(alpha: 0.5)),
                  ),
                  contentPadding: const EdgeInsets.all(14),
                ),
              ),
              const SizedBox(height: 16),
              // Actions
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(ctx),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: kBg3,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: kCardBorder),
                      ),
                      child: const Text(
                        'Cancel',
                        style: TextStyle(
                          color: kSlate,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: () {
                      Navigator.pop(ctx);
                      // TODO: Implement reply submission
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(
                        color: kGold,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Submit',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Skeleton ──────────────────────────────────────────────────

  Widget _buildSkeletonList() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: 4,
      itemBuilder: (_, _) => _buildSkeletonCard(),
    );
  }

  Widget _buildSkeletonCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kCardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _shimmer(width: 40, height: 40, radius: 40),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _shimmer(width: 120, height: 13, radius: 4),
                    const SizedBox(height: 8),
                    _shimmer(width: 80, height: 10, radius: 4),
                  ],
                ),
                const Spacer(),
                _shimmer(width: 50, height: 28, radius: 20),
              ],
            ),
          ),
          Container(height: 1, color: kCardBorder),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _shimmer(width: double.infinity, height: 11, radius: 4),
                const SizedBox(height: 8),
                _shimmer(width: double.infinity, height: 11, radius: 4),
                const SizedBox(height: 8),
                _shimmer(width: 180, height: 11, radius: 4),
              ],
            ),
          ),
          Container(height: 1, color: kCardBorder),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                _shimmer(width: 80, height: 10, radius: 4),
                const Spacer(),
                _shimmer(width: 64, height: 28, radius: 7),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _shimmer({
    required double width,
    required double height,
    required double radius,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFF1A2740),
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }

  // ── Empty State ──────────────────────────────────────────────

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: kGold.withValues(alpha: 0.08),
                shape: BoxShape.circle,
                border: Border.all(color: kGold.withValues(alpha: 0.2)),
              ),
              child: const Icon(Icons.rate_review_rounded,
                  size: 28, color: kGold),
            ),
            const SizedBox(height: 20),
            const Text(
              'No reviews found',
              style: TextStyle(
                color: kCream,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _searchQuery.isNotEmpty || _ratingFilter != 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Guest reviews will appear here once bookings are complete.',
              style: const TextStyle(
                color: kSlate,
                fontSize: 13,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            if (_searchQuery.isNotEmpty || _ratingFilter != 'all') ...[
              const SizedBox(height: 20),
              GestureDetector(
                onTap: () => setState(() {
                  _searchQuery = '';
                  _ratingFilter = 'all';
                }),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: kGold.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: kGold.withValues(alpha: 0.3)),
                  ),
                  child: const Text(
                    'Clear filters',
                    style: TextStyle(
                      color: kGold,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildErrorBanner() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: kRed.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kRed.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, size: 16, color: kRed),
          const SizedBox(width: 10),
          Expanded(
            child: Text(_error,
                style: const TextStyle(color: kRed, fontSize: 13)),
          ),
          GestureDetector(
            onTap: _loadReviews,
            child: const Text(
              'Retry',
              style: TextStyle(
                color: kRed,
                fontSize: 12,
                fontWeight: FontWeight.w700,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ],
      ),
    );
  }
}