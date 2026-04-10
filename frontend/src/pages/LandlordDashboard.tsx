import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Building, DollarSign, FileText, Plus, Users } from 'lucide-react';
import Api from '../services/api';
import { formatCurrency } from './landlord/landlordPageStyles';

interface DashboardStats {
  total_properties?: number;
  active_tenants?: number;
  monthly_revenue?: number;
  total_revenue?: number;
  occupancy_rate?: number;
  pending_contracts?: number;
}

interface ContractItem {
  id: number;
  property_id: number;
  property_title?: string;
  tenant_id: number;
  tenant_name?: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  status: string;
  payment_status: string;
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
  available?: boolean;
}

const LandlordDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({});
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [applicationCount, setApplicationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [statsResponse, propertiesResponse, applicationsResponse, contractsResponse] = await Promise.all([
          Api.getOwnerDashboard(),
          Api.getOwnerProperties(),
          Api.getOwnerApplications(),
          Api.getOwnerContracts().catch(() => ({ data: [] })), // Handle if no contracts yet
        ]);

        setStats(statsResponse.data || {});
        setProperties(Array.isArray(propertiesResponse.data) ? propertiesResponse.data.slice(0, 5) : []);
        setApplicationCount(Array.isArray(applicationsResponse.data) ? applicationsResponse.data.length : 0);
        setContracts(Array.isArray(contractsResponse.data) ? contractsResponse.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const statCards = useMemo(() => [
    { icon: Building, label: 'Total Properties', value: stats.total_properties ?? 0, helper: 'Live owner portfolio' },
    { icon: FileText, label: 'Applications', value: applicationCount, helper: 'Current submissions' },
    { icon: Users, label: 'Active Tenants', value: stats.active_tenants ?? 0, helper: 'Active contracts' },
    { icon: DollarSign, label: 'Monthly Revenue', value: formatCurrency(stats.monthly_revenue), helper: `${Number(stats.occupancy_rate ?? 0).toFixed(1)}% occupancy` },
    { icon: FileText, label: 'Pending Contracts', value: stats.pending_contracts ?? contracts.filter(c => c.status === 'pending_signature').length, helper: 'Awaiting signature' },
  ], [applicationCount, stats, contracts]);

  const quickActions = [
    { label: 'Add Property', icon: Plus, to: 'add-property', primary: true },
    { label: 'My Properties', icon: Building, to: 'my-properties', primary: false },
    { label: 'Applications', icon: FileText, to: 'applications', primary: false },
    { label: 'Digital Contracts', icon: FileText, to: 'digital-contracts', primary: false },
    { label: 'Contracts', icon: FileText, to: 'contracts', primary: false },
    { label: 'Analytics', icon: BarChart3, to: 'analytics', primary: false },
  ];

  const imageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL}/storage/${path}`;
  };

  if (loading) {
    return <div style={{ color: '#9f9587' }}>Loading landlord dashboard...</div>;
  }

  if (error) {
    return <div style={{ color: '#e07070' }}>{error}</div>;
  }

  return (
    <>
      <style>{`
        .ld-wrap { max-width: 1100px; margin: 0 auto; }
        .ld-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #c9a84c;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ld-eyebrow::after { content: ''; flex: 1; height: 1px; background: rgba(37,99,235,0.15); }
        .ld-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-bottom: 40px;
        }
        .ld-stat {
          background: linear-gradient(180deg, rgba(20,20,20,0.96) 0%, rgba(11,11,11,0.98) 100%);
          border: 1px solid rgba(37,99,235,0.14);
          border-radius: 22px;
          padding: 24px;
          color: #e8e4dc;
        }
        .ld-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: rgba(37,99,235,0.12);
          color: #c9a84c;
          margin-bottom: 16px;
        }
        .ld-stat-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #9f9587;
        }
        .ld-stat-value {
          font-size: 32px;
          margin-top: 8px;
          margin-bottom: 6px;
        }
        .ld-stat-helper {
          color: #9f9587;
          font-size: 13px;
        }
        .ld-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 42px;
        }
        .ld-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          text-decoration: none;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.1);
          color: #e8e4dc;
          background: rgba(255,255,255,0.04);
        }
        .ld-action.primary {
          color: #17120a;
          background: #c9a84c;
          border-color: #c9a84c;
        }
        .ld-list {
          display: grid;
          gap: 14px;
        }
        .ld-item {
          display: grid;
          grid-template-columns: 92px minmax(0, 1fr) auto auto;
          gap: 18px;
          align-items: center;
          background: linear-gradient(180deg, rgba(20,20,20,0.96) 0%, rgba(11,11,11,0.98) 100%);
          border: 1px solid rgba(37,99,235,0.14);
          border-radius: 22px;
          padding: 18px;
          color: #e8e4dc;
        }
        .ld-thumb {
          width: 92px;
          height: 68px;
          border-radius: 16px;
          object-fit: cover;
          background: rgba(255,255,255,0.05);
        }
        .ld-title { font-size: 18px; margin-bottom: 6px; }
        .ld-meta { color: #9f9587; font-size: 14px; line-height: 1.6; }
        .ld-price { font-size: 22px; color: #c9a84c; white-space: nowrap; }
        .ld-links {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .ld-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          text-decoration: none;
          color: #e8e4dc;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          font-size: 13px;
        }
        @media (max-width: 820px) {
          .ld-item {
            grid-template-columns: 1fr;
          }
          .ld-links {
            justify-content: flex-start;
          }
        }
      `}</style>

      <div className="ld-wrap">
        <div className="ld-eyebrow">Overview</div>
        <div className="ld-stats">
          {statCards.map((card) => (
            <div key={card.label} className="ld-stat">
              <div className="ld-stat-icon"><card.icon size={18} /></div>
              <div className="ld-stat-label">{card.label}</div>
              <div className="ld-stat-value">{card.value}</div>
              <div className="ld-stat-helper">{card.helper}</div>
            </div>
          ))}
        </div>

        <div className="ld-eyebrow">Quick Actions</div>
        <div className="ld-actions">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to} className={`ld-action${action.primary ? ' primary' : ''}`}>
              <action.icon size={15} />
              {action.label}
              {action.primary && <ArrowRight size={14} />}
            </Link>
          ))}
        </div>

        <div className="ld-eyebrow">Recent Properties</div>
        <div className="ld-list">
          {properties.length === 0 ? (
            <div style={{ color: '#9f9587' }}>No properties yet.</div>
          ) : (
            properties.map((property) => (
              <div key={property.id} className="ld-item">
                {property.images?.[0] ? (
                  <img className="ld-thumb" src={imageUrl(property.images[0])} alt={property.title || 'Property'} />
                ) : (
                  <div className="ld-thumb" />
                )}
                <div>
                  <div className="ld-title">{property.title || 'Untitled property'}</div>
                  <div className="ld-meta">
                    {property.location || 'No location'}
                    <br />
                    {property.bedrooms ?? 0} bd • {property.bathrooms ?? 0} ba • {property.area ?? 0} m²
                    <br />
                    {property.available ? 'Available' : 'Occupied'}
                  </div>
                </div>
                <div className="ld-price">{formatCurrency(property.price)}</div>
                <div className="ld-links">
                  <Link className="ld-link" to={`/dashboard/landlord/properties/${property.id}/edit`}>Edit</Link>
                  <Link className="ld-link" to={`/property/${property.id}`}>View</Link>
                </div>
              </div>
            ))
          )}
        </div>

        {properties.length > 0 && (
          <div style={{ marginTop: '18px', textAlign: 'right' }}>
            <Link to="my-properties" style={{ color: '#c9a84c', textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              View all properties <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default LandlordDashboard;
