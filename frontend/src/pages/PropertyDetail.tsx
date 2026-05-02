import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin, Bed, Bath, Square, Shield, CheckCircle,
  Heart, Share2, QrCode, Download, ArrowLeft, X,
  Zap, Star, Bookmark, ChevronLeft, ChevronRight,
  Home, Tag, Calendar, Wifi, Camera,
} from 'lucide-react';
import QRCode from 'qrcode';
import type { Property } from '../types';
import Api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/* ─── TOKENS ─── */
const t = {
  gold:   '#c9a84c',
  goldLt: '#e8c97a',
  dark:   '#080808',
  dark2:  '#0e0e0e',
  dark3:  '#141414',
  dark4:  '#1a1a1a',
  cream:  '#e8e4dc',
  muted:  '#7a7060',
  border: 'rgba(201,168,76,0.12)',
  borderHover: 'rgba(201,168,76,0.28)',
  green:  '#10b981',
  red:    '#ef4444',
  amber:  '#f59e0b',
} as const;

const body: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif' };
const serif: React.CSSProperties = { fontFamily: 'Cormorant Garamond, Georgia, serif' };

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  backgroundColor: t.dark2,
  border: `1px solid ${t.border}`,
  borderRadius: 12,
  overflow: 'hidden',
  ...extra,
});

const pill = (color: string): React.CSSProperties => ({
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 10px',
  backgroundColor: `${color}18`,
  border: `1px solid ${color}30`,
  color,
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
});

