import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Archive, Trash2, Search, AlertCircle } from 'lucide-react';
import Api from '../../services/api';
import { formatDate } from './tenantPageStyles';

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
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F1F5F9', color: '#0F172A', minHeight: '100vh', padding: '0' }}>

      {/* ── Header ── */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '52px 40px 44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C89128', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', padding: '4px 12px' }}>
              Tenant Workspace
            </div>
            <h1 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>Notifications</h1>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 400, color: '#94A3B8', margin: '8px 0 0' }}>Stay updated on contracts, applications, and messages.</p>
          </div>

          <button
            style={{ background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', color: '#C89128', padding: '10px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end', fontFamily: "'DM Sans', system-ui, sans-serif" }}
            onClick={handleMarkAllRead}
          >
            <CheckCheck size={14} /> Mark All Read
          </button>
        </div>
      </div>

      {/* ── Stats + search row ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 40px 0', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                textTransform: 'uppercase', color: '#64748B', fontWeight: 700,
              }}>
                {label}
              </span>
              <span style={{
                fontSize: '20px', fontWeight: 700,
                color: accent ? '#C89128' : '#0F172A',
              }}>
                {value}
              </span>
            </div>
          ))}

          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '320px', position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: '#64748B',
            }} />
            <input
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A', padding: '10px 12px', borderRadius: 8, outline: 'none', paddingLeft: '36px', width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications…"
            />
          </div>
        </div>

      {/* ── Notifications list ── */}
      <section style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '32px' }}>

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
        <div style={{ overflowX: 'auto', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFFFFF' }}>
            <thead>
              <tr>
                {['Title & Message', 'Type', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', background: '#F1F5F9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>

              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <div style={{
                        width: 16, height: 16,
                        border: '2px solid #C89128', borderTopColor: 'transparent',
                        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                      }} />
                      Loading…
                    </div>
                  </td>
                </tr>

              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>
                    <Bell size={32} style={{ opacity: 0.25, margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
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
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        {unread && (
                          <div style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: '#C89128', flexShrink: 0, marginTop: 6,
                          }} />
                        )}
                        <div>
                          <div style={{ fontWeight: unread ? 600 : 400, color: '#0F172A' }}>
                            {item.title || 'Notification'}
                          </div>
                          <div style={{ color: '#64748B', fontSize: '13px', marginTop: '3px' }}>
                            {item.message}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {getTypeLabel(item.type)}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', color: '#64748B', fontSize: '13px' }}>
                      {formatDate(item.created_at)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {unread && (
                          <button
                            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A', padding: '5px 10px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}
                            onClick={() => handleMarkRead(item.id)}
                          >
                            <CheckCheck size={11} /> Read
                          </button>
                        )}
                        <button
                          style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A', padding: '5px 10px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}
                          onClick={() => handleArchive(item.id)}
                          title="Archive"
                        >
                          <Archive size={11} />
                        </button>
                        <button
                          style={{ background: 'rgba(220,38,68,0.1)', border: `1px solid rgba(220,38,68,0.3)`, color: '#dc2626', padding: '5px 10px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}
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
        <div style={{ display: 'none', marginTop: '24px' }}>
          {loading ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', marginBottom: '12px' }}>
              <div style={{ color: '#0F172A', fontSize: 14 }}>Loading notifications…</div>
            </div>

          ) : filtered.length === 0 ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', marginBottom: '12px' }}>
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748B' }}>
                <Bell size={28} style={{ opacity: 0.25, margin: '0 auto 8px', display: 'block' }} />
                <div style={{ color: '#0F172A', fontSize: 14 }}>No notifications yet</div>
              </div>
            </div>

          ) : filtered.map((item) => {
            const unread = isUnread(item);
            return (
              <div key={item.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', marginBottom: '12px' }}>
                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      {unread && (
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: '#C89128', flexShrink: 0, marginTop: 4,
                        }} />
                      )}
                      <div>
                        <div style={{ fontWeight: unread ? 600 : 400, fontSize: '15px', color: '#0F172A' }}>
                          {item.title || 'Notification'}
                        </div>
                        <div style={{ color: '#64748B', fontSize: '13px' }}>{item.message}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {formatDate(item.created_at)}
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '12px', display: 'flex', gap: '12px' }}>
                  <div style={{ color: '#64748B', fontSize: 12, fontWeight: 600, minWidth: '60px' }}>Type</div>
                  <div style={{ color: '#0F172A', fontSize: 14 }}>{getTypeLabel(item.type)}</div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {unread && (
                    <button
                      style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A', flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => handleMarkRead(item.id)}
                    >
                      <CheckCheck size={12} /> Read
                    </button>
                  )}
                  <button
                    style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A', flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: 8, cursor: 'pointer' }}
                    onClick={() => handleArchive(item.id)}
                  >                           
                    <Archive size={12} /> Archive
                  </button>
                  <button
                    style={{ background: 'rgba(220,38,68,0.1)', border: `1px solid rgba(220,38,68,0.3)`, color: '#dc2626', flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: 8, cursor: 'pointer' }}
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