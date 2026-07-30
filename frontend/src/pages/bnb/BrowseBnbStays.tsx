import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Star, Hotel, Loader2 } from 'lucide-react';
import Api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { resolveBnbPropertyPath } from '../../utils/bnbNav';
import { getPropertyThumbnail, normalizeBnbProperty } from '../../utils/propertyImages';
import { DASHBOARD_LISTING_CSS } from '../../styles/dashboardListingStyles';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n || 0);

const BrowseBnbStays = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const parseList = (payload: unknown): any[] => {
        if (Array.isArray(payload)) return payload;
        if (payload && typeof payload === 'object') {
          const row = payload as Record<string, unknown>;
          if (Array.isArray(row.data)) return row.data as any[];
        }
        return [];
      };

      let list: any[] = [];
      const filters = debouncedSearch ? { search: debouncedSearch } : undefined;

      try {
        const res = await Api.searchBnbProperties(filters);
        list = parseList(res.data ?? res).map(normalizeBnbProperty);
      } catch {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const r = await fetch(`${API_BASE}/api/public/bnb`, { headers: { Accept: 'application/json' } });
        if (r.ok) {
          list = parseList(await r.json()).map(normalizeBnbProperty);
        }
      }

      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        list = list.filter((p) =>
          `${p.title || ''} ${p.location || ''}`.toLowerCase().includes(q),
        );
      }

      setProperties(list.filter((p) => p?.id && p.id !== 999));
    } catch {
      setError('Could not load BnB stays. Please try again.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="dlp-page">
      <style>{DASHBOARD_LISTING_CSS}</style>

      <div className="dlp-ph">
        <div className="dlp-ph-inner">
          <div>
            <div className="dlp-eyebrow">Short stays</div>
            <h1 className="dlp-title">Browse BnB Stays</h1>
          </div>
          <div className="dlp-meta">
            {loading ? 'Loading stays…' : (
              <>
                <strong>{properties.length}</strong> vacation rental{properties.length === 1 ? '' : 's'} available
              </>
            )}
          </div>
        </div>
      </div>

      <div className="dlp-sb">
        <div className="dlp-sb-inner">
          <div className="dlp-search">
            <span className="dlp-search-icon"><Search size={14} /></span>
            <input
              className="dlp-input"
              placeholder="Search by name or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="dlp-body">
        {error && <div className="dlp-err">{error}</div>}

        {loading ? (
          <div className="dlp-empty">
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Loading BnB properties…
          </div>
        ) : properties.length === 0 ? (
          <div className="dlp-empty">
            <Hotel size={32} style={{ margin: '0 auto 12px', color: 'var(--gold)' }} />
            <p>No BnB stays match your search right now.</p>
          </div>
        ) : (
          <div className="dlp-grid">
            {properties.map((p) => (
              <article key={p.id} className="dlp-card">
                <img
                  className="dlp-img"
                  src={getPropertyThumbnail(p)}
                  alt={p.title}
                  loading="lazy"
                />
                <div className="dlp-card-body">
                  <h2 className="dlp-card-title">{p.title}</h2>
                  <div className="dlp-loc">
                    <MapPin size={13} />
                    {p.location || 'Location TBC'}
                  </div>
                  <div className="dlp-meta-row">
                    {p.max_guests ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Users size={12} /> Up to {p.max_guests} guests
                      </span>
                    ) : null}
                    {p.rating_count > 0 ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Star size={12} color="var(--gold)" fill="var(--gold)" /> {p.rating_avg} ({p.rating_count})
                      </span>
                    ) : null}
                  </div>
                  <div className="dlp-price">
                    {fmt(p.price)} <span>/ night</span>
                  </div>
                  <button
                    type="button"
                    className="dlp-btn"
                    onClick={() => navigate(resolveBnbPropertyPath(user, p.id, isAuthenticated))}
                  >
                    View & book
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseBnbStays;
