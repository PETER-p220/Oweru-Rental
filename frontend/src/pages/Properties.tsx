import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Bed, Bath, Square, Heart, Share2,
  SlidersHorizontal, X, ChevronDown, LayoutGrid, List,
} from 'lucide-react';
import Api from '../services/api';

/* ─── Types ─── */
interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Property {
  id: number;
  title: string;
  location?: string;
  address?: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  area?: number;
  type?: string;
  featured?: boolean;
  furnished?: boolean;
  description?: string;
  images?: string[];
  owner?: { name?: string; first_name?: string; last_name?: string };
  agent?: { name?: string; code?: string };
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

/* ─── Helpers ─── */
const VITE_STORAGE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? '';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);

const typeLabel: Record<string, string> = {
  apartment: 'Apartment', house: 'House', studio: 'Studio',
  villa: 'Villa', commercial: 'Commercial',
};

const getImage = (property: Property) => {
  if (property.images && property.images.length > 0) {
    const img = property.images[0];
    return img.startsWith('http') ? img : `${VITE_STORAGE}/storage/${img}`;
  }
  return '/api/placeholder/600/400';
};

/* ─── CSS ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --navy:       #1E3A5F;
  --navy-2:     #2D5282;
  --navy-faint: rgba(30, 58, 95, 0.06);
  --navy-soft:  rgba(30, 58, 95, 0.12);
  --gold:       #C9A84C;
  --gold-faint: rgba(201,168,76,0.10);
  --bg:         #F8FAFC;
  --surface:    #FFFFFF;
  --border:     #E2E8F0;
  --muted:      #64748B;
  --hint:       #94A3B8;
  --text:       #1E293B;
  --success:    #059669;
  --danger:     #DC2626;
  --sans:       'DM Sans', system-ui, sans-serif;
  --serif:      'Fraunces', Georgia, serif;
  --radius:     12px;
  --radius-sm:  8px;
}

body { font-family: var(--sans); background: var(--bg); color: var(--text); }

/* ── Page header ── */
.ph { background: var(--navy); color: #fff; }
.ph-inner {
  max-width: 1280px; margin: 0 auto;
  padding: 52px 40px 44px;
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 20px; flex-wrap: wrap;
}
.ph-eyebrow {
  font-family: var(--sans); font-size: 10px; font-weight: 500;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--gold); margin-bottom: 10px;
  display: flex; align-items: center; gap: 10px;
}
.ph-eyebrow::before { content: ''; width: 20px; height: 1px; background: var(--gold); }
.ph-title {
  font-family: var(--serif); font-size: clamp(28px, 4vw, 48px);
  font-weight: 300; line-height: 1.08; letter-spacing: -0.02em; color: #fff;
}
.ph-title em { font-style: italic; color: rgba(201,168,76,0.9); }
.ph-meta {
  font-family: var(--sans); font-size: 13px; font-weight: 300;
  color: rgba(255,255,255,0.5); padding-bottom: 4px; text-align: right;
}
.ph-meta strong { color: var(--gold); font-weight: 400; }

/* ── Search bar ── */
.sb {
  background: var(--surface); border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 50;
  box-shadow: 0 1px 8px rgba(0,0,0,0.06);
}
.sb-inner {
  max-width: 1280px; margin: 0 auto;
  padding: 12px 40px;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.sb-search {
  flex: 1; min-width: 220px;
  display: flex; align-items: center;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: var(--radius-sm); overflow: hidden;
  transition: border-color 0.18s;
}
.sb-search:focus-within { border-color: var(--navy); }
.sb-search-icon { padding: 0 10px; color: var(--hint); display: flex; align-items: center; flex-shrink: 0; }
.sb-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: var(--text); font-family: var(--sans); font-size: 13px;
  font-weight: 400; padding: 9px 10px 9px 0;
}
.sb-input::placeholder { color: var(--hint); }
.sb-clear {
  background: none; border: none; color: var(--hint); cursor: pointer;
  padding: 0 10px; display: flex; align-items: center; line-height: 1;
  transition: color 0.15s;
}
.sb-clear:hover { color: var(--text); }

.sb-select {
  background: var(--bg); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--muted);
  padding: 9px 12px; font-family: var(--sans); font-size: 13px;
  font-weight: 400; outline: none; cursor: pointer; appearance: none;
  transition: border-color 0.18s; min-width: 130px;
}
.sb-select:focus { border-color: var(--navy); color: var(--text); }

