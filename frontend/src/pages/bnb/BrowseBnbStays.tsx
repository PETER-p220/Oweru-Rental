import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Star, Hotel, Loader2 } from 'lucide-react';
import Api from '../../services/api';
import { getPropertyThumbnail, normalizeBnbProperty } from '../../utils/propertyImages';

const GOLD = '#C89128';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n || 0);

const BrowseBnbStays = () => {
  const navigate = useNavigate();
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
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#0F172A', minHeight: '100vh' }}>
      <style>{`
        .bnb-browse-header { padding: 32px 24px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .bnb-browse-inner { max-width: 1200px; margin: 0 auto; }
        .bnb-browse-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${GOLD}; margin-bottom: 8px; }
        .bnb-browse-title { margin: 0; color: #fff; font-size: clamp(24px, 4vw, 32px); font-weight: 800; }
        .bnb-browse-sub { margin: 8px 0 0; color: #94A3B8; font-size: 14px; }
        .bnb-browse-search-wrap { margin-top: 20px; position: relative; max-width: 480px; }
        .bnb-browse-search {
          width: 100%; padding: 12px 16px 12px 42px; border-radius: 10px; border: 1px solid #334155;
          background: #1E293B; color: #F8FAFC; font-size: 14px; outline: none;
        }
        .bnb-browse-search:focus { border-color: ${GOLD}; box-shadow: 0 0 0 3px ${GOLD}22; }
        .bnb-browse-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748B; }
        .bnb-browse-body { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .bnb-browse-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .bnb-browse-card {
          background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0;
          display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s;
        }
        .bnb-browse-card:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(15,23,42,0.12); }
        .bnb-browse-img { width: 100%; height: 200px; object-fit: cover; background: #E2E8F0; }
        .bnb-browse-card-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .bnb-browse-card-title { font-size: 16px; font-weight: 700; color: #0F172A; margin: 0; }
        .bnb-browse-loc { display: flex; align-items: center; gap: 6px; color: #64748B; font-size: 13px; }
        .bnb-browse-meta { display: flex; gap: 12px; color: #64748B; font-size: 12px; flex-wrap: wrap; }
        .bnb-browse-price { font-size: 18px; font-weight: 800; color: #0F172A; }
        .bnb-browse-price span { font-size: 12px; font-weight: 500; color: #64748B; }
        .bnb-browse-btn {
          margin-top: auto; width: 100%; padding: 12px; border: none; border-radius: 10px;
          background: ${GOLD}; color: #0F172A; font-weight: 700; font-size: 13px; cursor: pointer;
        }
        .bnb-browse-empty { text-align: center; padding: 48px 20px; color: #94A3B8; }
      `}</style>

      <div className="bnb-browse-header">
        <div className="bnb-browse-inner">
          <div className="bnb-browse-eyebrow">Short stays</div>
          <h1 className="bnb-browse-title">Browse BnB Stays</h1>
          <p className="bnb-browse-sub">
            {loading ? 'Loading stays…' : `${properties.length} vacation rental${properties.length === 1 ? '' : 's'} available`}
          </p>
          <div className="bnb-browse-search-wrap">
            <Search size={16} className="bnb-browse-search-icon" />
            <input
              className="bnb-browse-search"
              placeholder="Search by name or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bnb-browse-body">
        {error && (
          <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="bnb-browse-empty">
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Loading BnB properties…
          </div>
        ) : properties.length === 0 ? (
          <div className="bnb-browse-empty">
            <Hotel size={32} style={{ margin: '0 auto 12px', color: GOLD }} />
            <p>No BnB stays match your search right now.</p>
          </div>
        ) : (
          <div className="bnb-browse-grid">
            {properties.map((p) => (
              <article key={p.id} className="bnb-browse-card">
                <img
                  className="bnb-browse-img"
                  src={getPropertyThumbnail(p)}
                  alt={p.title}
                  loading="lazy"
                />
                <div className="bnb-browse-card-body">
                  <h2 className="bnb-browse-card-title">{p.title}</h2>
                  <div className="bnb-browse-loc">
                    <MapPin size={13} color={GOLD} />
                    {p.location || 'Location TBC'}
                  </div>
                  <div className="bnb-browse-meta">
                    {p.max_guests ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Users size={12} /> Up to {p.max_guests} guests
                      </span>
                    ) : null}
                    {p.rating_count > 0 ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Star size={12} color={GOLD} fill={GOLD} /> {p.rating_avg} ({p.rating_count})
                      </span>
                    ) : null}
                  </div>
                  <div className="bnb-browse-price">
                    {fmt(p.price)} <span>/ night</span>
                  </div>
                  <button type="button" className="bnb-browse-btn" onClick={() => navigate(`/bnb/${p.id}`)}>
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
