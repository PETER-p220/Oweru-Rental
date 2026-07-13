import { useState, useEffect } from 'react';
import {
  Building, Plus, Edit2, Trash2, Search, MapPin, Bed, Bath,
  Square, Shield, TrendingUp, DollarSign, Upload, X, Check, Video
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

const commonAmenities = [
  'Parking', 'Security', 'Gym', 'Pool', 'Garden', 'Balcony',
  'Air Conditioning', 'Heating', 'WiFi', 'Kitchen', 'Laundry',
  'Elevator', 'Storage', 'Pet Friendly', 'Furnished',
];

interface MediaItem {
  file?: File;
  preview: string;
  uploadedUrl?: string;
}

const parseAmenities = (amenities: unknown): string[] => {
  if (Array.isArray(amenities)) return amenities.filter((a): a is string => typeof a === 'string');
  if (typeof amenities === 'string' && amenities.trim()) {
    try {
      const parsed = JSON.parse(amenities);
      if (Array.isArray(parsed)) return parsed.filter((a): a is string => typeof a === 'string');
    } catch { /* fall through */ }
    return amenities.split(',').map(a => a.trim()).filter(Boolean);
  }
  return [];
};

const mediaUrl = (path: string) =>
  path.startsWith('http') ? path : `${VITE_STORAGE}/${path.replace(/^\//, '')}`;

const emptyForm = () => ({
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
  amenities: [] as string[],
  images: [] as MediaItem[],
  videos: [] as MediaItem[],
});

const OweruProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [formData, setFormData] = useState(emptyForm());
  const [uploading, setUploading] = useState(false);

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

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, { file, preview }],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (!file.type.startsWith('video/')) return;
      const preview = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, { file, preview }],
      }));
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const removeVideo = (index: number) => {
    setFormData(prev => {
      const item = prev.videos[index];
      if (item?.file && item.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);
      return { ...prev, videos: prev.videos.filter((_, i) => i !== index) };
    });
  };

  const uploadMediaFiles = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    const base = import.meta.env.VITE_API_URL;

    const newImages = formData.images.filter(i => i.file);
    const existingImages = formData.images.filter(i => i.uploadedUrl).map(i => i.uploadedUrl!);
    let uploadedImages = [...existingImages];

    if (newImages.length > 0) {
      const fd = new FormData();
      newImages.forEach((item, index) => fd.append(`images[${index}]`, item.file!));
      const res = await fetch(`${base}/api/admin/properties/upload-images`, { method: 'POST', headers, body: fd });
      if (!res.ok) throw new Error('Failed to upload images');
      const data = await res.json();
      uploadedImages = [...uploadedImages, ...(data.images || [])];
    }

    const newVideos = formData.videos.filter(v => v.file);
    const existingVideos = formData.videos.filter(v => v.uploadedUrl).map(v => v.uploadedUrl!);
    let uploadedVideos = [...existingVideos];

    if (newVideos.length > 0) {
      const fd = new FormData();
      newVideos.forEach((item, index) => fd.append(`videos[${index}]`, item.file!));
      const res = await fetch(`${base}/api/admin/properties/upload-videos`, { method: 'POST', headers, body: fd });
      if (!res.ok) throw new Error('Failed to upload videos');
      const data = await res.json();
      uploadedVideos = [...uploadedVideos, ...(data.videos || [])];
    }

    return { images: uploadedImages, videos: uploadedVideos };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0 && formData.videos.length === 0) {
      alert('Please add at least one image or video.');
      return;
    }

    try {
      setUploading(true);
      const { images, videos } = await uploadMediaFiles();
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        address: formData.address,
        price: formData.price,
        type: formData.type,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area: formData.area,
        featured: formData.featured,
        available: formData.available,
        amenities: formData.amenities,
        images,
        videos,
        landlord_name: 'Oweru Rental',
      };

      if (editingProperty) {
        await Api.updateAdminProperty(editingProperty.id, payload);
        alert('Oweru property updated successfully!');
      } else {
        await Api.createAdminProperty(payload);
        alert('Oweru property created successfully!');
      }

      setShowAddModal(false);
      setEditingProperty(null);
      setFormData(emptyForm());
      loadProperties();
    } catch (error: any) {
      console.error('Failed to save property:', error);
      alert(error?.message || error?.response?.data?.message || 'Failed to save property');
    } finally {
      setUploading(false);
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
      featured: property.featured ?? true,
      available: property.available ?? true,
      amenities: parseAmenities(property.amenities),
      images: (property.images || []).map((url: string) => ({
        preview: mediaUrl(url),
        uploadedUrl: url,
      })),
      videos: (property.videos || []).map((url: string) => ({
        preview: mediaUrl(url),
        uploadedUrl: url,
      })),
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
            onClick={() => { setEditingProperty(null); setFormData(emptyForm()); setShowAddModal(true); }}
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
              onClick={() => { setEditingProperty(null); setFormData(emptyForm()); setShowAddModal(true); }}
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
            maxWidth: '720px',
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
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  Amenities
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
                  {commonAmenities.map(amenity => {
                    const selected = formData.amenities.includes(amenity);
                    return (
                      <div
                        key={amenity}
                        onClick={() => handleAmenityToggle(amenity)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                          border: `1.5px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          background: selected ? 'rgba(201, 168, 76, 0.12)' : 'var(--color-background)',
                        }}
                      >
                        <div style={{
                          width: 16, height: 16, borderRadius: '3px', flexShrink: 0,
                          border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-text-muted)'}`,
                          background: selected ? 'var(--color-primary)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && <Check size={10} color="#080808" />}
                        </div>
                        <span style={{ fontSize: '12px', color: selected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                          {amenity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Images */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  Property Images
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                  {formData.images.map((item, index) => (
                    <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <img src={item.preview} alt={`Property ${index + 1}`}
                        style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }} />
                      <button type="button" onClick={() => removeImage(index)}
                        style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label style={{
                    height: '90px', borderRadius: '8px', border: '2px dashed var(--color-border)',
                    background: 'var(--color-background)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    <Upload size={20} style={{ color: 'var(--color-text-muted)', marginBottom: 4 }} />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Add Images</span>
                  </label>
                </div>
                {formData.images.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {formData.images.length} image{formData.images.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>

              {/* Videos */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  Property Videos
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                  {formData.videos.map((item, index) => (
                    <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <video src={item.preview} style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }} muted />
                      <button type="button" onClick={() => removeVideo(index)}
                        style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label style={{
                    height: '90px', borderRadius: '8px', border: '2px dashed var(--color-border)',
                    background: 'var(--color-background)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <input type="file" multiple accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} />
                    <Video size={20} style={{ color: 'var(--color-text-muted)', marginBottom: 4 }} />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Add Videos</span>
                  </label>
                </div>
                {formData.videos.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {formData.videos.length} video{formData.videos.length !== 1 ? 's' : ''} selected
                  </div>
                )}
                <div style={{ marginTop: 4, fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Add at least one image or video
                </div>
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
                    setFormData(emptyForm());
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
                  disabled={uploading}
                  style={{
                    background: uploading ? 'var(--color-text-muted)' : 'var(--color-primary)',
                    color: 'var(--color-background)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {uploading ? 'Saving…' : editingProperty ? 'Update Property' : 'Create Property'}
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
