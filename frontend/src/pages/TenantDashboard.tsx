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
        .td-wrap { max-width: 1100px; margin: 0 auto; }
        .td-eyebrow { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #c9a84c; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }
        .td-eyebrow::after { content: ''; flex: 1; height: 1px; background: rgba(37,99,235,0.15); }
        .td-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 40px; }
        .td-stat, .td-item { background: #ffffff; border: 1px solid rgba(37,99,235,0.14); border-radius: 12px; padding: 16px; color: #171717; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .td-label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; }
        .td-value { font-size: 28px; margin-top: 6px; color: #171717; font-weight: 700; }
        .td-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 32px; }
        .td-action { display:inline-flex; align-items:center; gap:8px; padding:12px 16px; text-decoration:none; border-radius:999px; font-size:13px; font-weight:600; border:1px solid rgba(255,255,255,0.1); color:#171717; background:rgba(255,255,255,0.04); }
        .td-action.primary { color:#17120a; background:#c9a84c; border-color:#c9a84c; }
        .td-list { display:grid; gap:14px; }
        .td-item { display:grid; grid-template-columns:92px minmax(0,1fr) auto; gap:18px; align-items:center; }
        .td-thumb { width:92px; height:68px; border-radius:16px; object-fit:cover; background:rgba(255,255,255,0.05); }
        .td-title { font-size:16px; margin-bottom:4px; color: #171717; font-weight: 600; }
        .td-meta { color:#6b7280; font-size:13px; line-height:1.5; }
        .td-price { font-size:18px; color:#c9a84c; white-space:nowrap; font-weight: 700; }
        .td-contract { background: linear-gradient(180deg, rgba(20,20,20,0.96) 0%, rgba(11,11,11,0.98) 100%); border: 1px solid rgba(37,99,235,0.14); border-radius: 16px; padding: 16px; margin-bottom: 12px; }
        .td-contract-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .td-contract-title { font-size: 16px; font-weight: 600; color: #e8e4dc; }
        .td-contract-status { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
        .td-contract-status.pending { background: rgba(37,99,235,0.2); color: #c9a84c; }
        .td-contract-status.active { background: rgba(76,201,76,0.2); color: #4cc94c; }
        .td-contract-status.signed { background: rgba(76,168,201,0.2); color: #4ca8c9; }
        .td-contract-status.unknown { background: rgba(160,160,160,0.15); color: #9f9587; }
        .td-contract-meta { font-size: 13px; color: #9f9587; line-height: 1.4; }
        .td-contract-rent { font-size: 18px; color: #c9a84c; font-weight: 600; margin-top: 4px; }
        
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
          <Link className="td-action primary" to="/properties">Browse Properties</Link>
          <Link className="td-action" to="/dashboard/tenant/saved-properties">Saved Properties</Link>
          <Link className="td-action" to="/dashboard/tenant/applications">My Applications</Link>
          <Link className="td-action" to="/dashboard/tenant/digital-contracts">Digital Contracts</Link>
          <Link className="td-action" to="/dashboard/tenant/messages">Messages</Link>
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