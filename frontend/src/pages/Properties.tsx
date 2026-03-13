import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Bed, Bath, Square, Heart, Share2, QrCode, SlidersHorizontal, X, ArrowRight, ChevronDown } from 'lucide-react';

const Properties = () => {
  const [searchTerm,   setSearchTerm]   = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [priceRange,   setPriceRange]   = useState('');
  const [showFilters,  setShowFilters]  = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [viewMode,     setViewMode]     = useState('grid'); // 'grid' | 'list'
  const [bedrooms,     setBedrooms]     = useState('');
  const [furnished,    setFurnished]    = useState('');

  const properties = [
    {
      id: '1',
      title: 'Modern 2-Bedroom Apartment in Masaki',
      description: 'Beautiful apartment with ocean view, fully furnished with modern amenities.',
      price: 800000,
      address: 'Masaki, Dar es Salaam',
      bedrooms: 2, bathrooms: 2, area: 120,
      type: 'apartment', furnished: true,
      images: ['/api/placeholder/600/400'],
      owner: { name: 'John Smith', verified: true },
      status: 'available', featured: true,
    },
    {
      id: '2',
      title: 'Cozy Studio in Mikocheni',
      description: 'Perfect for singles or couples. Close to public transport and shopping centers.',
      price: 350000,
      address: 'Mikocheni, Dar es Salaam',
      bedrooms: 1, bathrooms: 1, area: 45,
      type: 'studio', furnished: false,
      images: ['/api/placeholder/600/400'],
      owner: { name: 'Mary Johnson', verified: true },
      dalali: { name: 'Agent Michael', code: 'DAL001' },
      status: 'available', featured: false,
    },
    {
      id: '3',
      title: 'Spacious 3-Bedroom House with Garden',
      description: 'Family-friendly house with private garden, parking space, and 24/7 security.',
      price: 1500000,
      address: 'Upanga, Dar es Salaam',
      bedrooms: 3, bathrooms: 2, area: 200,
      type: 'house', furnished: true,
      images: ['/api/placeholder/600/400'],
      owner: { name: 'Robert Williams', verified: true },
      status: 'available', featured: true,
    },
    {
      id: '4',
      title: 'Executive Villa in Oyster Bay',
      description: 'Luxury villa with private pool, ocean views and premium finishes throughout.',
      price: 3200000,
      address: 'Oyster Bay, Dar es Salaam',
      bedrooms: 4, bathrooms: 3, area: 340,
      type: 'house', furnished: true,
      images: ['/api/placeholder/600/400'],
      owner: { name: 'Sarah Ahmed', verified: true },
      status: 'available', featured: true,
    },
    {
      id: '5',
      title: '1-Bedroom Apartment in Kinondoni',
      description: 'Affordable and comfortable apartment in a quiet residential neighbourhood.',
      price: 420000,
      address: 'Kinondoni, Dar es Salaam',
      bedrooms: 1, bathrooms: 1, area: 60,
      type: 'apartment', furnished: false,
      images: ['/api/placeholder/600/400'],
      owner: { name: 'David Osei', verified: true },
      dalali: { name: 'Agent Lisa', code: 'DAL007' },
      status: 'available', featured: false,
    },
    {
      id: '6',
      title: 'Penthouse Studio in Msasani',
      description: 'Top-floor studio with panoramic city views and rooftop access.',
      price: 650000,
      address: 'Msasani, Dar es Salaam',
      bedrooms: 1, bathrooms: 1, area: 55,
      type: 'studio', furnished: true,
      images: ['/api/placeholder/600/400'],
      owner: { name: 'Amina Hassan', verified: true },
      status: 'available', featured: false,
    },
  ];

  const filtered = properties.filter(p => {
    const matchSearch   = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType     = !selectedType || p.type === selectedType;
    const matchPrice    = !priceRange ||
      (priceRange === '0-500'    && p.price <= 500000) ||
      (priceRange === '500-1000' && p.price > 500000 && p.price <= 1000000) ||
      (priceRange === '1000+'    && p.price > 1000000);
    const matchBeds     = !bedrooms || p.bedrooms >= parseInt(bedrooms);
    const matchFurnish  = !furnished ||
      (furnished === 'furnished'   && p.furnished) ||
      (furnished === 'unfurnished' && !p.furnished);
    return matchSearch && matchType && matchPrice && matchBeds && matchFurnish;
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSavedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const clearFilters = () => {
    setSearchTerm(''); setSelectedType(''); setPriceRange('');
    setBedrooms(''); setFurnished('');
  };

  const activeFilterCount = [selectedType, priceRange, bedrooms, furnished].filter(Boolean).length;

  const typeLabel: { [key: string]: string } = { apartment: 'Apartment', house: 'House', studio: 'Studio', villa: 'Villa' };

  const PropertyCard = ({ property }: { property: any }) => (
    <Link to={`/property/${property.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="prop-card">
        {/* Image */}
        <div className="prop-img-wrap">
          <img src={property.images[0]} alt={property.title} className="prop-img" />
          <div className="prop-img-overlay" />

          {property.featured && (
            <div className="prop-badge-featured">Featured</div>
          )}

          <div className="prop-type-badge">{typeLabel[property.type] || property.type}</div>

          <div className="prop-actions">
            <button
              className={`prop-action-btn${savedIds.includes(property.id) ? ' saved' : ''}`}
              onClick={(e) => toggleSave(property.id, e)}
              title="Save"
            >
              <Heart size={13} fill={savedIds.includes(property.id) ? 'currentColor' : 'none'} />
            </button>
            <button className="prop-action-btn" onClick={e => e.preventDefault()} title="Share">
              <Share2 size={13} />
            </button>
            <button className="prop-action-btn" onClick={e => e.preventDefault()} title="QR Code">
              <QrCode size={13} />
            </button>
          </div>

          <div className="prop-price">
            <span className="prop-price-num">{(property.price / 1000).toFixed(0)}K</span>
            <span className="prop-price-unit"> TZS / mo</span>
          </div>
        </div>

        {/* Body */}
        <div className="prop-body">
          <div className="prop-location">
            <MapPin size={11} style={{ color: 'var(--gold)', flexShrink: 0 }} />
            {property.address}
          </div>

          <h3 className="prop-title">{property.title}</h3>
          <p className="prop-desc">{property.description}</p>

          <div className="prop-specs">
            <div className="prop-spec"><Bed size={12} />{property.bedrooms} Bed{property.bedrooms > 1 ? 's' : ''}</div>
            <div className="prop-spec-div" />
            <div className="prop-spec"><Bath size={12} />{property.bathrooms} Bath{property.bathrooms > 1 ? 's' : ''}</div>
            <div className="prop-spec-div" />
            <div className="prop-spec"><Square size={12} />{property.area} m²</div>
          </div>

          <div className="prop-footer">
            <div className="prop-furnished-tag">
              {property.furnished ? 'Furnished' : 'Unfurnished'}
            </div>
            {property.dalali && (
              <div className="prop-agent-tag">
                {property.dalali.name}
              </div>
            )}
            <div className="prop-cta">
              View <ArrowRight size={11} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

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

        /* ── Page header ── */
        .pr-header {
          border-bottom: 1px solid var(--border);
          background: var(--dark);
        }

        .pr-header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 56px 40px 44px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .pr-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pr-eyebrow::before { content: ''; width: 24px; height: 1px; background: var(--gold); }

        .pr-title {
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 300;
          line-height: 1.06;
          letter-spacing: -0.025em;
          color: var(--cream);
        }

        .pr-title em { font-style: italic; color: var(--gold-light); }

        .pr-count {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: var(--muted);
          padding-bottom: 6px;
        }

        .pr-count strong { color: var(--gold); font-weight: 400; }

        /* ── Search bar ── */
        .pr-search-wrap {
          background: var(--dark-3);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 64px;
          z-index: 50;
        }

        .pr-search-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 16px 40px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pr-search-field {
          flex: 1;
          min-width: 220px;
          display: flex;
          align-items: center;
          gap: 0;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,168,76,0.12);
          transition: border-color 0.2s;
        }

        .pr-search-field:focus-within { border-color: rgba(201,168,76,0.35); }

        .pr-search-icon {
          padding: 0 12px;
          color: var(--muted);
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .pr-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          padding: 10px 12px 10px 0;
        }

        .pr-search-input::placeholder { color: rgba(138,128,112,0.5); }

        .pr-select {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,168,76,0.12);
          color: var(--muted);
          padding: 10px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          outline: none;
          cursor: pointer;
          appearance: none;
          transition: border-color 0.2s, color 0.2s;
          min-width: 130px;
        }

        .pr-select:focus, .pr-select:not([value=""]) { border-color: rgba(201,168,76,0.3); color: var(--cream); }

        .pr-filter-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,168,76,0.15);
          color: var(--muted);
          padding: 10px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .pr-filter-btn:hover, .pr-filter-btn.active {
          border-color: rgba(201,168,76,0.4);
          color: var(--cream);
          background: rgba(201,168,76,0.06);
        }

        .pr-filter-count {
          background: var(--gold);
          color: #0a0a0a;
          width: 16px; height: 16px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px;
          font-weight: 500;
        }

        .pr-view-btns {
          display: flex;
          gap: 0;
          border: 1px solid rgba(201,168,76,0.12);
          overflow: hidden;
          flex-shrink: 0;
        }

        .pr-view-btn {
          background: transparent;
          border: none;
          padding: 8px 12px;
          cursor: pointer;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: all 0.2s;
          border-right: 1px solid rgba(201,168,76,0.12);
        }

        .pr-view-btn:last-child { border-right: none; }
        .pr-view-btn.active { background: rgba(201,168,76,0.1); color: var(--gold); }
        .pr-view-btn:hover:not(.active) { color: var(--cream); background: rgba(255,255,255,0.03); }

        /* Advanced filters drawer */
        .pr-adv-filters {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 40px;
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.35s ease, padding 0.35s ease;
        }

        .pr-adv-filters.open {
          max-height: 120px;
          padding: 16px 40px 20px;
        }

        .pr-adv-inner {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .pr-adv-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          margin-right: 4px;
        }

        .pr-clear-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: transparent;
          border: 1px solid rgba(201,168,76,0.15);
          color: var(--muted);
          padding: 8px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          margin-left: auto;
        }

        .pr-clear-btn:hover { color: var(--cream); border-color: rgba(201,168,76,0.3); }

        /* ── Grid ── */
        .pr-body {
          max-width: 1280px;
          margin: 0 auto;
          padding: 48px 40px 80px;
        }

        .pr-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }

        .pr-grid.list-view {
          grid-template-columns: 1fr;
        }

        /* ── Property card ── */
        .prop-card {
          background: var(--dark-2);
          display: flex;
          flex-direction: column;
          transition: background 0.25s;
          position: relative;
          overflow: hidden;
        }

        .pr-grid.list-view .prop-card {
          flex-direction: row;
        }

        .prop-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s;
        }

        .prop-card:hover { background: rgba(20,20,18,0.98); }
        .prop-card:hover::after { transform: scaleX(1); }

        .prop-img-wrap {
          position: relative;
          overflow: hidden;
          aspect-ratio: 4/3;
          flex-shrink: 0;
        }

        .pr-grid.list-view .prop-img-wrap {
          width: 280px;
          aspect-ratio: auto;
        }

        .prop-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
          filter: brightness(0.75) saturate(0.7);
        }

        .prop-card:hover .prop-img { transform: scale(1.04); filter: brightness(0.8) saturate(0.8); }

        .prop-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%);
        }

        .prop-badge-featured {
          position: absolute;
          top: 12px; left: 12px;
          background: var(--gold);
          color: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 4px 10px;
        }

        .prop-type-badge {
          position: absolute;
          bottom: 12px; left: 12px;
          background: rgba(10,10,10,0.8);
          border: 1px solid rgba(201,168,76,0.25);
          color: var(--gold);
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 4px 10px;
          backdrop-filter: blur(8px);
        }

        .prop-actions {
          position: absolute;
          top: 12px; right: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.25s;
        }

        .prop-card:hover .prop-actions { opacity: 1; }

        .prop-action-btn {
          width: 28px; height: 28px;
          background: rgba(10,10,10,0.8);
          border: 1px solid rgba(201,168,76,0.2);
          color: var(--muted);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(8px);
        }

        .prop-action-btn:hover { color: var(--gold); border-color: rgba(201,168,76,0.5); }
        .prop-action-btn.saved { color: var(--gold); border-color: var(--gold); }

        .prop-price {
          position: absolute;
          bottom: 12px; right: 12px;
          text-align: right;
        }

        .prop-price-num {
          font-size: 20px;
          font-weight: 300;
          color: var(--cream);
          letter-spacing: -0.02em;
        }

        .prop-price-unit {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 300;
          color: rgba(245,240,232,0.55);
        }

        /* card body */
        .prop-body {
          padding: 22px 22px 18px;
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1;
        }

        .prop-location {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 8px;
        }

        .prop-title {
          font-size: 17px;
          font-weight: 400;
          color: var(--cream);
          letter-spacing: -0.01em;
          line-height: 1.3;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .prop-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 300;
          line-height: 1.65;
          color: rgba(138,128,112,0.7);
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .prop-specs {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-top: 1px solid rgba(201,168,76,0.07);
          border-bottom: 1px solid rgba(201,168,76,0.07);
          margin-bottom: 14px;
        }

        .prop-spec {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 300;
          color: var(--muted);
        }

        .prop-spec svg { color: var(--gold); }

        .prop-spec-div {
          width: 1px; height: 12px;
          background: rgba(201,168,76,0.15);
        }

        .prop-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .prop-furnished-tag {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--muted);
          border: 1px solid rgba(201,168,76,0.12);
          padding: 3px 8px;
        }

        .prop-agent-tag {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold);
          border: 1px solid rgba(201,168,76,0.2);
          padding: 3px 8px;
          background: rgba(201,168,76,0.05);
        }

        .prop-cta {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .prop-card:hover .prop-cta { opacity: 1; }

        /* ── Empty state ── */
        .pr-empty {
          grid-column: 1 / -1;
          padding: 80px 40px;
          text-align: center;
          background: var(--dark-2);
        }

        .pr-empty-icon {
          width: 64px; height: 64px;
          background: rgba(201,168,76,0.06);
          border: 1px solid rgba(201,168,76,0.15);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
          margin: 0 auto 24px;
        }

        .pr-empty-title {
          font-size: 26px;
          font-weight: 300;
          color: var(--cream);
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .pr-empty-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: var(--muted);
          margin-bottom: 24px;
        }

        .pr-empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid rgba(201,168,76,0.25);
          color: var(--muted);
          padding: 10px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pr-empty-btn:hover { color: var(--cream); border-color: rgba(201,168,76,0.5); }

        /* Responsive */
        @media (max-width: 1100px) {
          .pr-grid { grid-template-columns: repeat(2, 1fr); }
        }

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
            Showing <strong>{filtered.length}</strong> of <strong>{properties.length}</strong> verified listings
          </div>
        </div>
      </div>

      {/* ── Search / Filter bar ── */}
      <div className="pr-search-wrap">
        <div className="pr-search-inner">
          {/* Search */}
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
          </select>

          <select className="pr-select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
            <option value="">All Prices</option>
            <option value="0-500">Under 500K TZS</option>
            <option value="500-1000">500K – 1M TZS</option>
            <option value="1000+">Above 1M TZS</option>
          </select>

          <button
            className={`pr-filter-btn${showFilters ? ' active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
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
                <X size={11} />
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Listings ── */}
      <div className="pr-body">
        <div className={`pr-grid${viewMode === 'list' ? ' list-view' : ''}`}>
          {filtered.length > 0 ? (
            filtered.map(p => <PropertyCard key={p.id} property={p} />)
          ) : (
            <div className="pr-empty">
              <div className="pr-empty-icon"><Search size={24} /></div>
              <div className="pr-empty-title">No properties found</div>
              <p className="pr-empty-desc">Try adjusting your search criteria or clearing the active filters.</p>
              <button className="pr-empty-btn" onClick={clearFilters}>
                <X size={12} /> Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Properties;