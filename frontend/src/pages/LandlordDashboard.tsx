import { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Building, DollarSign, FileText,
  Plus, Users, Home, MapPin, Bell, ChevronRight, Settings, ClipboardList,
} from 'lucide-react';
import Api from '../services/api';
import { useAuthenticatedEffect } from '../hooks/useAuthenticatedEffect';
import { getApiErrorMessage, rejectedReason, retryAsync } from '../utils/apiErrors';
import DashboardLoadError from '../components/DashboardLoadError';

// ── Design tokens — 1:1 with landlord_dashboard.dart kSlate* color system
const C = {
  pageBg:   '#F1F5F9',   // kPageBg / kSlate100  — page background
  headerBg: '#1E293B',   // kHeaderBg / kSlate800 — slate header panels
  cardBg:   '#FFFFFF',   // kCardBg / kWhite      — card surfaces
  border:   '#E2E8F0',   // kBorder / kSlate200
  text:     '#0F172A',   // kSlate900
  textSub:  '#475569',   // kSlate600
  textMuted:'#94A3B8',   // kSlate400
  textLight:'#CBD5E1',   // kSlate300  — text on dark bg
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
  // Gold — CTA buttons & accent price text ONLY
  gold:     '#C89128',
  goldGlow: '0 4px 14px rgba(200,145,40,0.26)',
  // Semantic — matches kSuccess / kInfo / kWarning / kDanger
  green:    '#16A34A', greenBg:  '#DCFCE7',
  blue:     '#2563EB', blueBg:   '#DBEAFE',
  amber:    '#D97706', amberBg:  '#FEF3C7',
  red:      '#DC2626', redBg:    '#FFE4E6',
};

interface DashboardStats {
  total_properties?: number;
  active_tenants?: number;
  monthly_revenue?: number;
  total_revenue?: number;
  occupancy_rate?: number;
  pending_contracts?: number;
}
interface ContractItem { id: number; status: string; payment_status: string; [k: string]: any; }
interface PropertyItem {
  id: number; title?: string; location?: string;
  price?: number | string; bedrooms?: number;
  bathrooms?: number; area?: number;
  images?: string[]; available?: boolean;
}

const imageUrl = (path?: string) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL}/storage/${path}`;
};

const fmtPrice = (v: any): string => {
  if (v == null) return 'TZS 0';
  const n = typeof v === 'number' ? v : parseFloat(v) || 0;
  if (n >= 1_000_000) return `TZS ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `TZS ${(n / 1_000).toFixed(1)}K`;
  return `TZS ${n.toFixed(0)}`;
};

