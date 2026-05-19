import 'package:flutter/material.dart';
import 'tenant_theme.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final List<Map<String, dynamic>> _notifications = [
    {
      'id': 1,
      'title': 'Application Approved',
      'message': 'Your application for Masaki Apartments - Unit 3B has been approved!',
      'timestamp': '2 hours ago',
      'type': 'success',
      'read': false,
      'icon': Icons.check_circle_rounded,
    },
    {
      'id': 2,
      'title': 'Payment Reminder',
      'message': 'Your rent payment is due in 5 days. Pay now to avoid penalties.',
      'timestamp': '5 hours ago',
      'type': 'warning',
      'read': false,
      'icon': Icons.warning_rounded,
    },
    {
      'id': 3,
      'title': 'New Message',
      'message': 'John Doe sent you a message about the property viewing.',
      'timestamp': '1 day ago',
      'type': 'info',
      'read': true,
      'icon': Icons.mail_rounded,
    },
    {
      'id': 4,
      'title': 'Application Received',
      'message': 'Your application for Oyster Bay Villa has been received and is under review.',
      'timestamp': '2 days ago',
      'type': 'info',
      'read': true,
      'icon': Icons.description_rounded,
    },
    {
      'id': 5,
      'title': 'Contract Ready',
      'message': 'Your rental contract for Masaki Apartments is ready for review and signature.',
      'timestamp': '3 days ago',
      'type': 'info',
      'read': true,
      'icon': Icons.check_circle_rounded,
    },
  ];

  void _markAllRead() {
    setState(() {
      for (final n in _notifications) {
        n['read'] = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => !n['read']).length;

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
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (unreadCount > 0)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: kGoldDim,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kGoldBorder),
              ),
              child: Row(
                children: [
                  const Icon(Icons.notifications_active_rounded, color: kGold, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'You have $unreadCount unread notification${unreadCount > 1 ? 's' : ''}',
                    style: const TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ..._notifications.map((n) => _buildNotificationCard(n)),
        ],
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
    final isRead = notification['read'] as bool;

    return GestureDetector(
      onTap: () => setState(() => notification['read'] = true),
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
                    notification['timestamp'],
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