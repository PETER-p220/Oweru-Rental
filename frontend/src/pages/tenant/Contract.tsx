import { useEffect, useState } from 'react';
import { FileText, MapPin, Calendar, Download, AlertCircle, CheckCircle } from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency, formatDate } from './tenantPageStyles';

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
  active:    B.gold,
  signed:    B.gold,
  expired:   '#ef4444',
  cancelled: '#ef4444',
  pending:   '#f59e0b',
};

const StatusBadge = ({ status }: { status?: string }) => {
  const s = status || 'unknown';
  const color = statusColorMap[s] ?? B.slate;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 14px',
      background: `${color}18`, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      fontFamily: "'Jost', sans-serif",
    }}>
      <CheckCircle size={11} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

const Contract = () => {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await Api.getMyContract();
        setContract(res.data || null);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'No active contract found.');
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={{ fontFamily: "'Jost', 'Futura PT', sans-serif", background: B.navy900, color: B.cream, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .ct-panel {
          background: ${B.navy800};
          border: 1px solid ${B.border};
          padding: 32px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .ct-tag {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: ${B.gold}; margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .ct-tag::before { content: ''; width: 20px; height: 1px; background: ${B.gold}; }

        .ct-prop-card {
          background: ${B.navy900};
          border: 1px solid ${B.border};
          overflow: hidden;
          position: relative;
        }

        .ct-prop-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 3px;
          background: ${B.gold};
        }

        .ct-meta-row {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .ct-meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px 20px;
          background: ${B.navy700};
          border: 1px solid ${B.borderF};
          flex: 1;
          min-width: 140px;
        }

        .ct-meta-lbl {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: ${B.gold};
        }

        .ct-meta-val {
          font-size: 14px; font-weight: 500;
          color: ${B.cream};
          display: flex; align-items: center; gap: 6px;
        }

        .ct-terms {
          background: ${B.navy900};
          border: 1px solid ${B.borderF};
          padding: 22px 24px;
        }

        .ct-download-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: ${B.gold}; color: ${B.navy900};
          padding: 13px 26px;
          font-family: 'Jost', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: none; cursor: pointer;
          transition: background 0.2s;
        }
        .ct-download-btn:hover { background: ${B.goldLt}; }
      `}</style>

      {/* ── Header Panel ── */}
      <div className="ct-panel">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: B.gold }} />

        <div className="ct-tag">Tenant Workspace</div>
        <h1 style={{ fontSize: 'clamp(26px,3vw,36px)', fontWeight: 700, color: B.cream, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          My Contract
        </h1>
        <p style={{ fontSize: 14, fontWeight: 300, color: B.slate, margin: 0 }}>
          Your active tenancy contract from the tenant API.
        </p>
      </div>

      {/* ── Content Panel ── */}
      <div className="ct-panel">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: B.slate, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${B.border}`, borderTopColor: B.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading contract…
          </div>

        ) : error || !contract ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 16, color: B.slate }}>
            <div style={{ width: 64, height: 64, background: B.goldDim, border: `1px solid ${B.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={28} style={{ color: B.gold, opacity: 0.5 }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: B.cream }}>{error || 'No active contract found'}</div>
            <div style={{ fontSize: 13, fontWeight: 300, color: B.slate }}>Contact your landlord if you believe this is an error.</div>
          </div>

        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Status + dates */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <StatusBadge status={contract.status} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: B.slate, fontSize: 13, fontWeight: 300 }}>
                <Calendar size={13} style={{ color: B.gold }} />
                {formatDate(contract.start_date)} — {formatDate(contract.end_date)}
              </div>
            </div>

            {/* Property card */}
            <div className="ct-prop-card">
              <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 34, height: 34, background: B.goldDim, border: `1px solid ${B.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: B.gold, flexShrink: 0 }}>
                      <FileText size={16} />
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: B.cream, letterSpacing: '-0.01em' }}>
                      {contract.property?.title || 'Untitled property'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: B.slate, fontSize: 13, fontWeight: 300 }}>
                    <MapPin size={12} /> {contract.property?.location || 'No location'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: B.gold, marginBottom: 7 }}>Monthly Rent</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: B.gold, lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {formatCurrency(contract.rent_amount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta rows */}
            <div className="ct-meta-row">
              {[
                { lbl: 'Contract ID',  val: `#${contract.id}` },
                { lbl: 'Start Date',   val: formatDate(contract.start_date), icon: <Calendar size={13} style={{ color: B.gold }} /> },
                { lbl: 'End Date',     val: formatDate(contract.end_date),   icon: <Calendar size={13} style={{ color: B.gold }} /> },
                { lbl: 'Status',       val: contract.status || 'unknown' },
              ].map(m => (
                <div key={m.lbl} className="ct-meta-item">
                  <div className="ct-meta-lbl">{m.lbl}</div>
                  <div className="ct-meta-val">{m.icon}{m.val}</div>
                </div>
              ))}
            </div>

            {/* Terms */}
            {contract.terms && (
              <div className="ct-terms">
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: B.gold, marginBottom: 14 }}>
                  Contract Terms
                </div>
                <p style={{ color: B.slate, lineHeight: 1.8, fontSize: 14, fontWeight: 300, margin: 0 }}>
                  {contract.terms}
                </p>
              </div>
            )}

            {/* Download */}
            <div>
              <button
                className="ct-download-btn"
                onClick={() => Api.downloadContract(contract.id).catch(() => {})}
              >
                <Download size={15} /> Download Contract PDF
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Contract;