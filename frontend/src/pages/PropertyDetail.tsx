import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Bed, Bath, Square, Phone, Mail,
  Shield, CheckCircle, Heart, Share2, QrCode,
  Download, ArrowLeft, X, Wifi, Zap,
  Building, Star, ChevronRight,
} from 'lucide-react';
import QRCode from 'qrcode';
import type { Property } from '../types';
import Api from '../services/api';

/* ─────────────────────────────────────────────────────────────
   SHARED STYLE TOKENS  (mirrors DashboardLayout / LeadsAndVisitors)
───────────────────────────────────────────────────────────── */
const t = {
  gold:    '#c9a84c',
  goldLt:  '#e8c97a',
  dark:    '#080808',
  dark2:   '#0e0e0e',
  dark3:   '#141414',
  cream:   '#e8e4dc',
  muted:   '#7a7060',
  border:  'rgba(201,168,76,0.12)',
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
  backgroundColor: 'rgba(201,168,76,0.03)',
  border: `1px solid rgba(201,168,76,0.09)`,
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
  boxShadow: `0 4px 20px rgba(201,168,76,0.3)`,
};

/* ═════════════════════════════════════════════════════════════
   COMPONENT
═════════════════════════════════════════════════════════════ */
const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  // Helper function for image URLs (similar to Properties.tsx)
  const getPropertyImageUrl = (property: any, imageIndex: number = 0) => {
    if (property?.images?.length > 0) {
      const image = property.images[imageIndex];
      return image.startsWith('http') ? image : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${image}`;
    }
    
    // Use SVG placeholder instead of non-existent API endpoint
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='600' viewBox='0 0 900 600'%3E%3Crect width='900' height='600' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='28' fill='%236b7280'%3ENo Image Available%3C/text%3E%3C/svg%3E`;
  };
  const [selectedImg, setSelectedImg] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        console.log('PropertyDetail - Loading property for ID:', id);
        const res = await Api.getProperty(Number(id));
        console.log('PropertyDetail - API Response:', res);
        console.log('PropertyDetail - Property data:', res.data);
        
        // Debug: Check for tracking code and images
        if (res.data) {
          console.log('🔗 Tracking Code (dalali):', res.data.dalali);
          console.log('🔗 Tracking Code (alternative):', res.data.tracking_code);
          console.log('🖼️ Property Images:', res.data.images);
          console.log('🖼️ Property Owner:', res.data.owner);
          console.log('🖼️ Property Agent:', res.data.agent);
        }
        
        setProperty(res.data);
      } catch (err) {
        console.error('PropertyDetail - Failed to load property:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await Api.getProperty(parseInt(id || '1'));
      setProperty(response.data);
    } catch (err) {
      console.error('Failed to load property:', err);
      setError('Failed to load property details');
      setProperty(null);
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      // Check if property is saved
    } catch (err) {
      console.error('Failed to check saved status:', err);
    }
  };

  const generateQR = async () => {
    try {
      const url = `${window.location.origin}/property/${id || '1'}`;
      const qr = await QRCode.toDataURL(url, { width: 200, margin: 2 });
      setQrCodeUrl(qr);
      setShowQrModal(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const features = [
    'Air Conditioning', '24/7 Security', 'Parking Space', 'Balcony',
    'Kitchen Appliances', 'High-Speed Internet', 'Backup Generator', 'Water Storage',
  ];

  const amenities = [
    'Gym Access', 'Swimming Pool', 'Children Playground', 'Community Center',
    'Shopping Nearby', 'Public Transport Access',
  ];

  const generateQRCode = async () => {
    try {
      if (!property) {
        console.error('PropertyDetail: Property is null, cannot generate QR code');
        return;
      }
      const trackingUrl = `https://oweru.co/p/${property.id}?ref=${property.dalali?.code ?? 'DIRECT'}_OWERU`;
      const dataUrl = await QRCode.toDataURL(trackingUrl, {
        color: { dark: '#c9a84c', light: '#0e0e0e' },
        width: 260,
      });
      setQrCodeUrl(dataUrl);
      setShowQrModal(true);
    } catch (e) {
      console.error('QR error:', e);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `oweru-property-${property.id}-qr.png`;
    a.click();
  };

  const shareProperty = async () => {
    if (!property) {
      console.error('PropertyDetail: Property is null, cannot share');
      return;
    }
    // Use the new tracking code (dalali) if available
    const trackingCode = property.dalali || property.tracking_code || 'DIRECT';
    const url = `https://oweru.co/p/${property.id}?ref=${trackingCode}_OWERU`;
    
    console.log('🔗 Sharing property with URL:', url);
    console.log('🔗 Tracking code:', trackingCode);
    
    if (navigator.share) {
      try {
        await navigator.share({ title: property.title, text: property.address, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const trackingUrl = property
    ? `https://oweru.co/p/${property.id}?ref=${property.dalali?.code ?? 'DIRECT'}_OWERU`
    : 'https://oweru.co';

  // Add null check to prevent errors
  const safeTrackingUrl = property
    ? `https://oweru.co/p/${property.id}?ref=${property.dalali?.code ?? 'DIRECT'}_OWERU`
    : 'https://oweru.co';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  /* ─── render ─── */
  return (
    <div style={{ background: t.dark, minHeight: '100vh', color: t.cream, fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); border-radius: 2px; }
        .pd-thumb { opacity: .45; transition: opacity .2s; cursor: pointer; }
        .pd-thumb:hover { opacity: .75; }
        .pd-thumb.active { opacity: 1; outline: 1.5px solid #c9a84c; }
        .pd-icon-btn { background: rgba(14,14,14,0.7); border: 1px solid rgba(201,168,76,0.15); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(8px); transition: all .2s; }
        .pd-icon-btn:hover { background: rgba(14,14,14,0.9); border-color: rgba(201,168,76,0.4); }
        .pd-action-btn { transition: filter .15s, transform .15s; }
        .pd-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .pd-action-btn:active { transform: scale(.98); }
        .pd-contact-link { transition: color .18s; }
        .pd-contact-link:hover { color: #c9a84c !important; }
        .pd-feature-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(201,168,76,0.05); font-size: 13px; color: #c8c0b0; }
        .pd-feature-row:last-child { border-bottom: none; }
      `}</style>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: t.muted }}>
            <div style={{ fontSize: '18px', marginBottom: '16px' }}>Loading property details...</div>
            <div style={{ fontSize: '14px', opacity: '0.7' }}>Fetching property information from our database</div>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: t.muted }}>
            <div style={{ fontSize: '18px', marginBottom: '16px', color: t.red }}>{error}</div>
            <div style={{ fontSize: '14px', opacity: '0.7' }}>Please try again later or contact support</div>
          </div>
        )}

        {/* ── Main content ── */}
        {!loading && !error && property && (
          <>
            {/* ── Back link ── */}
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

            {/* ── Two-column layout ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 24, alignItems: 'start' }}>

              {/* ═══ LEFT COLUMN ═══ */}
              <div>

                {/* ── Image gallery ── */}
                <div style={{ ...card, marginBottom: 20 }}>
                  <div style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
                    <img
                      src={getPropertyImageUrl(property, selectedImg)}
                      alt={property?.title || 'Property'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity .3s' }}
                    />
                    {/* Dark gradient */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,.7) 0%, transparent 55%)' }} />

                    {/* Featured badge */}
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

                    {/* Action buttons top-right */}
                    <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8 }}>
                      <button className="pd-icon-btn" onClick={() => setIsSaved(!isSaved)} title="Save">
                        <Heart size={15} style={{ color: isSaved ? t.red : t.cream, fill: isSaved ? t.red : 'none' }} />
                      </button>
                      <button className="pd-icon-btn" onClick={shareProperty} title="Share">
                        <Share2 size={15} style={{ color: copied ? t.green : t.cream }} />
                      </button>
                      <button className="pd-icon-btn" onClick={generateQR} title="QR Code">
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

                  {/* Thumbnails */}
                  <div style={{ display: 'flex', gap: 8, padding: '12px 14px', background: t.dark3 }}>
                    {property?.images?.map((img: string, i: number) => (
                      <img
                        key={i}
                        src={img}
                        alt={`View ${i + 1}`}
                        className={`pd-thumb${selectedImg === i ? ' active' : ''}`}
                        onClick={() => setSelectedImg(i)}
                        style={{ width: 72, height: 52, objectFit: 'cover', borderRadius: 5 }}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Property info card ── */}
                <div style={{ ...card, padding: '24px 26px', marginBottom: 20 }}>

                  {/* Title + pills */}
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

                  {/* Features */}
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

                  {/* Amenities */}
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

                {/* ── Tracking link ── */}
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

              </div>{/* /left column */}

              {/* ═══ RIGHT SIDEBAR ═══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── Property meta ── */}
                <div style={{ ...card, padding: '20px 22px' }}>
                  <div style={{ ...serif, fontSize: 16, fontWeight: 500, color: t.cream, marginBottom: 16 }}>
                    Property Details
                  </div>
                  {[
                    { k: 'Type',      v: property?.type || 'N/A',      mono: false },
                    { k: 'Status',    v: property?.status || 'Available',    mono: false, highlight: t.green },
                    { k: 'Furnished', v: property?.furnished ? 'Yes' : 'No', mono: false },
                    { k: 'Listed',    v: property?.createdAt ? new Date(property.createdAt).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A', mono: true },
                  ].map(({ k, v, mono, highlight }) => (
                    <div key={k} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '9px 0', borderBottom: `1px solid rgba(201,168,76,0.06)`,
                    }}>
                      <span style={{ ...body, fontSize: 12, color: t.muted }}>{k}</span>
                      <span style={{
                        ...body, fontSize: 12.5, fontWeight: 500,
                        color: highlight ?? t.cream,
                        fontFamily: mono ? 'monospace' : undefined,
                        textTransform: 'capitalize',
                      }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* ── Owner ── */}
                <div style={{ ...card, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                    <Shield size={14} style={{ color: t.gold }} />
                    <span style={{ ...serif, fontSize: 15, fontWeight: 500, color: t.cream }}>Property Owner</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'rgba(201,168,76,0.08)',
                      border: `1px solid rgba(201,168,76,0.2)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ ...serif, fontSize: 16, color: t.gold }}>
                        {property?.owner?.name?.charAt(0) || 'O'}
                      </span>
                    </div>
                    <div>
                      <div style={{ ...body, fontSize: 14, fontWeight: 500, color: t.cream }}>{property?.owner?.name || 'Owner Name'}</div>
                      {property?.owner?.verified && (
                        <span style={pill(t.green)}>
                          <CheckCircle size={9} /> Verified
                        </span>
                      )}
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

                {/* ── Dalali / Agent ── */}
                {property?.dalali && (
                  <div style={{ ...card, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                      <Building size={14} style={{ color: t.blue }} />
                      <span style={{ ...serif, fontSize: 15, fontWeight: 500, color: t.cream }}>Listed by Dalali</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(56,189,248,0.08)',
                        border: `1px solid rgba(56,189,248,0.2)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ ...serif, fontSize: 16, color: t.blue }}>
                          {property?.dalali?.name?.charAt(0) || 'D'}
                        </span>
                      </div>
                      <div>
                        <div style={{ ...body, fontSize: 14, fontWeight: 500, color: t.cream }}>{property?.dalali?.name || 'Agent Name'}</div>
                        {property?.dalali?.verified && (
                          <span style={pill(t.blue)}>
                            <CheckCircle size={9} /> Verified Agent
                          </span>
                        )}
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

                    <div style={{
                      ...body, fontSize: 11, color: t.muted,
                      background: 'rgba(56,189,248,0.04)',
                      border: '1px solid rgba(56,189,248,0.10)',
                      borderRadius: 6, padding: '8px 12px',
                    }}>
                      Agent Code: <strong style={{ color: t.blue, fontFamily: 'monospace' }}>{property?.dalali?.code || 'N/A'}</strong>
                      &nbsp;·&nbsp; Commission: <strong style={{ color: t.gold }}>{property?.dalali?.commission || 0}%</strong>
                    </div>
                  </div>
                )}

                {/* ── CTA buttons ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button style={solidBtn} className="pd-action-btn">
                    Apply Now
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

              </div>{/* /right sidebar */}

            </div>{/* /two-column grid */}

            {/* ══ QR MODAL ══ — rendered outside the grid so it overlays correctly */}
            {showQrModal && (
              <div style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20, zIndex: 999,
              }}>
                <div style={{ ...card, padding: 28, maxWidth: 380, width: '100%', position: 'relative' }}>
                  {/* Close */}
                  <button
                    onClick={() => setShowQrModal(false)}
                    style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: t.muted, cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <QrCode size={16} style={{ color: t.gold }} />
                    <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: t.cream, margin: 0 }}>
                      Property QR Code
                    </h3>
                  </div>
                  <p style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 20, lineHeight: 1.6 }}>
                    Scan to view property details. Every scan is tracked and attributed to the dalali.
                  </p>

                  {/* QR image */}
                  {qrCodeUrl && (
                    <div style={{
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      background: t.dark3, borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      padding: 20, marginBottom: 16,
                    }}>
                      <img src={qrCodeUrl} alt="Property QR Code" style={{ width: 200, height: 200 }} />
                    </div>
                  )}

                  {/* URL */}
                  <div style={{
                    ...body, fontSize: 10, color: t.blue,
                    background: 'rgba(56,189,248,0.05)',
                    border: '1px solid rgba(56,189,248,0.12)',
                    borderRadius: 6, padding: '8px 12px',
                    wordBreak: 'break-all', marginBottom: 18,
                  }}>
                    {trackingUrl}
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={downloadQRCode}
                      style={{ ...solidBtn, flex: 1 }}
                      className="pd-action-btn"
                    >
                      <Download size={14} /> Download
                    </button>
                    <button
                      onClick={() => setShowQrModal(false)}
                      style={{ ...ghostBtn(t.muted), flex: 1 }}
                      className="pd-action-btn"
                    >
                      Close
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