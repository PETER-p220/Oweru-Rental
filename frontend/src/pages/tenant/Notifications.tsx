import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Archive, Trash2, Search, AlertCircle } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatDate, headingStyle,
  inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  tableStyle, tableWrapStyle, tdStyle, thStyle,
  mobileTableContainer, mobileCard, mobileCardHeader,
  mobileCardSection, mobileCardLabel, mobileCardValue, mobileCardActions,
} from '../landlord/landlordPageStyles'; // ← shared dark amber theme (cross-folder import)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determines whether a notification has not yet been read.
 * Handles two backend shapes:
 *   • { is_read: boolean }
 *   • { read_at: string | null }
 */
const isUnread = (item: Notification): boolean => {
  if (typeof item.is_read === 'boolean') return !item.is_read;
  if (item.read_at !== null && item.read_at !== undefined) return false;
  return true;
};

const getTypeLabel = (type: string | undefined): string =>
  (type ?? 'system').replace(/_/g, ' ');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Notification {
  id: number;
  title?: string;
  message?: string;
  type?: string;
  is_read?: boolean;
  read_at?: string | null;
  created_at?: string;
}

interface NotificationStats {
  total?: number;
  unread?: number;
  this_week?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Notifications = () => {
  const [items, setItems]     = useState<Notification[]>([]);
  const [stats, setStats]     = useState<NotificationStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  // ── Data fetching ──────────────────────────────────────────────────────────

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const [itemsRes, statsRes] = await Promise.all([
        Api.getNotifications(),
        Api.getNotificationStats(),
      ]);

      // Normalise: backend may return a flat array or { data: [], pagination: {} }
      const raw = itemsRes.data;
      const arr: Notification[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : [];

      setItems(arr);

      // Stats may arrive as { data: { … } } or directly as { total, unread, … }
      const s: NotificationStats = statsRes.data?.data ?? statsRes.data ?? {};
      setStats(s);

    } catch (err: any) {
      if (err?.response?.status === 503) {
        setError('Notifications are not yet available. Please check back later.');
      } else {
        setError(err?.response?.data?.message || 'Unable to load notifications.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived state ──────────────────────────────────────────────────────────

  const filtered = useMemo(() =>
    items.filter(({ title = '', message = '' }) =>
      `${title} ${message}`.toLowerCase().includes(search.toLowerCase())
    ),
    [items, search],
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleMarkRead    = async (id: number) => { try { await Api.markNotificationAsRead(id);    load(); } catch { /* non-critical */ } };
  const handleMarkAllRead = async ()            => { try { await Api.markAllNotificationsAsRead(); load(); } catch { /* non-critical */ } };
  const handleArchive     = async (id: number) => { try { await Api.archiveNotification(id);       load(); } catch { /* non-critical */ } };
  const handleDelete      = async (id: number) => { try { await Api.deleteNotification(id);        load(); } catch { /* non-critical */ } };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ ...pageStyle, padding: '0' }}>

      {/* ── Header ── */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 32, right: 32, height: '2px',
          background: `linear-gradient(90deg, transparent, ${palette.amber}, transparent)`,
        }} />

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap',
        }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: palette.amber, display: 'inline-block', marginRight: 6,
              }} />
              Tenant Workspace
            </div>
            <h1 style={headingStyle}>Notifications</h1>
            <p style={descriptionStyle}>Stay updated on contracts, applications, and messages.</p>
          </div>

          <button
            style={{ ...buttonStyle('secondary'), padding: '10px 18px', alignSelf: 'flex-end' }}
            onClick={handleMarkAllRead}
          >
            <CheckCheck size={14} /> Mark All Read
          </button>
        </div>

        {/* Stats + search row */}
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
              background: accent ? 'rgba(200,145,40,0.10)' : 'rgba(255,255,255,0.03)',
              border: accent
                ? '1px solid rgba(200,145,40,0.28)'
                : '1px solid rgba(255,255,255,0.08)',
              display: 'flex', gap: '10px', alignItems: 'center',
            }}>
              <span style={{
                fontSize: '10px', letterSpacing: '0.15em',
                textTransform: 'uppercase', color: palette.muted, fontWeight: 700,
              }}>
                {label}
              </span>
              <span style={{
                fontSize: '20px', fontWeight: 700,
                color: accent ? palette.amber : palette.cream,
              }}>
                {value}
              </span>
            </div>
          ))}

          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '320px', position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: palette.muted,
            }} />
            <input
              style={{ ...inputStyle, paddingLeft: '36px', width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications…"
            />
          </div>
        </div>
      </section>

      {/* ── Notifications list ── */}
      <section style={panelStyle}>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            color: 'var(--error)', background: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            borderRadius: '10px', padding: '14px 18px',
            marginBottom: '20px', fontSize: '14px',
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* ── Desktop table ── */}
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
                  <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: palette.muted }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <div style={{
                        width: 16, height: 16,
                        border: `2px solid ${palette.amber}`, borderTopColor: 'transparent',
                        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                      }} />
                      Loading…
                    </div>
                  </td>
                </tr>

              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: palette.muted }}>
                    <Bell size={32} style={{ opacity: 0.25, margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontSize: '16px', fontWeight: 600, color: palette.cream, marginBottom: '4px' }}>
                      No notifications yet
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.7 }}>
                      You'll be notified about contracts, applications, and messages here.
                    </div>
                  </td>
                </tr>

              ) : filtered.map((item) => {
                const unread = isUnread(item);
                return (
                  <tr
                    key={item.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Title + message */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        {unread && (
                          <div style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: palette.amber, flexShrink: 0, marginTop: 6,
                          }} />
                        )}
                        <div>
                          <div style={{ fontWeight: unread ? 600 : 400, color: palette.cream }}>
                            {item.title || 'Notification'}
                          </div>
                          <div style={{ color: palette.muted, fontSize: '13px', marginTop: '3px' }}>
                            {item.message}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{
                      ...tdStyle,
                      color: palette.muted, fontSize: '12px',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      {getTypeLabel(item.type)}
                    </td>

                    {/* Date */}
                    <td style={{ ...tdStyle, color: palette.muted, fontSize: '13px' }}>
                      {formatDate(item.created_at)}
                    </td>

                    {/* Actions */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {unread && (
                          <button
                            style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: '12px', borderRadius: '8px' }}
                            onClick={() => handleMarkRead(item.id)}
                          >
                            <CheckCheck size={11} /> Read
                          </button>
                        )}
                        <button
                          style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: '12px', borderRadius: '8px' }}
                          onClick={() => handleArchive(item.id)}
                          title="Archive"
                        >
                          <Archive size={11} />
                        </button>
                        <button
                          style={{ ...buttonStyle('danger'), padding: '5px 10px', fontSize: '12px', borderRadius: '8px' }}
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
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

        {/* ── Mobile cards ── */}
        <div style={mobileTableContainer}>
          {loading ? (
            <div style={mobileCard}>
              <div style={mobileCardValue}>Loading notifications…</div>
            </div>

          ) : filtered.length === 0 ? (
            <div style={mobileCard}>
              <div style={{ textAlign: 'center', padding: '20px 0', color: palette.muted }}>
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
                          background: palette.amber, flexShrink: 0, marginTop: 4,
                        }} />
                      )}
                      <div>
                        <div style={{ fontWeight: unread ? 600 : 400, fontSize: '15px', color: palette.cream }}>
                          {item.title || 'Notification'}
                        </div>
                        <div style={{ color: palette.muted, fontSize: '13px' }}>{item.message}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: palette.muted, whiteSpace: 'nowrap' }}>
                    {formatDate(item.created_at)}
                  </div>
                </div>

                <div style={mobileCardSection}>
                  <div style={mobileCardLabel}>Type</div>
                  <div style={mobileCardValue}>{getTypeLabel(item.type)}</div>
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
                    style={{ ...buttonStyle('secondary'), flex: 1, padding: '8px 12px', fontSize: '13px' }}
                    onClick={() => handleArchive(item.id)}
                  >                           
                    <Archive size={12} /> Archive
                  </button>
                  <button
                    style={{ ...buttonStyle('danger'), flex: 1, padding: '8px 12px', fontSize: '13px' }}
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={12} /> Delete
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