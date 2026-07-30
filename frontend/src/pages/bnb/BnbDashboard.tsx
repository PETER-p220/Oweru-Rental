import { useState, useEffect } from 'react';
import {
  Home, Calendar, DollarSign, Users, Star, TrendingUp, Bed, Bath, Wifi,
  Car, Dumbbell, Wind, Utensils, Monitor, Tv, Shirt, MapPin,
  Plus, CheckCircle, Clock, XCircle, Award, AlertCircle,
} from 'lucide-react';
import Api from '../../services/api';

function parseGuestFromNotes(notes?: string): { name: string; email: string; phone: string } | null {
  if (!notes) return null;
  const match = notes.match(/by:\s*(.+?)\s*\(([^,]+),\s*([^)]+)\)/);
  if (match) return { name: match[1].trim(), email: match[2].trim(), phone: match[3].trim() };
  const nameMatch = notes.match(/by:\s*(.+)/);
  if (nameMatch) return { name: nameMatch[1].trim(), email: '', phone: '' };
  return null;
}

/* ─── TOKENS ─────────────────────────────────────────── */
/* Same warm-paper / brass identity as the properties page */
const t = {
  gold:     '#8B5E34', // brass accent
  goldLt:   '#7A5230', // deeper brass for text on light tinted chips
  bg:       '#FAF9F6', // page background
  surface:  '#FFFFFF', // card background
  surface2: '#F4F1EA', // inset surface: inputs, modal shells, info tiles
  ink:      '#1C1917', // primary text
  onAccent: '#FFFFFF', // text placed on solid brass/accent backgrounds
  muted:    '#78716C',
  border:   '#E7E2D9',
  green:    '#2F6844',
  red:      '#9F1D1D',
  blue:     '#33448C',
  orange:   '#92400E',
  sky:      '#33448C',
  amber:    '#92400E',
} as const;

