// ============================================================
// TENANT THEME — matches homepage color palette
// Single source of truth. Import in every tenant page.
// ============================================================
import 'package:flutter/material.dart';

// ── Core palette (from homepage) ────────────────────────────
const Color kGold       = Color(0xFFC89128);
const Color kGoldLight  = Color(0xFFE6A830);
const Color kBg         = Color(0xFF0A0F1E);
const Color kBg2        = Color(0xFF0F172A);
const Color kBg3        = Color(0xFF162035);
const Color kCream      = Color(0xFFF1F5F9);
const Color kSlate      = Color(0xFF94A3B8);
const Color kSlateDim   = Color(0xFF64748B);
const Color kBorder     = Color(0x26C89128);
const Color kGoldBorder = Color(0x33C89128);
const Color kGoldDim    = Color(0x1AC89128);

// ── Semantic accents ─────────────────────────────────────────
const Color kWhite      = Color(0xFFFFFFFF);
const Color kSuccess    = Color(0xFF10B981);
const Color kWarning    = Color(0xFFF59E0B);
const Color kDanger     = Color(0xFFEF4444);
const Color kInfo       = Color(0xFF3B82F6);

// ── Gradients ────────────────────────────────────────────────
const LinearGradient kGoldGradient = LinearGradient(
  colors: [kGold, kGoldLight],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

const LinearGradient kBannerGradient = LinearGradient(
  colors: [Color(0x2EC89128), Color(0x08C89128)],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

// ── Text styles ───────────────────────────────────────────────
const TextStyle kHeadingStyle = TextStyle(
  color: kCream, fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: -0.5,
);
const TextStyle kSubheadStyle = TextStyle(
  color: kSlate, fontSize: 13, fontWeight: FontWeight.w400, height: 1.6,
);
const TextStyle kLabelStyle = TextStyle(
  color: kGold, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 2.0,
);

// ── Decorations ───────────────────────────────────────────────
BoxDecoration kCardDecor = BoxDecoration(
  color: kBg2,
  borderRadius: BorderRadius.circular(14),
  border: Border.all(color: kBorder),
);

BoxDecoration kGoldCardDecor = BoxDecoration(
  color: kBg2,
  borderRadius: BorderRadius.circular(14),
  border: Border.all(color: kGoldBorder),
  gradient: kBannerGradient,
);

// ── Reusable widgets ──────────────────────────────────────────

/// Gold pill label e.g.  "TENANT PORTAL"
class TLabel extends StatelessWidget {
  final String text;
  const TLabel(this.text, {super.key});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: kGoldDim,
      border: Border.all(color: kGoldBorder),
      borderRadius: BorderRadius.circular(4),
    ),
    child: Text(text.toUpperCase(), style: kLabelStyle),
  );
}

/// Section divider with gold label
class TSectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;
  const TSectionHeader(this.title, {super.key, this.trailing});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(children: [
      Expanded(child: Text(title,
        style: const TextStyle(color: kCream, fontSize: 15, fontWeight: FontWeight.w700))),
      ?trailing,
    ]),
  );
}

/// Standard card wrapper
class TCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final BoxDecoration? decoration;
  const TCard({super.key, required this.child, this.padding, this.decoration});
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: padding ?? const EdgeInsets.all(16),
    decoration: decoration ?? kCardDecor,
    child: child,
  );
}

/// Status badge pill
class TStatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  const TStatusBadge({super.key, required this.label, required this.color});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: color.withOpacity(0.12),
      borderRadius: BorderRadius.circular(4),
      border: Border.all(color: color.withOpacity(0.3)),
    ),
    child: Text(label.toUpperCase(),
      style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
  );
}

/// Gold action button
class TGoldButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final bool fullWidth;
  const TGoldButton({super.key, required this.label, this.onTap, this.icon, this.fullWidth = true});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: fullWidth ? double.infinity : null,
      padding: EdgeInsets.symmetric(horizontal: fullWidth ? 0 : 16, vertical: 13),
      decoration: BoxDecoration(
        gradient: kGoldGradient,
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [BoxShadow(color: Color(0x30C89128), blurRadius: 12, offset: Offset(0, 4))],
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 15, color: kBg), const SizedBox(width: 7)],
        Text(label, style: const TextStyle(color: kBg, fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
      ]),
    ),
  );
}

/// Ghost bordered button
class TGhostButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final Color? borderColor;
  const TGhostButton({super.key, required this.label, this.onTap, this.borderColor});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
      decoration: BoxDecoration(
        border: Border.all(color: borderColor ?? kGoldBorder),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
    ),
  );
}

/// Empty state
class TEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const TEmptyState({super.key, required this.icon, required this.title, required this.subtitle});
  @override
  Widget build(BuildContext context) => TCard(
    padding: const EdgeInsets.symmetric(vertical: 56, horizontal: 24),
    child: Column(children: [
      Container(
        width: 56, height: 56,
        decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(14),
          border: Border.all(color: kGoldBorder)),
        child: Icon(icon, color: kGold.withOpacity(0.5), size: 26),
      ),
      const SizedBox(height: 14),
      Text(title, style: const TextStyle(color: kCream, fontSize: 14, fontWeight: FontWeight.w600)),
      const SizedBox(height: 6),
      Text(subtitle, style: const TextStyle(color: kSlate, fontSize: 12, height: 1.5),
        textAlign: TextAlign.center),
    ]),
  );
}

/// Error state
class TErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const TErrorState({super.key, required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(child: Padding(
    padding: const EdgeInsets.all(32),
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Container(width: 52, height: 52,
        decoration: BoxDecoration(color: kDanger.withOpacity(0.12), borderRadius: BorderRadius.circular(14)),
        child: const Icon(Icons.error_outline_rounded, color: kDanger, size: 26)),
      const SizedBox(height: 14),
      Text(message, style: const TextStyle(color: kSlate, fontSize: 12), textAlign: TextAlign.center),
      const SizedBox(height: 18),
      TGhostButton(label: 'Try Again', onTap: onRetry, borderColor: kDanger.withOpacity(0.4)),
    ]),
  ));
}

/// Shimmer skeleton loader
class TSkeletonCard extends StatefulWidget {
  final double height;
  const TSkeletonCard({super.key, this.height = 80});
  @override State<TSkeletonCard> createState() => _TSkeletonCardState();
}
class _TSkeletonCardState extends State<TSkeletonCard> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
  }
  @override void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: Tween<double>(begin: 0.3, end: 0.7).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut)),
    child: Container(
      height: widget.height,
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(color: kBg3, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder)),
    ),
  );
}