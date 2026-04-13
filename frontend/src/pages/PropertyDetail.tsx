import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin, Bed, Bath, Square, Phone, Mail,
  Shield, CheckCircle, AlertCircle, Heart, Share2, QrCode,
  Download, ArrowLeft, X, Wifi, Zap,
  Building, Star, ChevronRight, Bookmark,
} from 'lucide-react';
import QRCode from 'qrcode';
import type { Property } from '../types';
import Api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/* ─────────────────────────────────────────────────────────────
   SHARED STYLE TOKENS
───────────────────────────────────────────────────────────── */
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
  blue:    '#38bdf8',
} as const;

const body: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif' };
const serif: React.CSSProperties = { fontFamily: 'Cormorant Garamond, Georgia, serif' };

const card: React.CSSProperties = {
  backgroundColor: t.dark2,
  border: `1px solid ${t.border}`,
  borderRadius: 10,
  overflow: 'hidden',
};

const metaBox: React.CSSProperties = {
  backgroundColor: 'rgba(37,99,235,0.03)',
  border: `1px solid rgba(37,99,235,0.09)`,
  borderRadius: 8,
  padding: '14px 16px',
  marginBottom: 14,
};

const label: React.CSSProperties = {
  ...body,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: t.muted,
  marginBottom: 4,
};

const pill = (color: string): React.CSSProperties => ({
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 9px',
  backgroundColor: `${color}18`,
  border: `1px solid ${color}30`,
  color,
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
});

const ghostBtn = (color: string): React.CSSProperties => ({
  ...body,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%',
  padding: '12px 20px',
  backgroundColor: `${color}10`,
  border: `1px solid ${color}30`,
  color,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  letterSpacing: '0.03em',
});

const solidBtn: React.CSSProperties = {
  ...body,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%',
  padding: '13px 20px',
  background: `linear-gradient(135deg, ${t.gold}, ${t.goldLt})`,
  border: 'none',
  color: '#111',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.04em',
  boxShadow: `0 4px 20px rgba(37,99,235,0.3)`,
};

/* ── Save button styles ── */
const saveBtn = (saved: boolean): React.CSSProperties => ({
  ...body,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  width: '100%',
  padding: '12px 20px',
  backgroundColor: saved ? `rgba(37,99,235,0.15)` : 'rgba(37,99,235,0.06)',
  border: saved ? `1px solid rgba(37,99,235,0.5)` : `1px solid rgba(37,99,235,0.2)`,
  color: saved ? t.gold : t.muted,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  letterSpacing: '0.03em',
});

