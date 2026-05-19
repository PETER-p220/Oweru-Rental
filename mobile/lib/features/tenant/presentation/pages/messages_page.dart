import 'package:flutter/material.dart';
import 'tenant_theme.dart';

class MessagesPage extends StatefulWidget {
  const MessagesPage({super.key});

  @override
  State<MessagesPage> createState() => _MessagesPageState();
}

class _MessagesPageState extends State<MessagesPage> {
  final List<Map<String, dynamic>> _conversations = [
    {
      'id': 1,
      'name': 'John Doe',
      'role': 'Landlord',
      'lastMessage': 'The property will be ready for move-in next week.',
      'timestamp': '2 hours ago',
      'unread': 2,
      'avatar': 'J',
    },
    {
      'id': 2,
      'name': 'Jane Smith',
      'role': 'Property Agent',
      'lastMessage': 'Have you scheduled a viewing for the Oyster Bay property?',
      'timestamp': '5 hours ago',
      'unread': 0,
      'avatar': 'J',
    },
    {
      'id': 3,
      'name': 'Support Team',
      'role': 'Oweru Support',
      'lastMessage': 'Thank you for your inquiry. We will respond shortly.',
      'timestamp': '1 day ago',
      'unread': 0,
      'avatar': 'S',
    },
  ];

  String _searchQuery = '';
  int? _selectedConversationId;

  @override
  Widget build(BuildContext context) {
    if (_selectedConversationId != null) {
      return _buildChatView();
    }

    final filtered = _conversations
        .where((conv) =>
            conv['name'].toString().toLowerCase().contains(_searchQuery.toLowerCase()) ||
            conv['role'].toString().toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        iconTheme: const IconThemeData(color: kGold),
        title: const Text('Messages',
            style: TextStyle(color: kCream, fontSize: 17, fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSearchBar(),
          const SizedBox(height: 16),
          if (filtered.isEmpty)
            const TEmptyState(
              icon: Icons.chat_bubble_outline_rounded,
              title: 'No messages yet',
              subtitle: 'Messages from your landlord and agents will appear here.',
            )
          else
            ...filtered.map((conv) => _buildConversationCard(conv)),
        ],
      ),
    );
  }

  Widget _buildSearchBar() => TextField(
    onChanged: (value) => setState(() => _searchQuery = value),
    style: const TextStyle(color: kCream, fontSize: 13),
    decoration: InputDecoration(
      hintText: 'Search conversations...',
      hintStyle: const TextStyle(color: kSlateDim),
      prefixIcon: const Icon(Icons.search_rounded, color: kSlate, size: 20),
      filled: true,
      fillColor: kBg2,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border:        OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kBorder)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kBorder)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kGold)),
    ),
  );

  Widget _buildConversationCard(Map<String, dynamic> conversation) {
    return GestureDetector(
      onTap: () => setState(() => _selectedConversationId = conversation['id']),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: kBg2,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: kBorder),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: kGoldDim,
              child: Text(
                conversation['avatar'],
                style: const TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.w700),
              ),
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
                        conversation['name'],
                        style: const TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      Text(
                        conversation['timestamp'],
                        style: const TextStyle(color: kSlateDim, fontSize: 10),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    conversation['role'],
                    style: const TextStyle(color: kSlate, fontSize: 10),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    conversation['lastMessage'],
                    style: const TextStyle(color: kSlate, fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (conversation['unread'] > 0) ...[
              const SizedBox(width: 10),
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(color: kGold, borderRadius: BorderRadius.circular(11)),
                child: Center(
                  child: Text(
                    conversation['unread'].toString(),
                    style: const TextStyle(color: kBg, fontSize: 10, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildChatView() {
    final conversation = _conversations.firstWhere((c) => c['id'] == _selectedConversationId);
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg2,
        elevation: 0,
        iconTheme: const IconThemeData(color: kGold),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: kCream),
          onPressed: () => setState(() => _selectedConversationId = null),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              conversation['name'],
              style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600),
            ),
            Text(
              conversation['role'],
              style: const TextStyle(color: kSlate, fontSize: 10),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildMessage('Hey, is the apartment still available?', false, '10:30 AM'),
                _buildMessage('Yes, it is! When would you like to schedule a viewing?', true, '10:35 AM'),
                _buildMessage('How about this weekend?', false, '10:40 AM'),
                _buildMessage('Perfect! Saturday at 2 PM works for me. See you then!', true, '10:42 AM'),
              ],
            ),
          ),
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildMessage(String text, bool isReceived, String time) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: isReceived ? CrossAxisAlignment.start : CrossAxisAlignment.end,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isReceived ? kBg2 : kGold,
              borderRadius: BorderRadius.circular(12),
              border: isReceived ? Border.all(color: kBorder) : null,
            ),
            child: Text(
              text,
              style: TextStyle(
                color: isReceived ? kCream : kBg,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(time, style: const TextStyle(color: kSlateDim, fontSize: 9)),
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        color: kBg2,
        border: Border(top: BorderSide(color: kBorder)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              style: const TextStyle(color: kCream, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Type a message...',
                hintStyle: const TextStyle(color: kSlateDim),
                filled: true,
                fillColor: kBg,
                border:        OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kBorder)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kBorder)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGold)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              gradient: kGoldGradient,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.send_rounded, color: kBg, size: 18),
          ),
        ],
      ),
    );
  }
}