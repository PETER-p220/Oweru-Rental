import 'package:flutter/material.dart';
import '../../../../shared/services/agent_api_service.dart';

class AgentMessagesPage extends StatefulWidget {
  const AgentMessagesPage({super.key});

  @override
  State<AgentMessagesPage> createState() => _AgentMessagesPageState();
}

class _AgentMessagesPageState extends State<AgentMessagesPage> {
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final messages = await AgentApiService.getMessages();
      setState(() {
        _messages = messages;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load messages.';
        _isLoading = false;
      });
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '—';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1218),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1D26),
        elevation: 0,
        title: const Text('Messages', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          // Header Section
          Container(
            padding: const EdgeInsets.all(20),
            color: const Color(0xFF1A1D26),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Agent Workspace', style: TextStyle(color: Color(0xFF8B8680), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.14)),
                const SizedBox(height: 16),
                const Text('Messages', style: TextStyle(color: Color(0xFFE8E1D5), fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'View and manage your messages from landlords and tenants.',
                  style: TextStyle(color: Color(0xFF8B8680), fontSize: 13),
                ),
              ],
            ),
          ),
          // Error Alert
          if (_error.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withOpacity(0.06),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.18)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error, size: 16, color: Color(0xFFEF4444)),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_error, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 14))),
                ],
              ),
            ),
          // Messages List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFC9A84C)))
                : _messages.isEmpty
                    ? const Center(
                        child: Text('No messages available.', style: TextStyle(color: Color(0xFF8B8680), fontSize: 13)),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) => _buildMessageCard(_messages[index]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageCard(Map<String, dynamic> message) {
    final sender = message['sender'] as Map<String, dynamic>? ?? {};
    final senderName = '${sender['first_name'] ?? ''} ${sender['last_name'] ?? ''}'.trim() ?? 'Unknown';
    final subject = message['subject'] as String? ?? 'No subject';
    final content = message['message'] as String? ?? message['content'] as String? ?? '';
    final isRead = message['is_read'] as bool? ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1D26),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF2A2418)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              CircleAvatar(
                backgroundColor: isRead ? const Color(0xFF8B8680) : const Color(0xFFC9A84C),
                child: const Icon(Icons.person, color: Color(0xFF0F1218), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      senderName,
                      style: TextStyle(
                        color: const Color(0xFFE8E1D5),
                        fontSize: 15,
                        fontWeight: isRead ? FontWeight.w400 : FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(_formatDate(message['created_at'] ?? ''), style: const TextStyle(color: Color(0xFF8B8680), fontSize: 12)),
                  ],
                ),
              ),
              if (!isRead)
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFFC9A84C),
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          // Subject
          Text(
            subject,
            style: TextStyle(
              color: const Color(0xFFE8E1D5),
              fontSize: 14,
              fontWeight: isRead ? FontWeight.w400 : FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          // Content preview
          Text(
            content.length > 100 ? '${content.substring(0, 100)}...' : content,
            style: const TextStyle(color: Color(0xFF8B8680), fontSize: 13),
          ),
        ],
      ),
    );
  }
}