.sb-filter-btn {
  display: flex; align-items: center; gap: 6px;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--muted);
  padding: 9px 14px; font-family: var(--sans); font-size: 13px;
  font-weight: 400; cursor: pointer; white-space: nowrap;
  transition: all 0.18s;
}
.sb-filter-btn:hover, .sb-filter-btn.active {
  border-color: var(--navy); color: var(--navy);
  background: var(--navy-faint);
}
.sb-filter-count {
  background: var(--navy); color: #fff;
  width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 500;
}

.sb-view-btns {
  display: flex; gap: 4px; flex-shrink: 0;
}
.sb-view-btn {
  width: 34px; height: 34px;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--hint);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.18s;
}
.sb-view-btn.active { background: var(--navy); border-color: var(--navy); color: #fff; }
.sb-view-btn:hover:not(.active) { border-color: var(--navy); color: var(--navy); }

/* ── Advanced filters drawer ── */
.adv {
  background: var(--bg); border-bottom: 1px solid var(--border);
  max-height: 0; overflow: hidden; transition: max-height 0.3s ease;
}
.adv.open { max-height: 80px; }
.adv-inner {
  max-width: 1280px; margin: 0 auto;
  padding: 12px 40px 16px;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.adv-label {
  font-family: var(--sans); font-size: 10px; font-weight: 500;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--hint);
  margin-right: 4px; flex-shrink: 0;
}
.adv-clear {
  display: flex; align-items: center; gap: 5px;
  background: transparent; border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--muted);
  padding: 7px 12px; font-family: var(--sans); font-size: 12px;
  cursor: pointer; transition: all 0.18s; margin-left: auto;
}
.adv-clear:hover { color: var(--danger); border-color: var(--danger); }

/* ── Body ── */
.pr-body { max-width: 1280px; margin: 0 auto; padding: 36px 40px 80px; }

/* ── Grid ── */
.pr-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.pr-grid.list { grid-template-columns: minmax(0, 1fr); }

/* ── Property Card ── */
.pc {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); overflow: hidden;
  transition: box-shadow 0.22s, transform 0.22s, border-color 0.22s;
  display: flex; flex-direction: column;
  text-decoration: none; color: inherit;
}
.pc:hover {
  box-shadow: 0 8px 28px rgba(30,58,95,0.10);
  transform: translateY(-2px); border-color: rgba(30,58,95,0.2);
}
.pr-grid.list .pc { flex-direction: row; }

/* Image area */
.pc-img-wrap {
  position: relative; overflow: hidden; aspect-ratio: 4/3; flex-shrink: 0;
}
.pr-grid.list .pc-img-wrap { width: 260px; aspect-ratio: auto; }
.pc-img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.4s ease;
}
.pc:hover .pc-img { transform: scale(1.04); }
.pc-img-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(15,25,50,0.55) 0%, transparent 55%);
}

/* Badges on image */
.pc-badge-featured {
  position: absolute; top: 12px; left: 12px;
  background: var(--gold); color: #1a1000;
  font-family: var(--sans); font-size: 9px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 4px;
}
.pc-badge-type {
  position: absolute; bottom: 12px; left: 12px;
  background: rgba(30,58,95,0.85); color: rgba(201,168,76,0.95);
  font-family: var(--sans); font-size: 9px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 4px;
  backdrop-filter: blur(6px);
}
.pc-price-overlay {
  position: absolute; bottom: 12px; right: 12px;
  text-align: right;
}
.pc-price-main {
  font-family: var(--serif); font-size: 18px; font-weight: 300;
  color: #fff; letter-spacing: -0.01em;
}
.pc-price-period {
  font-family: var(--sans); font-size: 10px; font-weight: 300;
  color: rgba(255,255,255,0.55);
}

/* Hover actions on image */
.pc-img-actions {
  position: absolute; top: 12px; right: 12px;
  display: flex; flex-direction: column; gap: 4px;
  opacity: 0; transition: opacity 0.22s;
}
.pc:hover .pc-img-actions { opacity: 1; }
.pc-img-btn {
  width: 30px; height: 30px;
  background: rgba(255,255,255,0.92); border: none; border-radius: 6px;
  color: var(--muted); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}
