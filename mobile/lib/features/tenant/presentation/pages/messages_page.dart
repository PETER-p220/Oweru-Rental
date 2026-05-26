import 'package:flutter/material.dart';
import '../../../../shared/widgets/shared_messages_page.dart';

/// Tenant messages — uses unified `/api/messages` (same as web `SharedMessagesPage`).
class MessagesPage extends StatelessWidget {
  const MessagesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const SharedMessagesPage(role: MessagesRole.tenant);
  }
}
