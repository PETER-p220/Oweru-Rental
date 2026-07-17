// ============================================================
// AGENT THEME — white + slate + gold (matches frontend agent pages)
// Single source of truth. Import in every agent page.
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

// ── Gold accent ─────────────────────────────────────────────
const Color kGold       = Color(0xFFC89128);
const Color kGoldLight  = Color(0xFFD4A84B);
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

// ── Legacy aliases ──────────────────────────────────────────
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

const TextStyle kHeadingStyle = TextStyle(
  color: kSlate800, fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: -0.5,
);
const TextStyle kSubheadStyle = TextStyle(
  color: kSlate500, fontSize: 13, fontWeight: FontWeight.w400, height: 1.6,
);
const TextStyle kLabelStyle = TextStyle(
  color: kGold, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 2.0,
);

BoxDecoration kCardDecor = BoxDecoration(
  color: kCardBg,
  borderRadius: BorderRadius.circular(12),
  border: Border.all(color: kBorder),
);

class ALabel extends StatelessWidget {
  final String text;
  const ALabel(this.text, {super.key});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: kGoldDim, border: Border.all(color: kGoldBorder), borderRadius: BorderRadius.circular(4)),
    child: Text(text.toUpperCase(), style: kLabelStyle),
  );
}

class ACard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  const ACard({super.key, required this.child, this.padding});
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: padding ?? const EdgeInsets.all(16),
    decoration: kCardDecor,
    child: child,
  );
}

class AStatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  const AStatusBadge({super.key, required this.label, required this.color});
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

class APrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  const APrimaryButton({super.key, required this.label, this.onTap, this.icon});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 13),
      decoration: BoxDecoration(color: kSlate800, borderRadius: BorderRadius.circular(10)),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        if (icon != null) ...[Icon(icon, size: 15, color: kWhite), const SizedBox(width: 7)],
        Text(label, style: const TextStyle(color: kWhite, fontSize: 13, fontWeight: FontWeight.w700)),
      ]),
    ),
  );
}

class AGoldButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  const AGoldButton({super.key, required this.label, this.onTap, this.icon});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 13),
      decoration: BoxDecoration(
        gradient: kGoldGradient,
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [BoxShadow(color: Color(0x30C89128), blurRadius: 12, offset: Offset(0, 4))],
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        if (icon != null) ...[Icon(icon, size: 15, color: kSlate900), const SizedBox(width: 7)],
        Text(label, style: const TextStyle(color: kSlate900, fontSize: 13, fontWeight: FontWeight.w700)),
      ]),
    ),
  );
}

class AEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const AEmptyState({super.key, required this.icon, required this.title, required this.subtitle});
  @override
  Widget build(BuildContext context) => ACard(
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
