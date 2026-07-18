import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Eye, DollarSign, Users, Activity, BarChart3, PieChart, Calendar, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { 
    style: 'currency', 
    currency: 'TZS', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(n);

  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  const metrics = [
    { label: 'Total Revenue', value: fmt(data?.total_revenue || 0), icon: <DollarSign size={20} />, change: 23.5, up: true, color: '#10B981' },
    { label: 'Applications', value: String(data?.total_bookings || 0), icon: <Users size={20} />, change: 15.2, up: true, color: '#3B82F6' },
    { label: 'Occupancy Rate', value: fmtPct(data?.occupancy_rate || 0), icon: <Activity size={20} />, change: 5.8, up: true, color: '#8B5CF6' },
    { label: 'Payments', value: String((data as any)?.total_payments || 0), icon: <TrendingUp size={20} />, change: 2.1, up: true, color: '#F59E0B' },
  ];

  const maxRev = Math.max(...(data?.monthly_revenue?.map(m => m.revenue) || [1]), 1);
  const maxBook = Math.max(...(data?.booking_trends?.map(t => t.bookings) || [1]), 1);
  const bestMonth = data?.booking_trends?.reduce((mx, t) => t.bookings > mx.bookings ? t : mx, { month: '—', bookings: 0 });
  const avgBookingValue = (data?.total_revenue || 0) / Math.max(data?.total_bookings || 1, 1);

  if (loading) {
    return (
      <div className="cd-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748B' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .cd-page { background: #F1F5F9; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .cd-header { background: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 32px 40px; }
        .cd-wrap { max-width: 1280px; margin: 0 auto; padding: 32px 40px 80px; }
        
        .cd-stat-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s;
        }
        .cd-stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(15,23,42,0.08); }
        
        .cd-card { 
          background: #FFFFFF; 
          border: 1px solid #E2E8F0; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 1px 3px rgba(15,23,42,0.04); 
        }
        
        .cd-bar-fill-gold { background: linear-gradient(to top, #3B82F6, #93C5FD); }
        .cd-bar-fill-blue { background: linear-gradient(to top, #10B981, #6EE7B7); }
        
        .cd-row {
          padding: 18px 24px;
          border-bottom: 1px solid #F1F5F9;
          transition: background 0.2s;
        }
        .cd-row:hover { background: #F8FAFC; }
      `}</style>

      {/* Header */}
      <div className="cd-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#64748B', textTransform: 'uppercase' }}>
              BUSINESS INTELLIGENCE
            </div>
            <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 28px)', fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0' }}>
              Analytics Dashboard
            </h1>
            <p style={{ color: '#64748B' }}>Track performance and make data-driven decisions</p>
          </div>

          <select 
            value={timeRange} 
            onChange={e => setTimeRange(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #CBD5E1', background: 'white' }}
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="cd-wrap">
        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
          {metrics.map((m, i) => (
            <div key={i} className="cd-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, background: '#EFF6FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.icon}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: m.up ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 600 }}>
                  {m.up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {Math.abs(m.change)}%
                </div>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: '20px 0 4px' }}>{m.value}</p>
              <p style={{ color: '#64748B', fontWeight: 500 }}>{m.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>

          {/* Revenue Trend */}
          <div className="cd-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BarChart3 size={20} style={{ color: '#3B82F6' }} />
                <span style={{ fontWeight: 700, color: '#0F172A' }}>Revenue Trend</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                {fmt(data?.monthly_revenue?.reduce((sum, m) => sum + m.revenue, 0) || 0)}
              </span>
            </div>
            <div style={{ padding: '28px 24px' }}>
              <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                {(data?.monthly_revenue || []).map((m, i) => {
                  const height = Math.max((m.revenue / maxRev) * 100, 8);
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: '100%', height: `${height}%`, background: 'linear-gradient(#3B82F6, #93C5FD)', borderRadius: '6px 6px 0 0', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', background: '#1E2937', color: 'white', padding: '4px 8px', borderRadius: 6, fontSize: 11, whiteSpace: 'nowrap' }}>
                          {fmt(m.revenue)}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Properties */}
          <div className="cd-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PieChart size={20} style={{ color: '#3B82F6' }} />
                <span style={{ fontWeight: 700, color: '#0F172A' }}>Top Performing Properties</span>
              </div>
            </div>
            <div>
              {(data?.property_performance?.slice(0, 5) || []).map((p, idx) => (
                <div key={p.id} className="cd-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                    <div style={{ width: 36, height: 36, background: '#EFF6FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', fontWeight: 700, fontSize: 13 }}>
                      #{idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: '#0F172A' }}>{p.title}</p>
                      <p style={{ color: '#64748B', fontSize: 13 }}>{p.views} views • {p.bookings} applications</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>{fmt(p.revenue)}</p>
                    <p style={{ color: '#10B981', fontSize: 12, marginTop: 4 }}>{p.rating} ★</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Trends */}
        <div className="cd-card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Calendar size={20} style={{ color: '#3B82F6' }} />
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Application Trends</span>
            </div>
          </div>
          <div style={{ padding: '28px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {/* Bookings Bar Chart */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 16 }}>Monthly Applications</p>
                <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                  {(data?.booking_trends || []).map((t, i) => {
                    const height = Math.max((t.bookings / maxBook) * 100, 8);
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: '100%', height: `${height}%`, background: 'linear-gradient(#10B981, #6EE7B7)', borderRadius: '6px 6px 0 0', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', background: '#1E2937', color: 'white', padding: '4px 8px', borderRadius: 6, fontSize: 11 }}>
                            {t.bookings}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{t.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Insights */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 16 }}>Key Insights</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ padding: 20, background: '#F0F9FF', borderRadius: 12, border: '1px solid #BFDBFE' }}>
                    <p style={{ fontWeight: 600, color: '#0F172A' }}>Peak Month</p>
                    <p style={{ color: '#1E40AF', fontSize: 22, fontWeight: 700, marginTop: 4 }}>{bestMonth?.month}</p>
                  </div>
                  <div style={{ padding: 20, background: '#F0FDF4', borderRadius: 12, border: '1px solid #A1E2C8' }}>
                    <p style={{ fontWeight: 600, color: '#0F172A' }}>Average Booking Value</p>
                    <p style={{ color: '#166534', fontSize: 22, fontWeight: 700, marginTop: 4 }}>{fmt(avgBookingValue)}</p>
                  </div>
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