import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Archive, Trash2, Search, AlertCircle } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatDate, headingStyle,
  inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  tableStyle, tableWrapStyle, tdStyle, thStyle,
  mobileTableContainer, mobileCard, mobileCardHeader,
  mobileCardSection, mobileCardLabel, mobileCardValue, mobileCardActions,
} from './tenantPageStyles';

// Works regardless of whether the backend sends is_read (bool) or read_at (timestamp)
const isUnread = (item: any): boolean => {
  if (typeof item.is_read === 'boolean') return !item.is_read;
  if (item.read_at !== null && item.read_at !== undefined) return false;
  return true; // no read info → treat as unread
};

const Notifications = () => {
  const [items, setItems]     = useState<any[]>([]);
  const [stats, setStats]     = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [itemsRes, statsRes] = await Promise.all([
        Api.getNotifications(),
        Api.getNotificationStats(),
      ]);

      // Api.request() unwraps one level: response.data = backend's data field.
      // Backend sends { data: [...], pagination: {} }
      // So itemsRes.data = { data: [...], pagination: {} }
      // We need the inner array:
      const raw = itemsRes.data;
      const arr = Array.isArray(raw)
        ? raw                                          // flat array response
        : Array.isArray(raw?.data)
          ? raw.data                                   // paginated { data: [] }
          : [];

      setItems(arr);

      // Stats: statsRes.data might be { total, unread, this_week } directly
      // or nested as { data: { ... } }
      const s = statsRes.data?.data ?? statsRes.data ?? {};
      setStats(s);

    } catch (err: any) {
      const msg = err?.response?.data?.message;
      // 503 just means the table isn't migrated yet — show a soft message
      if (err?.response?.status === 503) {
        setError('Notifications are not yet available. Please check back later.');
      } else {
        setError(msg || 'Unable to load notifications.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    items.filter((item) =>
      `${item.title ?? ''} ${item.message ?? ''}`.toLowerCase().includes(search.toLowerCase())
    ), [items, search]);

  const handleMarkRead = async (id: number) => {
    try { await Api.markNotificationAsRead(id); load(); }
    catch { /* silently ignore */ }
  };

  const handleMarkAllRead = async () => {
    try { await Api.markAllNotificationsAsRead(); load(); }
    catch { /* silently ignore */ }
  };

  const handleArchive = async (id: number) => {
    try { await Api.archiveNotification(id); load(); }
    catch { /* silently ignore */ }
  };

  const handleDelete = async (id: number) => {
    try { await Api.deleteNotification(id); load(); }
    catch { /* silently ignore */ }
  };

  return (
    <div style={{ ...pageStyle, padding: '0' }}>

      {/* ── Header ── */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 32, right: 32, height: '2px',
          background: `linear-gradient(90deg, transparent, ${palette.gold}, transparent)`,
        }} />

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap',
        }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: palette.gold, display: 'inline-block', marginRight: 6,
              }} />
              Tenant Workspace
            </div>
            <h1 style={headingStyle}>Notifications</h1>
            <p style={descriptionStyle}>Stay updated on contracts, applications and messages.</p>
          </div>

          <button
            style={{ ...buttonStyle('secondary'), padding: '10px 18px', alignSelf: 'flex-end' }}
            onClick={handleMarkAllRead}
          >
            <CheckCheck size={14} /> Mark All Read
          </button>
        </div>

        {/* Stats + search */}
        <div style={{
          display: 'flex', gap: '14px', marginTop: '24px',
          flexWrap: 'wrap', alignItems: 'center',
        }}>
          {[
            { label: 'Total',     value: stats.total     ?? 0, accent: false },
            { label: 'Unread',    value: stats.unread    ?? 0, accent: true  },
            { label: 'This Week', value: stats.this_week ?? 0, accent: false },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{
              padding: '10px 18px', borderRadius: '10px',
              background: accent ? 'rgba(200,145,40,0.10)' : 'rgba(15,23,42,0.04)',
              border: accent
                ? '1px solid rgba(200,145,40,0.28)'
                : `1px solid ${palette.gray200}`,
              display: 'flex', gap: '10px', alignItems: 'center',
            }}>
              <span style={{
                fontSize: '10px', letterSpacing: '0.15em',
                textTransform: 'uppercase', color: palette.gray400, fontWeight: 700,
              }}>
                {label}
              </span>
              <span style={{
                fontSize: '20px', fontWeight: 700,
                color: accent ? palette.gold : palette.navy900,
              }}>
                {value}
              </span>
            </div>
          ))}

          {/* Search */}
          <div style={{
            flex: 1, minWidth: '200px', maxWidth: '320px',
            position: 'relative' as const,
          }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: palette.gray400,
            }} />
            <input
              style={{ ...inputStyle, paddingLeft: '36px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications…"
            />
          </div>
        </div>
      </section>

      {/* ── List ── */}
      <section style={{ ...panelStyle }}>
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            color: '#dc2626', background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.18)',
            borderRadius: '10px', padding: '14px 18px',
            marginBottom: '20px', fontSize: '14px',
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Desktop table */}
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['Title & Message', 'Type', 'Date', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: palette.gray400 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <div style={{
                        width: 16, height: 16,
                        border: `2px solid ${palette.gold}`, borderTopColor: 'transparent',
                        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                      }} />
                      Loading…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: palette.gray400 }}>
                    <Bell size={32} style={{ opacity: 0.25, margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                      No notifications yet
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.7 }}>
                      You'll be notified about contracts, applications and messages here.
                    </div>
                  </td>
                </tr>
              ) : filtered.map((item) => {
                const unread = isUnread(item);
                return (
                  <tr
                    key={item.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,145,40,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        {unread && (
                          <div style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: palette.gold, flexShrink: 0, marginTop: 6,
                          }} />
                        )}
                        <div>
                          <div style={{ fontWeight: unread ? 600 : 400, color: palette.navy900 }}>
                            {item.title || 'Notification'}
                          </div>
                          <div style={{ color: palette.gray500, fontSize: '13px', marginTop: '3px' }}>
                            {item.message}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: palette.gray500, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {item.type || 'system'}
                    </td>
                    <td style={{ ...tdStyle, color: palette.gray500, fontSize: '13px' }}>
                      {formatDate(item.created_at)}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {unread && (
                          <button
                            style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: '12px' }}
                            onClick={() => handleMarkRead(item.id)}
                          >
                            <CheckCheck size={11} /> Read
                          </button>
                        )}
                        <button
                          style={{ ...buttonStyle('ghost'), padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => handleArchive(item.id)}
                        >
                          <Archive size={11} />
                        </button>
                        <button
                          style={{ ...buttonStyle('danger'), padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div style={mobileTableContainer}>
          {loading ? (
            <div style={mobileCard}><div style={mobileCardValue}>Loading notifications…</div></div>
          ) : filtered.length === 0 ? (
            <div style={mobileCard}>
              <div style={{ textAlign: 'center', padding: '20px 0', color: palette.gray400 }}>
                <Bell size={28} style={{ opacity: 0.25, margin: '0 auto 8px', display: 'block' }} />
                <div style={mobileCardValue}>No notifications yet</div>
              </div>
            </div>
          ) : filtered.map((item) => {
            const unread = isUnread(item);
            return (
              <div key={item.id} style={mobileCard}>
                <div style={mobileCardHeader}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      {unread && (
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: palette.gold, flexShrink: 0, marginTop: 4,
                        }} />
                      )}
                      <div>
                        <div style={{ fontWeight: unread ? 600 : 400, fontSize: '15px', color: palette.navy900 }}>
                          {item.title || 'Notification'}
                        </div>
                        <div style={{ color: palette.gray500, fontSize: '13px' }}>{item.message}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: palette.gray400, whiteSpace: 'nowrap' as const }}>
                    {formatDate(item.created_at)}
                  </div>
                </div>

                <div style={mobileCardSection}>
                  <div style={mobileCardLabel}>Type</div>
                  <div style={mobileCardValue}>{item.type || 'system'}</div>
                </div>

                <div style={mobileCardActions}>
                  {unread && (
                    <button
                      style={{ ...buttonStyle('secondary'), flex: 1, padding: '8px 12px', fontSize: '13px' }}
                      onClick={() => handleMarkRead(item.id)}
                    >
                      <CheckCheck size={12} /> Read
                    </button>
                  )}
                  <button
                    style={{ ...buttonStyle('ghost'), flex: 1, padding: '8px 12px', fontSize: '13px' }}
                    onClick={() => handleArchive(item.id)}
                  >
                    <Archive size={12} /> Archive
                  </button>
                  <button
                    style={{ ...buttonStyle('danger'), flex: 1, padding: '8px 12px', fontSize: '13px' }}
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Notifications;