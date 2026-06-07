import { Link } from 'react-router-dom';
import { ArrowRight, Building, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FeatureAction { label: string; to: string; }
interface LandlordFeaturePageProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: FeatureAction[];
}

// ── Design tokens (matches Flutter kSlate* / kCardBg / kHeaderBg / gold CTA)
const C = {
  pageBg:    '#F1F5F9',   // kSlate100  — page background
  headerBg:  '#1E293B',   // kSlate800  — section header panels
  cardBg:    '#FFFFFF',   // kWhite     — card surfaces
  border:    '#E2E8F0',   // kSlate200
  text:      '#0F172A',   // kSlate900
  textSub:   '#475569',   // kSlate600
  textMuted: '#94A3B8',   // kSlate400
  textLight: '#CBD5E1',   // kSlate300  (text on dark bg)
  // Gold — CTAs & accent links only
  gold:      '#C89128',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.26)',
  // Semantic badge
  green:     '#16A34A',
  greenBg:   '#DCFCE7',
};

const LandlordFeaturePage = ({
  eyebrow, title, description, icon: Icon, actions = [],
}: LandlordFeaturePageProps) => (
  <div style={{ display: 'grid', gap: '20px', backgroundColor: C.pageBg, minHeight: '100vh', padding: '24px' }}>
    <style>{`
      * { box-sizing: border-box; }

      /* ── Header card (slate-800 bg, like kSlate800 header) */
      .lf-header {
        background: ${C.headerBg};
        border-radius: 14px;
        padding: 28px 32px;
        color: #fff;
      }

      .lf-hero { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; flex-wrap: wrap; }

      /* Icon box — white bg on dark panel */
      .lf-icon-box {
        width: 52px; height: 52px; border-radius: 12px; flex-shrink: 0;
        display: grid; place-items: center;
        background: rgba(255,255,255,0.10);
        border: 1px solid rgba(255,255,255,0.16);
        color: #fff;
      }

      .lf-eyebrow {
        font-size: 11px; letter-spacing: 0.20em; text-transform: uppercase;
        color: ${C.textLight}; font-weight: 700; margin-bottom: 5px;
      }
      .lf-title { font-size: clamp(22px, 4vw, 30px); font-weight: 800; margin: 0; color: #fff; letter-spacing: -0.02em; line-height: 1.15; }
      .lf-desc  { font-size: 14px; line-height: 1.65; color: ${C.textLight}; margin: 0; max-width: 680px; }

      /* Actions row — gold primary CTA buttons */
      .lf-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
      .lf-btn {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 18px; border-radius: 8px; text-decoration: none;
        font-size: 13px; font-weight: 700; white-space: nowrap;
        background: ${C.gold}; color: #fff; border: none;
        box-shadow: ${C.goldGlow}; transition: opacity 0.15s;
        letter-spacing: 0.02em;
      }
      .lf-btn:hover { opacity: 0.88; }

      /* ── Feature cards section (white cards on slate-100 bg) */
      .lf-features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
      }

      .lf-feature-card {
        background: ${C.cardBg};
        border: 1px solid ${C.border};
        border-radius: 14px;
        padding: 22px;
        box-shadow: 0 1px 3px rgba(15,23,42,0.06);
        transition: box-shadow 0.2s, transform 0.2s;
      }
      .lf-feature-card:hover { box-shadow: 0 6px 20px rgba(15,23,42,0.10); transform: translateY(-2px); }

      .lf-icon-sm {
        width: 38px; height: 38px; border-radius: 10px;
        display: grid; place-items: center; margin-bottom: 14px;
      }

      .lf-feature-title { font-size: 15px; font-weight: 700; color: ${C.text}; margin: 0 0 8px; }
      .lf-feature-text  { color: ${C.textSub}; margin: 0; line-height: 1.6; font-size: 13px; }

      /* Mobile */
      @media (max-width: 600px) {
        .lf-header { padding: 20px 18px; border-radius: 12px; }
        .lf-hero   { flex-direction: column; align-items: flex-start; gap: 10px; }
        .lf-actions { flex-direction: column; }
        .lf-btn { width: 100%; justify-content: center; }
        .lf-features-grid { grid-template-columns: 1fr; }
        .lf-feature-card  { padding: 18px; }
      }
    `}</style>

    {/* ── Slate-800 header panel ─────────────────────────── */}
    <section className="lf-header">
      <div className="lf-hero">
        <div className="lf-icon-box"><Icon size={24} /></div>
        <div>
          <div className="lf-eyebrow">{eyebrow}</div>
          <h1 className="lf-title">{title}</h1>
        </div>
      </div>

      <p className="lf-desc">{description}</p>

      {actions.length > 0 && (
        <div className="lf-actions">
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className="lf-btn">
              {a.label} <ArrowRight size={15} />
            </Link>
          ))}
        </div>
      )}
    </section>

    {/* ── White feature cards (on slate-100 page bg) ─────── */}
    <div className="lf-features-grid">
      <div className="lf-feature-card">
        <div className="lf-icon-sm" style={{ background: '#DCFCE7' }}>
          <Building size={18} style={{ color: '#16A34A' }} />
        </div>
        <h2 className="lf-feature-title">Portfolio-first workflow</h2>
        <p className="lf-feature-text">
          Keep this section connected to your property portfolio so every landlord task starts from a unit or tenant context.
        </p>
      </div>

      <div className="lf-feature-card">
        <div className="lf-icon-sm" style={{ background: '#DBEAFE' }}>
          <FileText size={18} style={{ color: '#2563EB' }} />
        </div>
        <h2 className="lf-feature-title">Ready for backend wiring</h2>
        <p className="lf-feature-text">
          The route is live now, so we can safely attach real API data and actions here without changing the landlord navigation again.
        </p>
      </div>
    </div>
  </div>
);

export default LandlordFeaturePage;