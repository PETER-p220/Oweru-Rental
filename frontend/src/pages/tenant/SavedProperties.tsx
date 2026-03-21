import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, formatCurrency, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle } from './tenantPageStyles';

interface SavedPropertyItem {
  id: number;
  property?: any;
}

const SavedProperties = () => {
  const [items, setItems] = useState<SavedPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await Api.getSavedProperties();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load saved properties.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter(({ property }) => {
    const hay = `${property?.title || ''} ${property?.location || ''}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  }), [items, search]);

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Tenant Workspace</div>
        <h1 style={headingStyle}>Saved Properties</h1>
        <p style={descriptionStyle}>Properties saved from your tenant account, loaded from the Laravel tenant API.</p>
        <div style={{ marginTop: '18px', maxWidth: '360px' }}><input style={inputStyle} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search saved properties" /></div>
      </section>
      <section style={panelStyle}>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        {loading ? <div style={{ color: '#9f9587' }}>Loading saved properties...</div> : filtered.length === 0 ? <div style={{ color: '#9f9587' }}>No saved properties found.</div> : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {filtered.map(({ id, property }) => (
              <div key={id} style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '14px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '18px' }}>{property?.title || 'Untitled property'}</div>
                  <div style={{ color: '#9f9587', marginTop: '4px' }}>{property?.location || 'No location'}</div>
                </div>
                <div style={{ color: '#c9a84c', fontSize: '20px' }}>{formatCurrency(property?.price)}</div>
                <button style={buttonStyle('danger')} onClick={() => Api.unsaveProperty(property?.id || id).then(load)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SavedProperties;
