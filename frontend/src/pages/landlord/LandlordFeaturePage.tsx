import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building, FileText, LucideIcon } from 'lucide-react';

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

const cardStyle: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(20,20,20,0.96) 0%, rgba(11,11,11,0.98) 100%)',
  border: '1px solid rgba(201,168,76,0.14)',
  borderRadius: '24px',
  padding: '32px',
  color: '#e8e4dc',
  boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
};

const actionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 18px',
  borderRadius: '999px',
  textDecoration: 'none',
  color: '#e8e4dc',
  background: 'rgba(201,168,76,0.12)',
  border: '1px solid rgba(201,168,76,0.2)',
  fontSize: '14px',
  fontWeight: 500,
};

const LandlordFeaturePage = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions = [],
}: LandlordFeaturePageProps) => {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <section style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '18px',
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.18)',
              color: '#c9a84c',
            }}
          >
            <Icon size={26} />
          </div>
          <div>
            <div style={{ color: '#c9a84c', fontSize: '12px', letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: '8px' }}>
              {eyebrow}
            </div>
            <h1 style={{ fontSize: '34px', lineHeight: 1.1, margin: 0 }}>{title}</h1>
          </div>
        </div>

        <p style={{ color: '#bdb4a8', fontSize: '16px', lineHeight: 1.7, maxWidth: '720px', margin: 0 }}>
          {description}
        </p>

        {actions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
            {actions.map((action) => (
              <Link key={action.to} to={action.to} style={actionStyle}>
                {action.label}
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          ...cardStyle,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Building size={20} style={{ color: '#c9a84c', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '18px', margin: '0 0 8px' }}>Portfolio-first workflow</h2>
          <p style={{ color: '#9f9587', margin: 0, lineHeight: 1.6 }}>
            Keep this section connected to your property portfolio so every landlord task starts from a unit or tenant context.
          </p>
        </div>

        <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <FileText size={20} style={{ color: '#70c490', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '18px', margin: '0 0 8px' }}>Ready for backend wiring</h2>
          <p style={{ color: '#9f9587', margin: 0, lineHeight: 1.6 }}>
            The route is live now, so we can safely attach real API data and actions here without changing the landlord navigation again.
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandlordFeaturePage;
