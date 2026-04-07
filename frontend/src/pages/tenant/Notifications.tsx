import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Archive, Trash2, Search, AlertCircle, BellOff } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatDate, headingStyle,
  inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  tableStyle, tableWrapStyle, tdStyle, thStyle,
} from './tenantPageStyles';

const Notifications = () => {
  const [items, setItems]   = useState<any[]>([]);
  const [stats, setStats]   = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [itemsRes, statsRes] = await Promise.all([
        Api.getNotifications(), Api.getNotificationStats(),
      ]);
      setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
      setStats(statsRes.data || {});
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load notifications.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    items.filter((item) =>
      `${item.title || ''} ${item.message || ''}`.toLowerCase().includes(search.toLowerCase())
    ), [items, search]);

  return (
    <div style={{ ...pageStyle, padding: '0' }}>
      {/* Header */}
      <section style={{ ...panelStyle }}>
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: `linear-gradient(90deg, transparent, ${palette.amber}, transparent)` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.amber, display: 'inline-block' }} />
              Tenant Workspace
            </div>
            <h1 style={headingStyle}>Notifications</h1>
            <p style={descriptionStyle}>Live notifications with read and archive actions.</p>
          </div>
          <button
            style={{ ...buttonStyle('secondary'), padding: '10px 18px', borderRadius: '12px', alignSelf: 'flex-end' }}
            onClick={() => Api.markAllNotificationsAsRead().then(load)}
          >
            <CheckCheck size={14} /> Mark All Read
          </button>
        </div>

        {/* Stats + search row */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Total', value: stats.total ?? 0, accent: false },
            { label: 'Unread', value: stats.unread ?? 0, accent: true },
            { label: 'This Week', value: stats.this_week ?? 0, accent: false },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{
              padding: '10px 18px', borderRadius: '12px',
              background: accent ? 'rgba(245,158,11,0.1)' : 'rgba(15,23,42,0.5)',
              border: accent ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(148,163,184,0.08)',
              display: 'flex', gap: '10px', alignItems: 'center',
            }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: palette.muted, fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: accent ? palette.amber : palette.cream }}>{value}</span>
            </div>
          ))}

          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '320px', position: 'relative' as const }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: palette.muted }} />
            <input
              style={{ ...inputStyle, paddingLeft: '36px', borderRadius: '12px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications…"
            />
          </div>
        </div>
      </section>

      {/* Table */}
      <section style={{ ...panelStyle }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.muted, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.amber}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.muted }}>
            <BellOff size={40} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '16px' }}>No notifications found</div>
          </div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>{['Title & Message', 'Type', 'Date', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        {!item.read_at && (
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: palette.amber, flexShrink: 0, marginTop: 5 }} />
                        )}
                        <div>
                          <div style={{ fontWeight: item.read_at ? 400 : 600 }}>{item.title}</div>
                          <div style={{ color: palette.muted, fontSize: '13px', marginTop: '3px' }}>{item.message}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: palette.muted, fontSize: '12px' }}>{item.type || 'system'}</td>
                    <td style={{ ...tdStyle, color: palette.muted, fontSize: '13px' }}>{formatDate(item.created_at)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {!item.read_at && (
                          <button style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: '12px', borderRadius: '8px' }}
                            onClick={() => Api.markNotificationAsRead(item.id).then(load)}>
                            <CheckCheck size={11} /> Read
                          </button>
                        )}
                        <button style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: '12px', borderRadius: '8px' }}
                          onClick={() => Api.archiveNotification(item.id).then(load)}>
                          <Archive size={11} />
                        </button>
                        <button style={{ ...buttonStyle('danger'), padding: '5px 10px', fontSize: '12px', borderRadius: '8px' }}
                          onClick={() => Api.deleteNotification(item.id).then(load)}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Notifications;