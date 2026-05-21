// ============================================================
// landlord_messages.dart — redesigned messaging UI
// ============================================================
import 'package:flutter/material.dart';
import '../../../../shared/services/landlord_api_service.dart';
import 'landlord_theme.dart';

class LandlordMessagesPage extends StatefulWidget {
  const LandlordMessagesPage({super.key});

  @override
  State<LandlordMessagesPage> createState() => _LandlordMessagesPageState();
}

class _LandlordMessagesPageState extends State<LandlordMessagesPage>
    with TickerProviderStateMixin {
  List<Map<String, dynamic>> _conversations = [];
  Map<String, dynamic>? _selectedConversation;
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  bool _isMessagesLoading = false;
  String _error = '';
  String _searchQuery = '';
  bool _isMobileChatOpen = false;
  bool _isTyping = false;
  bool _showEmojiPicker = false;

  final TextEditingController _messageController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _messagesScrollController = ScrollController();
  final FocusNode _messageFocusNode = FocusNode();

  late AnimationController _typingAnimCtrl;
  late AnimationController _slideAnimCtrl;
  late Animation<Offset> _slideAnim;

  // Quick reply suggestions
  final List<String> _quickReplies = [
    'The property is still available ✅',
    'Please send your documents 📄',
    'Rent is due on the 1st 📅',
    'I will visit tomorrow 🏠',
    'Thank you for reaching out!',
  ];

  final List<String> _emojis = [
    '😊', '👍', '🏠', '✅', '📄', '📅', '💰', '🔑', '📞', '🙏',
    '❤️', '👋', '😄', '🤝', '⭐', '🎉', '💬', '📱', '🔔', '✨',
  ];

  @override
  void initState() {
    super.initState();
    _typingAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);

    _slideAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(1.0, 0.0),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _slideAnimCtrl, curve: Curves.easeOutCubic));

    _messageController.addListener(() {
      setState(() => _isTyping = _messageController.text.trim().isNotEmpty);
    });

    _loadConversations();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _searchController.dispose();
    _messagesScrollController.dispose();
    _messageFocusNode.dispose();
    _typingAnimCtrl.dispose();
    _slideAnimCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadConversations() async {
    setState(() { _isLoading = true; _error = ''; });
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
    setState(() => _isMessagesLoading = true);
    try {
      final messages = await LandlordApiService.getMessages();
      setState(() {
        _messages = messages;
        _isMessagesLoading = false;
      });
      _scrollToBottom();
    } catch (e) {
      setState(() {
        _messages = [];
        _isMessagesLoading = false;
      });
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 120), () {
      if (_messagesScrollController.hasClients) {
        _messagesScrollController.animateTo(
          _messagesScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _openChat(Map<String, dynamic> conversation) {
    setState(() {
      _selectedConversation = conversation;
      _isMobileChatOpen = true;
      _showEmojiPicker = false;
    });
    _slideAnimCtrl.forward(from: 0);
    _loadMessages(conversation['id']);
  }

  void _closeChat() {
    _slideAnimCtrl.reverse().then((_) {
      if (mounted) setState(() => _isMobileChatOpen = false);
    });
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);
      if (diff.inMinutes < 1) return 'now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays == 1) return 'Yesterday';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${date.day}/${date.month}';
    } catch (_) { return ''; }
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (_) { return ''; }
  }

  String _senderInitial(Map<String, dynamic> conv) {
    final sender = conv['sender'] as Map<String, dynamic>? ?? {};
    final name = '${sender['first_name'] ?? ''}'.trim();
    return name.isNotEmpty ? name[0].toUpperCase() : 'U';
  }

  String _senderName(Map<String, dynamic> conv) {
    final sender = conv['sender'] as Map<String, dynamic>? ?? {};
    return '${sender['first_name'] ?? ''} ${sender['last_name'] ?? ''}'.trim().isNotEmpty
        ? '${sender['first_name'] ?? ''} ${sender['last_name'] ?? ''}'.trim()
        : 'Unknown';
  }

  List<Map<String, dynamic>> get _filteredConversations {
    if (_searchQuery.isEmpty) return _conversations;
    final q = _searchQuery.toLowerCase();
    return _conversations.where((conv) {
      final name = _senderName(conv).toLowerCase();
      final subject = (conv['subject'] as String? ?? '').toLowerCase();
      final content = (conv['message'] as String? ?? conv['content'] as String? ?? '').toLowerCase();
      return name.contains(q) || subject.contains(q) || content.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width >= 600;

    return Scaffold(
      backgroundColor: kBg,
      body: isWide
          ? _buildWideLayout()
          : _isMobileChatOpen
              ? SlideTransition(position: _slideAnim, child: _buildChatPanel())
              : _buildSidebarPanel(),
    );
  }

  // ── Wide Layout (tablet/desktop) ─────────────────────────
  Widget _buildWideLayout() => Row(
    children: [
      SizedBox(width: 320, child: _buildSidebarPanel()),
      Container(width: 1, color: kBorder),
      Expanded(child: _selectedConversation == null ? _buildEmptyState() : _buildChatPanel()),
    ],
  );

  // ── Sidebar ──────────────────────────────────────────────
  Widget _buildSidebarPanel() => Container(
    color: kBg2,
    child: Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Messages',
                          style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.3)),
                        if (_conversations.isNotEmpty)
                          Text('${_conversations.length} conversations',
                            style: const TextStyle(color: kSlate, fontSize: 11)),
                      ],
                    ),
                  ),
                  // Compose button
                  _IconBtn(
                    icon: Icons.edit_rounded,
                    color: kGold,
                    onTap: () {},
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Search bar
              Container(
                height: 38,
                decoration: BoxDecoration(
                  color: kBg3,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: kBorder),
                ),
                child: TextField(
                  controller: _searchController,
                  decoration: const InputDecoration(
                    hintText: 'Search...',
                    hintStyle: TextStyle(color: kSlateDim, fontSize: 13),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    prefixIcon: Icon(Icons.search_rounded, color: kSlateDim, size: 16),
                  ),
                  style: const TextStyle(color: kCream, fontSize: 13),
                  onChanged: (v) => setState(() => _searchQuery = v),
                ),
              ),
            ],
          ),
        ),
        Container(height: 1, color: kBorder),
        // List
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator(color: kGold, strokeWidth: 2))
              : _error.isNotEmpty
                  ? _buildSidebarError()
                  : _filteredConversations.isEmpty
                      ? _buildSidebarEmpty()
                      : ListView.builder(
                          itemCount: _filteredConversations.length,
                          itemBuilder: (_, i) => _buildConversationTile(_filteredConversations[i]),
                        ),
        ),
      ],
    ),
  );

  Widget _buildSidebarError() => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.wifi_off_rounded, color: kSlateDim, size: 32),
      const SizedBox(height: 8),
      Text(_error, style: const TextStyle(color: kSlate, fontSize: 13), textAlign: TextAlign.center),
      const SizedBox(height: 12),
      GestureDetector(
        onTap: _loadConversations,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: kGoldDim,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: kGoldBorder),
          ),
          child: const Text('Retry', style: TextStyle(color: kGold, fontSize: 13)),
        ),
      ),
    ]),
  );

  Widget _buildSidebarEmpty() => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Container(
        width: 52, height: 52,
        decoration: BoxDecoration(color: kGoldDim, borderRadius: BorderRadius.circular(16),
          border: Border.all(color: kGoldBorder)),
        child: const Icon(Icons.inbox_rounded, color: kGold, size: 26),
      ),
      const SizedBox(height: 12),
      const Text('No conversations', style: TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
      const SizedBox(height: 4),
      const Text('Start a new message', style: TextStyle(color: kSlate, fontSize: 12)),
    ]),
  );

  Widget _buildConversationTile(Map<String, dynamic> conv) {
    final isSelected = _selectedConversation?['id'] == conv['id'];
    final unread = conv['unread_count'] as int? ?? 0;
    final content = conv['message'] as String? ?? conv['content'] as String? ?? 'No messages yet';
    final initial = _senderInitial(conv);
    final name = _senderName(conv);

    return GestureDetector(
      onTap: () => _openChat(conv),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? kGold.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: isSelected ? Border.all(color: kGoldBorder) : null,
        ),
        child: Row(
          children: [
            // Avatar with online dot
            Stack(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: kGold.withOpacity(0.18),
                  child: Text(initial,
                    style: const TextStyle(color: kGold, fontSize: 15, fontWeight: FontWeight.w800)),
                ),
                Positioned(
                  bottom: 1, right: 1,
                  child: Container(
                    width: 9, height: 9,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      shape: BoxShape.circle,
                      border: Border.all(color: kBg2, width: 1.5),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(name,
                          style: TextStyle(
                            color: kCream,
                            fontSize: 13,
                            fontWeight: unread > 0 ? FontWeight.w700 : FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(_formatDate(conv['created_at']),
                        style: TextStyle(
                          color: unread > 0 ? kGold : kSlateDim,
                          fontSize: 10,
                          fontWeight: unread > 0 ? FontWeight.w600 : FontWeight.w400,
                        )),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          content,
                          style: TextStyle(
                            color: unread > 0 ? kCream : kSlateDim,
                            fontSize: 12,
                            fontWeight: unread > 0 ? FontWeight.w500 : FontWeight.w400,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (unread > 0) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: kGold, borderRadius: BorderRadius.circular(20)),
                          child: Text(
                            unread > 9 ? '9+' : '$unread',
                            style: const TextStyle(color: kBg, fontSize: 10, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Empty state ──────────────────────────────────────────
  Widget _buildEmptyState() => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Container(
        width: 80, height: 80,
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [kGold.withOpacity(0.2), kGold.withOpacity(0.05)],
            begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: kGoldBorder),
        ),
        child: const Icon(Icons.chat_bubble_outline_rounded, color: kGold, size: 38),
      ),
      const SizedBox(height: 20),
      const Text('Your messages', style: TextStyle(color: kCream, fontSize: 17, fontWeight: FontWeight.w700)),
      const SizedBox(height: 6),
      const Text('Select a conversation to start chatting',
        style: TextStyle(color: kSlate, fontSize: 13)),
    ]),
  );

  // ── Chat Panel ───────────────────────────────────────────
  Widget _buildChatPanel() {
    if (_selectedConversation == null) return _buildEmptyState();
    final name = _senderName(_selectedConversation!);
    final initial = _senderInitial(_selectedConversation!);

    return Column(
      children: [
        // Chat header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: kBg2,
            border: Border(bottom: BorderSide(color: kBorder)),
          ),
          child: Row(
            children: [
              // Back (mobile)
              GestureDetector(
                onTap: _closeChat,
                child: Container(
                  width: 34, height: 34,
                  decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(9)),
                  child: const Icon(Icons.arrow_back_ios_new_rounded, color: kSlate, size: 15),
                ),
              ),
              const SizedBox(width: 10),
              Stack(children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: kGold.withOpacity(0.18),
                  child: Text(initial,
                    style: const TextStyle(color: kGold, fontSize: 14, fontWeight: FontWeight.w800)),
                ),
                Positioned(
                  bottom: 0, right: 0,
                  child: Container(
                    width: 8, height: 8,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      shape: BoxShape.circle,
                      border: Border.all(color: kBg2, width: 1.5),
                    ),
                  ),
                ),
              ]),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                      style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w700),
                      overflow: TextOverflow.ellipsis),
                    const Text('Active now',
                      style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              _IconBtn(icon: Icons.call_rounded, color: kSlate, onTap: () {}),
              const SizedBox(width: 4),
              _IconBtn(icon: Icons.info_outline_rounded, color: kSlate, onTap: () {}),
            ],
          ),
        ),
        // Messages area
        Expanded(
          child: _isMessagesLoading
              ? const Center(child: CircularProgressIndicator(color: kGold, strokeWidth: 2))
              : Stack(
                  children: [
                    // Message list
                    ListView.builder(
                      controller: _messagesScrollController,
                      padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
                      itemCount: _messages.length + 1, // +1 for typing indicator slot
                      itemBuilder: (_, i) {
                        if (i == _messages.length) {
                          return _buildTypingIndicator();
                        }
                        final msg = _messages[i];
                        final prev = i > 0 ? _messages[i - 1] : null;
                        return _buildMessageBubble(msg, prev);
                      },
                    ),
                    // Empty state overlay
                    if (_messages.isEmpty)
                      Center(
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          Container(
                            width: 52, height: 52,
                            decoration: BoxDecoration(color: kGoldDim, borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: kGoldBorder)),
                            child: const Icon(Icons.waving_hand_rounded, color: kGold, size: 26),
                          ),
                          const SizedBox(height: 12),
                          const Text('No messages yet', style: TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 4),
                          const Text('Say hello!', style: TextStyle(color: kSlate, fontSize: 12)),
                        ]),
                      ),
                  ],
                ),
        ),
        // Quick replies
        if (_messages.isEmpty || _isTyping == false)
          _buildQuickReplies(),
        // Emoji picker
        if (_showEmojiPicker)
          _buildEmojiPicker(),
        // Input bar
        _buildInputBar(),
      ],
    );
  }

  Widget _buildTypingIndicator() => const SizedBox.shrink();

  Widget _buildQuickReplies() => SizedBox(
    height: 38,
    child: ListView.separated(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      itemCount: _quickReplies.length,
      separatorBuilder: (_, __) => const SizedBox(width: 8),
      itemBuilder: (_, i) => GestureDetector(
        onTap: () {
          _messageController.text = _quickReplies[i];
          _messageController.selection = TextSelection.fromPosition(
            TextPosition(offset: _quickReplies[i].length));
          setState(() => _isTyping = true);
          _messageFocusNode.requestFocus();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: kBg3,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: kBorder),
          ),
          child: Text(_quickReplies[i],
            style: const TextStyle(color: kSlate, fontSize: 11),
            maxLines: 1,
          ),
        ),
      ),
    ),
  );

  Widget _buildEmojiPicker() => Container(
    height: 110,
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: kBg2,
      border: Border(top: BorderSide(color: kBorder)),
    ),
    child: GridView.count(
      crossAxisCount: 10,
      mainAxisSpacing: 4,
      crossAxisSpacing: 4,
      children: _emojis.map((e) => GestureDetector(
        onTap: () {
          final pos = _messageController.selection.base.offset;
          final text = _messageController.text;
          final newText = pos >= 0
              ? text.substring(0, pos) + e + text.substring(pos)
              : text + e;
          _messageController.text = newText;
          _messageController.selection =
              TextSelection.fromPosition(TextPosition(offset: (pos >= 0 ? pos : text.length) + e.length));
          setState(() => _isTyping = true);
        },
        child: Center(child: Text(e, style: const TextStyle(fontSize: 20))),
      )).toList(),
    ),
  );

  Widget _buildInputBar() => Container(
    padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
    decoration: BoxDecoration(
      color: kBg2,
      border: Border(top: BorderSide(color: kBorder)),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Emoji toggle
        GestureDetector(
          onTap: () => setState(() => _showEmojiPicker = !_showEmojiPicker),
          child: Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: _showEmojiPicker ? kGoldDim : kBg3,
              borderRadius: BorderRadius.circular(10),
              border: _showEmojiPicker ? Border.all(color: kGoldBorder) : null,
            ),
            child: Icon(Icons.emoji_emotions_outlined,
              color: _showEmojiPicker ? kGold : kSlateDim, size: 18),
          ),
        ),
        const SizedBox(width: 8),
        // Text field
        Expanded(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 110),
            child: TextField(
              controller: _messageController,
              focusNode: _messageFocusNode,
              onTap: () => setState(() => _showEmojiPicker = false),
              decoration: InputDecoration(
                hintText: 'Message...',
                hintStyle: const TextStyle(color: kSlateDim, fontSize: 13),
                filled: true,
                fillColor: kBg3,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: kGold.withOpacity(0.4)),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              ),
              style: const TextStyle(color: kCream, fontSize: 13),
              maxLines: null,
              textInputAction: TextInputAction.newline,
            ),
          ),
        ),
        const SizedBox(width: 8),
        // Attach or Send
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
          child: _isTyping
              ? GestureDetector(
                  key: const ValueKey('send'),
                  onTap: _sendMessage,
                  child: Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: kGold,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [BoxShadow(color: kGold.withOpacity(0.35), blurRadius: 10, offset: const Offset(0, 4))],
                    ),
                    child: const Icon(Icons.send_rounded, color: kBg, size: 18),
                  ),
                )
              : GestureDetector(
                  key: const ValueKey('attach'),
                  onTap: () {},
                  child: Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.attach_file_rounded, color: kSlateDim, size: 18),
                  ),
                ),
        ),
      ],
    ),
  );

  Widget _buildMessageBubble(Map<String, dynamic> message, Map<String, dynamic>? prevMessage) {
    final isMe = message['is_from_me'] as bool? ?? false;
    final content = message['message'] as String? ?? message['content'] as String? ?? '';
    final time = _formatTime(message['created_at']);
    final prevIsMe = prevMessage != null ? (prevMessage['is_from_me'] as bool? ?? false) : null;
    final isGrouped = prevIsMe == isMe;

    return Padding(
      padding: EdgeInsets.only(
        top: isGrouped ? 2 : 10,
        bottom: 2,
      ),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Avatar for other side (only show on last of group)
          if (!isMe) ...[
            if (!isGrouped)
              CircleAvatar(
                radius: 13,
                backgroundColor: kGold.withOpacity(0.18),
                child: Text(_senderInitial(_selectedConversation!),
                  style: const TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.w800)),
              )
            else
              const SizedBox(width: 26),
            const SizedBox(width: 6),
          ],
          // Bubble
          Flexible(
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.65,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
                  decoration: BoxDecoration(
                    color: isMe ? kGold : kBg3,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(17),
                      topRight: const Radius.circular(17),
                      bottomLeft: Radius.circular(isMe ? 17 : (isGrouped ? 17 : 4)),
                      bottomRight: Radius.circular(isMe ? (isGrouped ? 17 : 4) : 17),
                    ),
                    boxShadow: isMe
                        ? [BoxShadow(color: kGold.withOpacity(0.2), blurRadius: 8, offset: const Offset(0, 3))]
                        : null,
                  ),
                  child: Text(
                    content,
                    style: TextStyle(
                      color: isMe ? kBg : kCream,
                      fontSize: 13,
                      height: 1.45,
                    ),
                  ),
                ),
                // Timestamp + status
                Padding(
                  padding: const EdgeInsets.only(top: 3, left: 4, right: 4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(time,
                        style: const TextStyle(color: kSlateDim, fontSize: 9)),
                      if (isMe) ...[
                        const SizedBox(width: 3),
                        const Icon(Icons.done_all_rounded, color: kGold, size: 11),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (isMe) const SizedBox(width: 4),
        ],
      ),
    );
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty || _selectedConversation == null) return;

    _messageController.clear();
    setState(() => _isTyping = false);

    setState(() {
      _messages.add({
        'id': DateTime.now().millisecondsSinceEpoch,
        'message': content,
        'is_from_me': true,
        'created_at': DateTime.now().toIso8601String(),
        'status': 'sent',
      });
    });
    _scrollToBottom();

    // TODO: wire to API
  }
}

// ── Helper widget ─────────────────────────────────────────────
class _IconBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _IconBtn({required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 34, height: 34,
      decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(9)),
      child: Icon(icon, color: color, size: 17),
    ),
  );
}