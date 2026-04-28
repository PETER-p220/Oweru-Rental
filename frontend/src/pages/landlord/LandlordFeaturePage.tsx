import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FeatureAction {
  label: string;
  to: string;
}

interface LandlordFeaturePageProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: FeatureAction[];
}

const LandlordFeaturePage = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions = [],
}: LandlordFeaturePageProps) => {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <style>{`
        * { box-sizing: border-box; }

        .lf-card {
          background: linear-gradient(180deg, rgba(20,20,20,0.96) 0%, rgba(11,11,11,0.98) 100%);
          border: 1px solid rgba(201,168,76,0.14);
          border-radius: 24px;
          padding: 32px;
          color: #e8e4dc;
          box-shadow: 0 24px 60px rgba(0,0,0,0.28);
        }

        .lf-hero {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .lf-icon-box {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: rgba(201,168,76,0.12);
          border: 1px solid rgba(201,168,76,0.18);
          color: #c9a84c;
          flex-shrink: 0;
        }

        .lf-title {
          font-size: clamp(24px, 4vw, 34px);
          line-height: 1.1;
          margin: 0;
        }

        .lf-eyebrow {
          color: #c9a84c;
          font-size: 12px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .lf-description {
          color: #bdb4a8;
          font-size: 16px;
          line-height: 1.7;
          max-width: 720px;
          margin: 0;
        }

        .lf-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
        }

        .lf-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 999px;
          text-decoration: none;
          color: #e8e4dc;
          background: rgba(201,168,76,0.12);
          border: 1px solid rgba(201,168,76,0.2);
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s, border-color 0.2s;
          white-space: nowrap;
        }
        .lf-action-btn:hover {
          background: rgba(201,168,76,0.2);
          border-color: rgba(201,168,76,0.35);
        }

        .lf-features-card {
          background: linear-gradient(180deg, rgba(20,20,20,0.96) 0%, rgba(11,11,11,0.98) 100%);
          border: 1px solid rgba(201,168,76,0.14);
          border-radius: 24px;
          padding: 32px;
          color: #e8e4dc;
          box-shadow: 0 24px 60px rgba(0,0,0,0.28);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .lf-feature-item {
          padding: 20px;
          border-radius: 18px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .lf-feature-title {
          font-size: 18px;
          margin: 0 0 8px;
        }

        .lf-feature-text {
          color: #9f9587;
          margin: 0;
          line-height: 1.6;
          font-size: 14px;
        }

        /* Mobile adjustments */
        @media (max-width: 600px) {
          .lf-card {
            padding: 22px 18px;
            border-radius: 16px;
          }

          .lf-features-card {
            padding: 22px 18px;
            border-radius: 16px;
            grid-template-columns: 1fr;
          }

          .lf-hero {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .lf-description {
            font-size: 15px;
          }

          .lf-actions {
            flex-direction: column;
            gap: 10px;
          }

          .lf-action-btn {
            width: 100%;
            justify-content: center;
          }

          .lf-feature-item {
            padding: 16px;
          }

          .lf-feature-title {
            font-size: 16px;
          }
        }

        @media (max-width: 380px) {
          .lf-card, .lf-features-card {
            padding: 18px 14px;
          }

          .lf-icon-box {
            width: 48px;
            height: 48px;
          }
        }
      `}</style>

      <section className="lf-card">
        <div className="lf-hero">
          <div className="lf-icon-box">
            <Icon size={26} />
          </div>
          <div>
            <div className="lf-eyebrow">{eyebrow}</div>
            <h1 className="lf-title">{title}</h1>
          </div>
        </div>

        <p className="lf-description">{description}</p>

        {actions.length > 0 && (
          <div className="lf-actions">
            {actions.map((action) => (
              <Link key={action.to} to={action.to} className="lf-action-btn">
                {action.label}
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="lf-features-card">
        <div className="lf-feature-item">
          <Building size={20} style={{ color: '#c9a84c', marginBottom: '12px' }} />
          <h2 className="lf-feature-title">Portfolio-first workflow</h2>
          <p className="lf-feature-text">
            Keep this section connected to your property portfolio so every landlord task starts from a unit or tenant context.
          </p>
        </div>

        <div className="lf-feature-item">
          <FileText size={20} style={{ color: '#70c490', marginBottom: '12px' }} />
          <h2 className="lf-feature-title">Ready for backend wiring</h2>
          <p className="lf-feature-text">
            The route is live now, so we can safely attach real API data and actions here without changing the landlord navigation again.
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandlordFeaturePage;