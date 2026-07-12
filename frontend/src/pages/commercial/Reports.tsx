import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, DollarSign, Users, Eye, TrendingUp, Zap } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Report {
  id: number; title: string; type: string; period: string; generated_at: string; file_url?: string; data?: any;
}
interface Property { id: number; title: string; type: string; location: string; status: string; }

const reportTypes = [
  { value: 'revenue',     label: 'Revenue',     icon: <DollarSign size={16} />,  dot: '#10B981' },
  { value: 'bookings',    label: 'Bookings',    icon: <Users size={16} />,       dot: '#3B82F6' },
  { value: 'performance', label: 'Performance', icon: <TrendingUp size={16} />,  dot: '#8B5CF6' },
  { value: 'analytics',   label: 'Analytics',   icon: <Eye size={16} />,         dot: '#F59E0B' },
];

const dotColor: Record<string, string> = {  
  revenue: '#10B981', bookings: '#3B82F6', performance: '#8B5CF6', analytics: '#F59E0B'
};

const periods = [
  { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' },
];

const getTypeInfo = (type: string) => reportTypes.find(t => t.value === type) || reportTypes[0];

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [selType, setSelType] = useState('');
  const [selPeriod, setSelPeriod] = useState('');
  const [selProperty, setSelProperty] = useState('');
  const [liveSummary, setLiveSummary] = useState<any>(null);
  const [genError, setGenError] = useState('');

  useEffect(() => { fetchReports(); fetchProperties(); }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/reports`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) {
        const d = await res.json();
        setReports(Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : []);
        setLiveSummary(d.live_summary || null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/properties?per_page=100`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) { const d = await res.json(); setProperties(Array.isArray(d.data) ? d.data : []); }
    } catch (e) { console.error(e); }
  };

  const generateReport = async (type: string, period: string, propertyId?: number) => {
    if (!type || !period) return;
    setGenerating(true);
    setGenError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          period,
          ...(propertyId ? { property_id: propertyId } : {}),
        }),
      });
      const nr = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGenError(nr.message || 'Could not generate report');
        return;
      }
      setReports(p => [nr, ...p]);
      if (nr.data) setLiveSummary(nr.data);
    } catch (e) {
      console.error(e);
      setGenError('Could not generate report');
    }
    finally { setGenerating(false); }
  };

  const downloadReport = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/reports/${id}/download`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `commercial-report-${id}.json`;
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); document.body.removeChild(a);
      }
    } catch (e) { console.error(e); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const filtered = reports.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchPeriod = periodFilter === 'all' || r.period === periodFilter;
    return matchSearch && matchType && matchPeriod;
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2px solid rgba(212,175,55,0.15)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#4A5568', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Loading reports…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080E1A', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .card-panel { background: #0F1829; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; }
        .panel-header { padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; gap: 10px; }
        .gold-dot { width: 7px; height: 7px; border-radius: 50%; background: #D4AF37; flex-shrink: 0; box-shadow: 0 0 8px rgba(212,175,55,0.5); }
        .form-input {
          width: 100%; padding: 10px 16px; background: #0C1420;
          border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
          color: #E2D5B0; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none;
          transition: border-color 0.2s;
        }
        .form-input::placeholder { color: #2D3748; }
        .form-input:focus { border-color: rgba(212,175,55,0.5); }
        .quick-btn {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 18px 12px; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05); border-radius: 14px;
          cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .quick-btn:hover:not(:disabled) { border-color: rgba(212,175,55,0.25); background: rgba(212,175,55,0.03); transform: translateY(-1px); }
        .quick-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .quick-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .custom-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .gen-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 22px; margin-top: 14px;
          background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%);
          color: #080E1A; border: none; border-radius: 12px;
          font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 6px 20px rgba(212,175,55,0.22);
        }
        .gen-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(212,175,55,0.32); }
        .gen-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(8,14,26,0.3); border-top-color: #080E1A; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .filter-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .type-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
        .report-row { display: flex; align-items: center; gap: 14px; padding: 14px 22px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s; }
        .report-row:last-child { border-bottom: none; }
        .report-row:hover { background: rgba(212,175,55,0.025); }
        .report-icon { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dl-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.18); border-radius: 10px; color: #D4AF37; font-size: 11px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .dl-btn:hover { background: rgba(212,175,55,0.15); border-color: rgba(212,175,55,0.35); }
        .empty-state { padding: 60px 20px; text-align: center; }
        .empty-icon { width: 60px; height: 60px; background: rgba(255,255,255,0.03); border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .section-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #4A5568; margin-bottom: 12px; }
        select option { background: #0C1420; color: #E2D5B0; }
        .search-wrap { position: relative; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; }
        .search-input { padding-left: 40px !important; }
        @media (max-width: 640px) {
          .quick-grid { grid-template-columns: repeat(2, 1fr); }
          .custom-grid, .filter-grid { grid-template-columns: 1fr !important; }
          .tbl-hide { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Business</span>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, color: '#F1EDD8', fontFamily: "'Playfair Display', serif", lineHeight: 1.1, marginBottom: 4 }}>Reports</h1>
            <p style={{ color: '#4A5568', fontSize: 13 }}>Live commercial performance plus downloadable snapshots</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}>
            <FileText size={14} color="#D4AF37" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#D4AF37' }}>{reports.length} total</span>
          </div>
        </div>

        {liveSummary && (
          <div className="card-panel" style={{ padding: '18px 22px' }}>
            <p className="section-label" style={{ marginBottom: 14 }}>{liveSummary.period_label || 'This month'} snapshot</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Revenue', value: fmt(liveSummary.revenue) },
                { label: 'Payments', value: String(liveSummary.payments_count ?? 0) },
                { label: 'Applications', value: String(liveSummary.applications_count ?? 0) },
                { label: 'Approved', value: String(liveSummary.approved_applications ?? 0) },
              ].map((s) => (
                <div key={s.label} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <p style={{ fontSize: 10, color: '#4A5568', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#F1EDD8' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {genError && (
          <div className="card-panel" style={{ padding: 14, color: '#FCA5A5', fontSize: 13 }}>{genError}</div>
        )}

        {/* Quick Generate */}
        <div className="card-panel">
          <div className="panel-header">
            <div className="gold-dot" />
            <Zap size={14} color="#D4AF37" />
            <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Quick Generate</span>
          </div>

          {/* One-click shortcuts */}
          <div className="quick-grid">
            {reportTypes.map(rt => (
              <button key={rt.value} className="quick-btn" onClick={() => generateReport(rt.value, 'monthly')} disabled={generating}>
                <div className="quick-icon" style={{ background: `${rt.dot}14`, border: `1px solid ${rt.dot}30` }}>
                  <span style={{ color: rt.dot }}>{rt.icon}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#E2D5B0', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{rt.label}</p>
                  <p style={{ color: '#4A5568', fontSize: 10 }}>Monthly</p>
                </div>
              </button>
            ))}
          </div>

          {/* Custom */}
          <div style={{ padding: '18px 22px' }}>
            <p className="section-label">Custom Report</p>
            <div className="custom-grid">
              <select value={selType} onChange={e => setSelType(e.target.value)} className="form-input">
                <option value="">Report Type</option>
                {reportTypes.map(t => <option key={t.value} value={t.value}>{t.label} Report</option>)}
              </select>
              <select value={selPeriod} onChange={e => setSelPeriod(e.target.value)} className="form-input">
                <option value="">Period</option>
                {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <select value={selProperty} onChange={e => setSelProperty(e.target.value)} className="form-input">
                <option value="">All Properties</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <button className="gen-btn"
              onClick={() => generateReport(selType, selPeriod, selProperty ? parseInt(selProperty) : undefined)}
              disabled={!selType || !selPeriod || generating}>
              {generating ? <><div className="spinner-sm" />Generating…</> : <><FileText size={15} />Generate Report</>}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card-panel" style={{ padding: '18px 22px' }}>
          <div className="filter-grid" style={{ marginBottom: 12 }}>
            <div className="search-wrap">
              <span className="search-icon"><Search size={14} color="#4A5568" /></span>
              <input type="text" placeholder="Search reports…" value={search} onChange={e => setSearch(e.target.value)} className="form-input search-input" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-input">
              <option value="all">All Types</option>
              {reportTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="form-input">
              <option value="all">All Periods</option>
              {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <p style={{ fontSize: 11, color: '#2D3748', fontWeight: 600 }}>{filtered.length} {filtered.length === 1 ? 'report' : 'reports'}</p>
        </div>

        {/* Reports list */}
        {filtered.length === 0 ? (
          <div className="card-panel">
            <div className="empty-state">
              <div className="empty-icon"><FileText size={28} color="#2D3748" /></div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#E2D5B0', marginBottom: 6 }}>No reports found</h3>
              <p style={{ color: '#4A5568', fontSize: 13 }}>Generate your first report above</p>
            </div>
          </div>
        ) : (
          <div className="card-panel">
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 100px 1fr 100px', gap: 16, padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="tbl-hide">
              {['Report', 'Type', 'Period', 'Generated', ''].map((h, i) => (
                <p key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#2D3748', textAlign: i === 4 ? 'right' : 'left' }}>{h}</p>
              ))}
            </div>

            {/* Rows */}
            {filtered.map(r => {
              const info = getTypeInfo(r.type);
              const dot = dotColor[r.type] || '#D4AF37';
              return (
                <div key={r.id} className="report-row">
                  {/* Icon + title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 2, minWidth: 0 }}>
                    <div className="report-icon" style={{ background: `${dot}12`, border: `1px solid ${dot}25` }}>
                      <span style={{ color: dot }}>{info.icon}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#E2D5B0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{r.title}</p>
                      <p style={{ fontSize: 10, color: '#2D3748' }}>#{r.id}</p>
                    </div>
                  </div>

                  {/* Type badge */}
                  <div style={{ width: 120 }} className="tbl-hide">
                    <span className="type-badge" style={{ background: `${dot}12`, color: dot, border: `1px solid ${dot}25` }}>
                      {info.label}
                    </span>
                  </div>

                  {/* Period */}
                  <div style={{ width: 100 }} className="tbl-hide">
                    <p style={{ fontSize: 12, color: '#64748B' }}>{periods.find(p => p.value === r.period)?.label || r.period}</p>
                  </div>

                  {/* Date */}
                  <div style={{ flex: 1 }} className="tbl-hide">
                    <p style={{ fontSize: 12, color: '#4A5568' }}>{formatDate(r.generated_at)}</p>
                  </div>

                  {/* Mobile info below title (visible on small screens) */}
                  <div style={{ display: 'none' }} className="mobile-meta">
                    <span className="type-badge" style={{ background: `${dot}12`, color: dot }}>{info.label}</span>
                    <span style={{ fontSize: 10, color: '#4A5568' }}>{periods.find(p => p.value === r.period)?.label}</span>
                  </div>

                  {/* Download */}
                  <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <button className="dl-btn" onClick={() => downloadReport(r.id)}>
                      <Download size={13} />
                      <span className="tbl-hide" style={{ display: 'inline' }}>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;