.pc-img-btn:hover { color: var(--navy); background: #fff; }
.pc-img-btn.saved { color: var(--danger); }

/* Card body */
.pc-body {
  padding: 16px 18px 18px;
  display: flex; flex-direction: column; flex: 1;
}
.pc-location {
  display: flex; align-items: center; gap: 4px;
  font-family: var(--sans); font-size: 11px; font-weight: 400;
  letter-spacing: 0.06em; color: var(--hint);
  margin-bottom: 6px;
}
.pc-title {
  font-family: var(--serif); font-size: 17px; font-weight: 400;
  color: var(--navy); letter-spacing: -0.01em; line-height: 1.3;
  margin-bottom: 4px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.pc-desc {
  font-family: var(--sans); font-size: 12px; font-weight: 300;
  line-height: 1.65; color: var(--hint);
  margin-bottom: 12px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.pc-specs {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0; margin: auto 0 12px;
  border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
}
.pc-spec {
  display: flex; align-items: center; gap: 5px;
  font-family: var(--sans); font-size: 12px; font-weight: 400; color: var(--muted);
}
.pc-spec svg { color: var(--navy); opacity: 0.7; }
.pc-spec-div { width: 1px; height: 12px; background: var(--border); }

/* Card footer */
.pc-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.pc-price-block {}
.pc-price-val {
  font-family: var(--sans); font-size: 16px; font-weight: 600; color: var(--navy);
}
.pc-price-mo { font-size: 11px; font-weight: 400; color: var(--hint); }
.pc-foot-actions { display: flex; align-items: center; gap: 6px; }
.pc-foot-btn {
  height: 30px; border-radius: 6px;
  border: 1px solid var(--border); background: var(--bg);
  color: var(--muted); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; padding: 0 8px;
}
.pc-foot-btn:hover { border-color: var(--navy); color: var(--navy); background: var(--navy-faint); }
.pc-foot-btn.saved { color: var(--danger); border-color: rgba(220,38,38,0.3); background: rgba(220,38,38,0.04); }
.pc-foot-btn.apply {
  background: var(--navy); border-color: var(--navy); color: #fff;
  padding: 0 12px; font-family: var(--sans); font-size: 12px; font-weight: 500;
}
.pc-foot-btn.apply:hover { background: var(--navy-2); border-color: var(--navy-2); }

/* Tags */
.pc-tag {
  font-family: var(--sans); font-size: 10px; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--navy-2); background: var(--navy-faint);
  border: 1px solid var(--navy-soft); padding: 3px 8px; border-radius: 4px;
}

/* ── Skeleton ── */
.skel {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); overflow: hidden;
}
.skel-pulse {
  background: linear-gradient(90deg, var(--border) 25%, #F1F5F9 50%, var(--border) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

/* ── Empty state ── */
.pr-empty {
  grid-column: 1 / -1;
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 40px; text-align: center;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius);
}
.pr-empty-icon {
  width: 60px; height: 60px; border-radius: 16px;
  background: var(--navy-faint); border: 1px solid var(--navy-soft);
  display: flex; align-items: center; justify-content: center;
  color: var(--navy); margin-bottom: 20px;
}
.pr-empty-title {
  font-family: var(--serif); font-size: 24px; font-weight: 300;
  color: var(--navy); margin-bottom: 6px; letter-spacing: -0.01em;
}
.pr-empty-desc {
  font-family: var(--sans); font-size: 14px; font-weight: 300;
  color: var(--hint); margin-bottom: 24px;
}
.pr-empty-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent; border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--muted);
  padding: 9px 18px; font-family: var(--sans); font-size: 13px;
  cursor: pointer; transition: all 0.18s;
}
.pr-empty-btn:hover { border-color: var(--navy); color: var(--navy); background: var(--navy-faint); }

/* ── Error banner ── */
.err-banner {
  background: rgba(220,38,38,0.05); border: 1px solid rgba(220,38,38,0.2);
  border-radius: var(--radius-sm); padding: 12px 16px;
  margin-bottom: 24px; font-family: var(--sans); font-size: 13px;
  color: var(--danger); display: flex; align-items: center; justify-content: space-between;
}
.err-retry {
  background: none; border: none; color: var(--danger); cursor: pointer;
  font-size: 12px; font-family: var(--sans); text-decoration: underline;
}

