import 'package:flutter/material.dart';
import '../../../../shared/services/messages_service.dart';
import 'tenant_theme.dart';

class MessagesPage extends StatefulWidget {
  const MessagesPage({super.key});

  @override
  State<MessagesPage> createState() => _MessagesPageState();
}

class _MessagesPageState extends State<MessagesPage> {
  List<Conversation> _conversations = [];
  bool _isLoading = true;
  String _error = '';
  String _searchQuery = '';
  final TextEditingController _messageCtrl = TextEditingController();
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _messageCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });
    try {
      final data = await MessagesService.getConversations();
      if (!mounted) return;
      final conversationsList = data['conversations'] as List?;
      setState(() {
        _conversations = conversationsList?.map((json) => Conversation.fromJson(json)).toList() ?? [];
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load messages: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageCtrl.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      // For now, we need a receiver_id to send a message
      // This will need to be updated when we implement conversation selection
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a conversation to send a message')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send message: $e')),
      );
    }
    if (!mounted) return;
    setState(() => _sending = false);
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _messages
        .where((m) =>
            ((m['subject'] ?? '').toString().toLowerCase().contains(_searchQuery.toLowerCase())) ||
            ((m['body'] ?? '').toString().toLowerCase().contains(_searchQuery.toLowerCase())) ||
            (((m['counterparty']?['first_name'] ?? '').toString() + (m['counterparty']?['last_name'] ?? '').toString()).toLowerCase().contains(_searchQuery.toLowerCase())))
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
      body: _isLoading
          ? ListView(
              padding: const EdgeInsets.all(16),
              children: List.generate(5, (_) => const TSkeletonCard(height: 78)),
            )
          : _error.isNotEmpty
              ? TErrorState(message: _error, onRetry: _load)
              : Column(
                  children: [
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: _load,
                        color: kGold,
                        backgroundColor: kBg2,
                        child: ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            _buildSearchBar(),
                            const SizedBox(height: 16),
                            if (filtered.isEmpty)
                              const TEmptyState(
                                icon: Icons.chat_bubble_outline_rounded,
                                title: 'No messages yet',
                                subtitle: 'Messages from your landlord will appear here.',
                              )
                            else
                              ...filtered.map(_buildMessageCard),
                          ],
                        ),
                      ),
                    ),
                    _buildMessageInput(),
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

  Widget _buildMessageCard(Map<String, dynamic> msg) {
    final sent = msg['direction'] == 'sent';
    final counterparty = msg['counterparty'] as Map<String, dynamic>?;
    final name = '${counterparty?['first_name'] ?? ''} ${counterparty?['last_name'] ?? ''}'.trim();
    final subtitle = (msg['subject'] ?? msg['body'] ?? '').toString();
    final time = (msg['created_at'] ?? '').toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: kBg2, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
      child: Row(children: [
        CircleAvatar(
          radius: 18,
          backgroundColor: sent ? kGoldDim : kInfo.withOpacity(0.15),
          child: Icon(sent ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded, color: sent ? kGold : kInfo, size: 14),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name.isEmpty ? (sent ? 'You' : 'Landlord') : name, style: const TextStyle(color: kCream, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(color: kSlate, fontSize: 11), maxLines: 2, overflow: TextOverflow.ellipsis),
        ])),
        Text(time, style: const TextStyle(color: kSlateDim, fontSize: 9)),
      ]),
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
              controller: _messageCtrl,
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
          GestureDetector(
            onTap: _sendMessage,
            child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              gradient: kGoldGradient,
              borderRadius: BorderRadius.circular(8),
            ),
            child: _sending
                ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: kBg))
                : const Icon(Icons.send_rounded, color: kBg, size: 18),
            ),
          ),
        ],
      ),
    );
  }
}