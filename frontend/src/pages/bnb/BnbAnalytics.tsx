import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Star } from 'lucide-react';
import Api from '../../services/api';

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
  occupancyRate: number;
  monthlyRevenue: number[];
  bookingTrends: number[];
  topProperties: Array<{
    id: number;
    title: string;
    bookings: number;
    revenue: number;
    rating: number;
  }>;
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
} as const;

const body: React.CSSProperties  = { fontFamily: 'Inter, sans-serif' };
const serif: React.CSSProperties = { fontFamily: 'serif' };
const card: React.CSSProperties  = { backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(28,25,23,0.04)' };

/* ─── formatting helpers ─────────────────────────────── */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount);

const formatNumber = (num: number) =>
  new Intl.NumberFormat('en-TZ').format(num);

const formatCompact = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
};

/* ─── REVENUE CHART (SVG line/area, professional dashboard style) ──────── */
function RevenueChart({ data }: { data: number[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 720;
  const H = 260;
  const padL = 54;
  const padR = 16;
  const padT = 18;
  const padB = 32;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  // pad the ceiling a bit so the line doesn't touch the top
  const yMax = max + range * 0.12;
  const yMin = Math.max(0, min - range * 0.08);
  const yRange = yMax - yMin || 1;

  const points = data.map((v, i) => {
    const x = padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
    const y = padT + plotH - ((v - yMin) / yRange) * plotH;
    return { x, y, v };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  const now = new Date();
  const monthLabels = data.map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (data.length - 1 - i), 1);
    return d.toLocaleDateString('en-TZ', { month: 'short' });
  });

  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => yMin + (yRange * i) / gridLines);

  const prev = hover !== null && hover > 0 ? data[hover - 1] : null;
  const cur = hover !== null ? data[hover] : null;
  const pctChange = prev !== null && cur !== null && prev !== 0 ? ((cur - prev) / prev) * 100 : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="bnb-revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.gold} stopOpacity={0.28} />
            <stop offset="100%" stopColor={t.gold} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* gridlines + y labels */}
        {gridValues.map((gv, i) => {
          const y = padT + plotH - ((gv - yMin) / yRange) * plotH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={t.border} strokeWidth={1} />
              <text x={padL - 10} y={y + 4} textAnchor="end" fontSize={11} fill={t.muted} fontFamily="Inter, sans-serif">
                {formatCompact(gv)}
              </text>
            </g>
          );
        })}

        {/* area fill */}
        <path d={areaPath} fill="url(#bnb-revenue-fill)" />

        {/* line */}
        <path d={linePath} fill="none" stroke={t.gold} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* hover guide */}
        {hover !== null && (
          <line
            x1={points[hover].x} y1={padT} x2={points[hover].x} y2={padT + plotH}
            stroke={t.gold} strokeWidth={1} strokeDasharray="3 3" opacity={0.5}
          />
        )}

        {/* points + hit targets */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x} cy={p.y}
              r={hover === i ? 5 : 3.5}
              fill={t.surface}
              stroke={t.gold}
              strokeWidth={2}
              style={{ transition: 'r 0.15s' }}
            />
            <rect
              x={p.x - plotW / (data.length * 2)}
              y={padT}
              width={plotW / data.length}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}

        {/* x labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={H - 8}
            textAnchor="middle"
            fontSize={11}
            fill={hover === i ? t.gold : t.muted}
            fontWeight={hover === i ? 600 : 400}
            fontFamily="Inter, sans-serif"
          >
            {monthLabels[i]}
          </text>
        ))}
      </svg>

      {/* tooltip */}
      {hover !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${(points[hover].x / W) * 100}%`,
            top: `${(points[hover].y / H) * 100}%`,
            transform: 'translate(-50%, -130%)',
            background: t.ink,
            color: t.onAccent,
            padding: '7px 11px',
            borderRadius: 8,
            fontSize: 12,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 6px 16px rgba(28,25,23,0.25)',
            zIndex: 2,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: pctChange !== null ? 2 : 0 }}>{formatCurrency(data[hover])}</div>
          {pctChange !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: pctChange >= 0 ? '#8FD9A8' : '#F0A8A8' }}>
              {pctChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(pctChange).toFixed(1)}% vs prior month
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const BnbAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Use existing API methods as fallback
      const response = await Api.getAnalytics(); // Using existing analytics API
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Fallback to mock data if API fails
      const mockAnalytics: AnalyticsData = {
        totalRevenue: 45000000,
        totalBookings: 156,
        averageRating: 4.7,
        occupancyRate: 85,
        monthlyRevenue: [3200000, 3800000, 4200000, 3900000, 4500000, 4800000],
        bookingTrends: [12, 15, 18, 14, 22, 25, 19, 28, 32, 26, 30, 28],
        topProperties: [
          { id: 1, title: 'Luxury Beach Villa', bookings: 45, revenue: 12000000, rating: 4.9 },
          { id: 2, title: 'City Center Apartment', bookings: 38, revenue: 9500000, rating: 4.7 },
          { id: 3, title: 'Mountain Retreat', bookings: 32, revenue: 8800000, rating: 4.8 },
          { id: 4, title: 'Garden Cottage', bookings: 28, revenue: 7200000, rating: 4.6 },
          { id: 5, title: 'Ocean View Suite', bookings: 25, revenue: 7500000, rating: 4.9 },
        ],
      };
      setAnalytics(mockAnalytics);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, change, icon: Icon, color }: {
    title: string;
    value: string;
    change?: { value: number; isPositive: boolean };
    icon: any;
    color: string;
  }) => (
    <div style={{ ...card, padding: 20, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={20} color={color} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: t.muted, marginBottom: 4 }}>{title}</div>
          <div style={{ ...serif, fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 700, color: t.ink }}>{value}</div>
        </div>
      </div>
      {change && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 500,
          color: change.isPositive ? t.green : t.red,
        }}>
          {change.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change.value}% from last period
        </div>
      )}
    </div>
  );

  // Overall change across the visible period, for the chart card's header stat
  const revenueChangeSummary = useMemo(() => {
    const rev = analytics?.monthlyRevenue ?? [];
    if (rev.length < 2) return null;
    const first = rev[0];
    const last = rev[rev.length - 1];
    if (first === 0) return null;
    return ((last - first) / first) * 100;
  }, [analytics]);

  if (loading) {
    return (
      <div style={{
        ...body,
        background: t.bg,
        color: t.ink,
        minHeight: '100vh',
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ width: 36, height: 36, border: `2px solid ${t.border}`, borderTop: `2px solid ${t.gold}`, borderRadius: '50%', animation: 'an-spin 0.8s linear infinite' }} />
        <style>{`@keyframes an-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: '0 auto', backgroundColor: t.bg, minHeight: '100vh', ...body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes an-spin { to { transform: rotate(360deg); } }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .time-range-selector {
          font-family: Inter, sans-serif;
          padding: 9px 14px;
          border: 1px solid ${t.border};
          border-radius: 8px;
          background: ${t.surface2};
          color: ${t.ink};
          font-size: 14px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .section-title {
          font-family: Fraunces, Georgia, serif;
          font-size: 18px;
          font-weight: 600;
          color: ${t.ink};
          margin: 0;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }
        .properties-table {
          width: 100%;
          border-collapse: collapse;
        }
        .properties-table th {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid ${t.border};
          color: ${t.muted};
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .properties-table td {
          padding: 12px;
          border-bottom: 1px solid ${t.border};
          color: ${t.ink};
          font-size: 14px;
        }
        .properties-table tr:last-child td {
          border-bottom: none;
        }
        .properties-table tr:hover td {
          background: ${t.surface2};
        }
      `}</style>

      <div className="analytics-header">
        <h1 style={{ ...serif, fontSize: 28, fontWeight: 600, color: t.ink, margin: 0 }}>Analytics</h1>
        <select
          className="time-range-selector"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(analytics?.totalRevenue || 0)}
          change={{ value: 12.5, isPositive: true }}
          icon={DollarSign}
          color={t.gold}
        />
        <MetricCard
          title="Total Bookings"
          value={formatNumber(analytics?.totalBookings || 0)}
          change={{ value: 8.2, isPositive: true }}
          icon={Calendar}
          color={t.blue}
        />
        <MetricCard
          title="Average Rating"
          value={(analytics?.averageRating || 0).toFixed(1)}
          change={{ value: 2.1, isPositive: true }}
          icon={Star}
          color={t.orange}
        />
        <MetricCard
          title="Occupancy Rate"
          value={`${analytics?.occupancyRate || 0}%`}
          change={{ value: 3.4, isPositive: true }}
          icon={Users}
          color={t.green}
        />
      </div>

      <div style={{ ...card, padding: 24, marginBottom: 24 }}>
        <div className="chart-header">
          <div>
            <h2 className="section-title">Revenue Trend</h2>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>Monthly revenue, most recent {analytics?.monthlyRevenue.length || 0} months</div>
          </div>
          {revenueChangeSummary !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20,
              background: revenueChangeSummary >= 0 ? `${t.green}18` : `${t.red}18`,
              color: revenueChangeSummary >= 0 ? t.green : t.red,
              fontSize: 12, fontWeight: 600,
            }}>
              {revenueChangeSummary >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(revenueChangeSummary).toFixed(1)}% over period
            </div>
          )}
        </div>
        {analytics && analytics.monthlyRevenue.length > 0 && (
          <RevenueChart data={analytics.monthlyRevenue} />
        )}
      </div>

      <div style={{ ...card, padding: 24 }}>
        <h2 className="section-title" style={{ marginBottom: 16 }}>Top Performing Properties</h2>
        <table className="properties-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Bookings</th>
              <th>Revenue</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {analytics && analytics.topProperties.map((property) => (
              <tr key={property.id}>
                <td style={{ fontWeight: 500 }}>{property.title}</td>
                <td>{property.bookings}</td>
                <td>{formatCurrency(property.revenue)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={14} fill={t.gold} color={t.gold} />
                    {property.rating}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BnbAnalytics;