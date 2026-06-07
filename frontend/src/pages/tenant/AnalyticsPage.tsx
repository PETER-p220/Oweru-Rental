import { useEffect, useState } from 'react';
import { BarChart2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import Api from '../../services/api';

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
        color: '#94A3B8', fontWeight: 600,
      }}>{label}</div>
    </div>

    <div style={{ fontSize: '40px', fontWeight: 800, color, letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>{sub}</div>}

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
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F1F5F9', color: '#0F172A', minHeight: '100vh', padding: '0' }}>
      {/* Header */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '52px 40px 44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C89128', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', padding: '4px 12px' }}>
              Tenant Workspace
            </div>
            <h1 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>Analytics</h1>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 400, color: '#94A3B8', margin: '8px 0 0' }}>Application and payment metrics from your tenant account.</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 40px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {total > 0 && (
            <div style={{
              padding: '10px 18px', borderRadius: '12px',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)',
              color: '#2563EB', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <BarChart2 size={14} />
              {total} Total Applications
            </div>
          )}
          {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
        </div>

      {/* Analytics Panel */}
      <section style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 32, marginBottom: 24, position: 'relative', overflow: 'hidden', maxWidth: '1280px', margin: '24px auto 0' }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', fontSize: '14px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94A3B8', padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
                <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '16px', fontWeight: 600 }}>Application Breakdown</div>
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
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94A3B8' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                      {l.label}: <span style={{ color: '#0F172A', fontWeight: 600 }}>{l.val}</span>
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