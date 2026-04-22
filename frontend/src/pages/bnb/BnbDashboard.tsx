import { useState, useEffect } from 'react';
import {
  Home, Calendar, DollarSign, Users, Star, TrendingUp, Bed, Bath, Wifi,
  Car, Dumbbell, Wind, Utensils, Monitor, Tv, Shirt, MapPin,
  Plus, CheckCircle, Clock, XCircle, Award, AlertCircle, Phone, Mail,
} from 'lucide-react';
import Api from '../../services/api';

// Helper to parse guest info from notes
function parseGuestFromNotes(notes?: string): { name: string; email: string; phone: string } | null {
  if (!notes) return null;
  const match = notes.match(/by:\s*(.+?)\s*\(([^,]+),\s*([^)]+)\)/);
  if (match) {                                
    return {
      name: match[1].trim(),
      email: match[2].trim(),
      phone: match[3].trim(),
    };
  }
  const nameMatch = notes.match(/by:\s*(.+)/);
  if (nameMatch) return { name: nameMatch[1].trim(), email: '', phone: '' };
  return null;
}

/* ─────────────────────────────────────────────────────────────
   BRAND TOKENS — Oweru Brand Kit
───────────────────────────────────────────────────────────── */
const B = {
  navy900:  '#0F172A',
  navy800:  '#162035',
  navy700:  '#1E2D4A',
  navy600:  '#253660',
  gold:     '#C89128',
  goldLt:   '#D4A843',
  goldDim:  'rgba(200,145,40,0.12)',
  cream:    '#F8F8F9',
  slate:    '#94A3B8',
  border:   'rgba(200,145,40,0.18)',
  borderFaint: 'rgba(200,145,40,0.08)',
  green:    '#10b981',
  red:      '#ef4444',
  amber:    '#f59e0b',
  sky:      '#38bdf8',
} as const;

/* ─────────────────────────────────────────────────────────────
   STYLE HELPERS
───────────────────────────────────────────────────────────── */
const panel: React.CSSProperties = {
  backgroundColor: B.navy800,
  border: `1px solid ${B.border}`,
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
};

const statCard = (accentColor: string): React.CSSProperties => ({
  backgroundColor: B.navy800,
  border: `1px solid ${B.border}`,
  padding: '22px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  position: 'relative',
  overflow: 'hidden',
});

const iconBox = (color: string): React.CSSProperties => ({
  width: 44, height: 44,
  background: `${color}18`,
  border: `1px solid ${color}30`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
  color,
});

const tag: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif",
  fontSize: 9, fontWeight: 600,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: B.gold,
  marginBottom: 12,
  display: 'flex', alignItems: 'center', gap: 10,
};

const bookingRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 16px',
  backgroundColor: B.navy900,
  border: `1px solid ${B.borderFaint}`,
  marginBottom: 1,
  transition: 'border-color 0.2s, background 0.2s',
};

