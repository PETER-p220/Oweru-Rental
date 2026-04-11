import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileCheck, Search, MapPin, AlertCircle, ClipboardList, Clock } from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency, formatDate, getStatusColor } from './tenantPageStyles';

interface ApplicationItem {
  id: number;
  status?: string;
  message?: string;
  created_at?: string;
  property?: { title?: string; location?: string; price?: number | string };
}

const B = {
  navy900:  '#0F172A',
  navy800:  '#162035',
  navy700:  '#1E2D4A',
  gold:     '#C89128',
  goldLt:   '#D4A843',
  goldDim:  'rgba(200,145,40,0.12)',
  cream:    '#F8F8F9',
  slate:    '#94A3B8',
  border:   'rgba(200,145,40,0.18)',
  borderF:  'rgba(200,145,40,0.08)',
};

const statusColorMap: Record<string, string> = {
  approved:  B.gold,
  pending:   '#f59e0b',
  rejected:  '#ef4444',
  cancelled: '#ef4444',
  active:    '#10b981',
};

const StatusBadge = ({ status }: { status?: string }) => {
  const s = status || 'unknown';
  const color = statusColorMap[s] ?? B.slate;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px',
      background: `${color}18`, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      fontFamily: "'Jost', sans-serif",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

const ApplicationsPage = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [searchParams]                  = useSearchParams();
  const propertyId                      = searchParams.get('property');

  useEffect(() => {
    if (propertyId) handleApplyForProperty(propertyId);
  }, [propertyId]);

  const handleApplyForProperty = async (id: string) => {
    try {
      if (!id || isNaN(parseInt(id))) throw new Error('Invalid property ID');
      await Api.createApplication({
        property_id: parseInt(id),
        message: 'I am interested in this property and would like to schedule a viewing.',
      });
      alert('Application submitted successfully!');
      window.history.replaceState({}, '', window.location.pathname);
      const res = await Api.getTenantApplications();
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to submit application.');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await Api.getTenantApplications();
        setApplications(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load applications.');
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => applications.filter((item) => {
    const hay = `${item.property?.title || ''} ${item.property?.location || ''} ${item.message || ''}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  }), [applications, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((a) => { const s = a.status || 'unknown'; counts[s] = (counts[s] || 0) + 1; });
    return counts;
  }, [applications]);

  return (
    <div style={{ fontFamily: "'Jost', 'Futura PT', sans-serif", background: B.navy900, color: B.cream, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .ap-panel {
          background: ${B.navy800};
          border: 1px solid ${B.border};
          padding: 32px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .ap-tag {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: ${B.gold}; margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .ap-tag::before { content: ''; width: 20px; height: 1px; background: ${B.gold}; }

        .ap-search {
          width: 100%; max-width: 420px;
          background: ${B.navy900};
          border: 1px solid ${B.border};
          color: ${B.cream};
          padding: 10px 14px 10px 40px;
          font-family: 'Jost', sans-serif;
          font-size: 14px; font-weight: 400;
          outline: none;
          transition: border-color 0.2s;
        }
        .ap-search::placeholder { color: rgba(148,163,184,0.4); }
        .ap-search:focus { border-color: ${B.gold}; }

        .ap-count-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 12px;
          font-family: 'Jost', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        table.ap-table { width: 100%; border-collapse: collapse; }
        table.ap-table thead th {
          font-size: 9px; font-weight: 700; letter-spacing: 0.2em;
          text-transform: uppercase; color: ${B.gold};
          padding: 10px 16px; text-align: left;
          border-bottom: 1px solid ${B.border};
          background: ${B.navy900};
        }
        table.ap-table tbody td {
          padding: 16px; font-size: 14px;
          border-bottom: 1px solid ${B.borderF};
          color: ${B.cream}; vertical-align: middle;
        }
        table.ap-table tbody tr:last-child td { border-bottom: none; }
        table.ap-table tbody tr { transition: background 0.15s; }
        table.ap-table tbody tr:hover td { background: rgba(200,145,40,0.03); }

        /* Mobile cards */
        .ap-mobile { display: none; }

        @media (max-width: 768px) {
          table.ap-table { display: none; }
          .ap-mobile { display: flex; flex-direction: column; gap: 1px; }
        }

        .ap-mob-card {
          background: ${B.navy900};
          border: 1px solid ${B.borderF};
          padding: 18px;
          margin-bottom: 1px;
          transition: border-color 0.2s;
        }
        .ap-mob-card:hover { border-color: rgba(200,145,40,0.3); }
      `}</style>

      {/* ── Header Panel ── */}
      <div className="ap-panel">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: B.gold }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="ap-tag">Tenant Workspace</div>
            <h1 style={{ fontSize: 'clamp(26px,3vw,36px)', fontWeight: 700, color: B.cream, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              My Applications
            </h1>
            <p style={{ fontSize: 14, fontWeight: 300, color: B.slate, margin: 0 }}>
              Track the status of all your rental applications in one place.
            </p>
          </div>

          {/* Status counts */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignSelf: 'flex-end' }}>
            {Object.entries(statusCounts).map(([status, count]) => {
              const color = statusColorMap[status] ?? B.slate;
              return (
                <div key={status} className="ap-count-pill" style={{ background: `${color}14`, border: `1px solid ${color}35`, color }}>
                  <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  <span style={{ background: `${color}22`, padding: '1px 7px', fontSize: 10, fontWeight: 800 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div style={{ marginTop: 24, position: 'relative' as const, display: 'inline-block' }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: B.slate, pointerEvents: 'none' }} />
          <input
            className="ap-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by property, location, or message…"
          />
        </div>
      </div>

      {/* ── Content Panel ── */}
      <div className="ap-panel">
        <div className="ap-tag">Application Records</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: B.cream, margin: '0 0 20px', letterSpacing: '-0.01em' }}>
          All Applications
        </h2>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', padding: '13px 16px', marginBottom: 20, fontSize: 13 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: B.slate, padding: '80px 0' }}>
            <div style={{ width: 18, height: 18, border: `2px solid ${B.border}`, borderTopColor: B.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 14, fontWeight: 400 }}>Loading your applications…</span>
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: B.slate }}>
            <div style={{ width: 64, height: 64, background: B.goldDim, border: `1px solid ${B.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ClipboardList size={28} style={{ color: B.gold }} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: B.cream }}>No applications found</div>
            <div style={{ fontSize: 14, fontWeight: 300, maxWidth: 300, margin: '0 auto', lineHeight: 1.65 }}>
              You haven't submitted any applications yet. Start browsing properties to apply.
            </div>
          </div>

        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div style={{ overflowX: 'auto', border: `1px solid ${B.border}` }}>
              <table className="ap-table">
                <thead>
                  <tr>
                    {['Property', 'Price', 'Status', 'Message', 'Applied'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14, color: B.cream }}>
                          {item.property?.title || 'Untitled Property'}
                        </div>
                        <div style={{ color: B.slate, fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} /> {item.property?.location || 'No location'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: B.gold, fontSize: 15 }}>
                          {formatCurrency(item.property?.price)}
                        </div>
                      </td>
                      <td><StatusBadge status={item.status} /></td>
                      <td style={{ maxWidth: 220 }}>
                        <div style={{ color: B.slate, fontSize: 13, lineHeight: 1.55, fontWeight: 300 }}>
                          {item.message || '—'}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' as const }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: B.slate, fontSize: 13, fontWeight: 300 }}>
                          <Clock size={12} /> {formatDate(item.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="ap-mobile">
              {filtered.map((item) => (
                <div key={item.id} className="ap-mob-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: B.cream, marginBottom: 4 }}>
                        {item.property?.title || 'Untitled Property'}
                      </div>
                      <div style={{ color: B.slate, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} /> {item.property?.location || 'No location'}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 17, color: B.gold, flexShrink: 0 }}>
                      {formatCurrency(item.property?.price)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: B.gold }}>Status</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: B.gold, marginBottom: 5 }}>Message</div>
                      <div style={{ fontSize: 13, fontWeight: 300, color: B.slate, lineHeight: 1.55 }}>{item.message || 'No message provided'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: B.slate, fontSize: 12, fontWeight: 300 }}>
                      <Clock size={11} /> {formatDate(item.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicationsPage;