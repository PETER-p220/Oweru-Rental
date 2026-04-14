import React, { useState, useEffect } from 'react';
import {
  Building, Search, Plus, Eye, MapPin, Home, Square, Users, Star,
  Trash2, AlertTriangle, X, Grid, List, ArrowUpDown
} from 'lucide-react';
import Api from '../../services/api';

/* ADMIN DASHBOARD STYLE TOKENS - Shared with AdminDashboard */
const t = {
  gold:    '#c9a84c',
  goldLt:  '#e8c97a',
  dark:    '#080808',
  dark2:   '#0e0e0e',
  dark3:   '#141414',
  cream:   '#e8e4dc',
  muted:   '#7a7060',
  border:  'rgba(37,99,235,0.12)',
  green:   '#10b981',
  red:     '#ef4444',
  blue:    '#2563eb',
  amber:   '#f59e0b',
};

const serif = { fontFamily: "'Playfair Display', 'Georgia', serif" };
const body = { fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" };

const card = {
  background: t.dark2,
  border: `1px solid ${t.border}`,
  borderRadius: 12,
  padding: 24,
};

const mobileStyles = `
  @media (max-width: 768px) {
    .properties-management { padding: 16px; }
    .stats-grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
    .property-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
  }
  @media (max-width: 480px) {
    .properties-management { padding: 12px; }
    .property-grid { grid-template-columns: 1fr; }
  }
`;

interface Property {
  id: number | string;
  title: string;
  description: string;
  price: number;
  location?: string;
  address?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  type: string;
  status?: string;
  featured?: boolean;
  images?: string[];
  isOweru?: boolean;           // New flag for Oweru properties
  created_at?: string;
  createdAt?: string;
}

const PropertiesManagement = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [oweruProperties, setOweruProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOweru, setLoadingOweru] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadAllProperties();
  }, []);

  const loadAllProperties = async () => {
    try {
      setLoading(true);

      // Load general properties
      const propertiesRes = await Api.getAdminProperties();
      const allProps = propertiesRes?.data || [];

      // Load Oweru properties separately
      setLoadingOweru(true);
      const oweruRes = await Api.getAdminProperties();
      const oweruOnly = (oweruRes?.data || []).filter((p: any) => 
        p.type === 'oweru_rental' || p.isOweru
      );

      setProperties(allProps.filter((p: any) => p.type !== 'oweru_rental'));
      setOweruProperties(oweruOnly);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
      setLoadingOweru(false);
    }
  };

  const handleDeleteProperty = async (id: number | string, isOweru: boolean = false) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      if (isOweru) {
        await Api.deleteAdminProperty(parseInt(id as string));
        setOweruProperties(prev => prev.filter(p => p.id !== id));
      } else {
        // For regular properties - adjust API call as needed
        await Api.deleteAdminProperty(parseInt(id as string));
        setProperties(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete property');
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 'Today' : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const filteredProperties = properties.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.location || p.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: t.cream }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 12 }}>Loading Properties...</div>
          <div style={{ color: t.muted, fontSize: 14 }}>Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="properties-management" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{mobileStyles}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ ...serif, fontSize: 32, fontWeight: 600, color: t.cream, margin: '0 0 8px' }}>
          Properties Management
        </h1>
        <p style={{ ...body, fontSize: 16, color: t.muted }}>
          Manage all listings including Oweru Rental properties
        </p>
      </div>

      {/* Oweru Rental Properties Section (Prominent like in Dashboard) */}
      <div style={{ ...card, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ ...serif, fontSize: 20, color: t.cream, margin: 0 }}>
              Oweru Rental Properties
            </h2>
            <p style={{ ...body, fontSize: 14, color: t.muted, margin: '4px 0 0' }}>
              Featured on homepage • {oweruProperties.length} properties
            </p>
          </div>
          <a
            href="/dashboard/admin/add-oweru-property"
            style={{
              background: t.gold,
              color: t.dark,
              padding: '10px 20px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
            }}
          >
            <Plus size={18} /> Add Oweru Property
          </a>
        </div>

        {loadingOweru ? (
          <div style={{ textAlign: 'center', padding: '40px', color: t.muted }}>
            Loading Oweru properties...
          </div>
        ) : oweruProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: t.muted }}>
            <Building size={48} style={{ opacity: 0.4, marginBottom: 16 }} />
            No Oweru Rental properties yet
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {oweruProperties.map((property) => (
              <div key={property.id} style={{
                background: t.dark3,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: 180,
                  background: `linear-gradient(135deg, ${t.dark2}, ${t.dark3})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <Building size={48} style={{ color: t.gold, opacity: 0.6 }} />
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: t.green,
                    color: t.dark,
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700
                  }}>
                    OWERU
                  </div>
                </div>

                <div style={{ padding: 20 }}>
                  <h3 style={{ ...serif, fontSize: 17, color: t.cream, margin: '0 0 8px' }}>
                    {property.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <MapPin size={14} style={{ color: t.gold }} />
                    <span style={{ ...body, color: t.muted, fontSize: 14 }}>
                      {property.location || property.address}
                    </span>
                  </div>

                  <div style={{ fontSize: 20, fontWeight: 600, color: t.gold, marginBottom: 16 }}>
                    {formatCurrency(property.price)}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button
                      onClick={() => {
                        setSelectedProperty(property);
                        setShowDeleteModal(true);
                      }}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        color: t.red,
                        border: `1px solid ${t.red}`,
                        padding: '10px',
                        borderRadius: 8,
                        fontSize: 13,
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Other Properties */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ ...serif, fontSize: 20, color: t.cream, margin: 0 }}>
            All Properties
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: t.muted }} />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  background: t.dark3,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  color: t.cream,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.border}` }}>
              {(['grid', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '10px 14px',
                    background: viewMode === mode ? t.gold : 'transparent',
                    color: viewMode === mode ? t.dark : t.muted,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {mode === 'grid' ? <Grid size={18} /> : <List size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: t.muted }}>
            No properties found matching your search.
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }} className="property-grid">
            {filteredProperties.map((p) => (
              <div key={p.id} style={{
                background: t.dark3,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                overflow: 'hidden'
              }}>
                <div style={{ height: 180, background: t.dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={48} style={{ color: t.muted }} />
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ ...serif, fontSize: 17, color: t.cream, margin: '0 0 8px' }}>{p.title}</h3>
                  <div style={{ color: t.muted, fontSize: 14, marginBottom: 12 }}>
                    {p.location || p.address}
                  </div>
                  <div style={{ color: t.gold, fontSize: 19, fontWeight: 600 }}>
                    {formatCurrency(p.price)}
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setSelectedProperty(p);
                        setShowDeleteModal(true);
                      }}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        color: t.red,
                        border: `1px solid ${t.red}`,
                        padding: '10px',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredProperties.map((p) => (
              <div key={p.id} style={{
                ...card,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 16
              }}>
                <Building size={32} style={{ color: t.gold, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: t.cream }}>{p.title}</div>
                  <div style={{ color: t.muted, fontSize: 14 }}>{p.location || p.address}</div>
                </div>
                <div style={{ color: t.gold, fontWeight: 600, textAlign: 'right' }}>
                  {formatCurrency(p.price)}
                </div>
                <button
                  onClick={() => {
                    setSelectedProperty(p);
                    setShowDeleteModal(true);
                  }}
                  style={{ color: t.red, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProperty && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ ...card, maxWidth: 420, textAlign: 'center' }}>
            <AlertTriangle size={48} style={{ color: t.red, marginBottom: 16 }} />
            <h3 style={{ ...serif, fontSize: 22, color: t.cream, marginBottom: 12 }}>
              Delete Property
            </h3>
            <p style={{ color: t.muted, marginBottom: 24 }}>
              Are you sure you want to delete <strong>"{selectedProperty.title}"</strong>?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: t.dark3,
                  color: t.cream,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteProperty(selectedProperty.id, selectedProperty.type === 'oweru_rental');
                  setShowDeleteModal(false);
                  setSelectedProperty(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: t.red,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesManagement;