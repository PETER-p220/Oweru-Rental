import { useEffect, useState } from 'react';
import { BarChart2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import Api from '../../services/api';
import {
  descriptionStyle, headingStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
} from './tenantPageStyles';

const MetricCard = ({
  label, value, icon: Icon, color, sub,
}: { label: string; value: string | number; icon: any; color: string; sub?: string }) => (
  <div style={{
    padding: '24px',
    borderRadius: '18px',
    background: `linear-gradient(145deg, rgba(15,23,42,0.7) 0%, rgba(30,41,59,0.4) 100%)`,
    border: `1px solid rgba(148,163,184,0.08)`,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'transform 0.18s',
  }}
    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)')}
    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)')}
  >
    {/* Decorative corner glow */}
    <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `${color}10`, pointerEvents: 'none' }} />

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '12px',
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        <Icon size={18} />
      </div>
      <div style={{
        fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
        color: palette.gray400, fontWeight: 600,
      }}>{label}</div>
    </div>

    <div style={{ fontSize: '40px', fontWeight: 800, color, letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '12px', color: palette.gray400, marginTop: '8px' }}>{sub}</div>}

    {/* Bottom accent bar */}
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}50, transparent)` }} />
  </div>
);

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await Api.getTenantAnalytics();
        setAnalytics(res.data || {});
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load analytics.');
      } finally { setLoading(false); }
    })();
  }, []);

  const statuses = analytics.applications_by_status || {};
  const total = (statuses.pending ?? 0) + (statuses.approved ?? 0) + (statuses.rejected ?? 0);

  const metrics = [
    { label: 'Pending',  value: statuses.pending ?? 0,  icon: Clock,        color: '#d97706',    sub: 'Awaiting review' },
    { label: 'Approved', value: statuses.approved ?? 0, icon: CheckCircle,  color: '#34d399',        sub: 'Accepted applications' },
    { label: 'Rejected', value: statuses.rejected ?? 0, icon: XCircle,      color: '#f87171',        sub: 'Unsuccessful applications' },
  ];

  return (
    <div style={{ ...pageStyle, padding: '0' }}>
      {/* Header */}
      <section style={{ ...panelStyle }}>
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: `linear-gradient(90deg, transparent, ${palette.blue600}, transparent)` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.blue600, display: 'inline-block' }} />
              Tenant Workspace
            </div>
            <h1 style={headingStyle}>Analytics</h1>
            <p style={descriptionStyle}>Application and payment metrics from your tenant account.</p>
          </div>
          {total > 0 && (
            <div style={{
              padding: '10px 18px', borderRadius: '12px',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)',
              color: palette.blue600, fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <BarChart2 size={14} />
              {total} Total Applications
            </div>
          )}
        </div>
      </section>

      {/* Metrics */}
      <section style={{ ...panelStyle }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', fontSize: '14px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.gray400, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.blue600}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading analytics...
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: total > 0 ? '28px' : '0' }}>
              {metrics.map(m => <MetricCard key={m.label} {...m} />)}
            </div>

            {/* Progress bar breakdown */}
            {total > 0 && (
              <div style={{ borderRadius: '14px', background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.06)', padding: '20px 24px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: palette.gray400, marginBottom: '16px', fontWeight: 600 }}>Application Breakdown</div>
                {/* Stacked bar */}
                <div style={{ display: 'flex', height: '8px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(148,163,184,0.1)', marginBottom: '14px' }}>
                  {[
                    { pct: (statuses.approved ?? 0) / total, color: '#34d399' },
                    { pct: (statuses.pending ?? 0) / total, color: '#d97706' },
                    { pct: (statuses.rejected ?? 0) / total, color: '#f87171' },
                  ].map((seg, i) => (
                    <div key={i} style={{ width: `${seg.pct * 100}%`, background: seg.color, transition: 'width 0.5s ease' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Approved', color: '#34d399', val: statuses.approved ?? 0 },
                    { label: 'Pending', color: '#d97706', val: statuses.pending ?? 0 },
                    { label: 'Rejected', color: '#f87171', val: statuses.rejected ?? 0 },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: palette.gray400 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                      {l.label}: <span style={{ color: palette.white, fontWeight: 600 }}>{l.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AnalyticsPage;