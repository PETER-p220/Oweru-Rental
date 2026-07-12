import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, TrendingUp, Users, DollarSign, Eye, Star, Plus, ArrowUpRight, ArrowDownRight, BarChart3, Calendar } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface DashboardStats {
  total_properties: number; active_properties: number; total_bookings: number;
  total_revenue: number; average_rating: number; occupancy_rate: number;
}
interface Property {
  id: number; title: string; type: string; location: string; price: number; status: string; views: number; image?: string;
}
interface Booking {
  id: number; property: Property; customer_name: string; total_amount: number; status: string; created_at: string;
}
interface MonthlyRevenue { month: string; revenue: number; }
interface CommercialUser { name: string; email: string; company_name: string; business_license: string; verified: boolean; }

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [popularProperties, setPopularProperties] = useState<Property[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [user, setUser] = useState<CommercialUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/dashboard/commercial`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats); setRecentBookings(data.recent_bookings);
        setPopularProperties(data.popular_properties); setMonthlyRevenue(data.monthly_revenue); setUser(data.user);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusMap: Record<string, { label: string; dot: string; text: string }> = {
    active:    { label: 'Active',    dot: '#10B981', text: '#10B981' },
    pending:   { label: 'Pending',   dot: '#F59E0B', text: '#F59E0B' },
    confirmed: { label: 'Confirmed', dot: '#3B82F6', text: '#3B82F6' },
    inactive:  { label: 'Inactive',  dot: '#64748B', text: '#64748B' },
  };

  const statCards = [
    { title: 'Total Properties', value: stats?.total_properties ?? 0, icon: Building2,  change: 12, up: true,  fmt: (v: number) => v.toString() },
    { title: 'Active Listings',  value: stats?.active_properties ?? 0, icon: TrendingUp, change: 8,  up: true,  fmt: (v: number) => v.toString() },
    { title: 'Total Bookings',   value: stats?.total_bookings ?? 0,    icon: Users,      change: 15, up: true,  fmt: (v: number) => v.toString() },
    { title: 'Total Revenue',    value: stats?.total_revenue ?? 0,     icon: DollarSign, change: 23, up: true,  fmt: fmt },
    { title: 'Average Rating',   value: stats?.average_rating ?? 0,    icon: Star,       change: 5,  up: true,  fmt: (v: number) => `${v.toFixed(1)} ★` },
    { title: 'Occupancy Rate',   value: stats?.occupancy_rate ?? 0,    icon: Eye,        change: 3,  up: false, fmt: (v: number) => `${v}%` },
  ];

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: '#64748B', fontSize: 13, marginTop: 12, fontFamily: "'DM Sans', sans-serif" }}>Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080E1A', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .spinner { width: 36px; height: 36px; border: 2px solid rgba(212,175,55,0.15); border-top-color: #D4AF37; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .stat-card { background: linear-gradient(145deg, #0F1829 0%, #0C1420 100%); border: 1px solid rgba(212,175,55,0.08); border-radius: 20px; padding: 24px; transition: all 0.3s ease; position: relative; overflow: hidden; cursor: default; }
        .stat-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(212,175,55,0.03) 0%, transparent 60%); opacity: 0; transition: opacity 0.3s; }
        .stat-card:hover { border-color: rgba(212,175,55,0.25); transform: translateY(-2px); box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,175,55,0.08); }
        .stat-card:hover::before { opacity: 1; }
        .stat-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.12); display: flex; align-items: center; justify-content: center; color: #D4AF37; flex-shrink: 0; }
        .booking-row { display: flex; align-items: center; gap: 14px; padding: 14px 20px; transition: background 0.2s; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .booking-row:last-child { border-bottom: none; }
        .booking-row:hover { background: rgba(212,175,55,0.03); }
        .bar-group { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; height: 100%; justify-content: flex-end; position: relative; }
        .bar-track { width: 100%; flex: 1; display: flex; align-items: flex-end; min-height: 0; }
        .bar-fill { width: 100%; border-radius: 6px 6px 0 0; background: linear-gradient(to top, rgba(212,175,55,0.8), rgba(212,175,55,0.3)); border-top: 2px solid rgba(212,175,55,0.9); transition: opacity 0.2s; cursor: pointer; position: relative; }
        .bar-fill:hover { opacity: 0.85; }
        .bar-tip { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: #0F1829; border: 1px solid rgba(212,175,55,0.3); border-radius: 8px; padding: 5px 10px; font-size: 11px; color: #D4AF37; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s; z-index: 10; }
        .bar-fill:hover .bar-tip { opacity: 1; }
        .card-panel { background: #0F1829; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; }
        .panel-header { padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: space-between; }
        .gold-dot { width: 7px; height: 7px; border-radius: 50%; background: #D4AF37; margin-right: 10px; flex-shrink: 0; box-shadow: 0 0 8px rgba(212,175,55,0.5); }
        .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; }
        .empty-state { padding: 56px 20px; text-align: center; }
        .empty-icon { width: 56px; height: 56px; background: rgba(255,255,255,0.03); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .add-btn { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: #080E1A; padding: 12px 22px; border-radius: 14px; font-weight: 700; font-size: 13px; text-decoration: none; transition: all 0.2s; box-shadow: 0 8px 24px rgba(212,175,55,0.25); border: none; cursor: pointer; letter-spacing: 0.3px; }
        .add-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(212,175,55,0.35); }
        .verified-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); border-radius: 20px; color: #10B981; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
        @media (max-width: 640px) {
          .stat-card { padding: 18px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .booking-row { padding: 12px 16px; gap: 10px; }
          .panel-header { padding: 14px 18px; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 20px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase' }}>Commercial Portal</span>
            </div>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 700, color: '#F1EDD8', fontFamily: "'Playfair Display', serif", lineHeight: 1.1, marginBottom: 8 }}>
              Good Morning, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: '#4A5568', fontSize: 13 }}>{user?.company_name || 'Your Dashboard'}</span>
              {user?.verified && <span className="verified-badge">✓ Verified Business</span>}
            </div>
          </div>
          <Link to="/dashboard/commercial/properties/add" className="add-btn">
            <Plus size={15} />Add Property
          </Link>
        </div>

        {/* ── Stats Grid ── */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {statCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="stat-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div className="stat-icon"><Icon size={18} /></div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: c.up ? '#10B981' : '#EF4444' }}>
                    {c.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{c.change}%
                  </span>
                </div>
                <div style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 700, color: '#F1EDD8', marginBottom: 4, letterSpacing: '-0.5px' }}>
                  {c.fmt(c.value as number)}
                </div>
                <div style={{ fontSize: 12, color: '#4A5568', fontWeight: 500 }}>{c.title}</div>
              </div>
            );
          })}
        </div>

        {/* ── Two Column ── */}
        <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Recent Bookings */}
          <div className="card-panel">
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="gold-dot" />
                <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Recent Bookings</span>
              </div>
              <span style={{ color: '#2D3748', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{recentBookings.length} total</span>
            </div>
            {recentBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Calendar size={22} color="#2D3748" /></div>
                <p style={{ color: '#2D3748', fontSize: 13 }}>No recent bookings yet</p>
              </div>
            ) : recentBookings.map(b => {
              const s = statusMap[b.status] || statusMap.inactive;
              return (
                <div key={b.id} className="booking-row">
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={15} color="#D4AF37" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#E2D5B0', fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.property.title}</p>
                    <p style={{ color: '#4A5568', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.customer_name} · {fmtDate(b.created_at)}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#D4AF37', fontSize: 13, fontWeight: 700 }}>{fmt(b.total_amount)}</p>
                    <span className="status-pill" style={{ background: `${s.dot}15`, color: s.text }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Popular Properties */}
          <div className="card-panel">
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="gold-dot" />
                <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Top Properties</span>
              </div>
              <span style={{ color: '#2D3748', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{popularProperties.length} listed</span>
            </div>
            {popularProperties.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Building2 size={22} color="#2D3748" /></div>
                <p style={{ color: '#2D3748', fontSize: 13 }}>No properties listed yet</p>
              </div>
            ) : popularProperties.map((p, idx) => (
              <div key={p.id} className="booking-row">
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#0C1420', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {p.image
                    ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 11, fontWeight: 800, color: '#D4AF37' }}>#{idx + 1}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#E2D5B0', fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                  <p style={{ color: '#4A5568', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.location}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ color: '#D4AF37', fontSize: 13, fontWeight: 700 }}>{fmt(p.price)}</p>
                  <p style={{ color: '#4A5568', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 2 }}>
                    <Eye size={10} />{p.views}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Revenue Chart ── */}
        <div className="card-panel">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="gold-dot" />
              <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Monthly Revenue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4A5568', fontSize: 11 }}>
              <BarChart3 size={13} />
              <span style={{ fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{monthlyRevenue.length} months</span>
            </div>
          </div>
          <div style={{ padding: '24px 22px' }}>
            {monthlyRevenue.length === 0 ? (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#2D3748', fontSize: 13 }}>No revenue data available</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200, marginBottom: 8 }}>
                  {monthlyRevenue.map((m, i) => {
                    const pct = Math.max((m.revenue / maxRevenue) * 100, 4);
                    return (
                      <div key={i} className="bar-group">
                        <div className="bar-track">
                          <div className="bar-fill" style={{ height: `${pct}%` }}>
                            <div className="bar-tip">{fmt(m.revenue)}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 9, color: '#4A5568', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{m.month}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#4A5568', fontSize: 11 }}>Total: <span style={{ color: '#D4AF37', fontWeight: 600 }}>{fmt(monthlyRevenue.reduce((s, m) => s + m.revenue, 0))}</span></span>
                  <span style={{ color: '#4A5568', fontSize: 11 }}>Peak: <span style={{ color: '#D4AF37', fontWeight: 600 }}>{fmt(maxRevenue)}</span></span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;