const LandlordDashboard = () => {
  const [stats, setStats]             = useState<DashboardStats>({});
  const [properties, setProperties]   = useState<PropertyItem[]>([]);
  const [contracts, setContracts]     = useState<ContractItem[]>([]);
  const [applicationCount, setApplicationCount] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  const loadDashboard = useCallback(async () => {
    if (!localStorage.getItem('token')) return;

    try {
      setLoading(true);
      setError('');

      await retryAsync(async () => {
        const [statsRes, propsRes, appsRes, contractsRes] = await Promise.allSettled([
          Api.getOwnerDashboard(),
          Api.getOwnerProperties(),
          Api.getOwnerApplications(),
          Api.getOwnerContracts(),
        ]);

        if (statsRes.status === 'rejected') {
          throw rejectedReason(statsRes);
        }

        setStats(statsRes.value.data || {});

        if (propsRes.status === 'fulfilled') {
          setProperties(Array.isArray(propsRes.value.data) ? propsRes.value.data.slice(0, 5) : []);
        }
        if (appsRes.status === 'fulfilled') {
          setApplicationCount(Array.isArray(appsRes.value.data) ? appsRes.value.data.length : 0);
        }
        if (contractsRes.status === 'fulfilled') {
          setContracts(Array.isArray(contractsRes.value.data) ? contractsRes.value.data : []);
        }
      });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useAuthenticatedEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Matches _statsRow items in Dart (_StatItem list)
  const statCards = useMemo(() => [
    { label: 'Properties',   value: `${stats.total_properties  ?? 0}`,                                          accent: C.slate800, bg: C.slate100, Icon: Building    },
    { label: 'Applications', value: `${applicationCount}`,                                                       accent: C.blue,     bg: C.blueBg,   Icon: FileText    },
    { label: 'Tenants',      value: `${stats.active_tenants    ?? 0}`,                                          accent: C.green,    bg: C.greenBg,  Icon: Users       },
    { label: 'Revenue',      value: fmtPrice(stats.monthly_revenue),                                             accent: C.amber,    bg: C.amberBg,  Icon: DollarSign  },
    { label: 'Pending',      value: `${stats.pending_contracts ?? contracts.filter(c => c.status === 'pending_signature').length}`, accent: C.red, bg: C.redBg, Icon: FileText },
  ], [applicationCount, stats, contracts]);

  // Matches _quickActionsSection / _ActionTile in Dart
  const quickActions = [
    { label: 'Add Property',      icon: Plus,     to: 'add-property',      accent: C.slate800 },
    { label: 'My Properties',     icon: Building, to: 'my-properties',     accent: C.blue     },
    { label: 'Applications',      icon: FileText, to: 'applications',      accent: C.blue     },
    { label: 'Compliance Requests', icon: ClipboardList, to: 'compliance',   accent: C.amber    },
    { label: 'Digital Contracts', icon: FileText, to: 'digital-contracts', accent: C.amber    },
    { label: 'Analytics',         icon: BarChart3,to: 'analytics',         accent: C.green    },
    { label: 'Rent Collection',   icon: DollarSign,to:'rent-collection',   accent: C.green    },
  ];

  if (loading) return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.slate800}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh' }}>
      <DashboardLoadError message={error} onRetry={() => void loadDashboard()} />
    </div>
  );

  return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .qa-tile { transition: box-shadow 0.15s, transform 0.15s; }
        .qa-tile:hover { box-shadow: 0 6px 20px rgba(15,23,42,0.10) !important; transform: translateY(-1px); }
        .prop-card { transition: box-shadow 0.15s, transform 0.15s; }
        .prop-card:hover { box-shadow: 0 6px 20px rgba(15,23,42,0.10) !important; transform: translateY(-1px); }
        .stat-scroll::-webkit-scrollbar { height: 0; }
      `}</style>

      {/* ══ Slate-800 header — matches _slatHeader() in Dart ══ */}
      <div style={{ background: C.headerBg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 28px' }}>

          {/* Top bar — logo + notification + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Oweru</span>
              {/* LANDLORD badge — matches Container(color:kSlate600) in Dart */}
              <span style={{ padding: '2px 7px', background: C.slate700, borderRadius: 4, fontSize: 9, fontWeight: 700, color: C.textLight, letterSpacing: '0.8px' }}>
                LANDLORD
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Notification bell with red dot */}
              <div style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} style={{ color: C.textLight }} />
                <div style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: C.red, border: `1.5px solid ${C.headerBg}` }} />
              </div>
              {/* Avatar chip */}
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.slate700, border: `1.5px solid ${C.slate500}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>L</span>
              </div>
            </div>
          </div>

          {/* Greeting + "Collect Rent" CTA — matches Row in _slatHeader */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 'clamp(20px,3.5vw,24px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>
                Hello, Landlord 
              </div>
              <div style={{ fontSize: 13, color: C.textMuted }}>
                {applicationCount > 0 ? `${applicationCount} application${applicationCount !== 1 ? 's' : ''} pending review.` : 'Your portfolio is up to date.'}
              </div>
            </div>
            {/* "Collect Rent" — white button on dark header, matches Container(color:kWhite) in Dart */}
            <Link to="rent-collection" style={{ padding: '10px 18px', background: C.cardBg, borderRadius: 8, color: C.slate900, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Collect Rent
            </Link>
          </div>

          {/* Mini header quick-links — matches _HeaderChip row in Dart (kSlate700 bg) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[
              { label: 'Properties', to: 'my-properties',     Icon: Building  },
              { label: 'Tenants',    to: 'tenants',           Icon: Users     },
              { label: 'Contracts',  to: 'digital-contracts', Icon: FileText  },
              { label: 'Analytics',  to: 'analytics',         Icon: BarChart3 },
            ].map(({ label, to, Icon }) => (
              <Link key={label} to={to} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 4px', background: C.slate700, borderRadius: 8, textDecoration: 'none' }}>
                <Icon size={12} style={{ color: C.textLight, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: C.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Body — slate-100 bg ══ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 40px' }}>

        {/* ── Stat cards row — horizontally scrollable white cards (matches _StatCard2) */}
        <div className="stat-scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 24 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ minWidth: 118, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', flexShrink: 0, boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
              {/* Icon badge — matches Container(color:item.bg) in _StatCard2 */}
              <div style={{ width: 28, height: 28, borderRadius: 7, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <s.Icon size={13} style={{ color: s.accent }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.slate500, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Section label — matches _sectionLabel() in Dart */}
        <div style={{ fontSize: 14, fontWeight: 700, color: C.slate800, letterSpacing: '0.1px', marginBottom: 12 }}>Quick Actions</div>

        {/* ── 2-col action tiles — matches _ActionTile in Dart ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 28 }}>
          {quickActions.map(a => (
            <Link key={a.to} to={a.to} className="qa-tile" style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
              background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12,
              textDecoration: 'none', boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            }}>
              {/* Icon container — matches Container(color:kSlate100) in _ActionTile */}
              <div style={{ width: 38, height: 38, borderRadius: 10, background: C.slate100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <a.icon size={17} style={{ color: a.accent }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.slate800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</div>
              </div>
            </Link>
          ))}

         
        </div>

        
        {/* View all row — matches _viewAllRow() in Dart */}
       
      </div>
    </div>
  );
};

export default LandlordDashboard;