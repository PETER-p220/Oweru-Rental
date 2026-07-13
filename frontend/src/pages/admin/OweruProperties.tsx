import { useState, useEffect } from 'react';
import {
  Building, Plus, Edit2, Trash2, Search, MapPin, Bed, Bath,
  Square, Shield, DollarSign, Upload, X, Check, Video, CheckCircle,
} from 'lucide-react';
import Api from '../../services/api';

const VITE_STORAGE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? '';

const C = {
  pageBg:    '#F1F5F9',
  headerBg:  '#1E293B',
  cardBg:    '#FFFFFF',
  border:    '#E2E8F0',
  text:      '#0F172A',
  textSub:   '#475569',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',
  slate100:  '#F1F5F9',
  slate200:  '#E2E8F0',
  gold:      '#C89128',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.26)',
  goldBg:    'rgba(200,145,40,0.08)',
  goldBorder:'rgba(200,145,40,0.28)',
  green:     '#16A34A', greenBg: '#DCFCE7',
  blue:      '#2563EB', blueBg:  '#DBEAFE',
  amber:     '#D97706', amberBg: '#FEF3C7',
  red:       '#DC2626', redBg:   '#FFE4E6',
};

const PLACEHOLDER_IMG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23E2E8F0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%2394A3B8'%3ENo Image%3C/text%3E%3C/svg%3E`;

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

const getImage = (property: any): string => {
  if (property.images?.length) return mediaUrl(property.images[0]);
  return PLACEHOLDER_IMG;
};

