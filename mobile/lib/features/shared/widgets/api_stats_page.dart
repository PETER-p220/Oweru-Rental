import 'package:flutter/material.dart';

class ApiStatsPage extends StatelessWidget {
  final String title;
  final Future<Map<String, dynamic>> future;

  const ApiStatsPage({super.key, required this.title, required this.future});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: FutureBuilder<Map<String, dynamic>>(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final data = snapshot.data ?? {};
          if (data.isEmpty) return const Center(child: Text('No data available.'));
          final items = data.entries.toList();
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final e = items[index];
              return Card(
                child: ListTile(
                  title: Text(e.key.replaceAll('_', ' ')),
                  subtitle: Text(e.value.toString()),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
