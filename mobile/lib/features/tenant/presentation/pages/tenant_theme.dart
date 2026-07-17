// ============================================================
// TENANT THEME — white + slate (matches frontend tenantPageStyles.ts)
// Single source of truth. Import in every tenant page.
// ============================================================
import 'package:flutter/material.dart';

// ── Slate scale ─────────────────────────────────────────────
const Color kWhite      = Color(0xFFFFFFFF);
const Color kSlate50    = Color(0xFFF8FAFC);
const Color kSlate100   = Color(0xFFF1F5F9);
const Color kSlate200   = Color(0xFFE2E8F0);
const Color kSlate300   = Color(0xFFCBD5E1);
const Color kSlate400   = Color(0xFF94A3B8);
const Color kSlate500   = Color(0xFF64748B);
const Color kSlate600   = Color(0xFF475569);
const Color kSlate700   = Color(0xFF334155);
const Color kSlate800   = Color(0xFF1E293B);
const Color kSlate900   = Color(0xFF0F172A);

// ── Gold accent (CTA only — matches frontend) ─────────────
const Color kGold       = Color(0xFFC89128);
const Color kGoldLight  = Color(0xFFD4A84B);
const Color kGoldPale   = Color(0xFFE8CC8A);
const Color kGoldDim    = Color(0x1AC89128);
const Color kGoldBorder = Color(0x47C89128);

// ── Semantic ────────────────────────────────────────────────
const Color kSuccess    = Color(0xFF16A34A);
const Color kSuccessBg  = Color(0xFFDCFCE7);
const Color kWarning    = Color(0xFFD97706);
const Color kWarningBg  = Color(0xFFFEF3C7);
const Color kDanger     = Color(0xFFDC2626);
const Color kDangerBg   = Color(0xFFFFE4E6);
const Color kInfo       = Color(0xFF2563EB);
const Color kInfoBg     = Color(0xFFDBEAFE);

// ── Layout surfaces ─────────────────────────────────────────
const Color kPageBg     = kSlate100;
const Color kHeaderBg   = kSlate800;
const Color kCardBg     = kWhite;
const Color kBorder     = kSlate200;

// ── Legacy aliases (backward compat with older tenant pages) ─
const Color kBg         = kPageBg;
const Color kBg2        = kCardBg;
const Color kBg3        = kSlate100;
const Color kCream      = kSlate800;
const Color kSlate      = kSlate400;
const Color kSlateDim   = kSlate500;

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

// ── Text styles ─────────────────────────────────────────────
const TextStyle kHeadingStyle = TextStyle(
  color: kSlate800, fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: -0.5,
);
const TextStyle kSubheadStyle = TextStyle(
  color: kSlate500, fontSize: 13, fontWeight: FontWeight.w400, height: 1.6,
);
const TextStyle kLabelStyle = TextStyle(
  color: kGold, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 2.0,
);

// ── Decorations ─────────────────────────────────────────────
BoxDecoration kCardDecor = BoxDecoration(
  color: kCardBg,
  borderRadius: BorderRadius.circular(12),
  border: Border.all(color: kBorder),
);

BoxDecoration kGoldCardDecor = BoxDecoration(
  color: kCardBg,
  borderRadius: BorderRadius.circular(12),
  border: Border.all(color: kGoldBorder),
  gradient: kBannerGradient,
);

/// Slate header app bar used across tenant sub-pages.
PreferredSizeWidget tenantPageAppBar(String title, {List<Widget>? actions}) => AppBar(
  backgroundColor: kHeaderBg,
  elevation: 0,
  iconTheme: const IconThemeData(color: kWhite),
  title: Text(title, style: const TextStyle(color: kWhite, fontSize: 17, fontWeight: FontWeight.w700)),
  actions: actions,
);

// ── Reusable widgets ────────────────────────────────────────

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

class TSectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;
  const TSectionHeader(this.title, {super.key, this.trailing});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(children: [
      Expanded(child: Text(title,
        style: const TextStyle(color: kSlate800, fontSize: 15, fontWeight: FontWeight.w700))),
      ?trailing,
    ]),
  );
}

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

class TStatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  const TStatusBadge({super.key, required this.label, required this.color});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(4),
      border: Border.all(color: color.withValues(alpha: 0.3)),
    ),
    child: Text(label.toUpperCase(),
      style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
  );
}

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
        if (icon != null) ...[Icon(icon, size: 15, color: kSlate900), const SizedBox(width: 7)],
        Text(label, style: const TextStyle(color: kSlate900, fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
      ]),
    ),
  );
}

class TPrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final bool fullWidth;
  const TPrimaryButton({super.key, required this.label, this.onTap, this.icon, this.fullWidth = true});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: fullWidth ? double.infinity : null,
      padding: EdgeInsets.symmetric(horizontal: fullWidth ? 0 : 16, vertical: 13),
      decoration: BoxDecoration(color: kSlate800, borderRadius: BorderRadius.circular(10)),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 15, color: kWhite), const SizedBox(width: 7)],
        Text(label, style: const TextStyle(color: kWhite, fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
      ]),
    ),
  );
}

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
        border: Border.all(color: borderColor ?? kBorder),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: const TextStyle(color: kSlate600, fontSize: 12, fontWeight: FontWeight.w600)),
    ),
  );
}

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
        decoration: BoxDecoration(color: kSlate200, borderRadius: BorderRadius.circular(14)),
        child: Icon(icon, color: kSlate400, size: 26),
      ),
      const SizedBox(height: 14),
      Text(title, style: const TextStyle(color: kSlate800, fontSize: 14, fontWeight: FontWeight.w600)),
      const SizedBox(height: 6),
      Text(subtitle, style: const TextStyle(color: kSlate500, fontSize: 12, height: 1.5),
        textAlign: TextAlign.center),
    ]),
  );
}

class TErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const TErrorState({super.key, required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(child: Padding(
    padding: const EdgeInsets.all(32),
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Container(width: 52, height: 52,
        decoration: BoxDecoration(color: kDangerBg, borderRadius: BorderRadius.circular(14)),
        child: const Icon(Icons.error_outline_rounded, color: kDanger, size: 26)),
      const SizedBox(height: 14),
      Text(message, style: const TextStyle(color: kSlate500, fontSize: 12), textAlign: TextAlign.center),
      const SizedBox(height: 18),
      TGhostButton(label: 'Try Again', onTap: onRetry, borderColor: kDanger.withValues(alpha: 0.4)),
    ])),
  );
}

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
      decoration: BoxDecoration(color: kSlate200, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder)),
    ),
  );
}