const body: React.CSSProperties   = { fontFamily: 'Inter, sans-serif' };
const serif: React.CSSProperties  = { fontFamily: 'serif' };
const card: React.CSSProperties   = { backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(28,25,23,0.04)' };
const btn: React.CSSProperties    = { ...body, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.2s' };

const iconBox = (color: string): React.CSSProperties => ({ background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color, borderRadius: 8 });
const eyebrow: React.CSSProperties = { ...body, fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.gold, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 };

const BnbDashboard = () => {
  const [stats, setStats] = useState({ totalProperties: 0, totalBookings: 0, totalRevenue: 0, occupancyRate: 0, averageRating: 0, activeListings: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [topProperties, setTopProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, bookingsRes, propertiesRes] = await Promise.all([
        Api.getBnbAnalytics(), Api.getBnbBookings(), Api.getBnbProperties(),
      ]);
      const a = analyticsRes.data || {};
      setStats({ totalProperties: a.totalProperties || 0, totalBookings: a.totalBookings || 0, totalRevenue: a.totalRevenue || 0, occupancyRate: a.occupancyRate || 0, averageRating: a.averageRating || 0, activeListings: a.activeListings || 0 });
      setRecentBookings((bookingsRes.data || []).slice(0, 5));
      setTopProperties((propertiesRes.data || []).slice(0, 3));
    } catch (e) { console.error('Failed to load BNB dashboard:', e); }
    finally { setLoading(false); }
  };

  const fmtCurrency = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const fmtCompactCurrency = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) {
      const v = n / 1_000_000;
      const formatted = v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
      return `TZS ${formatted}M`;
    }
    if (abs >= 1_000) {
      const v = n / 1_000;
      const formatted = v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
      return `TZS ${formatted}k`;
    }
    return fmtCurrency(n);
  };
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });
  const statusColor = (s: string) => ({ confirmed: t.green, pending: t.amber, cancelled: t.red, completed: t.sky }[s] ?? t.muted);
  const statusIcon = (s: string) => ({ confirmed: <CheckCircle size={14} />, pending: <Clock size={14} />, cancelled: <XCircle size={14} />, completed: <Award size={14} /> }[s] ?? <AlertCircle size={14} />);
  const amenityIcon = (a: string) => ({ wifi: <Wifi size={13} />, parking: <Car size={13} />, gym: <Dumbbell size={13} />, kitchen: <Utensils size={13} />, workspace: <Monitor size={13} />, tv: <Tv size={13} />, washer: <Shirt size={13} />, ac: <Wind size={13} />, pool: <Home size={13} /> }[a.toLowerCase()] ?? <Star size={13} />);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, backgroundColor: t.bg, minHeight: '100vh' }}>
        <div style={{ width: 36, height: 36, border: `2px solid ${t.border}`, borderTop: `2px solid ${t.gold}`, borderRadius: '50%', animation: 'bnb-spin 0.8s linear infinite' }} />
        <style>{`@keyframes bnb-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ ...body, background: t.bg, color: t.ink, minHeight: '100vh', padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes bnb-spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }

        .bnb-stat-card { transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; }
        .bnb-stat-card:hover { border-color: ${t.gold}55 !important; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(28,25,23,0.08); }
        .bnb-booking-row:hover { background: ${t.surface2} !important; border-color: ${t.gold}40 !important; }
        .bnb-prop-card { transition: border-color 0.2s, box-shadow 0.2s; }
        .bnb-prop-card:hover { border-color: ${t.gold}55 !important; box-shadow: 0 2px 8px rgba(28,25,23,0.06); }

        .bnb-btn-gold { display: inline-flex; align-items: center; gap: 8px; background: ${t.gold}; color: ${t.onAccent}; padding: 10px 16px; font-size: 14px; font-weight: 500; border: none; border-radius: 8px; cursor: pointer; font-family: Inter, sans-serif; transition: all 0.2s; white-space: nowrap; }
        .bnb-btn-gold:hover { background: ${t.goldLt}; }
        .bnb-btn-ghost { display: inline-flex; align-items: center; gap: 8px; background: ${t.gold}18; color: ${t.goldLt}; padding: 8px 14px; font-size: 13px; font-weight: 500; border-radius: 8px; border: 1px solid ${t.gold}30; cursor: pointer; font-family: Inter, sans-serif; transition: all 0.2s; white-space: nowrap; }
        .bnb-btn-ghost:hover { background: ${t.gold}28; border-color: ${t.gold}50; }

        .bnb-icon-box { width: 44px; height: 44px; }
        .bnb-thumb-box { width: 56px; height: 56px; border-radius: 8px; }

        .bnb-stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 32px;
        }

        .bnb-main-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 22px;
        }

        .bnb-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .bnb-booking-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          background-color: ${t.surface2};
          border: 1px solid ${t.border};
          border-radius: 8px;
          margin-bottom: 8px;
          transition: border-color 0.2s, background 0.2s;
          gap: 12px;
        }

        .bnb-booking-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .bnb-booking-info { min-width: 0; flex: 1; }
        .bnb-booking-title { font-size: 14px; font-weight: 600; color: ${t.ink}; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bnb-booking-sub { font-size: 12px; font-weight: 400; color: ${t.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .bnb-booking-right { text-align: right; flex-shrink: 0; }
        .bnb-booking-price { font-size: 15px; font-weight: 700; color: ${t.gold}; margin-bottom: 4px; font-family: Fraunces, Georgia, serif; }
        .bnb-booking-status { display: flex; align-items: center; gap: 5px; justify-content: flex-end; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }

        .bnb-prop-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        @media (max-width: 1100px) {
          .bnb-stats-grid { grid-template-columns: repeat(3, 1fr); }
          .bnb-main-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .bnb-stats-grid { grid-template-columns: repeat(2, 1fr); margin-bottom: 20px; }
        }

        @media (max-width: 480px) {
          .bnb-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .bnb-booking-row { padding: 10px 12px; gap: 8px; }
          .bnb-booking-sub { display: none; }
          .bnb-icon-box { width: 34px; height: 34px; }
          .bnb-thumb-box { width: 44px; height: 44px; }
        }
      `}</style>

      {/* Header */}
      <div className="bnb-header-row">
        <div>
          <div style={eyebrow}><span style={{ width: 20, height: 1, background: t.gold, display: 'inline-block' }} />BNB Management</div>
          <h1 style={{ ...serif, fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 600, color: t.ink, margin: '0 0 6px', letterSpacing: '-0.01em' }}>BNB Dashboard</h1>
          <p style={{ fontSize: 15, color: t.muted, margin: 0 }}>Manage your short-term rental properties and bookings</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="bnb-stats-grid">
        {[
          { label: 'Total Properties', value: stats.totalProperties,           icon: Home,        color: t.gold   },
          { label: 'Total Bookings',   value: stats.totalBookings,             icon: Calendar,    color: t.blue   },
          { label: 'Total Revenue',    value: fmtCompactCurrency(stats.totalRevenue), icon: DollarSign,  color: t.green  },
          { label: 'Occupancy Rate',   value: `${stats.occupancyRate}%`,       icon: TrendingUp,  color: t.gold   },
          { label: 'Average Rating',   value: stats.averageRating.toFixed(1),  icon: Star,        color: t.orange },
          { label: 'Active Listings',  value: stats.activeListings,            icon: CheckCircle, color: t.green  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bnb-stat-card" style={{ ...card, padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="bnb-icon-box" style={iconBox(color)}><Icon size={18} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.muted, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
              <div style={{ ...serif, fontSize: 'clamp(16px, 2.5vw, 22px)', fontWeight: 700, color: t.ink, letterSpacing: '-0.01em' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="bnb-main-grid">

        {/* Recent Bookings */}
        <div style={{ ...card, padding: 24, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={eyebrow}>Recent Activity</div>
              <h2 style={{ ...serif, fontSize: 20, fontWeight: 600, color: t.ink, margin: 0 }}>Recent Bookings</h2>
            </div>
            <button className="bnb-btn-ghost">View All</button>
          </div>

          <div>
            {recentBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: t.muted }}>
                <Calendar size={36} style={{ color: t.gold, opacity: 0.5, margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontSize: 14 }}>No recent bookings</div>
              </div>
            ) : recentBookings.map((b: any) => {
              const guest = b.guest || parseGuestFromNotes(b.notes);
              return (
                <div key={b.id} className="bnb-booking-row">
                  <div className="bnb-booking-left">
                    <div className="bnb-icon-box" style={iconBox(t.gold)}><Calendar size={16} /></div>
                    <div className="bnb-booking-info">
                      <div className="bnb-booking-title">{b.property?.title || `Property #${b.property_id}`}</div>
                      <div className="bnb-booking-sub">{guest?.name || 'Guest'} · {fmtDate(b.check_in)} → {fmtDate(b.check_out)}</div>
                    </div>
                  </div>
                  <div className="bnb-booking-right">
                    <div className="bnb-booking-price">{fmtCompactCurrency(b.total_price)}</div>
                    <div className="bnb-booking-status" style={{ color: statusColor(b.status) }}>{statusIcon(b.status)} {b.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Properties */}
        <div style={{ ...card, padding: 24, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={eyebrow}>Best Performers</div>
              <h2 style={{ ...serif, fontSize: 20, fontWeight: 600, color: t.ink, margin: 0 }}>Top Properties</h2>
            </div>
            <button className="bnb-btn-ghost">View All</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: t.muted }}>
                <Home size={36} style={{ color: t.gold, opacity: 0.5, margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontSize: 14 }}>No properties yet</div>
              </div>
            ) : topProperties.map((p: any) => (
              <div key={p.id} className="bnb-prop-card" style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.title} className="bnb-thumb-box" style={{ objectFit: 'cover', flexShrink: 0, border: `1px solid ${t.border}` }} />
                  ) : (
                    <div className="bnb-thumb-box" style={{ background: t.surface, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Home size={18} style={{ color: t.gold, opacity: 0.5 }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...serif, fontSize: 15, fontWeight: 600, color: t.ink, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: t.muted, marginBottom: 6 }}><MapPin size={11} /> {p.location}</div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: t.muted }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Bed size={11} />{p.bedrooms || 1}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Bath size={11} />{p.bathrooms || 1}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={11} />{p.max_guests || 2}</span>
                    </div>
                  </div>
                </div>
                <div className="bnb-prop-price-row" style={{ marginBottom: p.amenities ? 10 : 0 }}>
                  <div style={{ ...serif, fontSize: 16, fontWeight: 700, color: t.gold }}>{fmtCurrency(p.price)}<span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 400, color: t.muted }}>/night</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: t.green }}><Star size={11} fill="currentColor" />{p.average_rating || '4.5'} ({p.reviews_count || 0})</div>
                </div>
                {p.amenities && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(p.amenities).filter(([, v]) => v).slice(0, 4).map(([k]) => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: `${t.gold}18`, border: `1px solid ${t.gold}30`, borderRadius: 5, fontSize: 11, fontWeight: 500, color: t.goldLt, textTransform: 'capitalize' }}>
                        {amenityIcon(k)} {k}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BnbDashboard;