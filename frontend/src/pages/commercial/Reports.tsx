import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, DollarSign, Users, Eye, TrendingUp, Zap } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Report {
  id: number; title: string; type: string; period: string; generated_at: string; file_url?: string; data?: any;
}
interface Property { id: number; title: string; type: string; location: string; status: string; }

const reportTypes = [
  { value: 'revenue', label: 'Revenue', icon: <DollarSign size={18} />, color: '#10B981' },
  { value: 'bookings', label: 'Bookings', icon: <Users size={18} />, color: '#3B82F6' },
  { value: 'performance', label: 'Performance', icon: <TrendingUp size={18} />, color: '#8B5CF6' },
  { value: 'analytics', label: 'Analytics', icon: <Eye size={18} />, color: '#F59E0B' },
];

const periods = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
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
      if (res.ok) { 
        const d = await res.json(); 
        setProperties(Array.isArray(d.data) ? d.data : []); 
      }
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
    } finally { 
      setGenerating(false); 
    }
  };

  const downloadReport = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/reports/${id}/download`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; 
        a.download = `report-${id}.pdf`;
        document.body.appendChild(a); 
        a.click();
        window.URL.revokeObjectURL(url); 
        document.body.removeChild(a);
      }
    } catch (e) { console.error(e); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { 
    style: 'currency', 
    currency: 'TZS', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(n || 0);

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-TZ', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const filtered = reports.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchPeriod = periodFilter === 'all' || r.period === periodFilter;
    return matchSearch && matchType && matchPeriod;
  });

  return (
    <div className="cd-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .cd-page { background: #F1F5F9; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .cd-header { background: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 32px 40px; }
        .cd-wrap { max-width: 1280px; margin: 0 auto; padding: 32px 40px 80px; }
        
        .cd-card { 
          background: #FFFFFF; 
          border: 1px solid #E2E8F0; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 1px 3px rgba(15,23,42,0.04); 
        }
        
        .cd-quick-btn {
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 10px;
          padding: 20px 12px; 
          background: white; 
          border: 1px solid #E2E8F0; 
          border-radius: 12px;
          cursor: pointer; 
          transition: all 0.2s; 
        }
        .cd-quick-btn:hover { border-color: #3B82F6; transform: translateY(-2px); }
        
        .cd-row {
          padding: 18px 24px;
          border-bottom: 1px solid #F1F5F9;
          transition: background 0.2s;
        }
        .cd-row:hover { background: #F8FAFC; }
        .cd-row:last-child { border-bottom: none; }
      `}</style>

      {/* Header */}
      <div className="cd-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#64748B', textTransform: 'uppercase' }}>
              BUSINESS INTELLIGENCE
            </div>
            <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 28px)', fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0' }}>
              Reports &amp; Analytics
            </h1>
            <p style={{ color: '#64748B' }}>Live insights and downloadable performance reports</p>
          </div>
        </div>
      </div>

      <div className="cd-wrap">
        {/* Live Summary */}
        {liveSummary && (
          <div className="cd-card" style={{ padding: 24, marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 16 }}>
              {liveSummary.period_label || 'This Month'} Snapshot
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {[
                { label: 'Revenue', value: fmt(liveSummary.revenue) },
                { label: 'Payments', value: liveSummary.payments_count ?? 0 },
                { label: 'Applications', value: liveSummary.applications_count ?? 0 },
                { label: 'Approved', value: liveSummary.approved_applications ?? 0 },
              ].map((s, i) => (
                <div key={i} style={{ padding: 16, background: '#F8FAFC', borderRadius: 12 }}>
                  <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{s.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 6 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Generate */}
        <div className="cd-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Zap size={20} style={{ color: '#3B82F6' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Quick Generate</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {reportTypes.map(rt => (
              <button 
                key={rt.value} 
                className="cd-quick-btn"
                onClick={() => generateReport(rt.value, 'monthly')}
                disabled={generating}
              >
                <div style={{ width: 48, height: 48, background: `${rt.color}15`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: rt.color }}>{rt.icon}</span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#0F172A' }}>{rt.label}</p>
                  <p style={{ fontSize: 12, color: '#64748B' }}>Monthly</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Report Generator */}
        <div className="cd-card" style={{ padding: 24, marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Custom Report</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <select value={selType} onChange={e => setSelType(e.target.value)} style={{ padding: '12px', borderRadius: 10, border: '1px solid #CBD5E1' }}>
              <option value="">Select Report Type</option>
              {reportTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            <select value={selPeriod} onChange={e => setSelPeriod(e.target.value)} style={{ padding: '12px', borderRadius: 10, border: '1px solid #CBD5E1' }}>
              <option value="">Select Period</option>
              {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>

            <select value={selProperty} onChange={e => setSelProperty(e.target.value)} style={{ padding: '12px', borderRadius: 10, border: '1px solid #CBD5E1' }}>
              <option value="">All Properties</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>

          <button 
            className="cd-btn" 
            style={{ background: '#0F172A', color: 'white', padding: '12px 24px' }}
            onClick={() => generateReport(selType, selPeriod, selProperty ? Number(selProperty) : undefined)}
            disabled={!selType || !selPeriod || generating}
          >
            {generating ? 'Generating...' : 'Generate Custom Report'}
          </button>
        </div>

        {/* Filters & List */}
        <div className="cd-card">
          {/* Filters */}
          <div style={{ padding: 20, borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: 13, color: '#94A3B8' }} />
                <input 
                  type="text" 
                  placeholder="Search reports..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  style={{ paddingLeft: 44, width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid #CBD5E1' }}
                />
              </div>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '11px', borderRadius: 10, border: '1px solid #CBD5E1' }}>
                <option value="all">All Types</option>
                {reportTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} style={{ padding: '11px', borderRadius: 10, border: '1px solid #CBD5E1' }}>
                <option value="all">All Periods</option>
                {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Reports List */}
          {filtered.length === 0 ? (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <FileText size={48} style={{ color: '#CBD5E1', marginBottom: 16 }} />
              <h3 style={{ color: '#0F172A' }}>No reports found</h3>
              <p style={{ color: '#64748B' }}>Try adjusting your filters or generate a new report</p>
            </div>
          ) : (
            filtered.map(r => {
              const info = getTypeInfo(r.type);
              return (
                <div key={r.id} className="cd-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                    <div style={{ width: 44, height: 44, background: `${info.color}15`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: info.color }}>{info.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: '#0F172A' }}>{r.title}</p>
                      <p style={{ fontSize: 13, color: '#64748B' }}>{info.label} • {r.period}</p>
                    </div>
                  </div>

                  <div style={{ color: '#64748B', fontSize: 13, textAlign: 'right' }}>
                    {formatDate(r.generated_at)}
                  </div>

                  <button 
                    onClick={() => downloadReport(r.id)}
                    className="cd-btn"
                    style={{ marginLeft: 16, border: '1px solid #CBD5E1', color: '#475569' }}
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;