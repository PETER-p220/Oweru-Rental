import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Api from '../services/api';
import { formatCurrency } from './tenant/tenantPageStyles';
import { useAuthenticatedEffect } from '../hooks/useAuthenticatedEffect';
import { getApiErrorMessage, rejectedReason, retryAsync } from '../utils/apiErrors';
import DashboardLoadError from '../components/DashboardLoadError';

interface DashboardData {
  total_properties?: number;
  saved_properties?: number;
  total_applications?: number;
  messages?: number;
  contracts?: number;
}

interface ContractItem {
  id: number;
  property_id: number;
  property_title?: string;
  owner_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  rent_amount: number;
  status?: string;
  payment_status?: string;
}

interface PropertyItem {
  id: number;
  title?: string;
  location?: string;
  price?: number | string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  images?: string[];
}

// Safely format a status string: undefined/null → fallback, then replace underscores
const formatStatus = (value: string | undefined | null, fallback = 'unknown') =>
  (value ?? fallback).replace(/_/g, ' ');

// ── Icon set (shared between stat cards & quick actions, keeps the two families visually tied together) ──
const Icon = ({ name }: { name: 'home' | 'heart' | 'clipboard' | 'file' | 'chat' | 'wrench' }) => {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'home':
      return <svg {...common}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V10" /></svg>;
    case 'heart':
      return <svg {...common}><path d="M12 20.2s-7.2-4.4-9.6-9A5.4 5.4 0 0 1 12 5.4a5.4 5.4 0 0 1 9.6 5.8c-2.4 4.6-9.6 9-9.6 9z" /></svg>;
    case 'clipboard':
      return <svg {...common}><rect x="5.5" y="4" width="13" height="16.5" rx="2" /><rect x="9" y="2" width="6" height="4" rx="1" /><path d="M9 11.5h6M9 15.5h6" /></svg>;
    case 'file':
      return <svg {...common}><path d="M6.5 2.5h8l5 5v13a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1z" /><path d="M14.5 2.5v5h5" /><path d="M8.5 13.5h7M8.5 17h7" /></svg>;
    case 'chat':
      return <svg {...common}><path d="M21 12a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.3-4.3A8.5 8.5 0 1 1 21 12z" /></svg>;
    case 'wrench':
      return <svg {...common}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-3.4-3.4 2.1-2.1z" /></svg>;
  }
};

// Compute how far along a lease is, for the contract progress bar
const leaseProgress = (start?: string, end?: string) => {
  const s = start ? new Date(start).getTime() : NaN;
  const e = end ? new Date(end).getTime() : NaN;
  if (isNaN(s) || isNaN(e) || e <= s) return null;
  const now = Date.now();
  const pct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100));
  const daysLeft = Math.ceil((e - now) / 86400000);
  return { pct, daysLeft };
};

