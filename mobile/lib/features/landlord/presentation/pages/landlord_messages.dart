import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordMessagesPage extends StatefulWidget {
  const LandlordMessagesPage({super.key});

  @override
  State<LandlordMessagesPage> createState() => _LandlordMessagesPageState();
}

class _LandlordMessagesPageState extends State<LandlordMessagesPage> {
  List<Map<String, dynamic>> _conversations = [];
  Map<String, dynamic>? _selectedConversation;
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  String _error = '';
  String _searchQuery = '';
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _messagesScrollController = ScrollController();
  bool _isMobileChatOpen = false;

  @override
  void initState() {
    super.initState();
    _loadConversations();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _messagesScrollController.dispose();
    super.dispose();
  }

  Future<void> _loadConversations() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final conversations = await LandlordApiService.getMessages();
      setState(() {
        _conversations = conversations;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load conversations.';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMessages(int conversationId) async {
    try {
      final messages = await LandlordApiService.getMessages();
      setState(() {
        _messages = messages;
      });
      _scrollToBottom();
    } catch (e) {
      setState(() {
        _error = 'Unable to load messages.';
      });
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_messagesScrollController.hasClients) {
        _messagesScrollController.animateTo(
          _messagesScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final difference = now.difference(date);
      
      if (difference.inMinutes < 1) return 'now';
      if (difference.inMinutes < 60) return '${difference.inMinutes}m';
      if (difference.inHours < 24) return '${difference.inHours}h';
      if (difference.inDays < 7) return '${difference.inDays}d';
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '—';
    }
  }

  String _formatTime(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }

  List<Map<String, dynamic>> get _filteredConversations {
    if (_searchQuery.isEmpty) return _conversations;
    return _conversations.where((conv) {
      final sender = conv['sender'] as Map<String, dynamic>? ?? {};
      final senderName = '${sender['first_name'] ?? ''} ${sender['last_name'] ?? ''}'.toLowerCase();
      final subject = (conv['subject'] as String? ?? '').toLowerCase();
      final content = (conv['message'] as String? ?? conv['content'] as String? ?? '').toLowerCase();
      return senderName.contains(_searchQuery.toLowerCase()) ||
             subject.contains(_searchQuery.toLowerCase()) ||
             content.contains(_searchQuery.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      body: Row(
        children: [
          // Sidebar
          if (!_isMobileChatOpen)
            Container(
              width: 340,
              decoration: BoxDecoration(
                color: kBg2,
                border: Border(right: BorderSide(color: kBorder)),
              ),
              child: Column(
                children: [
                  // Header
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Landlord Inbox',
                              style: TextStyle(color: kCream, fontSize: 17, fontWeight: FontWeight.w700),
                            ),
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: kGold.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: kGold.withOpacity(0.4)),
                              ),
                              child: const Icon(Icons.add, color: kGold, size: 20),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Search
                        TextField(
                          decoration: InputDecoration(
                            hintText: 'Search conversations...',
                            hintStyle: const TextStyle(color: kSlate, fontSize: 13),
                            filled: true,
                            fillColor: kBg3,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            prefixIcon: const Icon(Icons.search, color: kSlate, size: 15),
                          ),
                          style: const TextStyle(color: kCream, fontSize: 13),
                          onChanged: (value) => setState(() => _searchQuery = value),
                        ),
                      ],
                    ),
                  ),
                  const Divider(color: kBorder),
                  // Conversation list
                  Expanded(
                    child: _isLoading
                        ? const Center(child: CircularProgressIndicator(color: kGold))
                        : _filteredConversations.isEmpty
                            ? const Center(
                                child: Text('No conversations found', style: TextStyle(color: kSlate, fontSize: 14)),
                              )
                            : ListView.builder(
                                itemCount: _filteredConversations.length,
                                itemBuilder: (context, index) => _buildConversationCard(_filteredConversations[index]),
                              ),
                  ),
                ],
              ),
            ),
          // Chat area
          Expanded(
            child: _selectedConversation == null
                ? _buildEmptyState()
                : _buildChatArea(),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationCard(Map<String, dynamic> conversation) {
    final sender = conversation['sender'] as Map<String, dynamic>? ?? {};
    final senderName = '${sender['first_name'] ?? ''} ${sender['last_name'] ?? ''}'.trim() ?? 'Unknown';
    final content = conversation['message'] as String? ?? conversation['content'] as String? ?? 'No messages yet';
    final isRead = conversation['is_read'] as bool? ?? false;
    final isSelected = _selectedConversation != null && _selectedConversation!['id'] == conversation['id'];
    final unreadCount = conversation['unread_count'] as int? ?? 0;

    return InkWell(
      onTap: () {
        setState(() {
          _selectedConversation = conversation;
          _isMobileChatOpen = true;
        });
        _loadMessages(conversation['id']);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? kGold.withOpacity(0.12) : Colors.transparent,
          border: Border(
            left: BorderSide(
              color: isSelected ? kGold : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: kGold.withOpacity(0.3),
              child: Text(
                senderName.isNotEmpty ? senderName[0].toUpperCase() : 'U',
                style: const TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        senderName,
                        style: TextStyle(
                          color: kCream,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        _formatDate(conversation['created_at'] ?? ''),
                        style: const TextStyle(color: kSlate, fontSize: 11),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    content,
                    style: TextStyle(
                      color: unreadCount > 0 ? kCream : kSlate,
                      fontSize: 13,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (unreadCount > 0)
              Container(
                width: 20,
                height: 20,
                decoration: const BoxDecoration(color: kGold, shape: BoxShape.circle),
                child: Center(
                  child: Text(
                    unreadCount > 9 ? '9+' : '$unreadCount',
                    style: const TextStyle(color: kBg, fontSize: 11, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: kGold.withOpacity(0.15),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(Icons.message, color: kGold, size: 40),
          ),
          const SizedBox(height: 20),
          const Text(
            'No conversation selected',
            style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          const Text(
            'Select a conversation from the sidebar',
            style: TextStyle(color: kSlate, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildChatArea() {
    final sender = _selectedConversation!['sender'] as Map<String, dynamic>? ?? {};
    final senderName = '${sender['first_name'] ?? ''} ${sender['last_name'] ?? ''}'.trim() ?? 'Unknown';

    return Column(
      children: [
        // Chat header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: kBg2,
            border: Border(bottom: BorderSide(color: kBorder)),
          ),
          child: Row(
            children: [
              if (_isMobileChatOpen)
                IconButton(
                  icon: const Icon(Icons.arrow_back, color: kSlate),
                  onPressed: () => setState(() => _isMobileChatOpen = false),
                ),
              CircleAvatar(
                backgroundColor: kGold.withOpacity(0.3),
                child: Text(
                  senderName.isNotEmpty ? senderName[0].toUpperCase() : 'U',
                  style: const TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      senderName,
                      style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                    const Text(
                      'Online',
                      style: TextStyle(color: Color(0xFF10B981), fontSize: 11),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.phone, color: kSlate, size: 18),
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.videocam, color: kSlate, size: 18),
                onPressed: () {},
              ),
            ],
          ),
        ),
        // Messages
        Expanded(
          child: Container(
            color: kBg,
            child: _messages.isEmpty
                ? const Center(
                    child: Text('No messages yet. Say hello!', style: TextStyle(color: kSlate, fontSize: 14)),
                  )
                : ListView.builder(
                    controller: _messagesScrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) => _buildMessageBubble(_messages[index]),
                  ),
          ),
        ),
        // Input area
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: kBg2,
            border: Border(top: BorderSide(color: kBorder)),
          ),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.attach_file, color: kSlate, size: 20),
                onPressed: () {},
              ),
              Expanded(
                child: TextField(
                  controller: _messageController,
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    hintStyle: const TextStyle(color: kSlate, fontSize: 14),
                    filled: true,
                    fillColor: kBg3,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                  style: const TextStyle(color: kCream, fontSize: 14),
                  maxLines: null,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _messageController.text.trim().isNotEmpty ? kGold : kBg3,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: const Icon(Icons.send, color: kBg, size: 18),
                  onPressed: _messageController.text.trim().isNotEmpty ? _sendMessage : null,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> message) {
    final isFromMe = message['is_from_me'] as bool? ?? false;
    final content = message['message'] as String? ?? message['content'] as String? ?? '';

    return Align(
      alignment: isFromMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 320),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isFromMe ? kGold : kBg3,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: isFromMe ? const Radius.circular(18) : const Radius.circular(4),
            bottomRight: isFromMe ? const Radius.circular(4) : const Radius.circular(18),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              content,
              style: TextStyle(
                color: isFromMe ? kBg : kCream,
                fontSize: 14,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _formatTime(message['created_at'] ?? ''),
              style: TextStyle(
                color: isFromMe ? kBg.withOpacity(0.65) : kSlate.withOpacity(0.65),
                fontSize: 10,
              ),
              textAlign: TextAlign.right,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty || _selectedConversation == null) return;
    
    final content = _messageController.text.trim();
    setState(() {
      _messageController.clear();
    });
    
    // Add message locally for immediate feedback
    setState(() {
      _messages.add({
        'id': DateTime.now().millisecondsSinceEpoch,
        'message': content,
        'is_from_me': true,
        'created_at': DateTime.now().toIso8601String(),
      });
    });
    _scrollToBottom();
    
    // TODO: Send to API
  }
}
