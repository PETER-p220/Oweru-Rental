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

  if (loading) return <div style={{ color: '#9f9587' }}>Loading tenant dashboard...</div>;
  if (error) return <div style={{ color: '#e07070' }}>{error}</div>;

  const cards = [
    ['Listings', stats.total_properties ?? 0],
    ['Saved', stats.saved_properties ?? 0],
    ['Applications', stats.total_applications ?? 0],
    ['Contracts', stats.contracts ?? contracts.length],
    ['Unread Messages', stats.messages ?? 0],
  ];

  return (
    <>
      <style>{`
        .td-wrap { max-width: 1200px; margin: 0 auto; padding: 20px; background: #0F172A; min-height: 100vh; }
        .td-header { text-align: center; margin-bottom: 40px; }
        .td-title { font-size: 32px; font-weight: 700; color: #F8F8F9; margin-bottom: 8px; }
        .td-subtitle { font-size: 16px; color: #94A3B8; }
        .td-eyebrow { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #C89128; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; font-weight: 600; }
        .td-eyebrow::after { content: ''; flex: 1; height: 2px; background: linear-gradient(90deg, #C89128, transparent); }
        .td-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .td-stat { background: linear-gradient(135deg, #162035 0%, #1E2D4A 100%); border: 1px solid rgba(200,145,40,0.18); border-radius: 16px; padding: 24px; color: #F8F8F9; box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.4); transition: all 0.3s ease; position: relative; overflow: hidden; }
        .td-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #C89128, #D4A843); }
        .td-stat:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.5); }
        .td-label { color: #94A3B8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; margin-bottom: 8px; }
        .td-value { font-size: 32px; margin-top: 8px; color: #F8F8F9; font-weight: 800; }
        .td-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 40px; }
        .td-action { display:flex; align-items:center; gap:12px; padding:20px 24px; text-decoration:none; border-radius: 12px; font-size: 15px; font-weight: 600; border: 2px solid transparent; color: #ffffff; transition: all 0.3s ease; position: relative; overflow: hidden; }
        .td-action::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%); }
        .td-action.primary { background: linear-gradient(135deg, #C89128 0%, #D4A843 100%); border-color: #C89128; box-shadow: 0 8px 25px rgba(200,145,40,0.3); }
        .td-action.primary:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(200,145,40,0.4); }
        .td-action.secondary { background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%); border-color: #3B82F6; box-shadow: 0 8px 25px rgba(59,130,246,0.3); }
        .td-action.secondary:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(59,130,246,0.4); }
        .td-action.tertiary { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); border-color: #10b981; box-shadow: 0 8px 25px rgba(16,185,129,0.3); }
        .td-action.tertiary:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(16,185,129,0.4); }
        .td-action.quaternary { background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); border-color: #8b5cf6; box-shadow: 0 8px 25px rgba(139,92,246,0.3); }
        .td-action.quaternary:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(139,92,246,0.4); }
        .td-action.quinary { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); border-color: #f59e0b; box-shadow: 0 8px 25px rgba(245,158,11,0.3); }
        .td-action.quinary:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(245,158,11,0.4); }
        .td-list { display:grid; gap:14px; }
        .td-item { display:grid; grid-template-columns:92px minmax(0,1fr) auto; gap:18px; align-items:center; background: linear-gradient(135deg, #162035 0%, #1E2D4A 100%); border: 1px solid rgba(200,145,40,0.18); border-radius: 16px; padding: 20px; color: #F8F8F9; box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.4); transition: all 0.3s ease; }
        .td-item:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.5); }
        .td-thumb { width:92px; height:68px; border-radius:16px; object-fit:cover; background:rgba(200,145,40,0.1); }
        .td-title { font-size:16px; margin-bottom:4px; color: #F8F8F9; font-weight: 600; }
        .td-meta { color:#94A3B8; font-size:13px; line-height:1.5; }
        .td-price { font-size:18px; color: #C89128; white-space:nowrap; font-weight: 700; }
        .td-contract { background: linear-gradient(135deg, #162035 0%, #1E2D4A 100%); border: 1px solid rgba(200,145,40,0.18); border-radius: 16px; padding: 20px; margin-bottom: 12px; color: #F8F8F9; box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.4); transition: all 0.3s ease; }
        .td-contract:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.5); }
        .td-contract-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .td-contract-title { font-size: 16px; font-weight: 600; color: #F8F8F9; }
        .td-contract-status { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
        .td-contract-status.pending { background: rgba(200,145,40,0.2); color: #C89128; }
        .td-contract-status.active { background: rgba(76,201,76,0.2); color: #4cc94c; }
        .td-contract-status.signed { background: rgba(56,189,248,0.2); color: #38bdf8; }
        .td-contract-status.unknown { background: rgba(148,163,184,0.2); color: #94A3B8; }
        .td-contract-meta { font-size: 13px; color: #94A3B8; line-height: 1.4; }
        .td-contract-rent { font-size: 18px; color: #C89128; font-weight: 600; margin-top: 4px; }
        
        /* Enhanced mobile responsiveness */
        @media (max-width: 1024px) {
          .td-stats { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .td-actions { gap: 8px; }
          .td-action { padding: 10px 14px; font-size: 12px; }
        }
        
        @media (max-width: 768px) {
          .td-stats { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .td-stat { padding: 12px; }
          .td-value { font-size: 20px; }
          .td-label { font-size: 9px; }
          .td-actions { gap: 6px; }
          .td-action { padding: 8px 12px; font-size: 11px; }
          .td-item { grid-template-columns:1fr; gap: 12px; }
          .td-thumb { width: 80px; height: 60px; border-radius: 12px; }
          .td-title { font-size: 16px; }
          .td-meta { font-size: 13px; }
          .td-price { font-size: 20px; }
          .td-contract { padding: 14px; }
          .td-contract-title { font-size: 15px; }
          .td-contract-header { flex-direction: column; align-items: flex-start; gap: 8px; }
          .td-contract-rent { font-size: 16px; }
        }
        
        @media (max-width: 480px) {
          .td-wrap { padding: 0 12px; }
          .td-stats { grid-template-columns: repeat(3, 1fr); gap: 6px; }
          .td-stat { padding: 10px; border-radius: 10px; }
          .td-value { font-size: 18px; }
          .td-label { font-size: 8px; }
          .td-actions { gap: 4px; }
          .td-action { padding: 6px 10px; font-size: 10px; }
          .td-thumb { width: 72px; height: 54px; border-radius: 10px; }
          .td-title { font-size: 15px; }
          .td-meta { font-size: 12px; }
          .td-price { font-size: 18px; }
          .td-contract { padding: 12px; border-radius: 14px; }
          .td-contract-title { font-size: 14px; }
          .td-contract-rent { font-size: 15px; }
        }
      `}</style>

      <div className="td-wrap">
        <div className="td-header">
          <h1 className="td-title">Tenant Dashboard</h1>
          <p className="td-subtitle">Manage your rental journey with ease</p>
        </div>

        <div className="td-eyebrow">Overview</div>
        <div className="td-stats">
          {cards.map(([label, value]) => (
            <div key={String(label)} className="td-stat">
              <div className="td-label">{label}</div>
              <div className="td-value">{value}</div>
            </div>
          ))}
        </div>

        <div className="td-eyebrow">Quick Actions</div>
        <div className="td-actions">
          <Link className="td-action primary" to="/properties">
            <span>🏠</span> Browse Properties
          </Link>
          <Link className="td-action secondary" to="/dashboard/tenant/saved-properties">
            <span>❤️</span> Saved Properties
          </Link>
          <Link className="td-action tertiary" to="/dashboard/tenant/applications">
            <span>📋</span> My Applications
          </Link>
          <Link className="td-action quaternary" to="/dashboard/tenant/digital-contracts">
            <span>📄</span> Digital Contracts
          </Link>
          <Link className="td-action quinary" to="/dashboard/tenant/messages">
            <span>💬</span> Messages
          </Link>
        </div>

        <div className="td-eyebrow">Featured Picks</div>
        <div className="td-list">
          {properties.map((property) => (
            <div key={property.id} className="td-item">
              {property.images && property.images.length > 0 && property.images[0]
                ? <img className="td-thumb" src={imageUrl(property.images[0])} alt={property.title || 'Property'} />
                : <div className="td-thumb" />}
              <div>
                <div className="td-title">{property.title || 'Untitled property'}</div>
                <div className="td-meta">
                  {property.location || 'No location'}<br />
                  {property.bedrooms ?? 0} bd • {property.bathrooms ?? 0} ba • {property.area ?? 0} m²
                </div>
              </div>
              <div className="td-price">{formatCurrency(property.price)}</div>
            </div>
          ))}
        </div>

        {contracts.length > 0 && (
          <>
            <div className="td-eyebrow" style={{ marginTop: '32px' }}>My Contracts</div>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
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
          </>
        )}
      </div>
    </>
  );
};

export default TenantDashboard;