import 'dart:convert';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

/// Touch signature pad — mirrors web `SignaturePad` (exports base64 PNG).
class SignaturePadWidget extends StatefulWidget {
  final Color strokeColor;
  final ValueChanged<String> onSave;
  final VoidCallback onCancel;

  const SignaturePadWidget({
    super.key,
    required this.strokeColor,
    required this.onSave,
    required this.onCancel,
  });

  @override
  State<SignaturePadWidget> createState() => _SignaturePadWidgetState();
}

class _SignaturePadWidgetState extends State<SignaturePadWidget> {
  final List<Offset?> _points = [];
  String? _error;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black54,
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(20),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF162035),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: widget.strokeColor.withOpacity(0.35)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Chora Sahihi Yako',
                      style: TextStyle(color: Color(0xFFF1F5F9), fontSize: 18, fontWeight: FontWeight.w700)),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Color(0xFF94A3B8)),
                    onPressed: widget.onCancel,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Chora sahihi yako kwenye sanduku hapa chini kwa kutumia kidole.',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
              ),
              const SizedBox(height: 14),
              Container(
                height: 160,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: widget.strokeColor.withOpacity(0.4)),
                  color: Colors.white.withOpacity(0.03),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: _SignatureCanvas(
                    points: _points,
                    color: widget.strokeColor,
                    onPointsChanged: () => setState(() => _error = null),
                  ),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13)),
              ],
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: () => setState(() {
                      _points.clear();
                      _error = null;
                    }),
                    child: const Text('Futa', style: TextStyle(color: Color(0xFFDC2626))),
                  ),
                  Row(
                    children: [
                      TextButton(onPressed: widget.onCancel, child: const Text('Ghairi')),
                      const SizedBox(width: 8),
                      FilledButton(
                        onPressed: _exportSignature,
                        style: FilledButton.styleFrom(backgroundColor: widget.strokeColor),
                        child: const Text('Hifadhi Sahihi'),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _exportSignature() async {
    if (_points.whereType<Offset>().isEmpty) {
      setState(() => _error = 'Tafadhali chora sahihi yako kwanza.');
      return;
    }
    const w = 400.0;
    const h = 160.0;
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder, const Rect.fromLTWH(0, 0, w, h));
    final paint = Paint()
      ..color = widget.strokeColor
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    for (var i = 0; i < _points.length - 1; i++) {
      final p1 = _points[i];
      final p2 = _points[i + 1];
      if (p1 != null && p2 != null) {
        canvas.drawLine(
          Offset(p1.dx * w, p1.dy * h),
          Offset(p2.dx * w, p2.dy * h),
          paint,
        );
      }
    }

    final picture = recorder.endRecording();
    final image = await picture.toImage(w.toInt(), h.toInt());
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    if (bytes == null) return;
    final b64 = base64Encode(bytes.buffer.asUint8List());
    widget.onSave('data:image/png;base64,$b64');
  }
}

class _SignatureCanvas extends StatelessWidget {
  final List<Offset?> points;
  final Color color;
  final VoidCallback onPointsChanged;

  const _SignatureCanvas({
    required this.points,
    required this.color,
    required this.onPointsChanged,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanStart: (d) {
        final box = context.findRenderObject() as RenderBox?;
        if (box == null) return;
        final local = box.globalToLocal(d.globalPosition);
        points.add(Offset(local.dx / box.size.width, local.dy / box.size.height));
        onPointsChanged();
      },
      onPanUpdate: (d) {
        final box = context.findRenderObject() as RenderBox?;
        if (box == null) return;
        final local = box.globalToLocal(d.globalPosition);
        points.add(Offset(local.dx / box.size.width, local.dy / box.size.height));
        onPointsChanged();
      },
      onPanEnd: (_) => points.add(null),
      child: CustomPaint(
        painter: _SignaturePainter(points: points, color: color),
        size: Size.infinite,
      ),
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final List<Offset?> points;
  final Color color;

  _SignaturePainter({required this.points, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    for (var i = 0; i < points.length - 1; i++) {
      final p1 = points[i];
      final p2 = points[i + 1];
      if (p1 != null && p2 != null) {
        canvas.drawLine(
          Offset(p1.dx * size.width, p1.dy * size.height),
          Offset(p2.dx * size.width, p2.dy * size.height),
          paint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter oldDelegate) => true;
}