/* ═════════════════════════════════════════════════════════════
   COMPONENT
═════════════════════════════════════════════════════════════ */
const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const getPropertyImageUrl = (property: any, imageIndex: number = 0) => {
    if (property?.images?.length > 0) {
      const image = property.images[imageIndex];
      return image.startsWith('http') ? image : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${image}`;
    }
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='600' viewBox='0 0 900 600'%3E%3Crect width='900' height='600' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='28' fill='%236b7280'%3ENo Image Available%3C/text%3E%3C/svg%3E`;
  };

  const [selectedImg, setSelectedImg] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showTenantOnlyModal, setShowTenantOnlyModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // Get query parameters for tracking
        const queryParams = searchParams.toString();
        
        // Mobile-friendly: Ensure proper URL handling
        const propertyId = Number(id);
        if (isNaN(propertyId) || propertyId <= 0) {
          throw new Error('Invalid property ID');
        }
        
        console.log('📱 Loading property:', { propertyId, queryParams, userAgent: navigator.userAgent, isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) });
        
        const res = await Api.getPropertyWithParams(propertyId, queryParams);
        setProperty(res.data);
      } catch (err: any) {
        console.error('PropertyDetail - Failed to load property:', err);
        // Mobile-friendly error handling
        const errorMessage = err?.response?.data?.message || err?.message || 'Property not found';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, searchParams]);

  const getFeatures = (property: Property | null): string[] => {
    if (!property) return [];
    const features = [];
    if (property.bedrooms > 0) features.push(`${property.bedrooms} Bedroom${property.bedrooms > 1 ? 's' : ''}`);
    if (property.bathrooms > 0) features.push(`${property.bathrooms} Bathroom${property.bathrooms > 1 ? 's' : ''}`);
    if (property.area) features.push(`${property.area} sqm`);
    if (property.type) features.push(property.type.charAt(0).toUpperCase() + property.type.slice(1));
    if (property.furnished) features.push('Furnished');
    if (property.amenities && Array.isArray(property.amenities)) {
      const commonFeatures = ['Air Conditioning', 'Parking Space', 'Balcony', 'Kitchen Appliances', 'High-Speed Internet', 'Backup Generator', 'Water Storage', '24/7 Security'];
      commonFeatures.forEach(feature => {
        if (property.amenities.some((amenity: string) =>
          amenity.toLowerCase().includes(feature.toLowerCase()) || feature.toLowerCase().includes(amenity.toLowerCase())
        )) { features.push(feature); }
      });
    }
    return features.length > 0 ? features : ['Standard Features'];
  };

  const getAmenities = (property: Property | null): string[] => {
    if (!property || !property.amenities || !Array.isArray(property.amenities)) return ['Basic Amenities'];
    return property.amenities.length > 0 ? property.amenities : ['Basic Amenities'];
  };

  const features = getFeatures(property);
  const amenities = getAmenities(property);

  const generateQRCode = async () => {
    try {
      if (!property) return;
      const trackingUrl = `https://oweru.co/p/${property.id}?ref=${property.dalali || 'DIRECT_OWERU'}`;
      const dataUrl = await QRCode.toDataURL(trackingUrl, {
        color: { dark: '#c9a84c', light: '#0e0e0e' },
        width: 260,
      });
      setQrCodeUrl(dataUrl);
      setShowQrModal(true);
    } catch (e) { console.error('QR error:', e); }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `oweru-property-${property.id}-qr.png`;
    a.click();
  };

  const shareProperty = async () => {
    if (!property) return;
    const trackingCode = property.dalali || property.tracking_code || 'DIRECT';
    const url = `https://oweru.co/p/${property.id}?ref=${trackingCode}_OWERU`;
    if (navigator.share) {
      try { await navigator.share({ title: property.title, text: property.address, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleSave = async () => {
    if (!property) return;
    try {
      if (isSaved) {
        await Api.unsaveProperty(property.id);
        setIsSaved(false);
      } else {
        await Api.saveProperty(property.id);
        setIsSaved(true);
      }
    } catch (e) {
      console.error('Failed to toggle save:', e);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) { setShowSignInModal(true); return; }
    if (!property) return;
    if (user?.userType !== 'tenant') {
      setShowTenantOnlyModal(true);
      return;
    }
    
    try {
      await Api.createApplication({
        property_id: property.id,
        message: `I am interested in applying for this property at ${property.address || property.location}. Please contact me for further details.`
      });
      alert('Application submitted successfully! The property owner will be notified.');
    } catch (error: any) {
      console.error('Application error:', error);
      alert(error?.response?.data?.message || 'Failed to submit application. Please try again.');
    }
  };

  const showPaymentSuccess = () => {
    alert('Payment initiated successfully! Please complete the payment on your phone.');
  };

  const trackingUrl = property
    ? `https://oweru.co/p/${property.id}?ref=${property.dalali?.code ?? 'DIRECT'}_OWERU`
    : 'https://oweru.co';

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

  return (
    <div style={{ background: t.dark, minHeight: '100vh', color: t.cream, fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.15); border-radius: 2px; }
        .pd-thumb { opacity: .45; transition: opacity .2s; cursor: pointer; }
        .pd-thumb:hover { opacity: .75; }
        .pd-thumb.active { opacity: 1; outline: 1.5px solid #c9a84c; }
        .pd-icon-btn { background: rgba(14,14,14,0.7); border: 1px solid rgba(37,99,235,0.15); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(8px); transition: all .2s; }
        .pd-icon-btn:hover { background: rgba(14,14,14,0.9); border-color: rgba(37,99,235,0.4); }
        .pd-action-btn { transition: filter .15s, transform .15s; }
        .pd-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .pd-action-btn:active { transform: scale(.98); }
        .pd-contact-link { transition: color .18s; }
        .pd-contact-link:hover { color: #c9a84c !important; }
        .pd-feature-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(37,99,235,0.05); font-size: 13px; color: #c8c0b0; }
        .pd-feature-row:last-child { border-bottom: none; }

        /* Save button hover */
        .pd-save-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .pd-save-btn:active { transform: scale(.98); }

        /* Mobile-specific improvements */
        @media (max-width: 768px) {
          .pd-icon-btn { 
            width: 44px; 
            height: 44px; /* Larger touch targets for mobile */
          }
          .pd-action-btn {
            padding: 14px 16px; /* Easier to tap on mobile */
            font-size: 14px;
          }
        }
        
        /* Mobile viewport fix */
        @viewport {
          width: device-width;
          initial-scale: 1.0;
          maximum-scale: 1.0;
          user-scalable: 0;
        }
      `}</style>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 20px 64px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: t.muted }}>
            <div style={{ fontSize: '18px', marginBottom: '16px' }}>Loading property details...</div>
            <div style={{ fontSize: '14px', opacity: '0.7' }}>Fetching property information from our database</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: t.muted }}>
            <div style={{ fontSize: '18px', marginBottom: '16px', color: t.red }}>{error}</div>
            <div style={{ fontSize: '14px', opacity: '0.7' }}>Please try again later or contact support</div>
          </div>
        )}

        {!loading && !error && property && (
          <>
            {/* Back link */}
            <Link
              to="/properties"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                ...body, fontSize: 11, fontWeight: 500,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: t.muted, textDecoration: 'none',
                marginBottom: 28, transition: 'color .2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = t.gold)}
              onMouseLeave={e => (e.currentTarget.style.color = t.muted)}
            >
              <ArrowLeft size={14} />
              Back to Properties
            </Link>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 24, alignItems: 'start' }}>

              {/* ═══ LEFT COLUMN ═══ */}
              <div>
                {/* Image gallery */}
                <div style={{ ...card, marginBottom: 20 }}>
                  <div style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
                    <img
                      src={getPropertyImageUrl(property, selectedImg)}
                      alt={property?.title || 'Property'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity .3s' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,.7) 0%, transparent 55%)' }} />

                    {property?.featured && (
                      <div style={{
                        position: 'absolute', top: 16, left: 16,
                        ...body, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: '#111', background: t.gold,
                        padding: '4px 10px', borderRadius: 4,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <Star size={9} fill="currentColor" /> Featured
                      </div>
                    )}

                    {/* Top-right actions — share & QR only; save is a text button in sidebar */}
                    <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8 }}>
                      <button className="pd-icon-btn" onClick={shareProperty} title="Share">
                        <Share2 size={15} style={{ color: copied ? t.green : t.cream }} />
                      </button>
                      <button className="pd-icon-btn" onClick={generateQRCode} title="QR Code">
                        <QrCode size={15} style={{ color: t.cream }} />
                      </button>
                    </div>

                    {/* Price overlay */}
                    <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
                      <div style={{ ...serif, fontSize: 26, fontWeight: 600, color: t.gold, lineHeight: 1.1 }}>
                        {formatPrice(property?.price || 0)}{' '}
                        <span style={{ fontSize: 14, fontWeight: 400, color: t.muted }}>TZS/mo</span>
                      </div>
                      <div style={{ ...body, fontSize: 12, color: 'rgba(232,228,220,.7)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={11} />{property?.location || property?.address || 'Location not specified'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property info card */}
                <div style={{ ...card, padding: '24px 26px', marginBottom: 20 }}>
                  <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${t.border}` }}>
                    <h1 style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                      {property?.title || 'Property Title'}
                    </h1>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={pill(t.blue)}>{property?.type || 'Property'}</span>
                      {property?.furnished && <span style={pill(t.gold)}>Furnished</span>}
                      {property?.dalali && (
                        <span style={{ ...pill(t.green), fontFamily: 'monospace', fontWeight: 600 }}>
                          Tracking: {property.dalali}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ ...label, marginBottom: 10 }}>Features</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                      {features.map((f) => (
                        <div key={f} className="pd-feature-row">
                          <CheckCircle size={13} style={{ color: t.green, flexShrink: 0 }} />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ ...label, marginBottom: 10 }}>Amenities</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                      {amenities.map((a) => (
                        <div key={a} className="pd-feature-row">
                          <CheckCircle size={13} style={{ color: t.blue, flexShrink: 0 }} />
                          {a}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tracking link */}
                <div style={{ ...card, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Zap size={14} style={{ color: t.gold }} />
                    <span style={{ ...label, marginBottom: 0, color: t.gold }}>Smart Tracking Link</span>
                  </div>
                  <div style={{
                    ...body, fontSize: 12, color: t.blue,
                    background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.12)',
                    borderRadius: 6, padding: '10px 14px', wordBreak: 'break-all', lineHeight: 1.6,
                  }}>
                    {trackingUrl}
                  </div>
                  <div style={{ ...body, fontSize: 11, color: t.muted, marginTop: 8 }}>
                    Every click through this link is tracked and attributed to the assigned dalali.
                  </div>
                </div>
              </div>

              {/* ═══ RIGHT SIDEBAR ═══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Property meta */}
                <div style={{ ...card, padding: '20px 22px' }}>
                  <div style={{ ...serif, fontSize: 16, fontWeight: 500, color: t.cream, marginBottom: 16 }}>
                    Property Details
                  </div>
                  {[
                    { k: 'Type',      v: property?.type || 'N/A',                mono: false },
                    { k: 'Status',    v: property?.status || 'Available',         mono: false, highlight: t.green },
                    { k: 'Furnished', v: property?.furnished ? 'Yes' : 'No',      mono: false },
                    { k: 'Listed',    v: property?.createdAt ? new Date(property.createdAt).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A', mono: true },
                  ].map(({ k, v, mono, highlight }) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid rgba(37,99,235,0.06)` }}>
                      <span style={{ ...body, fontSize: 12, color: t.muted }}>{k}</span>
                      <span style={{ ...body, fontSize: 12.5, fontWeight: 500, color: highlight ?? t.cream, fontFamily: mono ? 'monospace' : undefined, textTransform: 'capitalize' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Owner */}
                <div style={{ ...card, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                    <Shield size={14} style={{ color: t.gold }} />
                    <span style={{ ...serif, fontSize: 15, fontWeight: 500, color: t.cream }}>Property Owner</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', border: `1px solid rgba(37,99,235,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ ...serif, fontSize: 16, color: t.gold }}>{property?.owner?.name?.charAt(0) || 'O'}</span>
                    </div>
                    <div>
                      <div style={{ ...body, fontSize: 14, fontWeight: 500, color: t.cream }}>{property?.owner?.name || 'Owner Name'}</div>
                      {property?.owner?.verified && <span style={pill(t.green)}><CheckCircle size={9} /> Verified</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <a href={`tel:${property?.owner?.phone || '#'}`} className="pd-contact-link" style={{ display: 'flex', alignItems: 'center', gap: 8, ...body, fontSize: 12, color: t.muted, textDecoration: 'none' }}>
                      <Phone size={12} style={{ flexShrink: 0 }} /> {property?.owner?.phone || 'Phone not available'}
                    </a>
                    <a href={`mailto:${property?.owner?.email || '#'}`} className="pd-contact-link" style={{ display: 'flex', alignItems: 'center', gap: 8, ...body, fontSize: 12, color: t.muted, textDecoration: 'none' }}>
                      <Mail size={12} style={{ flexShrink: 0 }} /> {property?.owner?.email || 'Email not available'}
                    </a>
                  </div>
                </div>

                {/* Dalali / Agent */}
                {property?.dalali && (
                  <div style={{ ...card, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                      <Building size={14} style={{ color: t.blue }} />
                      <span style={{ ...serif, fontSize: 15, fontWeight: 500, color: t.cream }}>Listed by Dalali</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(56,189,248,0.08)', border: `1px solid rgba(56,189,248,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ ...serif, fontSize: 16, color: t.blue }}>{property?.dalali?.name?.charAt(0) || 'D'}</span>
                      </div>
                      <div>
                        <div style={{ ...body, fontSize: 14, fontWeight: 500, color: t.cream }}>{property?.dalali?.name || 'Agent Name'}</div>
                        {property?.dalali?.verified && <span style={pill(t.blue)}><CheckCircle size={9} /> Verified Agent</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
                      <a href={`tel:${property?.dalali?.phone || '#'}`} className="pd-contact-link" style={{ display: 'flex', alignItems: 'center', gap: 8, ...body, fontSize: 12, color: t.muted, textDecoration: 'none' }}>
                        <Phone size={12} style={{ flexShrink: 0 }} /> {property?.dalali?.phone || 'Phone not available'}
                      </a>
                      <a href={`mailto:${property?.dalali?.email || '#'}`} className="pd-contact-link" style={{ display: 'flex', alignItems: 'center', gap: 8, ...body, fontSize: 12, color: t.muted, textDecoration: 'none' }}>
                        <Mail size={12} style={{ flexShrink: 0 }} /> {property?.dalali?.email || 'Email not available'}
                      </a>
                    </div>
                    <div style={{ ...body, fontSize: 11, color: t.muted, background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.10)', borderRadius: 6, padding: '8px 12px' }}>
                      Agent Code: <strong style={{ color: t.blue, fontFamily: 'monospace' }}>{property?.dalali?.code || 'N/A'}</strong>
                      &nbsp;·&nbsp; Commission: <strong style={{ color: t.gold }}>{property?.dalali?.commission || 0}%</strong>
                    </div>
                  </div>
                )}

                {/* CTA buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button style={solidBtn} className="pd-action-btn" onClick={handleApply} disabled={!property}>
                    Visit site
                  </button>

                  {/* ── Save Property Button ── */}
                  <button
                    style={saveBtn(isSaved)}
                    className="pd-save-btn"
                    onClick={handleToggleSave}
                    disabled={!property}
                  >
                    <Bookmark
                      size={15}
                      fill={isSaved ? 'currentColor' : 'none'}
                      style={{ transition: 'fill 0.2s' }}
                    />
                    {isSaved ? 'Saved to My List' : 'Save Property'}
                  </button>

                  <button style={ghostBtn(t.gold)} className="pd-action-btn">
                    Schedule Viewing
                  </button>
                  <button style={ghostBtn('#e8e4dc')} className="pd-action-btn">
                    Contact Owner
                  </button>
                  <button style={ghostBtn(t.blue)} className="pd-action-btn" onClick={generateQRCode}>
                    <QrCode size={14} /> Generate QR Code
                  </button>
                </div>

              </div>
            </div>

            {/* Sign In Modal */}
            {showSignInModal && (
              <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}
                onClick={(e) => { if (e.target === e.currentTarget) setShowSignInModal(false); }}
              >
                <div style={{ ...card, padding: '36px 32px 28px', maxWidth: 380, width: '100%', position: 'relative', textAlign: 'center', overflow: 'visible' }}>
                  <button onClick={() => setShowSignInModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: t.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 4, transition: 'color .2s' }} onMouseEnter={e => (e.currentTarget.style.color = t.cream)} onMouseLeave={e => (e.currentTarget.style.color = t.muted)}>
                    <X size={18} />
                  </button>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', border: `1px solid rgba(37,99,235,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(37,99,235,0.1)' }}>
                    <Shield size={26} style={{ color: t.gold }} />
                  </div>
                  <h3 style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream, margin: '0 0 10px', letterSpacing: '-0.01em' }}>Sign In Required</h3>
                  <p style={{ ...body, fontSize: 13, color: t.muted, lineHeight: 1.75, margin: '0 0 26px' }}>
                    You need to be signed in to apply for this property. Please log in or create a free account to proceed.
                  </p>
                  <div style={{ height: 1, background: t.border, margin: '0 0 22px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={() => navigate('/login', { state: { from: `/property/${id}` } })} style={solidBtn} className="pd-action-btn">Sign In to My Account</button>
                    <button onClick={() => navigate('/register', { state: { from: `/property/${id}` } })} style={ghostBtn(t.gold)} className="pd-action-btn">Create a Free Account</button>
                    <button onClick={() => setShowSignInModal(false)} style={{ ...ghostBtn(t.muted), marginTop: 2 }} className="pd-action-btn">Maybe Later</button>
                  </div>
                  <p style={{ ...body, fontSize: 11, color: t.muted, marginTop: 16, lineHeight: 1.6 }}>
                    After signing in, you'll be brought back to this property automatically.
                  </p>
                </div>
              </div>
            )}

            {/* QR Modal */}
            {showQrModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 999 }}>
                <div style={{ ...card, padding: 28, maxWidth: 380, width: '100%', position: 'relative' }}>
                  <button onClick={() => setShowQrModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: t.muted, cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <QrCode size={16} style={{ color: t.gold }} />
                    <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: t.cream, margin: 0 }}>Property QR Code</h3>
                  </div>
                  <p style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 20, lineHeight: 1.6 }}>
                    Scan to view property details. Every scan is tracked and attributed to the dalali.
                  </p>
                  {qrCodeUrl && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: t.dark3, borderRadius: 10, border: `1px solid ${t.border}`, padding: 20, marginBottom: 16 }}>
                      <img src={qrCodeUrl} alt="Property QR Code" style={{ width: 200, height: 200 }} />
                    </div>
                  )}
                  <div style={{ ...body, fontSize: 10, color: t.blue, background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.12)', borderRadius: 6, padding: '8px 12px', wordBreak: 'break-all', marginBottom: 18 }}>
                    {trackingUrl}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={downloadQRCode} style={{ ...solidBtn, flex: 1 }} className="pd-action-btn"><Download size={14} /> Download</button>
                    <button onClick={() => setShowQrModal(false)} style={{ ...ghostBtn(t.muted), flex: 1 }} className="pd-action-btn">Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tenant Only Modal */}
            {showTenantOnlyModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: t.dark2,
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  padding: '32px',
                  maxWidth: '400px',
                  width: '90%',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
                    <h3 style={{ ...serif, fontSize: 20, fontWeight: 600, color: t.cream, margin: 0, textAlign: 'center' }}>
                      Tenant Access Required
                    </h3>
                  </div>
                  
                  <div style={{ ...body, fontSize: 14, color: t.muted, textAlign: 'center', marginBottom: '24px', lineHeight: 1.6 }}>
                    Only tenants can apply for rental properties. This feature is currently restricted to tenant accounts to ensure proper application processing and verification.
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                      onClick={() => setShowTenantOnlyModal(false)}
                      style={{
                        ...solidBtn,
                        padding: '12px 24px',
                        fontSize: 14,
                        flex: 1
                      }}
                    >
                      Got it
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowTenantOnlyModal(false);
                        setShowSignInModal(true);
                      }}
                      style={{
                        ...ghostBtn(t.muted),
                        padding: '12px 24px',
                        fontSize: 14,
                        flex: 1
                      }}
                    >
                      Switch to Tenant Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>

  );
};

export default PropertyDetail;