import { useState, useEffect } from 'react';
import {
  Building, Plus, Edit2, Trash2, Search, Filter, MapPin, Bed, Bath,
  Square, Eye, Heart, Shield, TrendingUp, DollarSign
} from 'lucide-react';
import Api from '../../services/api';

const VITE_STORAGE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? '';

const getImage = (property: any): string => {
  if (property.images?.length) {
    const i = property.images[0];
    return i.startsWith('http') ? i : `${VITE_STORAGE}/storage/${i}`;
  }
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231E2D4A'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%23C89128'%3ENo Image%3C/text%3E%3C/svg%3E`;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);

const OweruProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    address: '',
    price: '',
    type: 'oweru_rental',
    bedrooms: '',
    bathrooms: '',
    area: '',
    featured: true,
    available: true,
    amenities: ''
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await Api.getAdminProperties({ type: 'oweru_rental' });
      setProperties(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load Oweru properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProperty) {
        await Api.updateAdminProperty(editingProperty.id, formData);
        alert('Oweru property updated successfully!');
      } else {
        await Api.createAdminProperty(formData);
        alert('Oweru property created successfully!');
      }
      
      setShowAddModal(false);
      setEditingProperty(null);
      setFormData({
        title: '',
        description: '',
        location: '',
        address: '',
        price: '',
        type: 'oweru_rental',
        bedrooms: '',
        bathrooms: '',
        area: '',
        featured: true,
        available: true,
        amenities: ''
      });
      loadProperties();
    } catch (error: any) {
      console.error('Failed to save property:', error);
      alert(error?.response?.data?.message || 'Failed to save property');
    }
  };

  const handleEdit = (property: any) => {
    setEditingProperty(property);
    setFormData({
      title: property.title || '',
      description: property.description || '',
      location: property.location || '',
      address: property.address || '',
      price: property.price || '',
      type: property.type || 'oweru_rental',
      bedrooms: property.bedrooms || '',
      bathrooms: property.bathrooms || '',
      area: property.area || '',
      featured: property.featured || true,
      available: property.available || true,
      amenities: property.amenities || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (propertyId: number) => {
    if (confirm('Are you sure you want to delete this Oweru property?')) {
      try {
        await Api.deleteAdminProperty(propertyId);
        alert('Oweru property deleted successfully!');
        loadProperties();
      } catch (error) {
        console.error('Failed to delete property:', error);
        alert('Failed to delete property');
      }
    }
  };

  const filteredProperties = properties.filter(property =>
    property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: '#080808',
      color: '#e8e4dc',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <style>{`
        :root {
          --color-background: #080808;
          --color-surface: #1a1a1a;
          --color-surface-light: #252525;
          --color-border: rgba(201, 168, 76, 0.2);
          --color-primary: #c9a84c;
          --color-primary-light: #e8c97a;
          --color-text: #e8e4dc;
          --color-text-muted: #7a7060;
          --color-success: #10b981;
          --color-danger: #ef4444;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>
              Oweru Rental Properties
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', margin: 0 }}>
              Manage properties that appear on the homepage
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-background)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} />
            Add Oweru Property
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)'
          }} />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text)',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '8px',
              background: 'rgba(201, 168, 76, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text)' }}>
                {properties.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Total Properties
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={20} style={{ color: 'var(--color-success)' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text)' }}>
                {properties.filter(p => p.featured).length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Featured
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={20} style={{ color: 'var(--color-danger)' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text)' }}>
                {formatCurrency(properties.reduce((sum, p) => sum + (p.price || 0), 0))}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Total Value
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          Loading Oweru properties...
        </div>
      ) : filteredProperties.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px'
        }}>
          <Building size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            {searchTerm ? 'No properties found' : 'No Oweru properties yet'}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
            {searchTerm ? 'Try adjusting your search' : 'Add properties to feature on the homepage'}
          </div>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-background)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Add First Property
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '20px' 
        }}>
          {filteredProperties.map((property) => (
            <div key={property.id} style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Property Image */}
              <div style={{ 
                height: '200px',
                background: `url(${getImage(property)}) center/cover`,
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'var(--color-primary)',
                  color: 'var(--color-background)',
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  Oweru Rental
                </div>
                {property.featured && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(16, 185, 129, 0.9)',
                    color: 'white',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Shield size={12} />
                    Featured
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div style={{ padding: '16px' }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  color: 'var(--color-text)', 
                  margin: '0 0 8px' 
                }}>
                  {property.title}
                </h3>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  color: 'var(--color-text-muted)', 
                  fontSize: '13px', 
                  marginBottom: '12px' 
                }}>
                  <MapPin size={12} />
                  {property.location}
                </div>

                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 700, 
                  color: 'var(--color-primary)', 
                  marginBottom: '12px' 
                }}>
                  {formatCurrency(property.price)}
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: '4px' }}>
                    /month
                  </span>
                </div>

                {property.bedrooms && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    fontSize: '13px', 
                    color: 'var(--color-text-muted)', 
                    marginBottom: '12px' 
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Bed size={12} />
                      {property.bedrooms} beds
                    </span>
                    {property.bathrooms && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bath size={12} />
                        {property.bathrooms} baths
                      </span>
                    )}
                    {property.area && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Square size={12} />
                        {property.area}m²
                      </span>
                    )}
                  </div>
                )}

                <p style={{ 
                  fontSize: '13px', 
                  color: 'var(--color-text-muted)', 
                  marginBottom: '16px', 
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {property.description}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(property)}
                    style={{
                      background: 'transparent',
                      color: 'var(--color-primary)',
                      border: `1px solid var(--color-primary)`,
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(property.id)}
                    style={{
                      background: 'transparent',
                      color: 'var(--color-danger)',
                      border: `1px solid var(--color-danger)`,
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 600, 
              color: 'var(--color-text)', 
              margin: '0 0 20px' 
            }}>
              {editingProperty ? 'Edit Oweru Property' : 'Add Oweru Property'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  autoComplete="off"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter property title"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the property features, amenities, and location..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  autoComplete="off"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Dar es Salaam, Arusha, Mwanza"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  autoComplete="street-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address or street name"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Price (TZS) *
                </label>
                <input
                  type="number"
                  name="price"
                  autoComplete="off"
                  required
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., 500000"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    Area (m²)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Amenities
                </label>
                <textarea
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  rows={2}
                  placeholder="e.g. Parking, Security, Pool, WiFi"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>Featured</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>Available</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProperty(null);
                    setFormData({
                      title: '',
                      description: '',
                      location: '',
                      address: '',
                      price: '',
                      type: 'oweru_rental',
                      bedrooms: '',
                      bathrooms: '',
                      area: '',
                      featured: true,
                      available: true,
                      amenities: ''
                    });
                  }}
                  style={{
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--color-primary)',
                    color: 'var(--color-background)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {editingProperty ? 'Update Property' : 'Create Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OweruProperties;
