import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin, Bed, Bath, Square, Shield, CheckCircle,
  Share2, ArrowLeft, X, Star, Bookmark,
  ChevronLeft, ChevronRight, Home, Camera,
} from 'lucide-react';
import type { Property } from '../types';
import Api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/* ─── TOKENS — matches Home page exactly ─── */
const t = {
  navy900: '#0F172A',
  navy800: '#162035',
  navy700: '#1E2D4A',
  gold:    '#C89128',
  goldLt:  '#D4A843',
  goldDim: 'rgba(200,145,40,0.12)',
  cream:   '#F8F8F9',
  slate:   '#94A3B8',
  border:  'rgba(200,145,40,0.18)',
  green:   '#10b981',
  red:     '#ef4444',
  amber:   '#f59e0b',
} as const;

const body: React.CSSProperties  = { fontFamily: "'Jost', sans-serif" };
const serif: React.CSSProperties = { fontFamily: "'Jost', sans-serif", fontWeight: 700 };

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  backgroundColor: t.navy800,
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
  background: t.gold,
  border: 'none',
  color: t.navy900,
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const ghostBtn = (color: string): React.CSSProperties => ({
  ...body,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%',
  padding: '13px 20px',
  backgroundColor: 'transparent',
  border: `1px solid ${t.border}`,
  color,
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
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
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='600' viewBox='0 0 900 600'%3E%3Crect width='900' height='600' fill='%231E2D4A'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='22' fill='%23C89128'%3ENo Image Available%3C/text%3E%3C/svg%3E`;
  };

  const [selectedImg, setSelectedImg]         = useState(0);
  const [showSignInModal, setShowSignInModal]  = useState(false);
  const [showTenantModal, setShowTenantModal]  = useState(false);
  const [isSaved, setIsSaved]                 = useState(false);
  const [copied, setCopied]                   = useState(false);
  const [property, setProperty]               = useState<any>(null);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');

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

  const shareProperty = async () => {
    if (!property) return;
    const url = `${window.location.origin}/property/${property.id}`;
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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

  const prevImg = () => setSelectedImg(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setSelectedImg(i => (i + 1) % images.length);

  return (
    <div style={{ background: t.navy900, minHeight: '100vh', color: t.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --navy-900: #0F172A;
          --navy-800: #162035;
          --navy-700: #1E2D4A;
          --gold: #C89128;
          --gold-lt: #D4A843;
          --gold-dim: rgba(200,145,40,0.12);
          --cream: #F8F8F9;
          --slate: #94A3B8;
          --border: rgba(200,145,40,0.18);
        }

        .pd-thumb { opacity:.4; transition:opacity .2s; cursor:pointer; border-radius:6px; overflow:hidden; }
        .pd-thumb:hover { opacity:.75; }
        .pd-thumb.active { opacity:1; outline:2px solid var(--gold); outline-offset:1px; }

        .pd-icon-btn {
          background:rgba(15,23,42,0.75); border:1px solid var(--border);
          border-radius:50%; width:38px; height:38px;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; backdrop-filter:blur(10px); transition:all .2s;
        }
        .pd-icon-btn:hover { background:var(--gold-dim); border-color:var(--gold); }

        .pd-nav-btn {
          background:rgba(15,23,42,0.75); border:1px solid var(--border);
          border-radius:50%; width:42px; height:42px;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; backdrop-filter:blur(10px); transition:all .2s; color:var(--cream);
        }
        .pd-nav-btn:hover { background:var(--gold-dim); border-color:var(--gold); }

        .pd-btn { transition:filter .15s, transform .15s; }
        .pd-btn:hover { filter:brightness(1.08); transform:translateY(-1px); }
        .pd-btn:active { transform:scale(.98); }

        .pd-amenity-tag {
          display:inline-flex; align-items:center; gap:6px;
          padding:7px 13px; background:var(--gold-dim);
          border:1px solid var(--border); border-radius:6px;
          font-size:12px; color:var(--cream); font-family:'Jost',sans-serif;
          transition:background .2s, border-color .2s;
        }
        .pd-amenity-tag:hover { background:rgba(200,145,40,0.2); border-color:rgba(200,145,40,0.45); }

        .pd-stat-box {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:18px 12px; background:var(--navy-700); border:1px solid var(--border);
          border-radius:10px; text-align:center; transition:background .2s, border-color .2s;
        }
        .pd-stat-box:hover { background:var(--gold-dim); border-color:rgba(200,145,40,0.45); }

        .pd-back-link { transition:color .2s; }
        .pd-back-link:hover { color:var(--gold) !important; }

        .pd-detail-row {
          display:flex; justify-content:space-between; align-items:center;
          padding:9px 0; border-bottom:1px solid rgba(200,145,40,0.08);
        }
        .pd-detail-row:last-child { border-bottom:none; }

        .section-tag {
          display:inline-flex; align-items:center; gap:6px;
          font-size:10px; font-weight:600; letter-spacing:0.22em;
          text-transform:uppercase; color:var(--gold);
          background:var(--gold-dim); padding:4px 12px;
          border:1px solid var(--border); font-family:'Jost',sans-serif;
        }

        .trust-row {
          display:flex; align-items:center; gap:10px; padding:7px 0;
          border-bottom:1px solid rgba(200,145,40,0.07);
        }
        .trust-row:last-child { border-bottom:none; }

        @media (max-width:900px) {
          .pd-main-grid { grid-template-columns:1fr !important; }
          .pd-stats-grid { grid-template-columns:1fr 1fr !important; }
          .pd-sidebar { position:static !important; }
        }
        @media (max-width:600px) {
          .pd-stats-grid { grid-template-columns:1fr 1fr !important; }
          .pd-amenities-grid { grid-template-columns:1fr 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: t.slate }}>
            <div style={{ ...body, fontSize: 20, marginBottom: 10, color: t.cream, fontWeight: 700 }}>Loading property…</div>
            <div style={{ ...body, fontSize: 13 }}>Fetching details from our database</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: t.slate }}>
            <div style={{ ...body, fontSize: 20, marginBottom: 10, color: t.red, fontWeight: 700 }}>{error}</div>
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, ...body, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.slate, textDecoration: 'none', marginBottom: 28 }}
            >
              <ArrowLeft size={14} /> Back to Properties
            </Link>

            {/* Page header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div className="section-tag" style={{ marginBottom: 12 }}>
                    {property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : 'Property'}
                    {property.featured && <><Star size={9} fill="currentColor" /> Featured</>}
                  </div>
                  <h1 style={{ ...serif, fontSize: 'clamp(24px,4vw,36px)', color: t.cream, margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                    {property.title}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', ...body, fontSize: 13, color: t.slate }}>
                    <MapPin size={13} style={{ color: t.gold, flexShrink: 0 }} />
                    {property.location || property.address || 'Location not specified'}
                    {property.available !== false && <span style={pill(t.green)}>Available</span>}
                    {property.furnished && <span style={pill(t.gold)}>Furnished</span>}
                  </div>
                </div>

                {/* Price — desktop top-right */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ ...body, fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.slate, marginBottom: 4 }}>Monthly Rent</div>
                  <div style={{ ...serif, fontSize: 30, color: t.gold, lineHeight: 1 }}>
                    {formatPrice(property.price || 0)}
                  </div>
                  <div style={{ ...body, fontSize: 12, color: t.slate, marginTop: 4 }}>TZS / month</div>
                </div>
              </div>
            </div>

            {/* Two-column layout */}
            <div className="pd-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, alignItems: 'start' }}>

              {/* ══ LEFT ══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Gallery */}
                <div style={card()}>
                  <div style={{ position: 'relative', height: 420, overflow: 'hidden', background: t.navy700 }}>
                    <img
                      src={getPropertyImageUrl(property, selectedImg)}
                      alt={property.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity .3s' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).src = getPropertyImageUrl(property, 0); }}
                    />
                    {/* Bottom gradient */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,.65) 0%, transparent 50%)' }} />

                    {/* Arrow nav */}
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

                    {/* Share button */}
                    <div style={{ position: 'absolute', top: 14, right: 14 }}>
                      <button className="pd-icon-btn" onClick={shareProperty} title={copied ? 'Copied!' : 'Share'} style={{ border: 'none' }}>
                        <Share2 size={14} style={{ color: copied ? t.green : t.cream }} />
                      </button>
                    </div>

                    {/* Featured badge */}
                    {property.featured && (
                      <div style={{ position: 'absolute', top: 14, left: 14, background: t.gold, color: t.navy900, padding: '4px 10px', borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={9} fill="currentColor" /> Featured
                      </div>
                    )}

                    {/* Image counter */}
                    {images.length > 1 && (
                      <div style={{ position: 'absolute', bottom: 14, right: 14, ...body, fontSize: 11, color: t.cream, background: 'rgba(15,23,42,0.7)', padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(6px)' }}>
                        <Camera size={10} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                        {selectedImg + 1} / {images.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, padding: '12px 14px', overflowX: 'auto', background: t.navy800 }}>
                      {images.map((_: any, i: number) => (
                        <div
                          key={i}
                          className={`pd-thumb${selectedImg === i ? ' active' : ''}`}
                          onClick={() => setSelectedImg(i)}
                          style={{ width: 68, height: 48, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: t.navy700 }}
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
                      <div style={{ ...body, fontSize: 16, fontWeight: 700, color: t.cream, lineHeight: 1 }}>{value}</div>
                      <div style={{ ...body, fontSize: 10, color: t.slate, marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {property.description && (
                  <div style={card({ padding: '24px 26px', overflow: 'visible' })}>
                    <div className="section-tag" style={{ marginBottom: 16, display: 'inline-flex' }}>About this property</div>
                    <p style={{ ...body, fontSize: 14, color: t.slate, lineHeight: 1.85, margin: 0 }}>
                      {property.description}
                    </p>
                  </div>
                )}

                {/* Amenities */}
                {amenities.length > 0 && (
                  <div style={card({ padding: '24px 26px', overflow: 'visible' })}>
                    <div className="section-tag" style={{ marginBottom: 18, display: 'inline-flex' }}>Amenities & Features</div>
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
              </div>

              {/* ══ RIGHT SIDEBAR ══ */}
              <div className="pd-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>

                {/* Price + quick details */}
                <div style={{ ...card({ padding: '22px', overflow: 'visible' }), position: 'relative' }}>
                  {/* Gold top accent — same style as search card in Home */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: t.gold, borderRadius: '12px 12px 0 0' }} />

                  <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: 16, marginBottom: 16 }}>
                    <div style={{ ...body, fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.slate, marginBottom: 6 }}>Monthly Rent</div>
                    <div style={{ ...serif, fontSize: 28, color: t.gold, lineHeight: 1 }}>{formatPrice(property.price || 0)}</div>
                    <div style={{ ...body, fontSize: 12, color: t.slate, marginTop: 5 }}>TZS per month</div>
                  </div>

                  {[
                    { label: 'Property Type', value: property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : 'N/A' },
                    { label: 'Availability',  value: property.available !== false ? 'Available Now' : 'Not Available', color: property.available !== false ? t.green : t.red },
                    { label: 'Furnished',     value: property.furnished ? 'Yes' : 'No' },
                    { label: 'Listed',        value: property.createdAt ? new Date(property.createdAt).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="pd-detail-row">
                      <span style={{ ...body, fontSize: 12, color: t.slate }}>{label}</span>
                      <span style={{ ...body, fontSize: 12.5, fontWeight: 600, color: color ?? t.cream, textTransform: 'capitalize' }}>{value}</span>
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
                      ...ghostBtn(isSaved ? t.gold : t.slate),
                      backgroundColor: isSaved ? t.goldDim : 'transparent',
                      borderColor: isSaved ? t.gold : t.border,
                    }}
                  >
                    <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} style={{ transition: 'fill .2s' }} />
                    {isSaved ? 'Saved to My List' : 'Save Property'}
                  </button>

                  <button style={ghostBtn(t.cream)} className="pd-btn">
                    Schedule a Viewing
                  </button>
                </div>

                {/* Location */}
                <div style={card({ padding: '18px 20px', overflow: 'visible' })}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <MapPin size={13} style={{ color: t.gold }} />
                    <span style={{ ...body, fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold }}>Location</span>
                  </div>
                  <div style={{ ...body, fontSize: 13, color: t.cream, lineHeight: 1.6 }}>
                    {property.location || property.address || 'Location not specified'}
                  </div>
                </div>

                {/* Agent code — only if dalali exists, no contact details */}
                {property?.dalali && (
                  <div style={card({ padding: '16px 18px', overflow: 'visible' })}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Shield size={13} style={{ color: t.slate }} />
                      <span style={{ ...body, fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.slate }}>Listed by Agent</span>
                    </div>
                    <div style={{ ...body, fontSize: 12, color: t.slate }}>
                      Agent Code: <strong style={{ color: t.gold, fontFamily: 'monospace' }}>{property.dalali?.code || 'N/A'}</strong>
                    </div>
                  </div>
                )}

                {/* Trust row — matches Home CTA bullets */}
                <div style={card({ padding: '16px 20px', overflow: 'visible' })}>
                  {['Verified Listing', 'Secure Application Process', 'Tenant Support 24/7'].map(item => (
                    <div key={item} className="trust-row">
                      <div style={{ width: 7, height: 7, background: t.gold, borderRadius: '50%', flexShrink: 0 }} />
                      <span style={{ ...body, fontSize: 12, color: t.slate }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Sign In Modal ── */}
            {showSignInModal && (
              <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}
                onClick={e => { if (e.target === e.currentTarget) setShowSignInModal(false); }}
              >
                <div style={{ ...card({ padding: '36px 32px 28px', maxWidth: 380, width: '100%' }), position: 'relative', textAlign: 'center', overflow: 'visible' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: t.gold, borderRadius: '12px 12px 0 0' }} />
                  <button onClick={() => setShowSignInModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: t.slate, cursor: 'pointer', display: 'flex', padding: 6, borderRadius: 4 }}>
                    <X size={18} />
                  </button>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: t.goldDim, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px auto 18px' }}>
                    <Shield size={22} style={{ color: t.gold }} />
                  </div>
                  <h3 style={{ ...serif, fontSize: 22, color: t.cream, margin: '0 0 10px' }}>Sign In Required</h3>
                  <p style={{ ...body, fontSize: 13, color: t.slate, lineHeight: 1.75, margin: '0 0 24px' }}>
                    You need to be signed in to apply for this property.
                  </p>
                  <div style={{ height: 1, background: t.border, margin: '0 0 20px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <button onClick={() => navigate('/login', { state: { from: `/property/${id}` } })} style={solidBtn} className="pd-btn">Sign In to My Account</button>
                    <button onClick={() => navigate('/register', { state: { from: `/property/${id}` } })} style={ghostBtn(t.gold)} className="pd-btn">Create a Free Account</button>
                    <button onClick={() => setShowSignInModal(false)} style={ghostBtn(t.slate)} className="pd-btn">Maybe Later</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tenant Only Modal ── */}
            {showTenantModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
                <div style={{ ...card({ padding: '32px', maxWidth: 400, width: '90%' }), position: 'relative', textAlign: 'center', overflow: 'visible' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: t.amber, borderRadius: '12px 12px 0 0' }} />
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px auto 18px' }}>
                    <Shield size={22} style={{ color: t.amber }} />
                  </div>
                  <h3 style={{ ...serif, fontSize: 20, color: t.cream, margin: '0 0 12px' }}>Tenant Access Required</h3>
                  <p style={{ ...body, fontSize: 13, color: t.slate, lineHeight: 1.75, margin: '0 0 24px' }}>
                    Only tenant accounts can apply for rental properties. Please switch to or register a tenant account to proceed.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowTenantModal(false)} style={{ ...solidBtn, flex: 1 }} className="pd-btn">Got it</button>
                    <button onClick={() => { setShowTenantModal(false); setShowSignInModal(true); }} style={{ ...ghostBtn(t.slate), flex: 1 }} className="pd-btn">Switch Account</button>
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