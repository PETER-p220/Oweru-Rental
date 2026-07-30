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
  id: number; property?: Property; property_title?: string; customer_name?: string; tenant_name?: string; total_amount: number; status: string; created_at?: string; paid_at?: string;
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
      const response = await fetch(`${API_BASE}/api/commercial/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentBookings(data.recent_payments || data.recent_bookings || []);
        setPopularProperties(data.popular_properties || []);
        setMonthlyRevenue(data.monthly_revenue || []);
        setUser(data.user);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' });

  // Same semantic status colors used across the tenant dashboard's contract badges
  const statusMap: Record<string, { label: string; cls: string }> = {
    active:    { label: 'Active',    cls: 'active' },
    pending:   { label: 'Pending',   cls: 'pending' },
    confirmed: { label: 'Confirmed', cls: 'signed' },
    paid:      { label: 'Paid',      cls: 'active' },
    completed: { label: 'Paid',      cls: 'active' },
    inactive:  { label: 'Inactive',  cls: 'unknown' },
  };

  // Each stat gets its own tone, mirroring the tenant dashboard's color-coded stat cards
  const statCards: { title: string; value: number; icon: any; change: number; up: boolean; tone: string; fmt: (v: number) => string }[] = [
    { title: 'Total Properties', value: stats?.total_properties ?? 0, icon: Building2,  change: 12, up: true,  tone: 'blue',    fmt: (v) => v.toString() },
    { title: 'Active Listings',  value: stats?.active_properties ?? 0, icon: TrendingUp, change: 8,  up: true,  tone: 'emerald', fmt: (v) => v.toString() },
    { title: 'Approved Apps',    value: stats?.total_bookings ?? 0,    icon: Users,      change: 15, up: true,  tone: 'violet',  fmt: (v) => v.toString() },
    { title: 'Total Revenue',    value: stats?.total_revenue ?? 0,     icon: DollarSign, change: 23, up: true,  tone: 'amber',   fmt: fmt },
    { title: 'Payments',         value: (stats as any)?.total_payments ?? 0, icon: Star, change: 5,  up: true,  tone: 'rose',    fmt: (v) => v.toString() },
    { title: 'Occupancy Rate',   value: stats?.occupancy_rate ?? 0,    icon: Eye,        change: 3,  up: false, tone: 'cyan',    fmt: (v) => `${v}%` },
  ];

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  return (
    <div className="cd-page"> 
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .cd-page { background: #F1F5F9; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .cd-header { background: #FFFFFF; border-bottom: 1px solid #E2E8F0; }
        .cd-header-inner { max-width: 1280px; margin: 0 auto; padding: 40px 40px 32px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
        .cd-eyebrow-badge { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #475569; margin-bottom: 12px; display: inline-flex; align-items: center; gap: 8px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 5px 12px; border-radius: 20px; }
        .cd-heading { font-size: clamp(22px, 3.4vw, 30px); font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; color: #0F172A; margin: 0; }
        .cd-tagline { font-size: 14px; font-weight: 400; color: #64748B; margin: 8px 0 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .cd-wrap { max-width: 1280px; margin: 0 auto; padding: 32px 40px 56px; }
        .cd-section-label { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #64748B; margin: 0 0 16px; display: flex; align-items: center; gap: 10px; }
        .cd-section-label::after { content: ''; flex: 1; height: 1px; background: #E2E8F0; }
        .cd-section { margin-bottom: 28px; }

        .cd-add-btn { display: inline-flex; align-items: center; gap: 8px; background: #0F172A; border: 1px solid #0F172A; color: #FFFFFF; padding: 12px 20px; border-radius: 12px; font-weight: 700; font-size: 13.5px; text-decoration: none; transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .cd-add-btn:hover { transform: translateY(-2px); background: #1E293B; box-shadow: 0 10px 24px rgba(15,23,42,0.18); }
        .verified-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; background: #ECFDF5; border: 1px solid #BBF7D0; border-radius: 20px; color: #166534; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; }

        /* ── Smart stat cards — compact, professional: tone bar + icon chip ── */
        .cd-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
        .cd-stat { position: relative; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 13px 14px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; overflow: hidden; min-width: 0; }
        .cd-stat::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 3px; background: var(--tone-solid); }
        .cd-stat:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(15,23,42,0.08); border-color: #CBD5E1; }
        .cd-stat-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; gap: 6px; }
        .cd-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--tone-bg); color: var(--tone-solid); flex-shrink: 0; }
        .cd-stat-trend { display: flex; align-items: center; gap: 2px; font-size: 10px; font-weight: 700; flex-shrink: 0; white-space: nowrap; }
        .cd-stat-trend.up { color: #059669; }
        .cd-stat-trend.down { color: #E11D48; }
        .cd-stat-value { font-size: clamp(15px, 1.6vw, 19px); font-weight: 800; color: #0F172A; margin-bottom: 2px; letter-spacing: -0.02em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cd-stat-label { font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .tone-blue { --tone-bg: #EFF6FF; --tone-solid: #2563EB; }
        .tone-rose { --tone-bg: #FFF1F2; --tone-solid: #E11D48; }
        .tone-amber { --tone-bg: #FFFBEB; --tone-solid: #D97706; }
        .tone-emerald { --tone-bg: #ECFDF5; --tone-solid: #059669; }
        .tone-violet { --tone-bg: #F5F3FF; --tone-solid: #7C3AED; }
        .tone-cyan { --tone-bg: #ECFEFF; --tone-solid: #0891B2; }

        /* ── Panels (recent payments / top properties / revenue) ── */
        .cd-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cd-panel { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .cd-panel-header { padding: 16px 20px; border-bottom: 1px solid #F1F5F9; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .cd-panel-title { display: flex; align-items: center; gap: 8px; color: #0F172A; font-weight: 700; font-size: 14px; }
        .cd-panel-count { color: #94A3B8; font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .cd-dot { width: 7px; height: 7px; border-radius: 50%; background: #0F172A; flex-shrink: 0; }

        .cd-row { display: flex; align-items: center; gap: 14px; padding: 13px 20px; transition: background 0.15s; border-bottom: 1px solid #F8FAFC; }
        .cd-row:last-child { border-bottom: none; }
        .cd-row:hover { background: #F8FAFC; }
        .cd-row-avatar { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; background: #EFF6FF; color: #2563EB; }
        .cd-row-title { color: #0F172A; font-size: 13.5px; font-weight: 700; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cd-row-meta { color: #64748B; font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cd-row-amount { color: #0F172A; font-size: 13.5px; font-weight: 700; }
        .cd-row-views { color: #94A3B8; font-size: 10.5px; display: flex; align-items: center; justify-content: flex-end; gap: 3px; margin-top: 2px; }

        /* Status pill, same visual language as tenant contract status badges */
        .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        .status-pill.pending { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
        .status-pill.active { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
        .status-pill.signed { background: #DBEAFE; color: #1D4ED8; border: 1px solid #BFDBFE; }
        .status-pill.unknown { background: #F1F5F9; color: #64748B; border: 1px solid #E2E8F0; }

        .cd-empty { padding: 44px 20px; text-align: center; }
        .cd-empty-icon { width: 52px; height: 52px; background: #F1F5F9; border: 1px dashed #CBD5E1; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; color: #94A3B8; }
        .cd-empty p { color: #94A3B8; font-size: 13px; }

        /* Revenue bars */
        .cd-bar-group { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; height: 100%; justify-content: flex-end; position: relative; }
        .cd-bar-track { width: 100%; flex: 1; display: flex; align-items: flex-end; min-height: 0; }
        .cd-bar-fill { width: 100%; border-radius: 6px 6px 0 0; background: linear-gradient(to top, #0F172A, #334155); transition: opacity 0.2s; cursor: pointer; position: relative; }
        .cd-bar-fill:hover { opacity: 0.82; }
        .cd-bar-tip { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: #0F172A; color: #FFFFFF; border-radius: 8px; padding: 5px 10px; font-size: 11px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s; z-index: 10; }
        .cd-bar-fill:hover .cd-bar-tip { opacity: 1; }
        .cd-bar-month { font-size: 9.5px; color: #94A3B8; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        .cd-revenue-summary { border-top: 1px solid #F1F5F9; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 11.5px; color: #64748B; }
        .cd-revenue-summary b { color: #0F172A; font-weight: 700; }

        /* ── Skeleton loading, same recipe as the tenant dashboard ── */
        .cd-skel-shimmer { background: linear-gradient(90deg, #E2E8F0 25%, #EDF1F5 37%, #E2E8F0 63%); background-size: 400% 100%; animation: cd-shimmer 1.4s ease infinite; border-radius: 10px; }
        @keyframes cd-shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
        .cd-skel-stat { height: 78px; border-radius: 12px; }
        .cd-skel-panel { height: 260px; border-radius: 16px; }

        @media (max-width: 1200px) {
          .cd-stats { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 1024px) {
          .cd-header-inner { padding: 32px 28px 26px; }
          .cd-wrap { padding: 26px 28px 44px; }
          .cd-stats { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 680px) {
          .cd-header-inner { padding: 24px 18px 20px; }
          .cd-wrap { padding: 20px 16px 40px; }
          .cd-section { margin-bottom: 22px; }
          .cd-heading { font-size: 22px; }

          .cd-stats { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .cd-stat { padding: 11px 12px; border-radius: 11px; }
          .cd-stat-top { margin-bottom: 8px; }
          .cd-stat-icon { width: 24px; height: 24px; border-radius: 7px; }
          .cd-stat-value { font-size: 16px; }
          .cd-stat-label { font-size: 9.5px; }
          .cd-skel-stat { height: 70px; }

          .cd-two-col { grid-template-columns: 1fr; }
          .cd-row { padding: 12px 16px; gap: 10px; }
          .cd-panel-header { padding: 14px 16px; }
        }

        @media (max-width: 380px) {
          .cd-stats { grid-template-columns: 1fr 1fr; gap: 7px; }
          .cd-stat { padding: 10px 11px; }
          .cd-stat-value { font-size: 15px; }
        }
      `}</style>

      <div className="cd-header">
        <div className="cd-header-inner">
          <div>
            <div className="cd-eyebrow-badge">Commercial Portal</div>
            <h1 className="cd-heading">Good Morning, {user?.name?.split(' ')[0] || 'User'}</h1>
            <div className="cd-tagline">
              <span>{user?.company_name || 'Your Dashboard'}</span>
              {user?.verified && <span className="verified-badge">✓ Verified Business</span>}
            </div>
          </div>
          <Link to="/dashboard/commercial/properties/add" className="cd-add-btn">
            <Plus size={15} />Add Property
          </Link>
        </div>
      </div>

      <div className="cd-wrap">
        {/* Stats */}
        <div className="cd-section">
          {loading ? (
            <div className="cd-stats">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="cd-skel-shimmer cd-skel-stat" />
              ))}
            </div>
          ) : (
            <div className="cd-stats">
              {statCards.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={i} className={`cd-stat tone-${c.tone}`}>
                    <div className="cd-stat-top">
                      <div className="cd-stat-icon"><Icon size={14} /></div>
                      <span className={`cd-stat-trend ${c.up ? 'up' : 'down'}`}>
                        {c.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{c.change}%
                      </span>
                    </div>
                    <div className="cd-stat-value">{c.fmt(c.value as number)}</div>
                    <div className="cd-stat-label">{c.title}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Two column */}
        <div className="cd-section">
          <div className="cd-two-col">
            {/* Recent Payments */}
            {loading ? (
              <div className="cd-skel-shimmer cd-skel-panel" />
            ) : (
              <div className="cd-panel">
                <div className="cd-panel-header">
                  <div className="cd-panel-title"><span className="cd-dot" />Recent Payments</div>
                  <span className="cd-panel-count">{recentBookings.length} total</span>
                </div>
                {recentBookings.length === 0 ? (
                  <div className="cd-empty">
                    <div className="cd-empty-icon"><Calendar size={20} /></div>
                    <p>No payments recorded yet</p>
                  </div>
                ) : recentBookings.map(b => {
                  const s = statusMap[b.status] || statusMap.inactive;
                  return (
                    <div key={b.id} className="cd-row">
                      <div className="cd-row-avatar"><Building2 size={15} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="cd-row-title">{b.property?.title || (b as any).property_title || 'Property'}</p>
                        <p className="cd-row-meta">{b.customer_name || (b as any).tenant_name} · {fmtDate(b.created_at || (b as any).paid_at)}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p className="cd-row-amount">{fmt(b.total_amount)}</p>
                        <span className={`status-pill ${s.cls}`}>{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Top Properties */}
            {loading ? (
              <div className="cd-skel-shimmer cd-skel-panel" />
            ) : (
              <div className="cd-panel">
                <div className="cd-panel-header">
                  <div className="cd-panel-title"><span className="cd-dot" />Top Properties</div>
                  <span className="cd-panel-count">{popularProperties.length} listed</span>
                </div>
                {popularProperties.length === 0 ? (
                  <div className="cd-empty">
                    <div className="cd-empty-icon"><Building2 size={20} /></div>
                    <p>No properties listed yet</p>
                  </div>
                ) : popularProperties.map((p, idx) => (
                  <div key={p.id} className="cd-row">
                    <div className="cd-row-avatar" style={{ background: p.image ? 'transparent' : '#F1F5F9', color: '#2563EB' }}>
                      {p.image
                        ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 11, fontWeight: 800 }}>#{idx + 1}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="cd-row-title">{p.title}</p>
                      <p className="cd-row-meta">{p.location}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p className="cd-row-amount">{fmt(p.price)}</p>
                      <p className="cd-row-views"><Eye size={10} />{p.views}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Revenue */}
        <div className="cd-section" style={{ marginBottom: 0 }}>
          {loading ? (
            <div className="cd-skel-shimmer cd-skel-panel" />
          ) : (
            <div className="cd-panel">
              <div className="cd-panel-header">
                <div className="cd-panel-title"><span className="cd-dot" />Monthly Revenue</div>
                <div className="cd-panel-count" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BarChart3 size={13} />{monthlyRevenue.length} months
                </div>
              </div>
              <div style={{ padding: '22px 20px' }}>
                {monthlyRevenue.length === 0 ? (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#94A3B8', fontSize: 13 }}>No revenue data available</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200, marginBottom: 8 }}>
                      {monthlyRevenue.map((m, i) => {
                        const pct = Math.max((m.revenue / maxRevenue) * 100, 4);
                        return (
                          <div key={i} className="cd-bar-group">
                            <div className="cd-bar-track">
                              <div className="cd-bar-fill" style={{ height: `${pct}%` }}>
                                <div className="cd-bar-tip">{fmt(m.revenue)}</div>
                              </div>
                            </div>
                            <span className="cd-bar-month">{m.month}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="cd-revenue-summary">
                      <span>Total: <b>{fmt(monthlyRevenue.reduce((s, m) => s + m.revenue, 0))}</b></span>
                      <span>Peak: <b>{fmt(maxRevenue)}</b></span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;