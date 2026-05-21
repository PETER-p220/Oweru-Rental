import 'package:flutter/material.dart';

class ApiCollectionPage extends StatelessWidget {
  final String title;
  final Future<List<Map<String, dynamic>>> future;
  final IconData icon;
  final String emptyMessage;

  const ApiCollectionPage({
    super.key,
    required this.title,
    required this.future,
    required this.icon,
    required this.emptyMessage,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'Failed to load $title.\n${snapshot.error}',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          final rows = snapshot.data ?? [];
          if (rows.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(icon, size: 48, color: Colors.grey.shade500),
                    const SizedBox(height: 12),
                    Text(
                      emptyMessage,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey.shade700),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(12),
            itemBuilder: (context, index) {
              final row = rows[index];
              return Card(
                child: ListTile(
                  title: Text(
                    _pickValue(row, ['title', 'name', 'subject', 'property_name', 'id']),
                  ),
                  subtitle: Text(
                    _pickValue(
                      row,
                      ['status', 'message', 'email', 'phone', 'location', 'created_at'],
                    ),
                  ),
                  trailing: const Icon(Icons.chevron_right),
                ),
              );
            },
            separatorBuilder: (_, _) => const SizedBox(height: 6),
            itemCount: rows.length,
          );
        },
      ),
    );
  }

  String _pickValue(Map<String, dynamic> row, List<String> keys) {
    for (final key in keys) {
      final value = row[key];
      if (value != null && value.toString().trim().isNotEmpty) {
        return value.toString();
      }
    }
    return 'N/A';
  }
}
