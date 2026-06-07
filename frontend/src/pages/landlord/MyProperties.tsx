import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building, Plus, Search, MapPin, Bed, Bath, Square,
  Eye, Edit, Trash2, Users, Calendar, AlertCircle,
  CheckCircle, Home, ChevronLeft, ChevronRight, TrendingUp,
} from 'lucide-react';
import Api from '../../services/api';

// ── Design tokens — 1:1 with landlord_dashboard.dart kSlate* / kWhite / kGold
const C = {
  pageBg:    '#F1F5F9',   // kSlate100  — page background
  headerBg:  '#1E293B',   // kSlate800  — header/nav panels
  cardBg:    '#FFFFFF',   // kWhite     — every card surface
  border:    '#E2E8F0',   // kSlate200  — dividers & borders
  text:      '#0F172A',   // kSlate900  — primary text
  textSub:   '#475569',   // kSlate600  — secondary text
  textMuted: '#94A3B8',   // kSlate400  — muted / placeholders
  textLight: '#CBD5E1',   // kSlate300  — text on dark bg
  slate100:  '#F1F5F9',
  slate500:  '#64748B',
  // Gold = CTA buttons & accent value text ONLY
  gold:      '#C89128',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.26)',
  // Semantic (matches Flutter kSuccess / kInfo / kWarning / kDanger)
  green:     '#16A34A', greenBg:  '#DCFCE7',
  blue:      '#2563EB', blueBg:   '#DBEAFE',
  amber:     '#D97706', amberBg:  '#FEF3C7',
  red:       '#DC2626', redBg:    '#FFE4E6',
};

interface Property {
  id: number; title: string; location: string; address: string; price: number;
  type: string; bedrooms: number; bathrooms: number; area: number; image?: string | null;
  description: string; amenities: string[];
  status: 'available' | 'rented' | 'maintenance' | 'listed';
  listedDate: string; views: number; inquiries: number;
  currentTenant?: { id: number; firstName: string; lastName: string; email: string; phone: string; contractStart: string; contractEnd: string; };
  documents: { images: string[]; floorPlan: string; certificates: string[]; };
}
interface PropertyStats {
  total: number; available: number; rented: number; maintenance: number;
  totalValue: number; monthlyRevenue: number; avgOccupancy: number; pendingInquiries: number;
}

const statusMeta = (status: string) => {
  switch (status) {
    case 'available':   return { color: C.green,  bg: C.greenBg,  Icon: CheckCircle };
    case 'rented':      return { color: C.blue,   bg: C.blueBg,   Icon: Users };
    case 'maintenance': return { color: C.amber,  bg: C.amberBg,  Icon: AlertCircle };
    case 'listed':      return { color: C.gold,   bg: '#FEF3C7',  Icon: Home };
    default:            return { color: C.textMuted, bg: C.slate100, Icon: Home };
  }
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });

