import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Bed, Bath, Square, Heart, Share2, QrCode,
  SlidersHorizontal, X, ChevronDown,
} from 'lucide-react';
import Api from '../services/api';

/* ─── Types ─── */
interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/* ─── Debounce hook ─── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const Properties = () => {
  const navigate = useNavigate();
  const [searchTerm,   setSearchTerm]   = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [priceRange,   setPriceRange]   = useState('');
  const [showFilters,  setShowFilters]  = useState(false);
  const [savedIds,     setSavedIds]     = useState<Set<number>>(new Set());
  const [viewMode,     setViewMode]     = useState<'grid' | 'list'>('grid');
  const [bedrooms,     setBedrooms]     = useState('');
  const [furnished,    setFurnished]    = useState('');

  const [properties,   setProperties]  = useState<any[]>([]);
  const [pagination,   setPagination]  = useState<Pagination | null>(null);
  const [page,         setPage]        = useState(1);
  const [loading,      setLoading]     = useState(true);
  const [loadingMore,  setLoadingMore] = useState(false);
  const [error,        setError]       = useState('');

  // Debounce search so we don't fire on every keystroke
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Reset to page 1 whenever any filter changes
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedType, priceRange, bedrooms, furnished]);

  useEffect(() => {
    loadProperties(page);
  }, [page, debouncedSearch, selectedType, priceRange, bedrooms, furnished]);

  /* ── Build query params matching backend expectations ── */
  const buildParams = (pageNum: number) => {
    const params: Record<string, any> = { page: pageNum };

    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedType)    params.type   = selectedType;

    // Backend uses min_price / max_price (snake_case)
    if (priceRange === '0-500')    { params.min_price = 0;       params.max_price = 500000;  }
    if (priceRange === '500-1000') { params.min_price = 500000;  params.max_price = 1000000; }
    if (priceRange === '1000+')    { params.min_price = 1000000; }

    if (bedrooms)  params.bedrooms  = parseInt(bedrooms);
    if (furnished) params.furnished = furnished === 'furnished' ? true : false;

    return params;
  };

  const loadProperties = async (pageNum: number) => {
    try {
      pageNum === 1 ? setLoading(true) : setLoadingMore(true);
      setError('');

      const response = await Api.getProperties(buildParams(pageNum));

      // Backend returns { data: [...], pagination: {...} }
      const newItems: any[] = response.data?.data ?? response.data ?? [];
      const pag: Pagination | null = response.data?.pagination ?? null;

      setProperties(prev => pageNum === 1 ? newItems : [...prev, ...newItems]);
      setPagination(pag);
    } catch (err: any) {
      console.error('Failed to load properties:', err);
      setError('Failed to load properties. Please try again.');
      if (pageNum === 1) setProperties([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const toggleSave = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (savedIds.has(id)) {
        await Api.publicUnsaveProperty(id);
        setSavedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      } else {
        await Api.publicSaveProperty(id);
        setSavedIds(prev => new Set(prev).add(id));
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const clearFilters = () => {
    setSearchTerm(''); setSelectedType(''); setPriceRange('');
    setBedrooms(''); setFurnished('');
  };

  const activeFilterCount = [selectedType, priceRange, bedrooms, furnished].filter(Boolean).length;
  const hasMore = pagination ? pagination.current_page < pagination.last_page : false;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-TZ', {
      style: 'currency', currency: 'TZS',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(price);

  const typeLabel: Record<string, string> = {
    apartment: 'Apartment', house: 'House', studio: 'Studio', villa: 'Villa', commercial: 'Commercial',
  };

  /* ── Property Card ── */
  const PropertyCard = ({ property }: { property: any }) => {
    const imageUrl =
      property.images && property.images.length > 0
        ? property.images[0].startsWith('http')
          ? property.images[0]
          : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${property.images[0]}`
        : '/api/placeholder/600/400';

    const isSaved = savedIds.has(property.id);

    return (
      <Link to={`/property/${property.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div className="prop-card">
          {/* Image */}
          <div className="prop-img-wrap">
            <img src={imageUrl} alt={property.title} className="prop-img" />
            <div className="prop-img-overlay" />

            {property.featured && <div className="prop-badge-featured">Featured</div>}
            <div className="prop-type-badge">{typeLabel[property.type] ?? property.type}</div>

            <div className="prop-actions">
              <button
                className={`prop-action-btn${isSaved ? ' saved' : ''}`}
                onClick={e => toggleSave(property.id, e)}
                title={isSaved ? 'Unsave' : 'Save'}
              >
                <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
              <button className="prop-action-btn apply-btn" title="Apply for this Property" onClick={e => { e.preventDefault(); 
  try {
    if (!property.id) {
      alert('Property ID not found');
      return;
    }
    navigate(`/dashboard/tenant/applications?property=${property.id}`);
  } catch (error) {
    console.error('Navigation error:', error);
    alert('Unable to navigate to application page');
  }
}}>
                Apply Now
              </button>
              <button className="prop-action-btn" title="Share"
                onClick={e => { e.preventDefault(); navigator.clipboard.writeText(`${window.location.origin}/property/${property.id}`); }}
              >
                <Share2 size={14} />
              </button>
              <button className="prop-action-btn" title="QR Code" onClick={e => e.preventDefault()}>
                <QrCode size={14} />
              </button>
            </div>

            {/* Price on image */}
            <div style={{ position: 'absolute', bottom: 12, right: 12, textAlign: 'right' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: 'var(--cream)', letterSpacing: '-0.02em' }}>
                {formatPrice(property.price)}
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 300, color: 'rgba(245,240,232,0.55)' }}>
                /month
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="prop-body">
            <div className="prop-location">
              <MapPin size={11} />
              {property.location || property.address}
            </div>

            <div className="prop-title">{property.title}</div>

            {property.description && (
              <div className="prop-desc">{property.description}</div>
            )}

            <div className="prop-specs">
              {property.bedrooms != null && (
                <>
                  <div className="prop-spec">
                    <Bed size={12} />
                    {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}
                  </div>
                  <div className="prop-spec-div" />
                </>
              )}
              {property.bathrooms != null && (
                <>
                  <div className="prop-spec">
                    <Bath size={12} />
                    {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
                  </div>
                  <div className="prop-spec-div" />
                </>
              )}
              {property.area != null && (
                <div className="prop-spec">
                  <Square size={12} />
                  {property.area} m²
                </div>
              )}
            </div>

            <div className="prop-footer">
              {property.furnished && <div className="prop-furnished-tag">Furnished</div>}

              {/* Owner / Agent info */}
              {(property.owner || property.agent) && (
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: 'var(--muted)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {property.owner && (
                    <span>{property.owner.name ?? `${property.owner.first_name ?? ''} ${property.owner.last_name ?? ''}`.trim()}</span>
                  )}
                  {property.agent && (
                    <span className="prop-agent-tag">{property.agent.name ?? property.agent.code}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  /* ── Render ── */
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        :root {
          --gold: var(--accent-color);
          --gold-light: var(--accent-light);
          --dark: var(--bg-primary);
          --dark-2: var(--bg-secondary);
          --dark-3: var(--bg-tertiary);
          --cream: var(--text-primary);
          --muted: var(--text-secondary);
          --border: var(--border-color);
        }
        .pr-header { border-bottom: 1px solid var(--border); background: var(--dark); }
        .pr-header-inner { max-width: 1280px; margin: 0 auto; padding: 56px 40px 44px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .pr-eyebrow { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .pr-eyebrow::before { content: ''; width: 24px; height: 1px; background: var(--gold); }
        .pr-title { font-size: clamp(32px, 4vw, 52px); font-weight: 300; line-height: 1.06; letter-spacing: -0.025em; color: var(--cream); }
        .pr-title em { font-style: italic; color: var(--gold-light); }
        .pr-count { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 300; color: var(--muted); padding-bottom: 6px; }
        .pr-count strong { color: var(--gold); font-weight: 400; }
        .pr-search-wrap { background: var(--dark-3); border-bottom: 1px solid var(--border); position: sticky; top: 64px; z-index: 50; }
        .pr-search-inner { max-width: 1280px; margin: 0 auto; padding: 16px 40px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .pr-search-field { flex: 1; min-width: 220px; display: flex; align-items: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(201,168,76,0.12); transition: border-color 0.2s; }
        .pr-search-field:focus-within { border-color: rgba(201,168,76,0.35); }
        .pr-search-icon { padding: 0 12px; color: var(--muted); display: flex; align-items: center; flex-shrink: 0; }
        .pr-search-input { flex: 1; background: transparent; border: none; outline: none; color: var(--cream); font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 300; padding: 10px 12px 10px 0; }
        .pr-search-input::placeholder { color: rgba(138,128,112,0.5); }
        .pr-select { background: rgba(255,255,255,0.04); border: 1px solid rgba(201,168,76,0.12); color: var(--muted); padding: 10px 14px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400; outline: none; cursor: pointer; appearance: none; transition: border-color 0.2s, color 0.2s; min-width: 130px; }
        .pr-select:focus { border-color: rgba(201,168,76,0.3); color: var(--cream); }
        .pr-filter-btn { display: flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.04); border: 1px solid rgba(201,168,76,0.15); color: var(--muted); padding: 10px 16px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .pr-filter-btn:hover, .pr-filter-btn.active { border-color: rgba(201,168,76,0.4); color: var(--cream); background: rgba(201,168,76,0.06); }
        .pr-filter-count { background: var(--gold); color: #0a0a0a; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 500; }
        .pr-view-btns { display: flex; border: 1px solid rgba(201,168,76,0.12); overflow: hidden; flex-shrink: 0; }
        .pr-view-btn { background: transparent; border: none; padding: 8px 12px; cursor: pointer; color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; transition: all 0.2s; border-right: 1px solid rgba(201,168,76,0.12); }
        .pr-view-btn:last-child { border-right: none; }
        .pr-view-btn.active { background: rgba(201,168,76,0.1); color: var(--gold); }
        .pr-view-btn:hover:not(.active) { color: var(--cream); background: rgba(255,255,255,0.03); }
        .pr-adv-filters { max-width: 1280px; margin: 0 auto; padding: 0 40px; overflow: hidden; max-height: 0; transition: max-height 0.35s ease, padding 0.35s ease; }
        .pr-adv-filters.open { max-height: 120px; padding: 16px 40px 20px; }
        .pr-adv-inner { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .pr-adv-label { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-right: 4px; }
        .pr-clear-btn { display: flex; align-items: center; gap: 5px; background: transparent; border: 1px solid rgba(201,168,76,0.15); color: var(--muted); padding: 8px 12px; font-family: 'DM Sans', sans-serif; font-size: 11px; cursor: pointer; transition: all 0.2s; margin-left: auto; }
        .pr-clear-btn:hover { color: var(--cream); border-color: rgba(201,168,76,0.3); }
        .pr-body { max-width: 1280px; margin: 0 auto; padding: 48px 40px 80px; }
        .pr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); }
        .pr-grid.list-view { grid-template-columns: 1fr; }
        .prop-card { background: var(--dark-2); display: flex; flex-direction: column; transition: background 0.25s; position: relative; overflow: hidden; }
        .pr-grid.list-view .prop-card { flex-direction: row; }
        .prop-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), transparent); transform: scaleX(0); transform-origin: left; transition: transform 0.4s; }
        .prop-card:hover { background: rgba(20,20,18,0.98); }
        .prop-card:hover::after { transform: scaleX(1); }
        .prop-img-wrap { position: relative; overflow: hidden; aspect-ratio: 4/3; flex-shrink: 0; }
        .pr-grid.list-view .prop-img-wrap { width: 280px; aspect-ratio: auto; }
        .prop-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; filter: brightness(0.75) saturate(0.7); }
        .prop-card:hover .prop-img { transform: scale(1.04); filter: brightness(0.8) saturate(0.8); }
        .prop-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%); }
        .prop-badge-featured { position: absolute; top: 12px; left: 12px; background: var(--gold); color: #0a0a0a; font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; }
        .prop-type-badge { position: absolute; bottom: 44px; left: 12px; background: rgba(10,10,10,0.8); border: 1px solid rgba(201,168,76,0.25); color: var(--gold); font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; backdrop-filter: blur(8px); }
        .prop-actions { position: absolute; top: 12px; right: 12px; display: flex; flex-direction: column; gap: 4px; opacity: 0; transition: opacity 0.25s; }
        .prop-card:hover .prop-actions { opacity: 1; }
        .prop-action-btn { width: 28px; height: 28px; background: rgba(10,10,10,0.8); border: 1px solid rgba(201,168,76,0.2); color: var(--muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; backdrop-filter: blur(8px); }
        .prop-action-btn:hover { color: var(--gold); border-color: rgba(201,168,76,0.5); }
        .prop-action-btn.saved { color: #ef4444; border-color: #ef4444; }
        .prop-action-btn.apply-btn { background: rgba(112,196,144,0.9); border-color: rgba(112,196,144,0.4); color: #fff; font-weight: 500; }
        .prop-action-btn.apply-btn:hover { background: rgba(112,196,144,1); border-color: rgba(112,196,144,0.6); transform: translateY(-1px); }
        .prop-body { padding: 18px 20px 16px; display: flex; flex-direction: column; gap: 0; flex: 1; }
        .prop-location { display: flex; align-items: center; gap: 5px; font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
        .prop-title { font-size: 17px; font-weight: 400; color: var(--cream); letter-spacing: -0.01em; line-height: 1.3; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .prop-desc { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 300; line-height: 1.65; color: rgba(138,128,112,0.7); margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .prop-specs { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid rgba(201,168,76,0.07); border-bottom: 1px solid rgba(201,168,76,0.07); margin-bottom: 12px; }
        .prop-spec { display: flex; align-items: center; gap: 5px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 300; color: var(--muted); }
        .prop-spec svg { color: var(--gold); }
        .prop-spec-div { width: 1px; height: 12px; background: rgba(201,168,76,0.15); }
        .prop-footer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .prop-furnished-tag { font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); border: 1px solid rgba(201,168,76,0.12); padding: 3px 8px; }
        .prop-agent-tag { font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); border: 1px solid rgba(201,168,76,0.2); padding: 3px 8px; background: rgba(201,168,76,0.05); }
        .pr-load-more { display: flex; align-items: center; justify-content: center; margin-top: 40px; }
        .pr-load-more-btn { display: flex; align-items: center; gap: 8px; background: transparent; border: 1px solid rgba(201,168,76,0.25); color: var(--muted); padding: 12px 28px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
        .pr-load-more-btn:hover { color: var(--cream); border-color: rgba(201,168,76,0.5); }
        .pr-load-more-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pr-empty { grid-column: 1 / -1; padding: 80px 40px; text-align: center; background: var(--dark-2); }
        .pr-empty-icon { width: 64px; height: 64px; background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.15); display: flex; align-items: center; justify-content: center; color: var(--gold); margin: 0 auto 24px; }
        .pr-empty-title { font-size: 26px; font-weight: 300; color: var(--cream); margin-bottom: 8px; letter-spacing: -0.02em; }
        .pr-empty-desc { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300; color: var(--muted); margin-bottom: 24px; }
        .pr-empty-btn { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid rgba(201,168,76,0.25); color: var(--muted); padding: 10px 20px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.2s; }
        .pr-empty-btn:hover { color: var(--cream); border-color: rgba(201,168,76,0.5); }
        .pr-skeleton { background: linear-gradient(90deg, rgba(201,168,76,0.04) 25%, rgba(201,168,76,0.08) 50%, rgba(201,168,76,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @media (max-width: 1100px) { .pr-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .pr-header-inner, .pr-search-inner, .pr-body { padding-left: 20px; padding-right: 20px; }
          .pr-grid { grid-template-columns: 1fr; }
          .pr-grid.list-view .prop-card { flex-direction: column; }
          .pr-grid.list-view .prop-img-wrap { width: 100%; aspect-ratio: 4/3; }
          .pr-adv-filters.open { padding: 16px 20px 20px; max-height: 200px; }
          .pr-view-btns { display: none; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div className="pr-header">
        <div className="pr-header-inner">
          <div>
            <div className="pr-eyebrow">Browse Listings</div>
            <h1 className="pr-title">
              Available<br /><em>Properties</em>
            </h1>
          </div>
          <div className="pr-count">
            {loading
              ? 'Loading listings…'
              : pagination
                ? <>Showing <strong>{properties.length}</strong> of <strong>{pagination.total}</strong> verified listings</>
                : <><strong>{properties.length}</strong> listings found</>
            }
          </div>
        </div>
      </div>

      {/* ── Search / Filter bar ── */}
      <div className="pr-search-wrap">
        <div className="pr-search-inner">
          <div className="pr-search-field">
            <span className="pr-search-icon"><Search size={14} /></span>
            <input
              className="pr-search-input"
              type="text"
              placeholder="Location, property name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0 10px', display: 'flex', alignItems: 'center' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select className="pr-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            <option value="">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
            <option value="villa">Villa</option>
            <option value="commercial">Commercial</option>
          </select>

          <select className="pr-select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
            <option value="">All Prices</option>
            <option value="0-500">Under 500K TZS</option>
            <option value="500-1000">500K – 1M TZS</option>
            <option value="1000+">Above 1M TZS</option>
          </select>

          <button
            className={`pr-filter-btn${showFilters ? ' active' : ''}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && <span className="pr-filter-count">{activeFilterCount}</span>}
            <ChevronDown size={11} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>

          <div className="pr-view-btns">
            <button className={`pr-view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')}>Grid</button>
            <button className={`pr-view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')}>List</button>
          </div>
        </div>

        {/* Advanced filters */}
        <div className={`pr-adv-filters${showFilters ? ' open' : ''}`}>
          <div className="pr-adv-inner">
            <span className="pr-adv-label">Refine</span>

            <select className="pr-select" style={{ minWidth: 110 }} value={bedrooms} onChange={e => setBedrooms(e.target.value)}>
              <option value="">Bedrooms</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>

            <select className="pr-select" style={{ minWidth: 130 }} value={furnished} onChange={e => setFurnished(e.target.value)}>
              <option value="">Furnishing</option>
              <option value="furnished">Furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>

            {(activeFilterCount > 0 || searchTerm) && (
              <button className="pr-clear-btn" onClick={clearFilters}>
                <X size={11} /> Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Listings ── */}
      <div className="pr-body">
        {/* Error banner */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 24,
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {error}
            <button onClick={() => loadProperties(1)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          /* Skeleton grid */
          <div className={`pr-grid${viewMode === 'list' ? ' list-view' : ''}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--dark-2)' }}>
                <div className="pr-skeleton" style={{ height: 220 }} />
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="pr-skeleton" style={{ height: 12, width: '40%' }} />
                  <div className="pr-skeleton" style={{ height: 18, width: '75%' }} />
                  <div className="pr-skeleton" style={{ height: 12, width: '60%' }} />
                  <div className="pr-skeleton" style={{ height: 12, width: '50%', marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className={`pr-grid${viewMode === 'list' ? ' list-view' : ''}`}>
              {properties.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>

            {/* Load more / pagination */}
            {hasMore && (
              <div className="pr-load-more">
                <button
                  className="pr-load-more-btn"
                  disabled={loadingMore}
                  onClick={() => setPage(prev => prev + 1)}
                >
                  {loadingMore ? 'Loading…' : `Load More  ·  page ${(pagination?.current_page ?? 1) + 1} of ${pagination?.last_page}`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="pr-grid">
            <div className="pr-empty">
              <div className="pr-empty-icon"><Search size={24} /></div>
              <div className="pr-empty-title">No properties found</div>
              <div className="pr-empty-desc">
                Try adjusting your filters or search terms to see more results.
              </div>
              {(activeFilterCount > 0 || searchTerm) && (
                <button className="pr-empty-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;