import 'package:flutter/material.dart';
import '../../../../shared/services/tenant_api_service.dart';
import 'tenant_theme.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });
    try {
      final data = await TenantApiService.getNotifications();
      if (!mounted) return;
      setState(() {
        _notifications = data;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load notifications';
        _isLoading = false;
      });
    }
  }

  Future<void> _markAllRead() async {
    final ok = await TenantApiService.markAllNotificationsAsRead();
    if (ok && mounted) {
      setState(() {
        for (final n in _notifications) {
          n['is_read'] = true;
          n['read'] = true;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => !(n['is_read'] == true || n['read'] == true)).length;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        iconTheme: const IconThemeData(color: kGold),
        title: const Text('Notifications',
            style: TextStyle(color: kCream, fontSize: 17, fontWeight: FontWeight.w700)),
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark all read',
                  style: TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
        ],
      ),
      body: _isLoading
          ? ListView(
              padding: const EdgeInsets.all(16),
              children: List.generate(5, (_) => const TSkeletonCard(height: 82)),
            )
          : _error.isNotEmpty
              ? TErrorState(message: _error, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  color: kGold,
                  backgroundColor: kBg2,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (unreadCount > 0)
                        Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: kGoldDim, borderRadius: BorderRadius.circular(10), border: Border.all(color: kGoldBorder)),
                          child: Text('You have $unreadCount unread notification${unreadCount > 1 ? 's' : ''}', style: const TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.w600)),
                        ),
                      if (_notifications.isEmpty)
                        const TEmptyState(
                          icon: Icons.notifications_none_rounded,
                          title: 'No notifications',
                          subtitle: 'You are all caught up for now.',
                        )
                      else
                        ..._notifications.map((n) => _buildNotificationCard(n)),
                    ],
                  ),
                ),
    );
  }

  Widget _buildNotificationCard(Map<String, dynamic> notification) {
    final typeColors = <String, Color>{
      'success': kSuccess,
      'warning': kWarning,
      'danger':  kDanger,
      'info':    kInfo,
    };
    final color = typeColors[notification['type']] ?? kInfo;
    final isRead = notification['is_read'] == true || notification['read'] == true;

    return GestureDetector(
      onTap: () async {
        final id = notification['id'];
        if (id is int && !isRead) {
          await TenantApiService.markNotificationAsRead(id);
        }
        if (!mounted) return;
        setState(() {
          notification['is_read'] = true;
          notification['read'] = true;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isRead ? kBg2 : kGoldDim,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isRead ? kBorder : kGoldBorder),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: color.withOpacity(0.25)),
              ),
              child: Icon(notification['icon'] as IconData, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        notification['title'],
                        style: TextStyle(
                          color: kCream,
                          fontSize: 12,
                          fontWeight: isRead ? FontWeight.w500 : FontWeight.w700,
                        ),
                      ),
                      if (!isRead)
                        Container(
                          width: 8, height: 8,
                          decoration: const BoxDecoration(color: kGold, shape: BoxShape.circle),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification['message'],
                    style: const TextStyle(color: kSlate, fontSize: 11, height: 1.5),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    (notification['timestamp'] ?? notification['created_at'] ?? '').toString(),
                    style: const TextStyle(color: kSlateDim, fontSize: 9),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}