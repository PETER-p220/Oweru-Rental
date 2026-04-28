import { useEffect, useMemo, useState } from 'react';
import {
  MapPin, Bed, Bath, Square,
  Heart, Eye, Search, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency } from './tenantPageStyles';

interface SavedPropertyItem {
  id: number;
  property?: any;
}

const SavedProperties = () => {
  const [items, setItems] = useState<SavedPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [imgIndex, setImgIndex] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      const res = await Api.getSavedProperties();

      // ✅ REMOVE DUPLICATES HERE
      const unique = Array.from(
        new Map(
          (res.data || []).map((item: SavedPropertyItem) => [
            item.property?.id || item.id,
            item
          ])
        ).values()
      );

      setItems(unique);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ✅ FILTER
  const filtered = useMemo(() => {
    return items.filter(({ property }) => {
      const text = `${property?.title || ''} ${property?.location || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [items, search]);

  const getImages = (p: any) =>
    p?.images?.length
      ? p.images
      : [`https://picsum.photos/seed/${p?.id}/800/500`];

  return (
    <div className="container">
      <style>{`
        .container {
          padding: 20px;
          max-width: 1200px;
          margin: auto;
          background:#0f172a;
          min-height:100vh;
        }

        .title {
          color:white;
          font-size:28px;
          font-weight:700;
          margin-bottom:10px;
        }

        .search {
          width:100%;
          padding:12px;
          margin:20px 0;
          border-radius:10px;
          border:1px solid #333;
          background:#111827;
          color:white;
        }

        .grid {
          display:grid;
          grid-template-columns: repeat(auto-fit, minmax(280px,1fr));
          gap:20px;
        }

        .card {
          background:#1e293b;
          border-radius:14px;
          overflow:hidden;
          transition:.3s;
        }

        .card:hover { transform:translateY(-5px); }

        .img {
          width:100%;
          height:180px;
          object-fit:cover;
        }

        .content { padding:15px; color:white; }

        .price {
          color:#fbbf24;
          font-weight:700;
          margin:10px 0;
        }

        .actions {
          display:flex;
          gap:10px;
        }

        button {
          flex:1;
          padding:10px;
          border:none;
          cursor:pointer;
          border-radius:8px;
        }

        .view { background:#fbbf24; }
        .remove { background:#ef4444; color:white; }

        /* MODAL */
        .modal {
          position:fixed;
          inset:0;
          background:rgba(0,0,0,0.8);
          display:flex;
          justify-content:center;
          align-items:center;
        }

        .modal-box {
          background:#1e293b;
          width:90%;
          max-width:700px;
          border-radius:10px;
          overflow:hidden;
        }

        .modal img {
          width:100%;
          height:300px;
          object-fit:cover;
        }

        .modal-body {
          padding:20px;
          color:white;
        }

        /* MOBILE */
        @media(max-width:600px){
          .img{ height:140px }
          .modal img{ height:200px }
        }
      `}</style>

      <h1 className="title">Saved Properties</h1>

      <input
        className="search"
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <p style={{ color: 'white' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'gray' }}>No saved properties</p>
      ) : (
        <div className="grid">
          {filtered.map(({ id, property }) => (
            <div key={id} className="card">
              <img
                src={getImages(property)[0]}
                className="img"
              />

              <div className="content">
                <h3>{property?.title}</h3>

                <p>
                  <MapPin size={14} /> {property?.location}
                </p>

                <p>
                  <Bed size={14} /> {property?.bedrooms} | 
                  <Bath size={14} /> {property?.bathrooms}
                </p>

                <div className="price">
                  {formatCurrency(property?.price)}
                </div>

                <div className="actions">
                  <button
                    className="view"
                    onClick={() => {
                      setSelected(property);
                      setImgIndex(0);
                    }}
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    className="remove"
                    onClick={() =>
                      Api.unsaveProperty(property.id).then(load)
                    }
                  >
                    <Heart size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {selected && (
        <div className="modal" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <img src={getImages(selected)[imgIndex]} />

            <div className="modal-body">
              <h2>{selected.title}</h2>
              <p>{selected.location}</p>

              <h3>{formatCurrency(selected.price)}</h3>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() =>
                  setImgIndex(i => i === 0 ? getImages(selected).length - 1 : i - 1)
                }>
                  <ChevronLeft />
                </button>

                <button onClick={() =>
                  setImgIndex(i => i === getImages(selected).length - 1 ? 0 : i + 1)
                }>
                  <ChevronRight />
                </button>
              </div>

              <p style={{ marginTop: 10 }}>
                {selected.description}
              </p>

              <button onClick={() => setSelected(null)}>
                <X />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedProperties;