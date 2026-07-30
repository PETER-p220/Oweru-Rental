import 'package:flutter/material.dart';
import '../../../shared/services/commercial_api_service.dart';

const Color kWhite = Color(0xFFFFFFFF);
const Color kBg = Color(0xFFF8FAFC);
const Color kBorder = Color(0xFFE2E8F0);
const Color kSlate800 = Color(0xFF1E293B);
const Color kSlate500 = Color(0xFF64748B);
const Color kGold = Color(0xFFC89128);

class CommercialNotificationsPage extends StatefulWidget {
  const CommercialNotificationsPage({super.key});

  @override
  State<CommercialNotificationsPage> createState() => _CommercialNotificationsPageState();
}

class _CommercialNotificationsPageState extends State<CommercialNotificationsPage> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final items = await CommercialApiService.getNotifications();
      setState(() { _items = items; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  bool _isUnread(Map<String, dynamic> n) => !(n['is_read'] == true || n['read_at'] != null);

  @override
  Widget build(BuildContext context) {
    final unread = _items.where(_isUnread).length;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kWhite,
        foregroundColor: kSlate800,
        title: const Text('Notifications'),
        actions: [
          if (unread > 0)
            TextButton(onPressed: () async { await CommercialApiService.markAllNotificationsRead(); _load(); }, child: const Text('Read all')),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _items.isEmpty
                  ? ListView(children: const [SizedBox(height: 80), Center(child: Text('No notifications', style: TextStyle(color: kSlate500)))])
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _items.length,
                      itemBuilder: (_, i) {
                        final n = _items[i];
                        final unreadItem = _isUnread(n);
                        return GestureDetector(
                          onTap: () async {
                            if (unreadItem && n['id'] != null) {
                              await CommercialApiService.markNotificationRead(n['id'] as int);
                              _load();
                            }
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: kWhite,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: unreadItem ? kGold.withValues(alpha: 0.4) : kBorder),
                            ),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(n['title']?.toString() ?? 'Notification', style: TextStyle(fontWeight: unreadItem ? FontWeight.w800 : FontWeight.w600)),
                              const SizedBox(height: 4),
                              Text(n['message']?.toString() ?? '', style: const TextStyle(color: kSlate500, fontSize: 13)),
                            ]),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
