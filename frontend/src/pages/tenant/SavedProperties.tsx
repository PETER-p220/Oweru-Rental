import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, formatCurrency, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle } from './tenantPageStyles';
import { X, MapPin, Bed, Bath, Square, Home as HomeIcon } from 'lucide-react';

interface SavedPropertyItem {
  id: number;
  property?: any;
}

const SavedProperties = () => {
  const [items, setItems] = useState<SavedPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await Api.getSavedProperties();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load saved properties.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter(({ property }) => {
    const hay = `${property?.title || ''} ${property?.location || ''}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  }), [items, search]);

  const handleViewProperty = (property: any) => {
    setSelectedProperty(property);
    setShowDetailsModal(true);
  };

  const getImage = (property: any) => {
    if (property?.images?.[0]) {
      return property.images[0];
    }
    return `https://picsum.photos/seed/property${property?.id || 0}/400/300.jpg`;
  };

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Tenant Workspace</div>
        <h1 style={headingStyle}>Saved Properties</h1>
        <p style={descriptionStyle}>Properties saved from your tenant account.</p>
        <div style={{ marginTop: '18px', maxWidth: '360px' }}><input style={inputStyle} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search saved properties" /></div>
      </section>
      <section style={panelStyle}>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        {loading ? <div style={{ color: '#9f9587' }}>Loading saved properties...</div> : filtered.length === 0 ? <div style={{ color: '#9f9587' }}>No saved properties found.</div> : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {filtered.map(({ id, property }) => (
              <div key={id} style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#1a1a1a' }}>
                  <img 
                    src={getImage(property)} 
                    alt={property?.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{property?.title || 'Untitled property'}</div>
                  <div style={{ color: '#9f9587', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} />
                    {property?.location || 'No location'}
                  </div>
                  {property?.bedrooms && (
                    <div style={{ color: '#9f9587', fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {property.bedrooms && <><Bed size={10} /> {property.bedrooms} bed</>}
                      {property.bathrooms && <><Bath size={10} /> {property.bathrooms} bath</>}
                      {property.area && <><Square size={10} /> {property.area} sqm</>}
                    </div>
                  )}
                </div>
                <div style={{ color: '#c9a84c', fontSize: '20px', fontWeight: '500' }}>{formatCurrency(property?.price)}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={buttonStyle('primary')} onClick={() => handleViewProperty(property)}>View</button>
                  <button style={buttonStyle('danger')} onClick={() => Api.unsaveProperty(property?.id || id).then(load)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Property Details Modal */}
      {showDetailsModal && selectedProperty && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            width: '90%',
            border: '1px solid rgba(201,168,76,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#c9a84c', fontSize: '24px', margin: 0 }}>{selectedProperty.title}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#9f9587',
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Property Images */}
            {selectedProperty.images && selectedProperty.images.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {selectedProperty.images.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${selectedProperty.title} - Image ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid rgba(201,168,76,0.1)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Property Details */}
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ color: '#9f9587', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} />
                {selectedProperty.location}
              </div>

              {selectedProperty.description && (
                <div style={{ color: '#ffffff', lineHeight: '1.6' }}>
                  {selectedProperty.description}
                </div>
              )}

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {selectedProperty.bedrooms && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9f9587' }}>
                    <Bed size={16} />
                    {selectedProperty.bedrooms} bedroom{selectedProperty.bedrooms !== 1 ? 's' : ''}
                  </div>
                )}
                {selectedProperty.bathrooms && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9f9587' }}>
                    <Bath size={16} />
                    {selectedProperty.bathrooms} bathroom{selectedProperty.bathrooms !== 1 ? 's' : ''}
                  </div>
                )}
                {selectedProperty.area && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9f9587' }}>
                    <Square size={16} />
                    {selectedProperty.area} sqm
                  </div>
                )}
              </div>

              <div style={{ fontSize: '24px', color: '#c9a84c', fontWeight: '500' }}>
                {formatCurrency(selectedProperty.price)}
                {selectedProperty.property_type === 'rental' && (
                  <span style={{ fontSize: '14px', color: '#9f9587', fontWeight: '300', marginLeft: '4px' }}>
                    /month
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedProperties;