/* ── Load more ── */
.load-more {
  display: flex; align-items: center; justify-content: center; margin-top: 36px;
}
.load-more-btn {
  display: flex; align-items: center; gap: 8px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--muted);
  padding: 11px 28px; font-family: var(--sans); font-size: 13px;
  font-weight: 400; cursor: pointer; transition: all 0.18s;
}
.load-more-btn:hover { border-color: var(--navy); color: var(--navy); background: var(--navy-faint); }
.load-more-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Responsive ── */
@media (max-width: 1100px) { .pr-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 768px) {
  .ph-inner, .sb-inner, .pr-body { padding-left: 16px; padding-right: 16px; }
  .pr-grid { grid-template-columns: minmax(0, 1fr); }
  .pr-grid.list .pc { flex-direction: column; }
  .pr-grid.list .pc-img-wrap { width: 100%; aspect-ratio: 4/3; }
  .adv.open { max-height: 130px; }
  .adv-inner { padding: 12px 16px 16px; }
  .sb-view-btns { display: none; }
}
`;

/* ─── Skeleton Card ─── */
const SkeletonCard = () => (
  <div className="skel">
    <div className="skel-pulse" style={{ height: 200 }} />
    <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="skel-pulse" style={{ height: 11, width: '38%', borderRadius: 4 }} />
      <div className="skel-pulse" style={{ height: 17, width: '72%', borderRadius: 4 }} />
      <div className="skel-pulse" style={{ height: 11, width: '55%', borderRadius: 4 }} />
      <div style={{ height: 12 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skel-pulse" style={{ height: 11, width: 55, borderRadius: 4 }} />
        <div className="skel-pulse" style={{ height: 11, width: 55, borderRadius: 4 }} />
        <div className="skel-pulse" style={{ height: 11, width: 55, borderRadius: 4 }} />
      </div>
    </div>
  </div>
);

/* ─── Property Card ─── */
const PropertyCard = ({
  property,
  isSaved,
  onSave,
  onApply,
}: {
  property: Property;
  isSaved: boolean;
  onSave: (e: React.MouseEvent) => void;
  onApply: (e: React.MouseEvent) => void;
}) => {
  const imageUrl = getImage(property);
  const loc = property.location || property.address;
  const size = property.size ?? property.area;

  return (
    <Link to={`/property/${property.id}`} className="pc" style={{ textDecoration: 'none' }}>
      {/* Image */}
      <div className="pc-img-wrap">
        <img src={imageUrl} alt={property.title} className="pc-img" />
        <div className="pc-img-overlay" />
        {property.featured && <div className="pc-badge-featured">Featured</div>}
        {property.type && (
          <div className="pc-badge-type">{typeLabel[property.type] ?? property.type}</div>
        )}
        <div className="pc-price-overlay">
          <div className="pc-price-main">{formatPrice(property.price)}</div>
          <div className="pc-price-period">/month</div>
        </div>
        {/* Hover actions */}
        <div className="pc-img-actions">
          <button
            className={`pc-img-btn${isSaved ? ' saved' : ''}`}
            onClick={onSave}
            title={isSaved ? 'Unsave' : 'Save'}
          >
            <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          <button
            className="pc-img-btn"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/property/${property.id}`); }}
            title="Copy link"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="pc-body">
        {loc && (
          <div className="pc-location">
            <MapPin size={11} />
            {loc}
          </div>
        )}
        <div className="pc-title">{property.title || 'Untitled Property'}</div>
        {property.description && <div className="pc-desc">{property.description}</div>}

        {/* Specs */}
        <div className="pc-specs">
          {property.bedrooms != null && (
            <>
              <div className="pc-spec"><Bed size={13} />{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</div>
              <div className="pc-spec-div" />
            </>
          )}
          {property.bathrooms != null && (
            <>
              <div className="pc-spec"><Bath size={13} />{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</div>
              {size != null && <div className="pc-spec-div" />}
            </>
          )}
          {size != null && (
            <div className="pc-spec"><Square size={13} />{size} m²</div>
          )}
        </div>

        {/* Footer */}
        <div className="pc-footer">
          <div>
            {property.furnished && <span className="pc-tag">Furnished</span>}
          </div>
          <div className="pc-foot-actions">
            <button
              className={`pc-foot-btn${isSaved ? ' saved' : ''}`}
              onClick={onSave}
              title={isSaved ? 'Unsave' : 'Save'}
            >
              <Heart size={13} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <button className="pc-foot-btn" title="Share"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/property/${property.id}`); }}
            >
              <Share2 size={13} />
            </button>
            <button className="pc-foot-btn apply" onClick={onApply}>
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ─── Main Component ─── */
const Properties = () => {
  const navigate = useNavigate();
  const [searchTerm,   setSearchTerm]   = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [priceRange,   setPriceRange]   = useState('');
  const [bedrooms,     setBedrooms]     = useState<number | undefined>(undefined);
  const [furnished,    setFurnished]    = useState<boolean | undefined>(undefined);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [error,        setError]        = useState('');
  const [savedIds,     setSavedIds]     = useState(new Set<number>());
  const [applications, setApplications] = useState<any[]>([]);
  const [pagination,   setPagination]   = useState<Pagination | null>(null);
  const [viewMode,     setViewMode]     = useState<'grid' | 'list'>('grid');
  const [showFilters,  setShowFilters]  = useState(false);
  const [properties,   setProperties]   = useState<Property[]>([]);

  const debouncedSearch = useDebounce(searchTerm, 400);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedType, priceRange, bedrooms, furnished]);

  // Load applications
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await Api.getTenantApplications();
          setApplications(res.data || []);
        }
      } catch { /* silent */ }
    };
    load();
  }, []);

  // Handle pending application from login redirect
  useEffect(() => {
    const pending = sessionStorage.getItem('pendingApplication');
    if (pending) {
      sessionStorage.removeItem('pendingApplication');
      setTimeout(() => navigate(`/dashboard/tenant/applications?property=${pending}`), 1500);
    }
  }, []);

  const buildParams = useCallback((pageNum: number) => {
    const p: Record<string, string> = { page: pageNum.toString() };
    if (debouncedSearch) p.search = debouncedSearch;
    if (selectedType)    p.type   = selectedType;
    if (priceRange === '0-500')    { p.min_price = '0';       p.max_price = '500000'; }
    if (priceRange === '500-1000') { p.min_price = '500000';  p.max_price = '1000000'; }
    if (priceRange === '1000+')    { p.min_price = '1000000'; }
    if (bedrooms)            p.bedrooms  = bedrooms.toString();
    if (furnished != null)   p.furnished = furnished ? 'true' : 'false';
    return p;
  }, [debouncedSearch, selectedType, priceRange, bedrooms, furnished]);

  const loadProperties = useCallback(async (pageNum: number) => {
    try {
      pageNum === 1 ? setLoading(true) : setLoadingMore(true);
      setError('');
      const res = await Api.getProperties(buildParams(pageNum));
      const items: Property[] = res.data?.data ?? res.data ?? [];
      const pag: Pagination | null = res.data?.pagination ?? null;
      setProperties(prev => pageNum === 1 ? items : [...prev, ...items]);
      setPagination(pag);
    } catch {
      setError('Failed to load properties. Please try again.');
      if (pageNum === 1) setProperties([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildParams]);

  useEffect(() => { loadProperties(page); }, [page, loadProperties]);

  const toggleSave = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      if (savedIds.has(id)) {
        await Api.publicUnsaveProperty(id);
        setSavedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      } else {
        await Api.publicSaveProperty(id);
        setSavedIds(prev => new Set(prev).add(id));
      }
    } catch { /* silent */ }
  };

  const handleApply = (property: Property, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      // Show authentication required message
      const action = window.confirm(
        `🔐 Authentication Required\n\n` +
        `To apply for "${property.title || 'this property'}", you need to:\n` +
        `• Log in to your existing account, OR\n` +
        `• Create a new account\n\n` +
        `Click OK to go to login/signup page\n` +
        `Click Cancel to browse more properties`
      );
      
      if (action) {
        // Store the property they want to apply for
        sessionStorage.setItem('pendingApplication', property.id.toString());
        // Redirect to login with a return URL
        navigate(`/login?redirect=/dashboard/tenant/applications?property=${property.id}`);
      }
      return;
    }
    
    // User is authenticated, show application confirmation
    const ok = window.confirm(
      `🏠 Ready to Apply?\n\n` +
      `Property: ${property.title || 'Untitled Property'}\n` +
      `Rent: ${formatPrice(property.price)}/month\n` +
      `Location: ${property.location || property.address || 'Not specified'}\n\n` +
      `Click OK to proceed with your rental application.`
    );
    
    if (ok) {
      navigate(`/dashboard/tenant/applications?property=${property.id}`);
    }
  };

  const clearFilters = () => {
    setSearchTerm(''); setSelectedType(''); setPriceRange('');
    setBedrooms(undefined); setFurnished(undefined);
  };

  const activeFilterCount = [selectedType, priceRange, bedrooms, furnished].filter(v => v != null && v !== '').length;
  const hasMore = pagination ? pagination.current_page < pagination.last_page : false;

  /* ── Render ── */
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div className="ph">
        <div className="ph-inner">
          <div>
            <div className="ph-eyebrow">Browse listings</div>
            <h1 className="ph-title">
              Available<br /><em>Properties</em>
            </h1>
          </div>
          <div className="ph-meta">
            {loading
              ? 'Fetching listings…'
              : pagination
                ? <><strong>{properties.length}</strong> of <strong>{pagination.total}</strong> listings</>
                : <><strong>{properties.length}</strong> listings found</>
            }
            {applications.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(201,168,76,0.85)' }}>
                {applications.length} active application{applications.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sb">
        <div className="sb-inner">
          {/* Search input */}
          <div className="sb-search">
            <span className="sb-search-icon"><Search size={14} /></span>
            <input
              className="sb-input"
              type="text"
              placeholder="Location or property name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="sb-clear" onClick={() => setSearchTerm('')}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Type */}
          <select className="sb-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            <option value="">All types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
            <option value="villa">Villa</option>
            <option value="commercial">Commercial</option>
          </select>

          {/* Price */}
          <select className="sb-select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
            <option value="">All prices</option>
            <option value="0-500">Under 500K TZS</option>
            <option value="500-1000">500K – 1M TZS</option>
            <option value="1000+">Above 1M TZS</option>
          </select>

          {/* More filters */}
          <button
            className={`sb-filter-btn${showFilters ? ' active' : ''}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && <span className="sb-filter-count">{activeFilterCount}</span>}
            <ChevronDown
              size={11}
              style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}
            />
          </button>

          {/* View mode */}
          <div className="sb-view-btns">
            <button className={`sb-view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')} title="Grid">
              <LayoutGrid size={15} />
            </button>
            <button className={`sb-view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')} title="List">
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Advanced filters */}
        <div className={`adv${showFilters ? ' open' : ''}`}>
          <div className="adv-inner">
            <span className="adv-label">Refine</span>
            <select
              className="sb-select"
              style={{ minWidth: 110 }}
              value={bedrooms?.toString() ?? ''}
              onChange={e => setBedrooms(e.target.value ? parseInt(e.target.value) : undefined)}
            >
              <option value="">Bedrooms</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
            <select
              className="sb-select"
              style={{ minWidth: 130 }}
              value={furnished == null ? '' : furnished ? 'true' : 'false'}
              onChange={e => {
                const v = e.target.value;
                setFurnished(v === '' ? undefined : v === 'true');
              }}
            >
              <option value="">Furnishing</option>
              <option value="true">Furnished</option>
              <option value="false">Unfurnished</option>
            </select>
            {(activeFilterCount > 0 || searchTerm) && (
              <button className="adv-clear" onClick={clearFilters}>
                <X size={11} /> Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="pr-body">
        {error && (
          <div className="err-banner">
            {error}
            <button className="err-retry" onClick={() => loadProperties(1)}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className={`pr-grid${viewMode === 'list' ? ' list' : ''}`}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className={`pr-grid${viewMode === 'list' ? ' list' : ''}`}>
              {properties.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isSaved={savedIds.has(p.id)}
                  onSave={e => toggleSave(p.id, e)}
                  onApply={e => handleApply(p, e)}
                />
              ))}
            </div>
            {hasMore && (
              <div className="load-more">
                <button
                  className="load-more-btn"
                  disabled={loadingMore}
                  onClick={() => setPage(prev => prev + 1)}
                >
                  {loadingMore
                    ? 'Loading…'
                    : `Load more · page ${(pagination?.current_page ?? 1) + 1} of ${pagination?.last_page}`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="pr-grid">
            <div className="pr-empty">
              <div className="pr-empty-icon"><Search size={22} /></div>
              <div className="pr-empty-title">No properties found</div>
              <div className="pr-empty-desc">Try adjusting your filters or search terms.</div>
              {(activeFilterCount > 0 || searchTerm) && (
                <button className="pr-empty-btn" onClick={clearFilters}>
                  <X size={13} /> Clear filters
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