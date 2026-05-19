// ============================================================
// landlord_messages.dart — Messages page
// ============================================================
import 'package:flutter/material.dart';
import 'landlord_theme.dart';

class LandlordMessagesPage extends StatefulWidget {
  const LandlordMessagesPage({super.key});
  @override
  State<LandlordMessagesPage> createState() => _LandlordMessagesPageState();
}

class _LandlordMessagesPageState extends State<LandlordMessagesPage> {
  final List<Message> _messages = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = '';
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _loading = false;
      // For now, empty list - will be populated from API
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    appBar: AppBar(
      backgroundColor: kBg2,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_rounded, color: kGold),
        onPressed: () => Navigator.pop(context),
      ),
      title: const Text('Messages',
        style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600)),
      actions: [
        IconButton(
          icon: const Icon(Icons.edit_rounded, color: kGold),
          onPressed: () {
            // Navigate to compose message
          },
        ),
      ],
    ),
    body: _loading ? _buildLoading() : _buildContent(),
  );

  Widget _buildLoading() => const Center(
    child: CircularProgressIndicator(color: kGold),
  );

  Widget _buildContent() => _messages.isEmpty
    ? LEmptyState(
        icon: Icons.chat_bubble_outline_rounded,
        title: 'No messages yet',
        subtitle: 'Conversations with tenants and agents will appear here.',
      )
    : ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _messages.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) => _MessageCard(message: _messages[index]),
      );
}

class _MessageCard extends StatelessWidget {
  final Message message;
  const _MessageCard({required this.message});

  @override
  Widget build(BuildContext context) => LCard(
    padding: const EdgeInsets.all(16),
    child: Row(children: [
      Container(width: 48, height: 48,
        decoration: BoxDecoration(
          color: kGold.withOpacity(0.12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(child: Text(
          message.senderName[0].toUpperCase(),
          style: TextStyle(color: kGold, fontSize: 18, fontWeight: FontWeight.w700),
        )),
      ),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(message.senderName, style: TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
          Text(_formatTime(message.timestamp), style: TextStyle(color: kSlate, fontSize: 11)),
        ]),
        const SizedBox(height: 4),
        Text(message.subject, style: TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w500)),
        const SizedBox(height: 2),
        Text(message.preview, style: TextStyle(color: kSlate, fontSize: 12),
          maxLines: 1, overflow: TextOverflow.ellipsis),
      ])),
      if (message.unread) ...[
        const SizedBox(width: 8),
        Container(width: 8, height: 8,
          decoration: BoxDecoration(color: kGold, shape: BoxShape.circle)),
      ],
    ]),
  );

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${time.day}/${time.month}/${time.year}';
  }
}

class Message {
  final String id;
  final String senderName;
  final String subject;
  final String preview;
  final DateTime timestamp;
  final bool unread;

  Message({
    required this.id,
    required this.senderName,
    required this.subject,
    required this.preview,
    required this.timestamp,
    this.unread = false,
  });
}
