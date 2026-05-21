import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../shared/services/agent_api_service.dart';

class AgentShareTrackPage extends StatefulWidget {
  const AgentShareTrackPage({super.key});

  @override
  State<AgentShareTrackPage> createState() => _AgentShareTrackPageState();
}

class _AgentShareTrackPageState extends State<AgentShareTrackPage>
    with SingleTickerProviderStateMixin {
  List<Map<String, dynamic>> _links = [];
  bool _isLoading = true;
  bool _refreshing = false;
  String _error = '';
  String _searchQuery = '';
  DateTime? _lastUpdated;
  final Map<int, bool> _copied = {};
  late AnimationController _pulseController;

  // ── Design tokens ──────────────────────────────────────────────
  static const _bg = Color(0xFF0C0F18);
  static const _surface = Color(0xFF131720);
  static const _card = Color(0xFF181D2A);
  static const _cardBorder = Color(0xFF242B3D);
  static const _gold = Color(0xFFC9A84C);
  static const _goldLight = Color(0xFFE8C76A);
  static const _green = Color(0xFF10B981);
  static const _blue = Color(0xFF38BDF8);
  static const _amber = Color(0xFFF59E0B);
  static const _red = Color(0xFFEF4444);
  static const _textPrimary = Color(0xFFECE8E1);
  static const _textSecondary = Color(0xFF7A7670);
  static const _textMuted = Color(0xFF4A4745);
  // ───────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _loadData();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _loadData({bool silent = false}) async {
    setState(() {
      if (!silent) _isLoading = true;
      _refreshing = true;
      _error = '';
    });

    try {
      final links = await AgentApiService.getTrackingLinks();
      setState(() {
        _links = links;
        _lastUpdated = DateTime.now();
        _isLoading = false;
        _refreshing = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load tracking links. Please try again.';
        _isLoading = false;
        _refreshing = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_searchQuery.isEmpty) return _links;
    final q = _searchQuery.toLowerCase();
    return _links.where((item) {
      final title = (item['title'] ?? '').toLowerCase();
      final url = (item['tracking_url'] ?? '').toLowerCase();
      return '$title $url'.contains(q);
    }).toList();
  }

  int get _totalClicks => _links.fold(
        0,
        (sum, item) =>
            sum + (int.tryParse(item['clicks']?.toString() ?? '0') ?? 0),
      );

  int get _totalShares => _links.fold(
        0,
        (sum, item) =>
            sum + (int.tryParse(item['shares']?.toString() ?? '0') ?? 0),
      );

  Future<void> _handleCopy(Map<String, dynamic> item) async {
    final url = item['tracking_url'] as String? ?? '';
    await Clipboard.setData(ClipboardData(text: url));
    setState(() => _copied[item['id']] = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied[item['id']] = false);
    });
  }

  Future<void> _handleWhatsApp(Map<String, dynamic> item) async {
    final url = item['tracking_url'] as String? ?? '';
    final wa = 'https://wa.me/?text=${Uri.encodeComponent('Check out this property: $url')}';
    final uri = Uri.parse(wa);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  String _formatDate(String dateStr) {
    try {
      final d = DateTime.parse(dateStr);
      final months = [
        'Jan','Feb','Mar','Apr','May','Jun',
        'Jul','Aug','Sep','Oct','Nov','Dec',
      ];
      return '${months[d.month - 1]} ${d.day}, ${d.year}';
    } catch (_) {
      return '—';
    }
  }

  // ── Build ───────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: _buildAppBar(),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          _buildSearchBar(),
          if (_error.isNotEmpty) _buildErrorBanner(),
          if (_lastUpdated != null) _buildLiveIndicator(),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: _surface,
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
                colors: [_gold, _goldLight],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.track_changes_rounded, size: 16, color: Colors.black),
          ),
          const SizedBox(width: 12),
          const Text(
            'Share & Track',
            style: TextStyle(
              color: _textPrimary,
              fontSize: 17,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.3,
            ),
          ),
        ],
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: _cardBorder),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      color: _surface,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: _gold.withOpacity(0.12),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: _gold.withOpacity(0.25)),
            ),
            child: const Text(
              'AGENT WORKSPACE',
              style: TextStyle(
                color: _gold,
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Tracking Links',
            style: TextStyle(
              color: _textPrimary,
              fontSize: 26,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Clicks are recorded automatically when someone opens your link.',
            style: TextStyle(color: _textSecondary, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 20),
          // Stats row
          Row(
            children: [
              _buildStatCard(
                icon: Icons.link_rounded,
                label: 'Total Links',
                value: '${_links.length}',
                color: _gold,
              ),
              const SizedBox(width: 12),
              _buildStatCard(
                icon: Icons.visibility_rounded,
                label: 'Total Clicks',
                value: '$_totalClicks',
                color: _green,
              ),
              const SizedBox(width: 12),
              _buildStatCard(
                icon: Icons.share_rounded,
                label: 'Total Shares',
                value: '$_totalShares',
                color: _amber,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withOpacity(0.06),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 22,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: color.withOpacity(0.7),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      color: _surface,
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: _card,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _cardBorder),
              ),
              child: TextField(
                onChanged: (v) => setState(() => _searchQuery = v),
                style: const TextStyle(color: _textPrimary, fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'Search properties...',
                  hintStyle: TextStyle(color: _textMuted, fontSize: 14),
                  prefixIcon: Icon(Icons.search_rounded, color: _textMuted, size: 18),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: _refreshing ? null : () => _loadData(silent: true),
            child: Container(
              height: 44,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: _gold.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _gold.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 14,
                    height: 14,
                    child: _refreshing
                        ? CircularProgressIndicator(
                            strokeWidth: 2,
                            color: _gold.withOpacity(0.7),
                          )
                        : const Icon(Icons.refresh_rounded, size: 14, color: _gold),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _refreshing ? 'Updating' : 'Refresh',
                    style: const TextStyle(
                      color: _gold,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveIndicator() {
    return Container(
      color: _surface,
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      child: Row(
        children: [
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, _) => Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                color: _green.withOpacity(
                  0.5 + 0.5 * _pulseController.value,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: _green.withOpacity(0.3 * _pulseController.value),
                    blurRadius: 6,
                    spreadRadius: 2,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'Live · Last updated ${_formatTime(_lastUpdated!)}',
            style: const TextStyle(color: _textMuted, fontSize: 11),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt).inSeconds;
    if (diff < 10) return 'just now';
    if (diff < 60) return '$diff seconds ago';
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  Widget _buildErrorBanner() {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: _red.withOpacity(0.06),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _red.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, size: 16, color: _red),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _error,
              style: const TextStyle(color: _red, fontSize: 13),
            ),
          ),
          GestureDetector(
            onTap: _loadData,
            child: const Text(
              'Retry',
              style: TextStyle(
                color: _red,
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

  Widget _buildBody() {
    if (_isLoading) return _buildSkeletonList();
    if (_filtered.isEmpty) return _buildEmptyState();

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      itemCount: _filtered.length,
      itemBuilder: (context, index) {
        return _buildLinkCard(_filtered[index], index);
      },
    );
  }

  Widget _buildLinkCard(Map<String, dynamic> item, int index) {
    final isCopied = _copied[item['id']] == true;
    final clicks = item['clicks']?.toString() ?? '0';
    final shares = item['shares']?.toString() ?? '0';
    final title = item['title'] ?? 'Untitled Property';
    final trackingUrl = item['tracking_url'] ?? '';
    final createdAt = item['created_at'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Card header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Index badge
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: _gold.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: _gold.withOpacity(0.25)),
                  ),
                  child: Center(
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        color: _gold,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Title and date
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: _textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -0.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.calendar_today_rounded,
                            size: 11,
                            color: _textMuted,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatDate(createdAt),
                            style: const TextStyle(
                              color: _textMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Tracking URL chip
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: GestureDetector(
              onTap: () => _openUrl(trackingUrl),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: _gold.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: _gold.withOpacity(0.15)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.link_rounded, size: 13, color: _gold),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        trackingUrl,
                        style: const TextStyle(
                          color: _gold,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Icon(
                      Icons.open_in_new_rounded,
                      size: 11,
                      color: _textMuted,
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Divider
          Container(height: 1, color: _cardBorder),

          // Stats row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                _buildInlineStatBadge(
                  icon: Icons.visibility_rounded,
                  label: '$clicks clicks',
                  color: _blue,
                ),
                const SizedBox(width: 8),
                _buildInlineStatBadge(
                  icon: Icons.share_rounded,
                  label: '$shares shares',
                  color: _amber,
                ),
                const Spacer(),
                // Action buttons
                _buildCardAction(
                  icon: isCopied ? Icons.check_rounded : Icons.copy_rounded,
                  label: isCopied ? 'Copied' : 'Copy',
                  color: isCopied ? _green : _gold,
                  onTap: () => _handleCopy(item),
                ),
                const SizedBox(width: 8),
                _buildCardAction(
                  icon: Icons.message_rounded,
                  label: 'Share',
                  color: const Color(0xFF25D366),
                  onTap: () => _handleWhatsApp(item),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInlineStatBadge({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.07),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardAction({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(7),
          border: Border.all(color: color.withOpacity(0.25)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Skeleton ───────────────────────────────────────────────────

  Widget _buildSkeletonList() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      itemCount: 4,
      itemBuilder: (_, i) => _buildSkeletonCard(),
    );
  }

  Widget _buildSkeletonCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _shimmer(width: 32, height: 32, radius: 8),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _shimmer(width: 160, height: 14, radius: 4),
                    const SizedBox(height: 8),
                    _shimmer(width: 80, height: 10, radius: 4),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: _shimmer(width: double.infinity, height: 36, radius: 8),
          ),
          Container(height: 1, color: _cardBorder),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _shimmer(width: 72, height: 26, radius: 6),
                const SizedBox(width: 8),
                _shimmer(width: 72, height: 26, radius: 6),
                const Spacer(),
                _shimmer(width: 64, height: 30, radius: 7),
                const SizedBox(width: 8),
                _shimmer(width: 64, height: 30, radius: 7),
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
        color: const Color(0xFF1E2840),
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }

  // ── Empty State ────────────────────────────────────────────────

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
                color: _gold.withOpacity(0.08),
                shape: BoxShape.circle,
                border: Border.all(color: _gold.withOpacity(0.2)),
              ),
              child: const Icon(
                Icons.link_off_rounded,
                size: 26,
                color: _gold,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              _searchQuery.isNotEmpty ? 'No results found' : 'No tracking links yet',
              style: const TextStyle(
                color: _textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _searchQuery.isNotEmpty
                  ? 'Try a different search term.'
                  : 'Tracking links will appear here once your listings are live.',
              style: const TextStyle(
                color: _textSecondary,
                fontSize: 13,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            if (_searchQuery.isNotEmpty) ...[
              const SizedBox(height: 20),
              GestureDetector(
                onTap: () => setState(() => _searchQuery = ''),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: _gold.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: _gold.withOpacity(0.3)),
                  ),
                  child: const Text(
                    'Clear search',
                    style: TextStyle(
                      color: _gold,
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
}