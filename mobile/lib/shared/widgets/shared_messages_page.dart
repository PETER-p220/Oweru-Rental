import 'dart:async';

import 'package:flutter/material.dart';
import '../services/messages_service.dart';

/// Role-specific inbox — mirrors frontend `SharedMessagesPage`.
enum MessagesRole { tenant, agent, landlord }

class _RoleConfig {
  final Color accent;
  final String label;
  final String tagline;

  const _RoleConfig({
    required this.accent,
    required this.label,
    required this.tagline,
  });
}

const _roleConfigs = {
  MessagesRole.tenant: _RoleConfig(
    accent: Color(0xFF6C63FF),
    label: 'Tenant Inbox',
    tagline: 'Talk to your landlord or agent',
  ),
  MessagesRole.agent: _RoleConfig(
    accent: Color(0xFF0EA5E9),
    label: 'Agent Inbox',
    tagline: 'Manage client conversations',
  ),
  MessagesRole.landlord: _RoleConfig(
    accent: Color(0xFF10B981),
    label: 'Landlord Inbox',
    tagline: 'Connect with your tenants',
  ),
};

String _initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty || parts.first.isEmpty) return '?';
  if (parts.length == 1) return parts.first[0].toUpperCase();
  return '${parts.first[0]}${parts[1][0]}'.toUpperCase();
}

String _relativeTime(String iso) {
  if (iso.isEmpty) return '';
  final dt = DateTime.tryParse(iso);
  if (dt == null) return '';
  final diff = DateTime.now().difference(dt);
  final minutes = diff.inMinutes;
  if (minutes < 1) return 'now';
  if (minutes < 60) return '${minutes}m';
  if (minutes < 1440) return '${minutes ~/ 60}h';
  return '${minutes ~/ 1440}d';
}

String _fullTime(String iso) {
  final dt = DateTime.tryParse(iso);
  if (dt == null) return '';
  final h = dt.hour.toString().padLeft(2, '0');
  final m = dt.minute.toString().padLeft(2, '0');
  return '$h:$m';
}

class SharedMessagesPage extends StatefulWidget {
  final MessagesRole role;
  final bool showAppBar;

  const SharedMessagesPage({
    super.key,
    this.role = MessagesRole.tenant,
    this.showAppBar = true,
  });

  @override
  State<SharedMessagesPage> createState() => _SharedMessagesPageState();
}

class _SharedMessagesPageState extends State<SharedMessagesPage> {
  static const _bg = Color(0xFF0F172A);
  static const _bgChat = Color(0xFF0A1628);
  static const _panel = Color(0xFF1E293B);
  static const _cream = Color(0xFFE2E8F0);
  static const _slate = Color(0xFF64748B);

  List<Conversation> _conversations = [];
  Conversation? _selected;
  List<Message> _messages = [];
  bool _loading = true;
  bool _sending = false;
  String _sideSearch = '';
  Timer? _pollTimer;
  final _draftCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  _RoleConfig get _cfg => _roleConfigs[widget.role]!;

