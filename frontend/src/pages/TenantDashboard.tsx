import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Api from '../services/api';
import { formatCurrency } from './tenant/tenantPageStyles';

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

const TenantDashboard = () => {
  const [stats, setStats] = useState<DashboardData>({});
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [dashboardRes, propertiesRes, contractsRes] = await Promise.all([
          Api.getTenantDashboard(),
          Api.getProperties({ page: 1 }),
          Api.getTenantDigitalContracts().catch(() => ({ data: [] })),
        ]);
        setStats(dashboardRes.data || {});
        setProperties(
          Array.isArray(propertiesRes.data?.data)
            ? propertiesRes.data.data.slice(0, 4)
            : []
        );
        setContracts(Array.isArray(contractsRes.data) ? contractsRes.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load tenant dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: '#F1F5F9', fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#64748B' }}>
        Loading tenant dashboard…
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: '#F1F5F9', fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#DC2626' }}>
        {error}
      </div>
    );
  }

  const cards = [
    ['Listings', stats.total_properties ?? 0],
    ['Saved', stats.saved_properties ?? 0],
    ['Applications', stats.total_applications ?? 0],
    ['Contracts', stats.contracts ?? contracts.length],
    ['Unread Messages', stats.messages ?? 0],
  ];

  const quickActions = [
    { to: '/properties',                              icon: '🏠', label: 'Browse Properties',  primary: true },
    { to: '/dashboard/tenant/saved-properties',        icon: '❤️', label: 'Saved Properties' },
    { to: '/dashboard/tenant/applications',            icon: '📋', label: 'My Applications' },
    { to: '/dashboard/tenant/digital-contracts',       icon: '📄', label: 'Digital Contracts' },
    { to: '/dashboard/tenant/messages',                icon: '💬', label: 'Messages' },
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

        /* Stat cards */
        .td-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; }
        .td-stat { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px 20px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .td-stat:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(15,23,42,0.09); border-color: #CBD5E1; }
        .td-stat-label { color: #64748B; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; margin-bottom: 10px; }
        .td-stat-value { font-size: 26px; color: #0F172A; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }

        /* Quick actions */
        .td-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
        .td-action { display: flex; align-items: center; gap: 12px; padding: 15px 18px; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 600; border: 1px solid #E2E8F0; color: #0F172A; background: #FFFFFF; box-shadow: 0 1px 2px rgba(15,23,42,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease; }
        .td-action-icon { font-size: 17px; line-height: 1; flex-shrink: 0; }
        .td-action:hover { transform: translateY(-2px); border-color: #CBD5E1; box-shadow: 0 10px 24px rgba(15,23,42,0.09); }
        .td-action.primary { background: #0F172A; border-color: #0F172A; color: #FFFFFF; }
        .td-action.primary:hover { background: #1E293B; border-color: #1E293B; }

        /* Property list */
        .td-list { display: grid; gap: 14px; }
        .td-item { display: grid; grid-template-columns: 96px minmax(0,1fr) auto; gap: 18px; align-items: center; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .td-item:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(15,23,42,0.09); border-color: #CBD5E1; }
        .td-thumb { width: 96px; height: 72px; border-radius: 10px; object-fit: cover; background: #F1F5F9; display: block; }
        .td-item-title { font-size: 15px; margin-bottom: 5px; color: #0F172A; font-weight: 700; letter-spacing: -0.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .td-item-meta { color: #64748B; font-size: 13px; line-height: 1.55; }
        .td-item-price { font-size: 16px; color: #0F172A; white-space: nowrap; font-weight: 700; }

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

        .td-empty { background: #FFFFFF; border: 1px dashed #CBD5E1; border-radius: 14px; padding: 32px 20px; text-align: center; color: #94A3B8; font-size: 13.5px; }

        /* ── Tablet ── */
        @media (max-width: 1024px) {
          .td-header-inner { padding: 32px 28px 26px; }
          .td-wrap { padding: 26px 28px 44px; }
          .td-stats { grid-template-columns: repeat(3, 1fr); }
          .td-actions { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Mobile ── */
        @media (max-width: 680px) {
          .td-header-inner { padding: 24px 18px 20px; }
          .td-wrap { padding: 20px 16px 40px; }
          .td-section { margin-bottom: 30px; }
          .td-heading { font-size: 22px; }
          .td-tagline { font-size: 13px; }

          .td-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .td-stat { padding: 14px 16px; border-radius: 12px; }
          .td-stat-label { font-size: 10.5px; margin-bottom: 6px; }
          .td-stat-value { font-size: 21px; }

          .td-actions { grid-template-columns: 1fr; gap: 10px; }
          .td-action { padding: 14px 16px; font-size: 13.5px; }

          /* Card-style stacked layout for property items */
          .td-item { grid-template-columns: 80px minmax(0,1fr); grid-template-rows: auto auto; gap: 12px 14px; padding: 14px; border-radius: 12px; }
          .td-thumb { width: 80px; height: 64px; border-radius: 8px; }
          .td-item-title { font-size: 14.5px; white-space: normal; }
          .td-item-meta { font-size: 12.5px; }
          .td-item-price { grid-column: 1 / -1; text-align: left; font-size: 15px; padding-top: 10px; border-top: 1px solid #E2E8F0; }

          .td-contract { padding: 14px; border-radius: 12px; }
          .td-contract-header { flex-direction: column; align-items: flex-start; gap: 8px; }
          .td-contract-title { font-size: 14px; }
          .td-contract-meta { font-size: 12.5px; }
          .td-contract-rent { font-size: 15px; }
        }

        @media (max-width: 380px) {
          .td-stats { grid-template-columns: 1fr 1fr; }
          .td-stat-value { font-size: 19px; }
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
          {/* Overview */}
          <div className="td-section">
            <div className="td-section-label">Overview</div>
            <div className="td-stats">
              {cards.map(([label, value]) => (
                <div key={String(label)} className="td-stat">
                  <div className="td-stat-label">{label}</div>
                  <div className="td-stat-value">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="td-section">
            <div className="td-section-label">Quick Actions</div>
            <div className="td-actions">
              {quickActions.map(a => (
                <Link key={a.to} className={`td-action${a.primary ? ' primary' : ''}`} to={a.to}>
                  <span className="td-action-icon">{a.icon}</span> {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Featured picks */}
          <div className="td-section">
            <div className="td-section-label">Featured Picks</div>
            {properties.length > 0 ? (
              <div className="td-list">
                {properties.map((property) => (
                  <div key={property.id} className="td-item">
                    {property.images && property.images.length > 0 && property.images[0]
                      ? <img
                          className="td-thumb"
                          src={imageUrl(property.images[0])}
                          alt={property.title || 'Property'}
                          loading="lazy"
                          decoding="async"
                          width="96"
                          height="72"
                        />
                      : <div className="td-thumb" />}
                    <div>
                      <div className="td-item-title">{property.title || 'Untitled property'}</div>
                      <div className="td-item-meta">
                        {property.location || 'No location'}<br />
                        {property.bedrooms ?? 0} bd • {property.bathrooms ?? 0} ba • {property.area ?? 0} m²
                      </div>
                    </div>
                    <div className="td-item-price">{formatCurrency(property.price)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="td-empty">No featured properties yet.</div>
            )}
          </div>

          {/* Contracts */}
          {contracts.length > 0 && (
            <div className="td-section" style={{ marginBottom: 0 }}>
              <div className="td-section-label">My Contracts</div>
              <div>
                {contracts.slice(0, 3).map((contract) => {
                  const statusSlug = (contract.status ?? 'unknown').toLowerCase().replace(/\s+/g, '_');
                  return (
                    <div key={contract.id} className="td-contract">
                      <div className="td-contract-header">
                        <div className="td-contract-title">
                          {contract.property_title || `Property #${contract.property_id}`}
                        </div>
                        <div className={`td-contract-status ${statusSlug}`}>
                          {formatStatus(contract.status)}
                        </div>
                      </div>
                      <div className="td-contract-meta">
                        Contract: {safeDate(contract.start_date)} – {safeDate(contract.end_date)}<br />
                        Payment status: {formatStatus(contract.payment_status, 'N/A')}
                      </div>
                      <div className="td-contract-rent">
                        {formatCurrency(contract.rent_amount)}/month
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TenantDashboard;