const emptyForm = () => ({
  title: '', description: '', location: '', address: '', price: '',
  type: 'oweru_rental', bedrooms: '', bathrooms: '', area: '',
  featured: true, available: true,
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

  const inputCss: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    background: C.cardBg, border: `1.5px solid ${C.border}`,
    color: C.text, fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  };

  const labelCss: React.CSSProperties = {
    display: 'block', marginBottom: '7px', fontWeight: 700,
    fontSize: '13px', color: C.text, fontFamily: 'DM Sans, sans-serif',
  };

  useEffect(() => { loadProperties(); }, []);

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

  const openAddModal = () => {
    setEditingProperty(null);
    setFormData(emptyForm());
    setShowAddModal(true);
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
    Array.from(e.target.files || []).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, { file, preview: event.target?.result as string }],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      if (!file.type.startsWith('video/')) return;
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, { file, preview: URL.createObjectURL(file) }],
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
        title: formData.title, description: formData.description,
        location: formData.location, address: formData.address,
        price: formData.price, type: formData.type,
        bedrooms: formData.bedrooms, bathrooms: formData.bathrooms, area: formData.area,
        featured: formData.featured, available: formData.available,
        amenities: formData.amenities, images, videos,
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
      alert(error?.message || error?.response?.data?.message || 'Failed to save property');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (property: any) => {
    setEditingProperty(property);
    setFormData({
      title: property.title || '', description: property.description || '',
      location: property.location || '', address: property.address || '',
      price: property.price || '', type: property.type || 'oweru_rental',
      bedrooms: property.bedrooms || '', bathrooms: property.bathrooms || '',
      area: property.area || '', featured: property.featured ?? true,
      available: property.available ?? true,
      amenities: parseAmenities(property.amenities),
      images: (property.images || []).map((url: string) => ({ preview: mediaUrl(url), uploadedUrl: url })),
      videos: (property.videos || []).map((url: string) => ({ preview: mediaUrl(url), uploadedUrl: url })),
    });
    setShowAddModal(true);
  };

  const handleDelete = async (propertyId: number) => {
    if (!confirm('Are you sure you want to delete this Oweru property?')) return;
    try {
      await Api.deleteAdminProperty(propertyId);
      loadProperties();
    } catch {
      alert('Failed to delete property');
    }
  };

  const filteredProperties = properties.filter(p =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featuredCount = properties.filter(p => p.featured).length;
  const totalValue = properties.reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .op-input:focus { border-color: ${C.gold} !important; box-shadow: 0 0 0 3px rgba(200,145,40,0.12); }
        .op-card { transition: box-shadow 0.2s, transform 0.2s; }
        .op-card:hover { box-shadow: 0 8px 28px rgba(15,23,42,0.10) !important; transform: translateY(-2px); }
        .amenity-item:hover { border-color: ${C.gold} !important; }
        .upload-zone:hover { border-color: ${C.gold} !important; }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: C.headerBg, borderRadius: '14px', padding: '24px 28px', marginBottom: '20px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '6px' }}>
                Admin · Oweru Rentals
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  Oweru Rental Properties
                </h1>
                <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.14)', borderRadius: '999px', fontSize: '12px', color: '#fff', fontWeight: 700 }}>
                  {properties.length} total
                </span>
              </div>
              <p style={{ margin: 0, color: C.textLight, fontSize: '14px', lineHeight: 1.6 }}>
                Manage homepage featured rentals — add images, videos, and amenities.
              </p>
            </div>
            <button type="button" onClick={openAddModal} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '11px 22px', backgroundColor: C.gold, color: '#fff',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
              boxShadow: C.goldGlow, cursor: 'pointer', alignSelf: 'flex-start',
            }}>
              <Plus size={16} /> Add Oweru Property
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total Properties', value: properties.length, color: C.text, bg: C.slate100, icon: Building },
            { label: 'Featured', value: featuredCount, color: C.green, bg: C.greenBg, icon: Shield },
            { label: 'Available', value: properties.filter(p => p.available).length, color: C.blue, bg: C.blueBg, icon: CheckCircle },
            { label: 'Portfolio Value', value: formatCurrency(totalValue), color: C.amber, bg: C.amberBg, icon: DollarSign },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} style={{
              backgroundColor: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '12px',
              padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px',
              boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div style={{ fontSize: typeof value === 'number' ? '22px' : '15px', fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{value}</div>
                <div style={{ fontSize: '11px', color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '420px', backgroundColor: C.slate100, border: `1.5px solid ${C.border}`, borderRadius: '8px', padding: '0 12px' }}>
            <Search size={15} style={{ color: C.textMuted, flexShrink: 0 }} />
            <input
              type="text" placeholder="Search by title or location…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '9px 0', border: 'none', background: 'transparent', color: C.text, fontSize: '13px', outline: 'none' }}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: C.textMuted }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Loading Oweru properties…
          </div>
        ) : filteredProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '14px' }}>
            <Building size={40} style={{ color: C.textMuted, opacity: 0.4, marginBottom: '14px' }} />
            <div style={{ fontSize: '17px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>
              {searchTerm ? 'No properties found' : 'No Oweru properties yet'}
            </div>
            <div style={{ fontSize: '14px', color: C.textMuted, marginBottom: '20px' }}>
              {searchTerm ? 'Try a different search term' : 'Add your first Oweru rental to feature on the homepage'}
            </div>
            {!searchTerm && (
              <button type="button" onClick={openAddModal} style={{
                padding: '10px 20px', background: C.gold, color: '#fff', border: 'none',
                borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: C.goldGlow,
              }}>
                Add First Property
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
            {filteredProperties.map(property => (
              <div key={property.id} className="op-card" style={{
                backgroundColor: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '14px',
                overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
              }}>
                <div style={{ height: '190px', background: `url(${getImage(property)}) center/cover`, position: 'relative' }}>
                  <span style={{
                    position: 'absolute', top: '10px', right: '10px', background: C.gold, color: '#fff',
                    padding: '3px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase',
                  }}>Oweru Rental</span>
                  {property.featured && (
                    <span style={{
                      position: 'absolute', top: '10px', left: '10px', background: C.green, color: '#fff',
                      padding: '3px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '4px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <Shield size={11} /> Featured
                    </span>
                  )}
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: C.text }}>{property.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: C.textMuted, fontSize: '13px', marginBottom: '10px' }}>
                    <MapPin size={13} /> {property.location}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: C.gold, marginBottom: '10px' }}>
                    {formatCurrency(property.price)}
                    <span style={{ fontSize: '12px', color: C.textMuted, fontWeight: 500, marginLeft: '4px' }}>/month</span>
                  </div>
                  {(property.bedrooms || property.bathrooms || property.area) && (
                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: C.textSub, marginBottom: '10px' }}>
                      {property.bedrooms > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Bed size={12} />{property.bedrooms}</span>}
                      {property.bathrooms > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Bath size={12} />{property.bathrooms}</span>}
                      {property.area > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Square size={12} />{property.area}m²</span>}
                    </div>
                  )}
                  {parseAmenities(property.amenities).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {parseAmenities(property.amenities).slice(0, 4).map(a => (
                        <span key={a} style={{ fontSize: '11px', padding: '2px 8px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '999px', color: C.gold, fontWeight: 600 }}>{a}</span>
                      ))}
                      {parseAmenities(property.amenities).length > 4 && (
                        <span style={{ fontSize: '11px', color: C.textMuted }}>+{parseAmenities(property.amenities).length - 4} more</span>
                      )}
                    </div>
                  )}
                  <p style={{ fontSize: '13px', color: C.textSub, margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {property.description}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => handleEdit(property)} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                      padding: '8px 12px', background: C.cardBg, border: `1.5px solid ${C.gold}`, borderRadius: '8px',
                      color: C.gold, fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    }}>
                      <Edit2 size={13} /> Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(property.id)} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                      padding: '8px 12px', background: C.redBg, border: `1.5px solid rgba(220,38,38,0.25)`, borderRadius: '8px',
                      color: C.red, fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }} onClick={() => !uploading && setShowAddModal(false)}>
          <div style={{
            background: C.cardBg, borderRadius: '14px', width: '100%', maxWidth: '760px',
            maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(15,23,42,0.18)',
            border: `1px solid ${C.border}`,
          }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ background: C.headerBg, padding: '20px 24px', borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '4px' }}>
                  {editingProperty ? 'Edit Property' : 'New Property'}
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                  {editingProperty ? editingProperty.title : 'Add Oweru Rental Property'}
                </h2>
              </div>
              <button type="button" onClick={() => !uploading && setShowAddModal(false)} style={{
                width: 32, height: 32, borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.12)',
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelCss}>Property Title *</label>
                  <input className="op-input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={inputCss} placeholder="e.g., Modern 2BR Apartment in Masaki" />
                </div>
                <div>
                  <label style={labelCss}>Location *</label>
                  <input className="op-input" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} style={inputCss} placeholder="Dar es Salaam, Masaki" />
                </div>
                <div>
                  <label style={labelCss}>Address</label>
                  <input className="op-input" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={inputCss} placeholder="Full street address" />
                </div>
                <div>
                  <label style={labelCss}>Monthly Price (TZS) *</label>
                  <input className="op-input" type="number" required min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={inputCss} placeholder="800000" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', gridColumn: '1 / -1' }}>
                  <div>
                    <label style={labelCss}>Bedrooms</label>
                    <input className="op-input" type="number" min="0" value={formData.bedrooms} onChange={e => setFormData({ ...formData, bedrooms: e.target.value })} style={inputCss} />
                  </div>
                  <div>
                    <label style={labelCss}>Bathrooms</label>
                    <input className="op-input" type="number" min="0" value={formData.bathrooms} onChange={e => setFormData({ ...formData, bathrooms: e.target.value })} style={inputCss} />
                  </div>
                  <div>
                    <label style={labelCss}>Area (m²)</label>
                    <input className="op-input" type="number" min="0" step="0.1" value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} style={inputCss} />
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelCss}>Description *</label>
                  <textarea className="op-input" required rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ ...inputCss, minHeight: '90px', resize: 'vertical' }} placeholder="Describe the property…" />
                </div>
              </div>

              {/* Amenities — checkbox grid (same as landlord) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelCss}>Amenities</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '8px' }}>
                  {commonAmenities.map(amenity => {
                    const selected = formData.amenities.includes(amenity);
                    return (
                      <div key={amenity} className="amenity-item"
                        onClick={() => handleAmenityToggle(amenity)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                          border: `1.5px solid ${selected ? C.gold : C.border}`,
                          background: selected ? C.goldBg : C.slate100,
                          transition: 'all 0.15s',
                        }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: '4px', flexShrink: 0,
                          border: `2px solid ${selected ? C.gold : C.textMuted}`,
                          background: selected ? C.gold : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && <Check size={11} color="#fff" />}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: selected ? C.gold : C.textSub }}>{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Images */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelCss}>Property Images</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                  {formData.images.map((item, index) => (
                    <div key={index} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                      <img src={item.preview} alt="" style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
                      <button type="button" onClick={() => removeImage(index)} style={{
                        position: 'absolute', top: 6, right: 6, width: 26, height: 26,
                        background: 'rgba(15,23,42,0.75)', border: 'none', borderRadius: '6px',
                        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><X size={13} /></button>
                    </div>
                  ))}
                  <label className="upload-zone" style={{
                    height: '100px', borderRadius: '10px', border: `2px dashed ${C.border}`,
                    background: C.slate100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    <Upload size={22} style={{ color: C.textMuted, marginBottom: 4 }} />
                    <span style={{ fontSize: '11px', color: C.textMuted, fontWeight: 600 }}>Add Images</span>
                  </label>
                </div>
              </div>

              {/* Videos */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelCss}>Property Videos</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                  {formData.videos.map((item, index) => (
                    <div key={index} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                      <video src={item.preview} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} muted />
                      <button type="button" onClick={() => removeVideo(index)} style={{
                        position: 'absolute', top: 6, right: 6, width: 26, height: 26,
                        background: 'rgba(15,23,42,0.75)', border: 'none', borderRadius: '6px',
                        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><X size={13} /></button>
                    </div>
                  ))}
                  <label className="upload-zone" style={{
                    height: '100px', borderRadius: '10px', border: `2px dashed ${C.border}`,
                    background: C.slate100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <input type="file" multiple accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} />
                    <Video size={22} style={{ color: C.textMuted, marginBottom: 4 }} />
                    <span style={{ fontSize: '11px', color: C.textMuted, fontWeight: 600 }}>Add Videos</span>
                  </label>
                </div>
                <div style={{ marginTop: 6, fontSize: '12px', color: C.textMuted }}>Add at least one image or video</div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', padding: '14px 16px', background: C.slate100, borderRadius: '10px', border: `1px solid ${C.border}` }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: C.text }}>
                  <input type="checkbox" checked={formData.featured} onChange={e => setFormData({ ...formData, featured: e.target.checked })} style={{ width: 16, height: 16, accentColor: C.gold }} />
                  Featured on homepage
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: C.text }}>
                  <input type="checkbox" checked={formData.available} onChange={e => setFormData({ ...formData, available: e.target.checked })} style={{ width: 16, height: 16, accentColor: C.gold }} />
                  Available for rent
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                <button type="button" disabled={uploading} onClick={() => setShowAddModal(false)} style={{
                  padding: '11px 20px', background: C.cardBg, border: `1.5px solid ${C.border}`,
                  borderRadius: '10px', color: C.textSub, fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                }}>Cancel</button>
                <button type="submit" disabled={uploading} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '11px 24px', background: uploading ? C.textMuted : C.gold, color: '#fff',
                  border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                  cursor: uploading ? 'not-allowed' : 'pointer', boxShadow: uploading ? 'none' : C.goldGlow,
                }}>
                  {uploading ? (
                    <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving…</>
                  ) : (
                    <>{editingProperty ? 'Update Property' : 'Create Property'}</>
                  )}
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