const TenantDashboard = () => {
  const [stats, setStats] = useState<DashboardData>({});
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!localStorage.getItem('token')) return;

    try {
      setLoading(true);
      setError('');

      await retryAsync(async () => {
        const [dashboardRes, propertiesRes, contractsRes] = await Promise.allSettled([
          Api.getTenantDashboard(),
          Api.getProperties({ page: 1 }),
          Api.getTenantDigitalContracts(),
        ]);

        if (dashboardRes.status === 'rejected') {
          throw rejectedReason(dashboardRes);
        }

        setStats(dashboardRes.value.data || {});

        if (propertiesRes.status === 'fulfilled') {
          const payload = propertiesRes.value.data;
          setProperties(
            Array.isArray(payload?.data)
              ? payload.data.slice(0, 4)
              : Array.isArray(payload)
                ? payload.slice(0, 4)
                : [],
          );
        }

        if (contractsRes.status === 'fulfilled') {
          setContracts(Array.isArray(contractsRes.value.data) ? contractsRes.value.data : []);
        }
      });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load tenant dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useAuthenticatedEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const imageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL}/storage/${path}`;
  };

  const safeDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  };

  const cards: { label: string; value: number; icon: 'home' | 'heart' | 'clipboard' | 'file' | 'chat'; tone: 'blue' | 'rose' | 'amber' | 'emerald' | 'violet' }[] = [
    { label: 'Listings', value: stats.total_properties ?? 0, icon: 'home', tone: 'blue' },
    { label: 'Saved', value: stats.saved_properties ?? 0, icon: 'heart', tone: 'rose' },
    { label: 'Applications', value: stats.total_applications ?? 0, icon: 'clipboard', tone: 'amber' },
    { label: 'Contracts', value: stats.contracts ?? contracts.length, icon: 'file', tone: 'emerald' },
    { label: 'Unread Messages', value: stats.messages ?? 0, icon: 'chat', tone: 'violet' },
  ];

  const quickActions: { to: string; icon: 'home' | 'heart' | 'clipboard' | 'file' | 'chat' | 'wrench'; label: string; tone: 'blue' | 'rose' | 'amber' | 'emerald' | 'violet'; primary?: boolean }[] = [
    { to: '/properties', icon: 'home', label: 'Browse Properties', tone: 'blue', primary: true },
    { to: '/dashboard/tenant/saved-properties', icon: 'heart', label: 'Saved Properties', tone: 'rose' },
    { to: '/dashboard/tenant/applications', icon: 'clipboard', label: 'My Applications', tone: 'amber' },
    { to: '/dashboard/tenant/compliance', icon: 'wrench', label: 'Compliance & Maintenance', tone: 'emerald' },
    { to: '/dashboard/tenant/digital-contracts', icon: 'file', label: 'Digital Contracts', tone: 'emerald' },
    { to: '/dashboard/tenant/messages', icon: 'chat', label: 'Messages', tone: 'violet' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .td-page { background: #F1F5F9; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .td-header { background: #FFFFFF; border-bottom: 1px solid #E2E8F0; }
        .td-header-inner { max-width: 1280px; margin: 0 auto; padding: 40px 40px 32px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
        .td-eyebrow-badge { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #475569; margin-bottom: 12px; display: inline-flex; align-items: center; gap: 8px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 5px 12px; border-radius: 20px; }
        .td-heading { font-family: 'Inter', sans-serif; font-size: clamp(22px, 3.4vw, 30px); font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; color: #0F172A; margin: 0; }
        .td-tagline { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 400; color: #64748B; margin: 8px 0 0; }

        .td-wrap { max-width: 1280px; margin: 0 auto; padding: 32px 40px 56px; }
        .td-section-label { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #64748B; margin: 0 0 16px; display: flex; align-items: center; gap: 10px; }
        .td-section-label::after { content: ''; flex: 1; height: 1px; background: #E2E8F0; }
        .td-section { margin-bottom: 40px; }

        /* ── Smart stat cards: icon chip + big number, color-coded per metric ── */
        .td-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; }
        .td-stat { position: relative; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px 20px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; overflow: hidden; }
        .td-stat::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 3px; background: var(--tone-solid); }
        .td-stat:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(15,23,42,0.09); border-color: #CBD5E1; }
        .td-stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .td-stat-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--tone-bg); color: var(--tone-solid); flex-shrink: 0; }
        .td-stat-label { color: #64748B; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; }
        .td-stat-value { font-size: 28px; color: #0F172A; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }

        .tone-blue { --tone-bg: #EFF6FF; --tone-solid: #2563EB; }
        .tone-rose { --tone-bg: #FFF1F2; --tone-solid: #E11D48; }
        .tone-amber { --tone-bg: #FFFBEB; --tone-solid: #D97706; }
        .tone-emerald { --tone-bg: #ECFDF5; --tone-solid: #059669; }
        .tone-violet { --tone-bg: #F5F3FF; --tone-solid: #7C3AED; }

        /* Quick actions */
        .td-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
        .td-action { display: flex; align-items: center; gap: 12px; padding: 14px 18px; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 600; border: 1px solid #E2E8F0; color: #0F172A; background: #FFFFFF; box-shadow: 0 1px 2px rgba(15,23,42,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease; }
        .td-action-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: var(--tone-bg); color: var(--tone-solid); flex-shrink: 0; }
        .td-action:hover { transform: translateY(-2px); border-color: #CBD5E1; box-shadow: 0 10px 24px rgba(15,23,42,0.09); }
        .td-action.primary { background: #0F172A; border-color: #0F172A; color: #FFFFFF; }
        .td-action.primary .td-action-icon { background: rgba(255,255,255,0.14); color: #FFFFFF; }
        .td-action.primary:hover { background: #1E293B; border-color: #1E293B; }

        /* ── Property cards: full card grid, image-forward, works the same shape at every width ── */
        .td-property-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
        .td-card { display: flex; flex-direction: column; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 2px rgba(15,23,42,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .td-card:hover { transform: translateY(-3px); box-shadow: 0 14px 32px rgba(15,23,42,0.10); border-color: #CBD5E1; }
        .td-card-media { position: relative; width: 100%; aspect-ratio: 16 / 10; background: #F1F5F9; overflow: hidden; }
        .td-card-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .td-card-price-tag { position: absolute; left: 12px; bottom: 12px; background: rgba(15,23,42,0.82); backdrop-filter: blur(4px); color: #FFFFFF; font-size: 13.5px; font-weight: 700; padding: 6px 12px; border-radius: 999px; letter-spacing: -0.01em; }
        .td-card-body { padding: 16px 16px 18px; }
        .td-card-title { font-size: 15px; color: #0F172A; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .td-card-location { color: #64748B; font-size: 12.5px; margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .td-card-specs { display: flex; gap: 12px; padding-top: 10px; border-top: 1px solid #F1F5F9; }
        .td-spec { display: flex; align-items: baseline; gap: 4px; font-size: 12.5px; color: #475569; }
        .td-spec b { color: #0F172A; font-weight: 700; font-size: 13.5px; }

        /* Contracts */
        .td-contract { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .td-contract:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(15,23,42,0.09); border-color: #CBD5E1; }
        .td-contract-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
        .td-contract-title { font-size: 15px; font-weight: 700; color: #0F172A; letter-spacing: -0.01em; }
        .td-contract-status { padding: 4px 11px; border-radius: 999px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }
        .td-contract-status.pending { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
        .td-contract-status.active { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
        .td-contract-status.signed { background: #DBEAFE; color: #1D4ED8; border: 1px solid #BFDBFE; }
        .td-contract-status.unknown { background: #F1F5F9; color: #64748B; border: 1px solid #E2E8F0; }
        .td-contract-meta { font-size: 13px; color: #64748B; line-height: 1.6; }
        .td-contract-rent { font-size: 16px; color: #0F172A; font-weight: 700; margin-top: 8px; }
        .td-lease-track { margin-top: 12px; height: 6px; border-radius: 999px; background: #F1F5F9; overflow: hidden; }
        .td-lease-fill { height: 100%; border-radius: 999px; background: #0F172A; }
        .td-lease-note { margin-top: 6px; font-size: 11.5px; color: #94A3B8; font-weight: 600; }

        .td-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; background: #FFFFFF; border: 1px dashed #CBD5E1; border-radius: 14px; padding: 36px 20px; text-align: center; color: #94A3B8; font-size: 13.5px; }
        .td-error { display: flex; align-items: center; justify-content: center; min-height: 60vh; background: #F1F5F9; font-family: 'Inter', sans-serif; font-size: 14px; color: #DC2626; padding: 20px; text-align: center; }

        /* ── Skeleton loading state, replaces plain "Loading…" text ── */
        .td-skel-shimmer { background: linear-gradient(90deg, #E2E8F0 25%, #EDF1F5 37%, #E2E8F0 63%); background-size: 400% 100%; animation: td-shimmer 1.4s ease infinite; border-radius: 10px; }
        @keyframes td-shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
        .td-skel-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; }
        .td-skel-stat { height: 92px; border-radius: 14px; }
        .td-skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
        .td-skel-card { height: 230px; border-radius: 16px; }

        /* ── Tablet ── */
        @media (max-width: 1024px) {
          .td-header-inner { padding: 32px 28px 26px; }
          .td-wrap { padding: 26px 28px 44px; }
          .td-stats, .td-skel-stats { grid-template-columns: repeat(3, 1fr); }
          .td-actions { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Mobile ── */
        @media (max-width: 680px) {
          .td-header-inner { padding: 24px 18px 20px; }
          .td-wrap { padding: 20px 16px 40px; }
          .td-section { margin-bottom: 30px; }
          .td-heading { font-size: 22px; }
          .td-tagline { font-size: 13px; }

          .td-stats, .td-skel-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .td-stat { padding: 14px 16px; border-radius: 12px; }
          .td-stat-top { margin-bottom: 10px; }
          .td-stat-icon { width: 28px; height: 28px; border-radius: 8px; }
          .td-stat-label { font-size: 10.5px; }
          .td-stat-value { font-size: 22px; }
          .td-skel-stat { height: 80px; }

          .td-actions { grid-template-columns: 1fr; gap: 10px; }
          .td-action { padding: 13px 16px; font-size: 13.5px; }

          /* Property cards stay full cards, just single column on mobile */
          .td-property-grid, .td-skel-grid { grid-template-columns: 1fr; }
          .td-skel-card { height: 210px; }
          .td-card-title, .td-card-location { white-space: normal; }

          .td-contract { padding: 14px; border-radius: 12px; }
          .td-contract-header { flex-direction: column; align-items: flex-start; gap: 8px; }
          .td-contract-title { font-size: 14px; }
          .td-contract-meta { font-size: 12.5px; }
          .td-contract-rent { font-size: 15px; }
        }

        @media (max-width: 380px) {
          .td-stats, .td-skel-stats { grid-template-columns: 1fr 1fr; }
          .td-stat-value { font-size: 20px; }
        }
      `}</style>

      <div className="td-page">
        {/* Header */}
        <div className="td-header">
          <div className="td-header-inner">
            <div>
              <div className="td-eyebrow-badge">Tenant Workspace</div>
              <h1 className="td-heading">Tenant Dashboard</h1>
              <p className="td-tagline">Manage your rental journey with ease</p>
            </div>
          </div>
        </div>

        <div className="td-wrap">
          {error && !loading && (
            <DashboardLoadError message={error} onRetry={() => void loadDashboard()} />
          )}

          {!error && (
            <>
              {/* Overview */}
              <div className="td-section">
                <div className="td-section-label">Overview</div>
                {loading ? (
                  <div className="td-skel-stats">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="td-skel-shimmer td-skel-stat" />
                    ))}
                  </div>
                ) : (
                  <div className="td-stats">
                    {cards.map((c) => (
                      <div key={c.label} className={`td-stat tone-${c.tone}`}>
                        <div className="td-stat-top">
                          <div className="td-stat-icon"><Icon name={c.icon} /></div>
                        </div>
                        <div className="td-stat-label">{c.label}</div>
                        <div className="td-stat-value">{c.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="td-section">
                <div className="td-section-label">Quick Actions</div>
                <div className="td-actions">
                  {quickActions.map(a => (
                    <Link key={a.to} className={`td-action tone-${a.tone}${a.primary ? ' primary' : ''}`} to={a.to}>
                      <span className="td-action-icon"><Icon name={a.icon} /></span> {a.label}
                    </Link>
                  ))}
                </div>
              </div>

              
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TenantDashboard;