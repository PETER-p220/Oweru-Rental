import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Eye, DollarSign, Users, Activity, BarChart3, PieChart, Calendar, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface AnalyticsData {
  total_properties: number;
  active_properties: number;
  total_bookings: number;
  total_revenue: number;
  average_rating: number;
  occupancy_rate: number;
  monthly_revenue: Array<{ month: string; revenue: number }>;
  property_performance: Array<{ id: number; title: string; views: number; bookings: number; revenue: number; rating: number }>;
  booking_trends: Array<{ month: string; bookings: number; revenue: number }>;
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => { fetchAnalytics(); }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/analytics?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (response.ok) setData(await response.json());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  const metrics = [
    { label: 'Total Revenue', value: fmt(data?.total_revenue || 0), icon: <DollarSign size={18} />, change: 23.5, up: true },
    { label: 'Total Bookings', value: String(data?.total_bookings || 0), icon: <Users size={18} />, change: 15.2, up: true },
    { label: 'Occupancy Rate', value: fmtPct(data?.occupancy_rate || 0), icon: <Activity size={18} />, change: 5.8, up: true },
    { label: 'Avg. Rating', value: (data?.average_rating || 0).toFixed(1), icon: <TrendingUp size={18} />, change: 2.1, up: true },
  ];

  const maxRev = Math.max(...(data?.monthly_revenue?.map(m => m.revenue) || [1]), 1);
  const maxBook = Math.max(...(data?.booking_trends?.map(t => t.bookings) || [1]), 1);
  const bestMonth = data?.booking_trends?.reduce((mx, t) => t.bookings > mx.bookings ? t : mx, { month: '—', bookings: 0 });
  const avgBookingValue = (data?.total_revenue || 0) / Math.max(data?.total_bookings || 1, 1);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '2px solid rgba(212,175,55,0.15)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#4A5568', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Loading analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080E1A', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .stat-card { background: linear-gradient(145deg, #0F1829 0%, #0C1420 100%); border: 1px solid rgba(212,175,55,0.08); border-radius: 20px; padding: 22px; transition: all 0.3s ease; position: relative; overflow: hidden; cursor: default; }
        .stat-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(212,175,55,0.03) 0%, transparent 60%); opacity: 0; transition: opacity 0.3s; }
        .stat-card:hover { border-color: rgba(212,175,55,0.25); transform: translateY(-2px); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
        .stat-card:hover::before { opacity: 1; }
        .stat-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.12); display: flex; align-items: center; justify-content: center; color: #D4AF37; flex-shrink: 0; }
        .card-panel { background: #0F1829; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; }
        .panel-header { padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: space-between; }
        .gold-dot { width: 7px; height: 7px; border-radius: 50%; background: #D4AF37; box-shadow: 0 0 8px rgba(212,175,55,0.5); flex-shrink: 0; }
        .bar-group { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; height: 100%; justify-content: flex-end; position: relative; }
        .bar-track { width: 100%; flex: 1; display: flex; align-items: flex-end; min-height: 0; }
        .bar-fill { width: 100%; border-radius: 6px 6px 0 0; transition: opacity 0.2s; cursor: pointer; position: relative; }
        .bar-fill-gold { background: linear-gradient(to top, rgba(212,175,55,0.8), rgba(212,175,55,0.3)); border-top: 2px solid rgba(212,175,55,0.9); }
        .bar-fill-blue { background: linear-gradient(to top, rgba(59,130,246,0.6), rgba(59,130,246,0.2)); border-top: 2px solid rgba(59,130,246,0.7); }
        .bar-fill:hover { opacity: 0.8; }
        .bar-tip { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: #0F1829; border: 1px solid rgba(212,175,55,0.3); border-radius: 8px; padding: 5px 10px; font-size: 11px; color: #D4AF37; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s; z-index: 10; }
        .bar-fill:hover .bar-tip { opacity: 1; }
        .perf-row { display: flex; align-items: center; gap: 14px; padding: 14px 22px; transition: background 0.2s; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .perf-row:last-child { border-bottom: none; }
        .perf-row:hover { background: rgba(212,175,55,0.03); }
        .insight-card { display: flex; align-items: flex-start; gap: 12px; padding: 14px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.04); }
        .time-select { padding: 10px 16px; background: #0F1829; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: #E2D5B0; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; cursor: pointer; transition: border-color 0.2s; }
        .time-select:focus { border-color: rgba(212,175,55,0.4); }
        @media (max-width: 640px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .charts-row { grid-template-columns: 1fr !important; }
          .insights-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Insights</span>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, color: '#F1EDD8', fontFamily: "'Playfair Display', serif", lineHeight: 1.1, marginBottom: 4 }}>Analytics</h1>
            <p style={{ color: '#4A5568', fontSize: 13 }}>Track your commercial property performance</p>
          </div>
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="time-select">
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {metrics.map((m, i) => (
            <div key={i} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                <div className="stat-icon">{m.icon}</div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: m.up ? '#10B981' : '#EF4444' }}>
                  {m.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(m.change)}%
                </span>
              </div>
              <p style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 700, color: '#F1EDD8', marginBottom: 4, letterSpacing: '-0.5px' }}>{m.value}</p>
              <p style={{ fontSize: 12, color: '#4A5568', fontWeight: 500 }}>{m.label}</p>
              <p style={{ fontSize: 10, color: '#2D3748', marginTop: 2 }}>vs last period</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Revenue Trend */}
          <div className="card-panel">
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="gold-dot" />
                <BarChart3 size={14} color="#D4AF37" />
                <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Revenue Trend</span>
              </div>
              <span style={{ color: '#2D3748', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {fmt(data?.monthly_revenue?.reduce((s, m) => s + m.revenue, 0) || 0)}
              </span>
            </div>
            <div style={{ padding: '22px' }}>
              <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                {(data?.monthly_revenue || []).map((m, i) => {
                  const pct = Math.max((m.revenue / maxRev) * 100, 4);
                  return (
                    <div key={i} className="bar-group">
                      <div className="bar-track">
                        <div className="bar-fill bar-fill-gold" style={{ height: `${pct}%` }}>
                          <div className="bar-tip">{fmt(m.revenue)}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 9, color: '#4A5568', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Properties */}
          <div className="card-panel">
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="gold-dot" />
                <PieChart size={14} color="#D4AF37" />
                <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Top Properties</span>
              </div>
              <span style={{ color: '#2D3748', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>by revenue</span>
            </div>
            <div>
              {(data?.property_performance?.slice(0, 5) || []).map((p, i) => (
                <div key={p.id} className="perf-row">
                  <div style={{ width: 36, height: 36, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#D4AF37' }}>#{i + 1}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#E2D5B0', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{p.title}</p>
                    <p style={{ color: '#4A5568', fontSize: 11 }}>{p.views} views</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#D4AF37', fontSize: 13, fontWeight: 700 }}>{fmt(p.revenue)}</p>
                    <p style={{ color: '#4A5568', fontSize: 10, marginTop: 2 }}>{p.bookings} bookings</p>
                  </div>
                </div>
              ))}
              {!data?.property_performance?.length && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <p style={{ color: '#2D3748', fontSize: 13 }}>No data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Trends */}
        <div className="card-panel">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="gold-dot" />
              <Calendar size={14} color="#D4AF37" />
              <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Booking Trends</span>
            </div>
          </div>
          <div style={{ padding: '22px' }}>
            <div className="insights-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

              {/* Bar chart */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#E2D5B0', marginBottom: 16, letterSpacing: '0.5px' }}>Monthly Bookings</p>
                <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  {(data?.booking_trends || []).map((t, i) => {
                    const pct = Math.max((t.bookings / maxBook) * 100, 4);
                    return (
                      <div key={i} className="bar-group">
                        <div className="bar-track">
                          <div className="bar-fill bar-fill-blue" style={{ height: `${pct}%` }}>
                            <div className="bar-tip">{t.bookings}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 9, color: '#4A5568', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{t.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Insights */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#E2D5B0', marginBottom: 16, letterSpacing: '0.5px' }}>Key Insights</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { dot: '#10B981', title: 'Peak Performance', desc: `Best month: ${bestMonth?.month}` },
                    { dot: '#F59E0B', title: 'Growth Opportunity', desc: 'Boost marketing in slower months' },
                    { dot: '#3B82F6', title: 'Avg. Booking Value', desc: fmt(avgBookingValue) },
                  ].map((ins, i) => (
                    <div key={i} className="insight-card">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: ins.dot, marginTop: 4, flexShrink: 0, boxShadow: `0 0 8px ${ins.dot}80` }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#E2D5B0', marginBottom: 3 }}>{ins.title}</p>
                        <p style={{ fontSize: 12, color: '#4A5568' }}>{ins.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;