const solidBtn: React.CSSProperties = {
  ...body,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%',
  padding: '14px 20px',
  background: `linear-gradient(135deg, ${t.gold}, ${t.goldLt})`,
  border: 'none',
  color: '#0e0e0e',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const ghostBtn = (color: string): React.CSSProperties => ({
  ...body,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%',
  padding: '13px 20px',
  backgroundColor: `${color}0d`,
  border: `1px solid ${color}28`,
  color,
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  letterSpacing: '0.03em',
});

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const getPropertyImageUrl = (property: any, imageIndex: number = 0) => {
    if (property?.images?.length > 0) {
      const image = property.images[imageIndex];
      if (typeof image === 'string' && image.trim() !== '') {
        const VITE_STORAGE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
        if (image.startsWith('http://') || image.startsWith('https://')) return image;
        if (image.startsWith('/')) return `${VITE_STORAGE}${image}`;
        if (image.startsWith('storage/')) return `${VITE_STORAGE}/${image}`;
        return `${VITE_STORAGE}/storage/${image}`;
      }
    }
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='600' viewBox='0 0 900 600'%3E%3Crect width='900' height='600' fill='%23141414'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='22' fill='%237a7060'%3ENo Image Available%3C/text%3E%3C/svg%3E`;
  };

  const [selectedImg, setSelectedImg]       = useState(0);
  const [qrCodeUrl, setQrCodeUrl]           = useState('');
  const [showQrModal, setShowQrModal]       = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [isSaved, setIsSaved]               = useState(false);
  const [copied, setCopied]                 = useState(false);
  const [property, setProperty]             = useState<any>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const propertyId = Number(id);
        if (isNaN(propertyId) || propertyId <= 0) throw new Error('Invalid property ID');
        const res = await Api.getPropertyWithParams(propertyId, searchParams.toString());
        setProperty(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Property not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, searchParams]);

  const getFeatures = (p: any) => {
    if (!p) return [];
    const f: { icon: any; label: string; value: string }[] = [];
    if (p.bedrooms > 0)  f.push({ icon: Bed,    label: 'Bedrooms',  value: String(p.bedrooms) });
    if (p.bathrooms > 0) f.push({ icon: Bath,   label: 'Bathrooms', value: String(p.bathrooms) });
    if (p.area)          f.push({ icon: Square, label: 'Area',      value: `${p.area} sqm` });
    if (p.type)          f.push({ icon: Home,   label: 'Type',      value: p.type.charAt(0).toUpperCase() + p.type.slice(1) });
    return f;
  };

  const getAmenities = (p: any): string[] => {
    if (!p?.amenities || !Array.isArray(p.amenities) || p.amenities.length === 0) return [];
    return p.amenities;
  };

  const features  = getFeatures(property);
  const amenities = getAmenities(property);
  const images    = property?.images?.length > 0 ? property.images : [null];

  const generateQRCode = async () => {
    try {
      if (!property) return;
      const url = `https://oweru.co/p/${property.id}?ref=${property.dalali?.code ?? 'DIRECT'}_OWERU`;
      const dataUrl = await QRCode.toDataURL(url, {
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
    const url = `https://oweru.co/p/${property.id}?ref=${property.dalali?.code ?? 'DIRECT'}_OWERU`;
    if (navigator.share) {
      try { await navigator.share({ title: property.title, text: property.location, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleSave = async () => {
    if (!property) return;
    try {
      if (isSaved) { await Api.unsaveProperty(property.id); setIsSaved(false); }
      else         { await Api.saveProperty(property.id);   setIsSaved(true);  }
    } catch (e) { console.error('Save error:', e); }
  };

  const handleApply = async () => {
    if (!isAuthenticated) { setShowSignInModal(true); return; }
    if (!property) return;
    if (user?.userType !== 'tenant') { setShowTenantModal(true); return; }
    try {
      await Api.createApplication({
        property_id: property.id,
        message: `I am interested in renting this property at ${property.location || property.address}. Please contact me.`,
      });
      alert('Application submitted successfully! The property owner will be notified.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to submit application. Please try again.');
    }
  };

  const trackingUrl = property
    ? `https://oweru.co/p/${property.id}?ref=${property.dalali?.code ?? 'DIRECT'}_OWERU`
    : 'https://oweru.co';

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

  const prevImg = () => setSelectedImg(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setSelectedImg(i => (i + 1) % images.length);

  return (
    <div style={{ background: t.dark, minHeight: '100vh', color: t.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); border-radius: 2px; }

        .pd-thumb { opacity: .4; transition: opacity .2s, outline .2s; cursor: pointer; border-radius: 6px; overflow: hidden; }
        .pd-thumb:hover { opacity: .7; }
        .pd-thumb.active { opacity: 1; outline: 2px solid #c9a84c; outline-offset: 1px; }

        .pd-icon-btn {
          background: rgba(8,8,8,0.75);
          border: 1px solid rgba(201,168,76,0.18);
          border-radius: 50%;
          width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; backdrop-filter: blur(10px);
          transition: all .2s;
        }
        .pd-icon-btn:hover { background: rgba(201,168,76,0.15); border-color: rgba(201,168,76,0.5); }

        .pd-nav-btn {
          background: rgba(8,8,8,0.7);
          border: 1px solid rgba(201,168,76,0.18);
          border-radius: 50%;
          width: 42px; height: 42px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; backdrop-filter: blur(10px);
          transition: all .2s; color: #e8e4dc;
        }
        .pd-nav-btn:hover { background: rgba(201,168,76,0.2); border-color: #c9a84c; }

        .pd-btn { transition: filter .15s, transform .15s; }
        .pd-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .pd-btn:active { transform: scale(.98); }

        .pd-amenity-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 12px;
          background: rgba(201,168,76,0.06);
          border: 1px solid rgba(201,168,76,0.14);
          border-radius: 6px;
          font-size: 12px; color: #c8c0b0;
          font-family: 'DM Sans', sans-serif;
          transition: background .2s, border-color .2s;
        }
        .pd-amenity-tag:hover { background: rgba(201,168,76,0.12); border-color: rgba(201,168,76,0.3); }

        .pd-stat-box {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 18px 12px;
          background: rgba(201,168,76,0.04);
          border: 1px solid rgba(201,168,76,0.1);
          border-radius: 10px;
          text-align: center;
          transition: background .2s, border-color .2s;
        }
        .pd-stat-box:hover { background: rgba(201,168,76,0.08); border-color: rgba(201,168,76,0.22); }

        .pd-back-link { transition: color .2s; }
        .pd-back-link:hover { color: #c9a84c !important; }

        @media (max-width: 900px) {
          .pd-main-grid { grid-template-columns: 1fr !important; }
          .pd-stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .pd-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .pd-amenities-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: t.muted }}>
            <div style={{ ...serif, fontSize: 22, marginBottom: 10, color: t.cream }}>Loading property…</div>
            <div style={{ ...body, fontSize: 13 }}>Fetching details from our database</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: t.muted }}>
            <div style={{ ...serif, fontSize: 22, marginBottom: 10, color: t.red }}>{error}</div>
            <div style={{ ...body, fontSize: 13 }}>Please try again or return to the listings.</div>
            <Link to="/properties" style={{ ...body, fontSize: 13, color: t.gold, marginTop: 16, display: 'inline-block' }}>← Back to Properties</Link>
          </div>
        )}

        {/* Main content */}
        {!loading && !error && property && (
          <>
            {/* Back */}
            <Link
              to="/properties"
              className="pd-back-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, ...body, fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.muted, textDecoration: 'none', marginBottom: 28 }}
            >
              <ArrowLeft size={14} /> Back to Properties
            </Link>

            {/* Page header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ ...serif, fontSize: 32, fontWeight: 600, color: t.cream, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    {property.title}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 13, color: t.muted }}>
                      <MapPin size={13} style={{ color: t.gold }} />
                      {property.location || property.address || 'Location not specified'}
                    </div>
                    <span style={{ color: t.border }}>·</span>
                    <span style={pill(t.gold)}>{property.type || 'Property'}</span>
                    {property.featured && <span style={pill(t.amber)}><Star size={9} fill="currentColor" /> Featured</span>}
                    {property.available !== false && <span style={pill(t.green)}>Available</span>}
                    {property.furnished && <span style={pill(t.muted)}>Furnished</span>}
                  </div>
                </div>
                {/* Price */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ ...serif, fontSize: 28, fontWeight: 600, color: t.gold, lineHeight: 1 }}>
                    {formatPrice(property.price || 0)}
                  </div>
                  <div style={{ ...body, fontSize: 12, color: t.muted, marginTop: 4 }}>per month</div>
                </div>
              </div>
            </div>

            {/* Two-column layout */}
            <div className="pd-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, alignItems: 'start' }}>

              {/* ══ LEFT ══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Gallery */}
                <div style={card()}>
                  {/* Main image */}
                  <div style={{ position: 'relative', height: 400, overflow: 'hidden', background: t.dark3 }}>
                    <img
                      src={getPropertyImageUrl(property, selectedImg)}
                      alt={property.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity .3s' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,.5) 0%, transparent 45%)' }} />

                    {/* Nav arrows — only if multiple images */}
                    {images.length > 1 && (
                      <>
                        <button className="pd-nav-btn" onClick={prevImg} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', border: 'none' }}>
                          <ChevronLeft size={18} />
                        </button>
                        <button className="pd-nav-btn" onClick={nextImg} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none' }}>
                          <ChevronRight size={18} />
                        </button>
                      </>
                    )}

                    {/* Top-right controls */}
                    <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8 }}>
                      <button className="pd-icon-btn" onClick={shareProperty} title={copied ? 'Copied!' : 'Share'} style={{ border: 'none' }}>
                        <Share2 size={14} style={{ color: copied ? t.green : t.cream }} />
                      </button>
                      <button className="pd-icon-btn" onClick={generateQRCode} title="QR Code" style={{ border: 'none' }}>
                        <QrCode size={14} style={{ color: t.cream }} />
                      </button>
                    </div>

                    {/* Image counter */}
                    {images.length > 1 && (
                      <div style={{ position: 'absolute', bottom: 14, right: 14, ...body, fontSize: 11, color: t.cream, background: 'rgba(8,8,8,0.65)', padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(6px)' }}>
                        <Camera size={10} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                        {selectedImg + 1} / {images.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, padding: '12px 14px', overflowX: 'auto', background: t.dark3 }}>
                      {images.map((_: any, i: number) => (
                        <div
                          key={i}
                          className={`pd-thumb${selectedImg === i ? ' active' : ''}`}
                          onClick={() => setSelectedImg(i)}
                          style={{ width: 68, height: 48, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: t.dark }}
                        >
                          <img
                            src={getPropertyImageUrl(property, i)}
                            alt={`View ${i + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Key stats */}
                <div className="pd-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {features.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="pd-stat-box">
                      <Icon size={18} style={{ color: t.gold, marginBottom: 8 }} />
                      <div style={{ ...body, fontSize: 16, fontWeight: 600, color: t.cream, lineHeight: 1 }}>{value}</div>
                      <div style={{ ...body, fontSize: 11, color: t.muted, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {property.description && (
                  <div style={{ ...card({ padding: '24px 26px' }) }}>
                    <div style={{ ...body, fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.muted, marginBottom: 14 }}>
                      About this property
                    </div>
                    <p style={{ ...body, fontSize: 14, color: '#c8c0b0', lineHeight: 1.85, margin: 0 }}>
                      {property.description}
                    </p>
                  </div>
                )}

                {/* Amenities */}
                {amenities.length > 0 && (
                  <div style={{ ...card({ padding: '24px 26px' }) }}>
                    <div style={{ ...body, fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.muted, marginBottom: 16 }}>
                      Amenities & Features
                    </div>
                    <div className="pd-amenities-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {amenities.map((a: string) => (
                        <div key={a} className="pd-amenity-tag">
                          <CheckCircle size={11} style={{ color: t.green, flexShrink: 0 }} />
                          {a}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tracking link */}
                <div style={{ ...card({ padding: '18px 20px' }) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <Zap size={13} style={{ color: t.gold }} />
                    <span style={{ ...body, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.gold }}>
                      Smart Tracking Link
                    </span>
                  </div>
                  <div style={{ ...body, fontSize: 12, color: '#7ab8d8', background: 'rgba(122,184,216,0.06)', border: '1px solid rgba(122,184,216,0.13)', borderRadius: 6, padding: '10px 14px', wordBreak: 'break-all', lineHeight: 1.6 }}>
                    {trackingUrl}
                  </div>
                  <div style={{ ...body, fontSize: 11, color: t.muted, marginTop: 8, lineHeight: 1.6 }}>
                    Every click through this link is tracked and attributed to the assigned agent.
                  </div>
                </div>
              </div>

              {/* ══ RIGHT SIDEBAR ══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>

                {/* Price card */}
                <div style={{ ...card({ padding: '22px' }) }}>
                  <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: 16, marginBottom: 16 }}>
                    <div style={{ ...body, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.muted, marginBottom: 6 }}>Monthly Rent</div>
                    <div style={{ ...serif, fontSize: 30, fontWeight: 600, color: t.gold, lineHeight: 1 }}>{formatPrice(property.price || 0)}</div>
                    <div style={{ ...body, fontSize: 12, color: t.muted, marginTop: 5 }}>TZS per month · negotiable</div>
                  </div>

                  {/* Quick details */}
                  {[
                    { label: 'Property Type', value: property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : 'N/A' },
                    { label: 'Availability',  value: property.available !== false ? 'Available Now' : 'Not Available', color: property.available !== false ? t.green : t.red },
                    { label: 'Furnished',     value: property.furnished ? 'Yes' : 'No' },
                    { label: 'Listed',        value: property.createdAt ? new Date(property.createdAt).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid rgba(201,168,76,0.06)` }}>
                      <span style={{ ...body, fontSize: 12, color: t.muted }}>{label}</span>
                      <span style={{ ...body, fontSize: 12.5, fontWeight: 500, color: color ?? t.cream, textTransform: 'capitalize' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* CTA buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <button style={solidBtn} className="pd-btn" onClick={handleApply} disabled={!property}>
                    Apply for this Property
                  </button>

                  <button
                    className="pd-btn"
                    onClick={handleToggleSave}
                    disabled={!property}
                    style={{
                      ...ghostBtn(isSaved ? t.gold : t.muted),
                      backgroundColor: isSaved ? 'rgba(201,168,76,0.12)' : 'rgba(122,116,96,0.08)',
                    }}
                  >
                    <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} style={{ transition: 'fill .2s' }} />
                    {isSaved ? 'Saved to My List' : 'Save Property'}
                  </button>

                  <button style={ghostBtn(t.gold)} className="pd-btn">
                    Schedule a Viewing
                  </button>

                  <button style={ghostBtn('#7ab8d8')} className="pd-btn" onClick={generateQRCode}>
                    <QrCode size={14} /> Generate QR Code
                  </button>
                </div>

                {/* Location note */}
                <div style={{ ...card({ padding: '16px 18px' }) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <MapPin size={13} style={{ color: t.gold }} />
                    <span style={{ ...body, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.gold }}>Location</span>
                  </div>
                  <div style={{ ...body, fontSize: 13, color: t.cream, lineHeight: 1.6 }}>
                    {property.location || property.address || 'Location not specified'}
                  </div>
                </div>

                {/* Agent tracking note — only if dalali exists */}
                {property?.dalali && (
                  <div style={{ ...card({ padding: '16px 18px' }) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Shield size={13} style={{ color: '#7ab8d8' }} />
                      <span style={{ ...body, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7ab8d8' }}>Listed by Agent</span>
                    </div>
                    <div style={{ ...body, fontSize: 12, color: t.muted, lineHeight: 1.6 }}>
                      Agent Code: <strong style={{ color: '#7ab8d8', fontFamily: 'monospace' }}>{property.dalali?.code || 'N/A'}</strong>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* ── Sign In Modal ── */}
            {showSignInModal && (
              <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}
                onClick={e => { if (e.target === e.currentTarget) setShowSignInModal(false); }}
              >
                <div style={{ ...card({ padding: '36px 32px 28px', maxWidth: 380, width: '100%' }), position: 'relative', textAlign: 'center', overflow: 'visible' }}>
                  <button onClick={() => setShowSignInModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: t.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6, transition: 'color .2s' }} onMouseEnter={e => (e.currentTarget.style.color = t.cream)} onMouseLeave={e => (e.currentTarget.style.color = t.muted)}>
                    <X size={18} />
                  </button>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Shield size={24} style={{ color: t.gold }} />
                  </div>
                  <h3 style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream, margin: '0 0 10px' }}>Sign In Required</h3>
                  <p style={{ ...body, fontSize: 13, color: t.muted, lineHeight: 1.75, margin: '0 0 24px' }}>
                    You need to be signed in to apply for this property.
                  </p>
                  <div style={{ height: 1, background: t.border, margin: '0 0 20px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <button onClick={() => navigate('/login', { state: { from: `/property/${id}` } })} style={solidBtn} className="pd-btn">Sign In to My Account</button>
                    <button onClick={() => navigate('/register', { state: { from: `/property/${id}` } })} style={ghostBtn(t.gold)} className="pd-btn">Create a Free Account</button>
                    <button onClick={() => setShowSignInModal(false)} style={ghostBtn(t.muted)} className="pd-btn">Maybe Later</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── QR Modal ── */}
            {showQrModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 999 }}>
                <div style={{ ...card({ padding: 28, maxWidth: 360, width: '100%' }), position: 'relative' }}>
                  <button onClick={() => setShowQrModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: t.muted, cursor: 'pointer', display: 'flex' }}>
                    <X size={18} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <QrCode size={16} style={{ color: t.gold }} />
                    <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: t.cream, margin: 0 }}>Property QR Code</h3>
                  </div>
                  <p style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 20, lineHeight: 1.6 }}>
                    Scan to view this property. Every scan is tracked and attributed to the assigned agent.
                  </p>
                  {qrCodeUrl && (
                    <div style={{ display: 'flex', justifyContent: 'center', background: t.dark3, borderRadius: 10, border: `1px solid ${t.border}`, padding: 20, marginBottom: 16 }}>
                      <img src={qrCodeUrl} alt="QR Code" style={{ width: 200, height: 200 }} />
                    </div>
                  )}
                  <div style={{ ...body, fontSize: 11, color: '#7ab8d8', background: 'rgba(122,184,216,0.05)', border: '1px solid rgba(122,184,216,0.12)', borderRadius: 6, padding: '8px 12px', wordBreak: 'break-all', marginBottom: 18 }}>
                    {trackingUrl}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={downloadQRCode} style={{ ...solidBtn, flex: 1 }} className="pd-btn"><Download size={14} /> Download</button>
                    <button onClick={() => setShowQrModal(false)} style={{ ...ghostBtn(t.muted), flex: 1 }} className="pd-btn">Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tenant Only Modal ── */}
            {showTenantModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
                <div style={{ ...card({ padding: '32px', maxWidth: 400, width: '90%' }), position: 'relative', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                    <Shield size={24} style={{ color: t.amber }} />
                  </div>
                  <h3 style={{ ...serif, fontSize: 22, fontWeight: 600, color: t.cream, margin: '0 0 12px' }}>Tenant Access Required</h3>
                  <p style={{ ...body, fontSize: 13, color: t.muted, lineHeight: 1.75, margin: '0 0 24px' }}>
                    Only tenant accounts can apply for rental properties. Please switch to or register a tenant account to proceed.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowTenantModal(false)} style={{ ...solidBtn, flex: 1 }} className="pd-btn">Got it</button>
                    <button onClick={() => { setShowTenantModal(false); setShowSignInModal(true); }} style={{ ...ghostBtn(t.muted), flex: 1 }} className="pd-btn">Switch Account</button>
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