/* ─────────────────────────────────────────────────────────────
   BNB DASHBOARD
───────────────────────────────────────────────────────────── */
const BnbDashboard = () => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    averageRating: 0,
    activeListings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [topProperties,  setTopProperties]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, bookingsRes, propertiesRes] = await Promise.all([
        Api.getBnbAnalytics(),
        Api.getBnbBookings(),
        Api.getBnbProperties(),
      ]);
      const a = analyticsRes.data || {};
      setStats({
        totalProperties: a.totalProperties || 0,
        totalBookings:   a.totalBookings   || 0,
        totalRevenue:    a.totalRevenue    || 0,
        occupancyRate:   a.occupancyRate   || 0,
        averageRating:   a.averageRating   || 0,
        activeListings:  a.activeListings  || 0,
      });
      setRecentBookings((bookingsRes.data || []).slice(0, 5));
      setTopProperties((propertiesRes.data || []).slice(0, 3));
    } catch (e) {
      console.error('Failed to load BNB dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });

  const statusColor = (s: string) => ({
    confirmed: B.green, pending: B.amber, cancelled: B.red, completed: B.sky,
  }[s] ?? B.slate);

  const statusIcon = (s: string) => ({
    confirmed: <CheckCircle size={14} />,
    pending:   <Clock       size={14} />,
    cancelled: <XCircle     size={14} />,
    completed: <Award       size={14} />,
  }[s] ?? <AlertCircle size={14} />);

  const amenityIcon = (a: string) => ({
    wifi: <Wifi size={13} />, parking: <Car size={13} />, gym: <Dumbbell size={13} />,
    kitchen: <Utensils size={13} />, workspace: <Monitor size={13} />,
    tv: <Tv size={13} />, washer: <Shirt size={13} />, ac: <Wind size={13} />,
    pool: <Home size={13} />,
  }[a.toLowerCase()] ?? <Star size={13} />);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div style={{ width: 36, height: 36, border: `2px solid ${B.border}`, borderTop: `2px solid ${B.gold}`, borderRadius: '50%', animation: 'bnb-spin 0.8s linear infinite' }} />
        <style>{`@keyframes bnb-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Jost', 'Futura PT', sans-serif", background: B.navy900, color: B.cream, minHeight: '100vh', padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
        @keyframes bnb-spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .bnb-stat-card { transition: transform 0.2s, border-color 0.2s; }
        .bnb-stat-card:hover { border-color: rgba(200,145,40,0.5) !important; transform: translateY(-2px); }

        .bnb-booking-row:hover { background: rgba(200,145,40,0.04) !important; border-color: rgba(200,145,40,0.25) !important; }

        .bnb-prop-card { transition: border-color 0.2s; }
        .bnb-prop-card:hover { border-color: rgba(200,145,40,0.4) !important; }

        .bnb-btn-gold {
          display: inline-flex; align-items: center; gap: 6px;
          background: ${B.gold}; color: ${B.navy900};
          padding: 8px 16px; font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: none; cursor: pointer; font-family: 'Jost', sans-serif;
          transition: background 0.2s;
        }
        .bnb-btn-gold:hover { background: ${B.goldLt}; }

        .bnb-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          background: ${B.goldDim}; color: ${B.gold};
          padding: 7px 14px; font-size: 11px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: 1px solid ${B.border}; cursor: pointer; font-family: 'Jost', sans-serif;
          transition: all 0.2s;
        }
        .bnb-btn-ghost:hover { background: rgba(200,145,40,0.2); border-color: rgba(200,145,40,0.4); }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={tag}>
            <span style={{ width: 20, height: 1, background: B.gold, display: 'inline-block' }} />
            BNB Management
          </div>
          <h1 style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700, color: B.cream, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            BNB Dashboard
          </h1>
          <p style={{ fontSize: 14, fontWeight: 300, color: B.slate, margin: 0 }}>
            Manage your short-term rental properties and bookings
          </p>
        </div>
        <button className="bnb-btn-gold">
          <Plus size={14} /> Add New Property
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, background: B.border, border: `1px solid ${B.border}`, marginBottom: 32 }}>
        {[
          { label: 'Total Properties', value: stats.totalProperties,              icon: Home,         color: B.gold  },
          { label: 'Total Bookings',   value: stats.totalBookings,                icon: Calendar,     color: B.sky   },
          { label: 'Total Revenue',    value: fmtCurrency(stats.totalRevenue),    icon: DollarSign,   color: '#10b981' },
          { label: 'Occupancy Rate',   value: `${stats.occupancyRate}%`,          icon: TrendingUp,   color: '#a78bfa' },
          { label: 'Average Rating',   value: stats.averageRating.toFixed(1),     icon: Star,         color: B.amber },
          { label: 'Active Listings',  value: stats.activeListings,               icon: CheckCircle,  color: '#10b981' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bnb-stat-card" style={{ ...statCard(color), background: B.navy800 }}>
            <div style={iconBox(color)}><Icon size={20} /></div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: B.slate, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: B.cream, letterSpacing: '-0.02em' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

        {/* Recent Bookings */}
        <div style={{ ...panel }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${B.gold}, transparent)` }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={tag}>Recent Activity</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: B.cream, margin: 0 }}>Recent Bookings</h2>
            </div>
            <button className="bnb-btn-ghost">View All</button>
          </div>

          <div>
            {recentBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: B.slate }}>
                <Calendar size={36} style={{ color: B.gold, opacity: 0.4, margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 300 }}>No recent bookings</div>
              </div>
            ) : (
              recentBookings.map((b: any) => {
                const guest = b.guest || parseGuestFromNotes(b.notes);
                return (
                  <div key={b.id} className="bnb-booking-row" style={bookingRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={iconBox(B.gold)}><Calendar size={16} /></div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: B.cream, marginBottom: 3 }}>
                          {b.property?.title || `Property #${b.property_id}`}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 300, color: B.slate }}>
                          {guest?.name || 'Guest'} · {fmtDate(b.check_in)} → {fmtDate(b.check_out)}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: B.gold, marginBottom: 4 }}>
                        {fmtCurrency(b.total_price)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', fontSize: 11, fontWeight: 600, color: statusColor(b.status), textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {statusIcon(b.status)} {b.status}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Properties */}
        <div style={{ ...panel }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: B.gold }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={tag}>Best Performers</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: B.cream, margin: 0 }}>Top Properties</h2>
            </div>
            <button className="bnb-btn-ghost">View All</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {topProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: B.slate }}>
                <Home size={36} style={{ color: B.gold, opacity: 0.4, margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 300 }}>No properties yet</div>
              </div>
            ) : (
              topProperties.map((p: any) => (
                <div key={p.id} className="bnb-prop-card" style={{ background: B.navy900, border: `1px solid ${B.borderFaint}`, padding: 16 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} style={{ width: 60, height: 60, objectFit: 'cover', flexShrink: 0, border: `1px solid ${B.border}` }} />
                    ) : (
                      <div style={{ width: 60, height: 60, background: B.navy700, border: `1px solid ${B.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Home size={20} style={{ color: B.gold, opacity: 0.4 }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: B.cream, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 300, color: B.slate, marginBottom: 6 }}>
                        <MapPin size={11} /> {p.location}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: B.slate }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Bed size={11} />{p.bedrooms || 1}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Bath size={11} />{p.bathrooms || 1}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={11} />{p.max_guests || 2}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: p.amenities ? 10 : 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: B.gold }}>
                      {fmtCurrency(p.price)}<span style={{ fontSize: 11, fontWeight: 400, color: B.slate }}>/night</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#10b981' }}>
                      <Star size={11} fill="currentColor" />
                      {p.average_rating || '4.5'} ({p.reviews_count || 0})
                    </div>
                  </div>

                  {p.amenities && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {Object.entries(p.amenities)
                        .filter(([, v]) => v)
                        .slice(0, 4)
                        .map(([k]) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: B.goldDim, border: `1px solid ${B.border}`, fontSize: 10, fontWeight: 600, color: B.gold, letterSpacing: '0.06em', textTransform: 'capitalize' }}>
                            {amenityIcon(k)} {k}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BnbDashboard;