  @override
  void initState() {
    super.initState();
    _loadConversations();
    _pollTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _loadConversations(silent: true);
      if (_selected != null) _loadMessages(_selected!.id, silent: true);
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _draftCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadConversations({bool silent = false}) async {
    if (!silent && mounted) setState(() => _loading = true);
    try {
      final data = await MessagesService.getConversations();
      if (!mounted) return;
      final list = data['conversations'] as List?;
      setState(() {
        _conversations = list?.map((j) => Conversation.fromJson(Map<String, dynamic>.from(j as Map))).toList() ?? [];
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _loadMessages(int userId, {bool silent = false}) async {
    try {
      final data = await MessagesService.getMessages(userId);
      if (!mounted) return;
      final list = data['messages'] as List?;
      setState(() {
        _messages = list?.map((j) => Message.fromJson(Map<String, dynamic>.from(j as Map))).toList() ?? [];
      });
      if (!silent) _scrollToBottom();
    } catch (_) {}
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _draftCtrl.text.trim();
    if (text.isEmpty || _sending || _selected == null) return;
    setState(() => _sending = true);
    try {
      final msg = await MessagesService.sendMessage(
        receiverId: _selected!.id,
        content: text,
      );
      if (!mounted) return;
      setState(() => _messages = [..._messages, msg]);
      _draftCtrl.clear();
      await _loadConversations(silent: true);
      _scrollToBottom();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _startConversationWith(User user) {
    final conv = Conversation(
      id: user.id,
      user: user,
      unreadCount: 0,
      updatedAt: DateTime.now().toIso8601String(),
    );
    setState(() {
      _selected = conv;
      _messages = [];
    });
    _loadMessages(user.id);
  }

  void _showNewChatSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: _panel,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) => _NewConversationSheet(
        accent: _cfg.accent,
        existingContacts: _conversations.map((c) => c.user).toList(),
        onSelectUser: (user) {
          Navigator.pop(sheetContext);
          _startConversationWith(user);
        },
        avatarBuilder: (name, size) => _avatar(name, size),
      ),
    );
  }

  List<Conversation> get _filteredConversations {
    final q = _sideSearch.toLowerCase();
    if (q.isEmpty) return _conversations;
    return _conversations.where((c) {
      final name = c.user.name.toLowerCase();
      final preview = (c.latestMessage?.content ?? '').toLowerCase();
      return name.contains(q) || preview.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final inChat = _selected != null;

    return Scaffold(
      backgroundColor: _bg,
      appBar: widget.showAppBar
          ? AppBar(
              backgroundColor: _bg,
              elevation: 0,
              leading: inChat
                  ? IconButton(
                      icon: const Icon(Icons.arrow_back_rounded, color: _cream),
                      onPressed: () => setState(() => _selected = null),
                    )
                  : null,
              title: Text(
                inChat ? (_selected!.user.name) : _cfg.label,
                style: const TextStyle(color: _cream, fontSize: 17, fontWeight: FontWeight.w700),
              ),
              actions: [
                if (!inChat)
                  IconButton(
                    icon: Icon(Icons.add_rounded, color: _cfg.accent),
                    onPressed: () => _showNewChatSheet(),
                  ),
              ],
            )
          : null,
      body: inChat ? _buildChat() : _buildSidebar(),
    );
  }

  Widget _buildSidebar() {
    return Column(
      children: [
        if (!widget.showAppBar) _buildSidebarHeader(),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: TextField(
            onChanged: (v) => setState(() => _sideSearch = v),
            style: const TextStyle(color: _cream, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Search conversations...',
              hintStyle: const TextStyle(color: _slate),
              prefixIcon: const Icon(Icons.search_rounded, color: _slate, size: 20),
              filled: true,
              fillColor: _panel,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF334155)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF334155)),
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: _cream))
              : _filteredConversations.isEmpty
                  ? const Center(
                      child: Text('No conversations found', style: TextStyle(color: _slate, fontSize: 14)),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadConversations,
                      child: ListView.builder(
                        itemCount: _filteredConversations.length,
                        itemBuilder: (_, i) => _conversationTile(_filteredConversations[i]),
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildSidebarHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_cfg.label, style: const TextStyle(color: _cream, fontSize: 17, fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(_cfg.tagline, style: const TextStyle(color: _slate, fontSize: 12)),
              ],
            ),
          ),
          IconButton(
            onPressed: _showNewChatSheet,
            icon: Icon(Icons.add_rounded, color: _cfg.accent),
            style: IconButton.styleFrom(
              backgroundColor: _cfg.accent.withValues(alpha: 0.12),
              side: BorderSide(color: _cfg.accent.withValues(alpha: 0.25)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _conversationTile(Conversation conv) {
    return InkWell(
      onTap: () {
        setState(() => _selected = conv);
        _loadMessages(conv.id);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          border: Border(left: BorderSide(color: _cfg.accent, width: 0)),
        ),
        child: Row(
          children: [
            _avatar(conv.user.name, 44),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(conv.user.name,
                          style: const TextStyle(color: Color(0xFFF1F5F9), fontSize: 14, fontWeight: FontWeight.w600)),
                      Text(_relativeTime(conv.updatedAt), style: const TextStyle(color: _slate, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    conv.latestMessage?.content ?? 'No messages yet',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: conv.unreadCount > 0 ? const Color(0xFFCBD5E1) : _slate,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            if (conv.unreadCount > 0)
              Container(
                width: 20,
                height: 20,
                margin: const EdgeInsets.only(left: 8),
                alignment: Alignment.center,
                decoration: BoxDecoration(color: _cfg.accent, shape: BoxShape.circle),
                child: Text(
                  '${conv.unreadCount}',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildChat() {
    final user = _selected!.user;
    return Column(
      children: [
        if (!widget.showAppBar)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            color: _bg,
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left_rounded, color: _cream, size: 28),
                  onPressed: () => setState(() => _selected = null),
                ),
                _avatar(user.name, 38),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user.name, style: const TextStyle(color: _cream, fontSize: 15, fontWeight: FontWeight.w600)),
                      Text(
                        user.isOnline ? '● Online' : 'Offline',
                        style: TextStyle(
                          fontSize: 11,
                          color: user.isOnline ? const Color(0xFF22C55E) : _slate,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        Expanded(
          child: Container(
            color: _bgChat,
            child: _messages.isEmpty
                ? const Center(child: Text('No messages yet. Say hello!', style: TextStyle(color: _slate, fontSize: 14)))
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (_, i) => _messageBubble(_messages[i]),
                  ),
          ),
        ),
        _buildInputBar(),
      ],
    );
  }

  Widget _messageBubble(Message msg) {
    final mine = msg.isFromMe;
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: mine ? _cfg.accent : _panel,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(mine ? 18 : 4),
            bottomRight: Radius.circular(mine ? 4 : 18),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              msg.content ?? '',
              style: TextStyle(color: mine ? Colors.white : _cream, fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 4),
            Text(
              _fullTime(msg.createdAt),
              style: TextStyle(fontSize: 10, color: mine ? Colors.white70 : _slate),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: EdgeInsets.fromLTRB(14, 12, 14, 12 + MediaQuery.of(context).padding.bottom),
      decoration: const BoxDecoration(
        color: _bg,
        border: Border(top: BorderSide(color: Color(0xFF1E293B))),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: _draftCtrl,
              style: const TextStyle(color: _cream, fontSize: 14),
              maxLines: 4,
              minLines: 1,
              decoration: InputDecoration(
                hintText: 'Type a message...',
                hintStyle: const TextStyle(color: _slate),
                filled: true,
                fillColor: _panel,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: _draftCtrl.text.trim().isNotEmpty ? _cfg.accent : _panel,
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              onTap: _sending ? null : _sendMessage,
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 44,
                height: 44,
                child: _sending
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _avatar(String name, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [_cfg.accent.withValues(alpha: 0.2), _cfg.accent.withValues(alpha: 0.45)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: _cfg.accent.withValues(alpha: 0.35)),
      ),
      alignment: Alignment.center,
      child: Text(
        _initials(name),
        style: TextStyle(color: _cfg.accent, fontSize: size * 0.38, fontWeight: FontWeight.w700),
      ),
    );
  }
}

/// New-chat user search — own state so the bottom sheet rebuilds when results arrive
/// (parent setState does not refresh modal content).
class _NewConversationSheet extends StatefulWidget {
  final Color accent;
  final List<User> existingContacts;
  final ValueChanged<User> onSelectUser;
  final Widget Function(String name, double size) avatarBuilder;

  const _NewConversationSheet({
    required this.accent,
    required this.existingContacts,
    required this.onSelectUser,
    required this.avatarBuilder,
  });

  @override
  State<_NewConversationSheet> createState() => _NewConversationSheetState();
}

class _NewConversationSheetState extends State<_NewConversationSheet> {
  static const _bg = Color(0xFF0F172A);
  static const _cream = Color(0xFFE2E8F0);
  static const _slate = Color(0xFF64748B);

  final _queryCtrl = TextEditingController();
  Timer? _debounce;
  List<User> _displayUsers = [];
  bool _searching = false;
  bool _loadedSuggestions = false;
  String? _searchError;

  @override
  void initState() {
    super.initState();
    _loadSuggestions();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _queryCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSuggestions() async {
    setState(() {
      _searching = true;
      _searchError = null;
    });
    try {
      final online = await MessagesService.getOnlineUsers();
      if (!mounted) return;
      setState(() {
        _displayUsers = _mergeUsers([...widget.existingContacts, ...online]);
        _loadedSuggestions = true;
        _searching = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _displayUsers = _mergeUsers(widget.existingContacts);
        _loadedSuggestions = true;
        _searching = false;
      });
    }
  }

  List<User> _mergeUsers(List<User> users) {
    final seen = <int>{};
    final merged = <User>[];
    for (final u in users) {
      if (u.id <= 0 || seen.contains(u.id)) continue;
      seen.add(u.id);
      merged.add(u);
    }
    return merged;
  }

  void _onQueryChanged(String raw) {
    _debounce?.cancel();
    final q = raw.trim();
    if (q.isEmpty) {
      _loadSuggestions();
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 350), () => _runSearch(q));
  }

  List<User> _localFilter(String q) {
    final lower = q.toLowerCase();
    return _mergeUsers(widget.existingContacts).where((u) {
      return u.name.toLowerCase().contains(lower) ||
          u.email.toLowerCase().contains(lower) ||
          u.userType.toLowerCase().contains(lower);
    }).toList();
  }

  Future<void> _runSearch(String q) async {
    setState(() {
      _searching = true;
      _searchError = null;
    });
    try {
      var users = await MessagesService.searchUsers(q);
      if (users.isEmpty) {
        users = _localFilter(q);
      }
      if (!mounted || _queryCtrl.text.trim() != q) return;
      setState(() {
        _displayUsers = users;
        _searching = false;
      });
    } catch (e) {
      if (!mounted || _queryCtrl.text.trim() != q) return;
      setState(() {
        _displayUsers = [];
        _searching = false;
        _searchError = 'Could not search users. Pull to retry.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final query = _queryCtrl.text.trim();
    final showEmptyHint = !_searching && _displayUsers.isEmpty && query.isNotEmpty;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('New Conversation',
                      style: TextStyle(color: _cream, fontSize: 16, fontWeight: FontWeight.w600)),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: _slate),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              TextField(
                controller: _queryCtrl,
                autofocus: true,
                onChanged: _onQueryChanged,
                style: const TextStyle(color: _cream, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Search users...',
                  hintStyle: const TextStyle(color: _slate),
                  prefixIcon: const Icon(Icons.search_rounded, color: _slate, size: 20),
                  filled: true,
                  fillColor: _bg,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF334155)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF334155)),
                  ),
                ),
              ),
              if (query.isEmpty && _loadedSuggestions && _displayUsers.isNotEmpty)
                const Padding(
                  padding: EdgeInsets.only(top: 10, bottom: 4),
                  child: Text('Recent & online contacts',
                      style: TextStyle(color: _slate, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              const SizedBox(height: 8),
              if (_searching)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: _cream)),
                )
              else if (_searchError != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Text(_searchError!, textAlign: TextAlign.center, style: const TextStyle(color: _slate, fontSize: 13)),
                )
              else if (showEmptyHint)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  child: Text(
                    'No users found for "$query".\nTry another name or email.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: _slate, fontSize: 13, height: 1.5),
                  ),
                )
              else if (_displayUsers.isEmpty && query.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Text(
                    'Type a name or email to find someone to message.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: _slate, fontSize: 13, height: 1.5),
                  ),
                )
              else
                ConstrainedBox(
                  constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.45),
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: _displayUsers.length,
                    separatorBuilder: (_, _) => const Divider(height: 1, color: Color(0xFF334155)),
                    itemBuilder: (_, i) {
                      final u = _displayUsers[i];
                      return InkWell(
                        onTap: () => widget.onSelectUser(u),
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                          child: Row(
                            children: [
                              widget.avatarBuilder(u.name, 38),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(u.name,
                                        style: const TextStyle(
                                            color: _cream, fontWeight: FontWeight.w600, fontSize: 14)),
                                    const SizedBox(height: 2),
                                    Text(
                                      [u.userType, u.email].where((s) => s.isNotEmpty).join(' · '),
                                      style: const TextStyle(color: _slate, fontSize: 12),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                              if (u.isOnline)
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: widget.accent,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