const MyProperties = () => {
  const [properties, setProperties]         = useState<Property[]>([]);
  const [stats, setStats]                   = useState<PropertyStats | null>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [searchTerm, setSearchTerm]         = useState('');
  const [statusFilter, setStatusFilter]     = useState('all');
  const [typeFilter, setTypeFilter]         = useState('all');
  const [sortBy, setSortBy]                 = useState('listedDate');
  const [carouselStates, setCarouselStates] = useState<Record<number, number>>({});

  useEffect(() => { loadProperties(); }, []);

  const loadProperties = async () => {
    try {
      setLoading(true); setError('');
      const response = await Api.getOwnerProperties();
      let transformed: Property[] = [];
      if (response.data) {
        transformed = response.data.map((p: any) => ({
          id: p.id, title: p.title, location: p.location, address: p.address || '',
          price: parseFloat(p.price), type: p.type, bedrooms: p.bedrooms, bathrooms: p.bathrooms, area: p.area,
          image: p.images?.length ? (p.images[0].startsWith('http') ? p.images[0] : `${import.meta.env.VITE_API_URL}/storage/${p.images[0]}`) : null,
          description: p.description, amenities: p.amenities || [],
          status: p.available ? 'available' : 'rented',
          listedDate: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          views: 0, inquiries: 0, currentTenant: p.tenant || null,
          documents: {
            images: (p.images || []).map((img: string) => img.startsWith('http') ? img : `${import.meta.env.VITE_API_URL}/storage/${img}`),
            floorPlan: '', certificates: [],
          },
        }));
        setProperties(transformed);
      }
      try {
        const sr = await Api.getOwnerAnalytics();
        if (sr.data) setStats({
          total: sr.data.property_performance?.total_properties || 0,
          available: sr.data.property_performance?.available_properties || 0,
          rented: sr.data.property_performance?.occupied_properties || 0,
          maintenance: 0, totalValue: 0,
          monthlyRevenue: sr.data.financial_metrics?.monthly_revenue || 0,
          avgOccupancy: sr.data.property_performance?.occupancy_rate || 0,
          pendingInquiries: 0,
        });
      } catch {
        setStats({ total: transformed.length, available: transformed.filter(p => p.status === 'available').length, rented: transformed.filter(p => p.status === 'rented').length, maintenance: 0, totalValue: 0, monthlyRevenue: 0, avgOccupancy: 0, pendingInquiries: 0 });
      }
    } catch { setError('Failed to load properties. Please try again.'); setProperties([]); setStats(null); }
    finally { setLoading(false); }
  };

  const deleteProperty = async (id: number) => {
    try { await Api.deleteOwnerProperty(id); setProperties(p => p.filter(x => x.id !== id)); loadProperties(); }
    catch { setError('Failed to delete property.'); }
  };

  const filtered = properties
    .filter(p => {
      const q = searchTerm.toLowerCase();
      return (p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
        && (statusFilter === 'all' || p.status === statusFilter)
        && (typeFilter === 'all' || p.type === typeFilter);
    })
    .sort((a, b) => {
      if (sortBy === 'listedDate')  return new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime();
      if (sortBy === 'price-low')   return a.price - b.price;
      if (sortBy === 'price-high')  return b.price - a.price;
      if (sortBy === 'views')       return b.views - a.views;
      if (sortBy === 'inquiries')   return b.inquiries - a.inquiries;
      return 0;
    });

  // Shared select style
  const selStyle: React.CSSProperties = {
    padding: '9px 14px', backgroundColor: C.cardBg, border: `1.5px solid ${C.border}`,
    color: C.text, borderRadius: '8px', fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px', outline: 'none', cursor: 'pointer', fontWeight: 500,
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', backgroundColor: C.pageBg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: C.textMuted, fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>Loading properties…</p>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .prop-card { transition: box-shadow 0.2s, transform 0.2s; }
          .prop-card:hover { box-shadow: 0 8px 28px rgba(15,23,42,0.12) !important; transform: translateY(-2px); }
          .act-btn { transition: opacity 0.15s, transform 0.15s; }
          .act-btn:hover { opacity: 0.86; transform: scale(1.08); }
          select option { background: #fff; color: #0F172A; }
        `}</style>

        {error && (
          <div style={{ marginBottom: '18px', padding: '13px 16px', borderRadius: '10px', backgroundColor: C.redBg, border: `1px solid rgba(220,38,38,0.22)`, color: C.red, fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
            {error}
          </div>
        )}

        {/* ════ Slate-800 header panel (matches kHeaderBg) ════ */}
        <div style={{ background: C.headerBg, borderRadius: '14px', padding: '24px 28px', marginBottom: '20px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '6px' }}>
                Property Management
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  My Properties
                </h1>
                {stats && (
                  <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.14)', borderRadius: '999px', fontSize: '12px', color: '#fff', fontWeight: 700 }}>
                    {stats.total} total
                  </span>
                )}
              </div>
              <p style={{ margin: 0, color: C.textLight, fontSize: '14px', lineHeight: 1.6 }}>
                Manage your rental portfolio and track performance
              </p>
            </div>
            {/* Gold CTA button */}
            <Link to="/dashboard/landlord/add-property" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '11px 22px', backgroundColor: C.gold, color: '#fff',
              textDecoration: 'none', borderRadius: '10px',
              fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 700,
              boxShadow: C.goldGlow, letterSpacing: '0.02em', alignSelf: 'flex-start',
            }}>
              <Plus size={16} /> Add Property
            </Link>
          </div>
        </div>

        {/* ════ Stats — white cards on slate-100 bg (matches _StatCard2) ════ */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'Total Properties', value: stats.total,                color: C.text,  bg: C.slate100, icon: Building },
              { label: 'Available',        value: stats.available,            color: C.green, bg: C.greenBg,  icon: CheckCircle },
              { label: 'Rented',           value: stats.rented,               color: C.blue,  bg: C.blueBg,   icon: Users },
              { label: 'Monthly Revenue',  value: fmt(stats.monthlyRevenue),  color: C.amber, bg: C.amberBg,  icon: TrendingUp },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <div style={{ fontSize: typeof value === 'number' ? '22px' : '15px', fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.2, fontFamily: 'DM Sans, sans-serif' }}>{value}</div>
                  <div style={{ fontSize: '11px', color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px', fontFamily: 'DM Sans, sans-serif' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════ Filters — white card ════ */}
        <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px', backgroundColor: C.slate100, border: `1.5px solid ${C.border}`, borderRadius: '8px', padding: '0 12px' }}>
              <Search size={15} style={{ color: C.textMuted, flexShrink: 0 }} />
              <input
                type="text" placeholder="Search properties…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: '9px 0', border: 'none', background: 'transparent', color: C.text, fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selStyle}>
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="listed">Listed</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selStyle}>
              <option value="all">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="studio">Studio</option>
              <option value="villa">Villa</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selStyle}>
              <option value="listedDate">Recently Listed</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
              <option value="views">Most Viewed</option>
              <option value="inquiries">Most Inquiries</option>
            </select>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: C.textMuted, whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ════ Property Grid — white cards on slate-100 bg ════ */}
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '18px' }}>
            {filtered.map(property => {
              const { color: stColor, bg: stBg, Icon: StIcon } = statusMeta(property.status);
              const imgIndex = carouselStates[property.id] || 0;
              const images   = property.documents.images;
              return (
                <div key={property.id} className="prop-card" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>

                  {/* Image carousel */}
                  <div style={{ height: '200px', position: 'relative', overflow: 'hidden', backgroundColor: C.slate100 }}>
                    {images.length > 0 ? (
                      <>
                        <img
                          src={images[imgIndex].startsWith('http') ? images[imgIndex] : `http://localhost:8000${images[imgIndex]}`}
                          alt={property.title} loading="lazy"
                          style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                          onError={e => { e.currentTarget.src = '/placeholder-property.jpg'; }}
                        />
                        {images.length > 1 && (
                          <>
                            <button className="act-btn"
                              onClick={() => setCarouselStates(p => ({ ...p, [property.id]: imgIndex === 0 ? images.length - 1 : imgIndex - 1 }))}
                              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                              <ChevronLeft size={14} style={{ color: C.text }} />
                            </button>
                            <button className="act-btn"
                              onClick={() => setCarouselStates(p => ({ ...p, [property.id]: imgIndex === images.length - 1 ? 0 : imgIndex + 1 }))}
                              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                              <ChevronRight size={14} style={{ color: C.text }} />
                            </button>
                            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 2 }}>
                              {images.map((_, i) => (
                                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: i === imgIndex ? C.gold : 'rgba(255,255,255,0.7)', transition: 'background 0.2s' }} />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building size={44} style={{ color: '#CBD5E1' }} />
                      </div>
                    )}

                    {/* Status badge — white pill overlay */}
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.94)', border: `1px solid ${stColor}30`, color: stColor, borderRadius: '999px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.04em', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <StIcon size={10} /> {property.status}
                    </div>

                    {/* Edit (gold) / Delete buttons */}
                    <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                      <button className="act-btn"
                        onClick={() => { window.location.href = `/dashboard/landlord/properties/${property.id}/edit`; }}
                        style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: C.gold, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(200,145,40,0.30)' }}>
                        <Edit size={13} />
                      </button>
                      <button className="act-btn"
                        onClick={() => deleteProperty(property.id)}
                        style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.92)', border: `1px solid rgba(220,38,38,0.22)`, color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '18px 20px' }}>
                    <h3 style={{ margin: '0 0 5px', fontSize: '15px', fontWeight: 700, color: C.text, letterSpacing: '-0.01em', lineHeight: 1.3, fontFamily: 'DM Sans, sans-serif' }}>
                      {property.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '10px' }}>
                      <MapPin size={12} style={{ color: C.textMuted, flexShrink: 0 }} />
                      <span style={{ color: C.textMuted, fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>{property.location}</span>
                    </div>

                    {/* Spec chips — matches _MetaChip */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: '12px', flexWrap: 'wrap' }}>
                      {[
                        { Icon: Bed,    val: `${property.bedrooms} bd` },
                        { Icon: Bath,   val: `${property.bathrooms} ba` },
                        { Icon: Square, val: `${property.area} m²` },
                      ].map(({ Icon, val }) => (
                        <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: C.slate100, borderRadius: '6px' }}>
                          <Icon size={11} style={{ color: C.textMuted }} />
                          <span style={{ fontSize: '11px', color: C.textSub, fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>{val}</span>
                        </div>
                      ))}
                    </div>

                    <p style={{ margin: '0 0 12px', color: C.textSub, fontSize: '13px', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {property.description}
                    </p>

                    {/* Tenant info */}
                    {property.currentTenant && (
                      <div style={{ backgroundColor: C.blueBg, border: `1px solid rgba(37,99,235,0.18)`, borderRadius: '8px', padding: '11px 14px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Users size={12} style={{ color: C.blue }} />
                          <span style={{ color: C.blue, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'DM Sans, sans-serif' }}>Current Tenant</span>
                        </div>
                        <div style={{ color: C.text, fontSize: '13px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>
                          {property.currentTenant.firstName} {property.currentTenant.lastName}
                        </div>
                        <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                          {fmtDate(property.currentTenant.contractStart)} – {fmtDate(property.currentTenant.contractEnd)}
                        </div>
                      </div>
                    )}

                    {/* Price + stats (matches _SmallButton row in _PropertyCard) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${C.border}` }}>
                      <div>
                        <div style={{ color: C.gold, fontSize: '18px', fontWeight: 800, fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.01em' }}>{fmt(property.price)}</div>
                        <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>/ month</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={12} style={{ color: C.textMuted }} />
                          <span style={{ fontSize: '12px', color: C.textMuted, fontFamily: 'DM Sans, sans-serif' }}>{property.views}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertCircle size={12} style={{ color: C.textMuted }} />
                          <span style={{ fontSize: '12px', color: C.textMuted, fontFamily: 'DM Sans, sans-serif' }}>{property.inquiries}</span>
                        </div>
                      </div>
                    </div>

                    {/* Listed date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.slate100}` }}>
                      <Calendar size={11} style={{ color: C.textMuted }} />
                      <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>Listed {fmtDate(property.listedDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '72px 24px', backgroundColor: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '14px', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '16px', backgroundColor: C.slate100, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Building size={28} style={{ color: C.textMuted }} />
            </div>
            <h3 style={{ color: C.text, fontSize: '18px', fontWeight: 700, margin: '0 0 8px', fontFamily: 'DM Sans, sans-serif' }}>No properties found</h3>
            <p style={{ color: C.textSub, fontFamily: 'DM Sans, sans-serif', marginBottom: '26px', fontSize: '14px' }}>
              Try adjusting your filters, or add your first property to get started.
            </p>
            {/* Gold CTA */}
            <Link to="/dashboard/landlord/add-property" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', backgroundColor: C.gold, color: '#fff', textDecoration: 'none', borderRadius: '10px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', boxShadow: C.goldGlow }}>
              <Plus size={16} /> Add Your First Property
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProperties;