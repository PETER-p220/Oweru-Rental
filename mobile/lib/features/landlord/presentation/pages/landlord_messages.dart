import 'package:flutter/material.dart';
import '../../../../shared/widgets/shared_messages_page.dart';

/// Landlord messages — uses unified `/api/messages` (same as web `SharedMessagesPage`).
class LandlordMessagesPage extends StatelessWidget {
  const LandlordMessagesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const SharedMessagesPage(role: MessagesRole.landlord);
  }
}
