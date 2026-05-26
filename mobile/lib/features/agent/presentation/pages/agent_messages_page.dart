import 'package:flutter/material.dart';
import '../../../../shared/widgets/shared_messages_page.dart';

/// Agent messages — uses unified `/api/messages` (same as web `SharedMessagesPage`).
class AgentMessagesPage extends StatelessWidget {
  const AgentMessagesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const SharedMessagesPage(role: MessagesRole.agent, showAppBar: true);
  }
}
