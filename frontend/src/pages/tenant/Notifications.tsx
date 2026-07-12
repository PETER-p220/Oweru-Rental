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
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F1F5F9', color: '#0F172A', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .notif-header { background: #FFFFFF; border-bottom: 1px solid #E2E8F0; }
        .notif-header-inner { max-width: 1280px; margin: 0 auto; padding: 40px 40px 32px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
        .notif-eyebrow { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #475569; margin-bottom: 12px; display: inline-flex; align-items: center; gap: 8px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 5px 12px; border-radius: 20px; }
        .notif-heading { font-family: 'Inter', sans-serif; font-size: clamp(22px, 3.4vw, 30px); font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; color: #0F172A; margin: 0; }
        .notif-tagline { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 400; color: #64748B; margin: 8px 0 0; }
        .notif-mark-all { display: inline-flex; align-items: center; gap: 7px; background: #0F172A; border: 1px solid #0F172A; color: #FFFFFF; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; align-self: flex-end; font-family: 'Inter', sans-serif; transition: background 0.2s; }
        .notif-mark-all:hover { background: #1E293B; }

        /* ── Stat + search row ── */
        .notif-toolbar { max-width: 1280px; margin: 0 auto; padding: 24px 40px 0; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .notif-stat { padding: 10px 16px; border-radius: 10px; background: #FFFFFF; border: 1px solid #E2E8F0; display: flex; gap: 10px; align-items: center; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .notif-stat.accent { background: #0F172A; border-color: #0F172A; }
        .notif-stat-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #64748B; font-weight: 700; white-space: nowrap; }
        .notif-stat.accent .notif-stat-label { color: rgba(255,255,255,0.6); }
        .notif-stat-value { font-size: 19px; font-weight: 800; color: #0F172A; }
        .notif-stat.accent .notif-stat-value { color: #FFFFFF; }
        .notif-search { flex: 1; min-width: 200px; max-width: 320px; position: relative; }
        .notif-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; pointer-events: none; }
        .notif-search input { background: #FFFFFF; border: 1px solid #E2E8F0; color: #0F172A; padding: 10px 12px 10px 36px; border-radius: 8px; outline: none; width: 100%; font-family: 'Inter', sans-serif; font-size: 13.5px; transition: border-color 0.2s; }
        .notif-search input:focus { border-color: #94A3B8; }
        .notif-search input::placeholder { color: #94A3B8; }

        .notif-panel { max-width: 1280px; margin: 24px auto 0; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 28px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }

        .notif-err { display: flex; align-items: center; gap: 10px; color: #DC2626; background: #FEE2E2; border: 1px solid #FECACA; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; font-size: 13.5px; }

        table.notif-table { width: 100%; border-collapse: collapse; }
        table.notif-table thead th { padding: 12px 16px; text-align: left; border-bottom: 1px solid #E2E8F0; color: #64748B; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; background: #F8FAFC; white-space: nowrap; }
        table.notif-table thead th:first-child { border-top-left-radius: 8px; }
        table.notif-table thead th:last-child { border-top-right-radius: 8px; }
        table.notif-table tbody td { padding: 14px 16px; border-bottom: 1px solid #F1F5F9; vertical-align: top; }
        table.notif-table tbody tr:last-child td { border-bottom: none; }
        table.notif-table tbody tr:hover td { background: #F8FAFC; }

        .notif-dot { width: 7px; height: 7px; border-radius: 50%; background: #0F172A; flex-shrink: 0; margin-top: 6px; }
        .notif-title { color: #0F172A; }
        .notif-title.unread { font-weight: 700; }
        .notif-msg { color: #64748B; font-size: 13px; margin-top: 3px; line-height: 1.5; }
        .notif-type { color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
        .notif-date { color: #64748B; font-size: 13px; white-space: nowrap; }

        .notif-btn { background: #F1F5F9; border: 1px solid #E2E8F0; color: #0F172A; padding: 6px 11px; font-size: 12px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-family: 'Inter', sans-serif; font-weight: 500; transition: all 0.15s; white-space: nowrap; }
        .notif-btn:hover { background: #E2E8F0; border-color: #CBD5E1; }
        .notif-btn.danger { background: #FEE2E2; border-color: #FECACA; color: #DC2626; }
        .notif-btn.danger:hover { background: #FECACA; border-color: #FCA5A5; }

        .notif-empty { padding: 56px 20px; text-align: center; color: #64748B; }
        .notif-empty svg { color: #94A3B8; margin: 0 auto 12px; display: block; }
        .notif-empty-title { font-size: 15px; font-weight: 600; color: #0F172A; margin-bottom: 4px; }
        .notif-empty-sub { font-size: 13px; }

        .notif-loading { display: flex; align-items: center; justify-content: center; gap: 10px; color: #64748B; padding: 48px 0; }
        .notif-spinner { width: 16px; height: 16px; border: 2px solid #E2E8F0; border-top-color: #0F172A; border-radius: 50%; animation: spin 0.8s linear infinite; }

        /* ── Desktop / mobile toggle ── */
        .notif-table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #E2E8F0; }
        .notif-cards { display: none; }

        .notif-card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .notif-card-top { border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .notif-card-date { font-size: 11px; color: #94A3B8; white-space: nowrap; }
        .notif-card-type-row { border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 12px; display: flex; gap: 10px; align-items: center; }
        .notif-card-type-label { color: #64748B; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; min-width: 40px; }
        .notif-card-actions { display: flex; gap: 8px; }
        .notif-card-actions .notif-btn { flex: 1; justify-content: center; padding: 9px 10px; }

        @media (max-width: 900px) {
          .notif-header-inner { padding: 32px 24px 26px; }
          .notif-toolbar { padding: 20px 24px 0; }
          .notif-panel { margin-left: 24px; margin-right: 24px; width: auto; }
        }

        @media (max-width: 720px) {
          .notif-table-wrap { display: none; }
          .notif-cards { display: block; }
        }

        @media (max-width: 640px) {
          .notif-header-inner { padding: 22px 16px 18px; flex-direction: column; align-items: flex-start; }
          .notif-heading { font-size: 21px; }
          .notif-tagline { font-size: 12.5px; }
          .notif-mark-all { align-self: stretch; justify-content: center; }

          .notif-toolbar { padding: 16px 12px 0; gap: 8px; }
          .notif-stat { padding: 8px 12px; flex: 1; min-width: 0; }
          .notif-stat-label { font-size: 8.5px; }
          .notif-stat-value { font-size: 16px; }
          .notif-search { min-width: 100%; max-width: 100%; order: 10; }

          .notif-panel { margin-left: 12px; margin-right: 12px; padding: 16px; border-radius: 12px; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="notif-header">
        <div className="notif-header-inner">
          <div>
            <div className="notif-eyebrow">Tenant Workspace</div>
            <h1 className="notif-heading">Notifications</h1>
            <p className="notif-tagline">Stay updated on contracts, applications, and messages.</p>
          </div>
          <button className="notif-mark-all" onClick={handleMarkAllRead}>
            <CheckCheck size={14} /> Mark All Read
          </button>
        </div>
      </div>

      {/* ── Stats + search row ── */}
      <div className="notif-toolbar">
        {[
          { label: 'Total',     value: stats.total     ?? 0, accent: false },
          { label: 'Unread',    value: stats.unread    ?? 0, accent: true  },
          { label: 'This Week', value: stats.this_week ?? 0, accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} className={`notif-stat${accent ? ' accent' : ''}`}>
            <span className="notif-stat-label">{label}</span>
            <span className="notif-stat-value">{value}</span>
          </div>
        ))}

        <div className="notif-search">
          <Search size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications…"
          />
        </div>
      </div>

      {/* ── Notifications ── */}
      <section className="notif-panel">
        {error && (
          <div className="notif-err">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* ── Desktop table ── */}
        <div className="notif-table-wrap">
          <table className="notif-table">
            <thead>
              <tr>
                {['Title & Message', 'Type', 'Date', 'Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}>
                    <div className="notif-loading"><div className="notif-spinner" />Loading…</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="notif-empty">
                      <Bell size={32} />
                      <div className="notif-empty-title">No notifications yet</div>
                      <div className="notif-empty-sub">You'll be notified about contracts, applications, and messages here.</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((item) => {
                const unread = isUnread(item);
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        {unread && <div className="notif-dot" />}
                        <div>
                          <div className={`notif-title${unread ? ' unread' : ''}`}>{item.title || 'Notification'}</div>
                          <div className="notif-msg">{item.message}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="notif-type">{getTypeLabel(item.type)}</span></td>
                    <td><span className="notif-date">{formatDate(item.created_at)}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {unread && (
                          <button className="notif-btn" onClick={() => handleMarkRead(item.id)}>
                            <CheckCheck size={11} /> Read
                          </button>
                        )}
                        <button className="notif-btn" onClick={() => handleArchive(item.id)} title="Archive">
                          <Archive size={11} />
                        </button>
                        <button className="notif-btn danger" onClick={() => handleDelete(item.id)} title="Delete">
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
        <div className="notif-cards">
          {loading ? (
            <div className="notif-card"><div className="notif-loading" style={{ padding: '24px 0' }}><div className="notif-spinner" />Loading notifications…</div></div>
          ) : filtered.length === 0 ? (
            <div className="notif-card">
              <div className="notif-empty" style={{ padding: '24px 0' }}>
                <Bell size={28} />
                <div className="notif-empty-title">No notifications yet</div>
              </div>
            </div>
          ) : filtered.map((item) => {
            const unread = isUnread(item);
            return (
              <div key={item.id} className="notif-card">
                <div className="notif-card-top">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {unread && <div className="notif-dot" style={{ marginTop: 5 }} />}
                    <div>
                      <div className={`notif-title${unread ? ' unread' : ''}`} style={{ fontSize: 15 }}>{item.title || 'Notification'}</div>
                      <div className="notif-msg">{item.message}</div>
                    </div>
                  </div>
                  <div className="notif-card-date">{formatDate(item.created_at)}</div>
                </div>

                <div className="notif-card-type-row">
                  <div className="notif-card-type-label">Type</div>
                  <div style={{ color: '#0F172A', fontSize: 13.5 }}>{getTypeLabel(item.type)}</div>
                </div>

                <div className="notif-card-actions">
                  {unread && (
                    <button className="notif-btn" onClick={() => handleMarkRead(item.id)}>
                      <CheckCheck size={12} /> Read
                    </button>
                  )}
                  <button className="notif-btn" onClick={() => handleArchive(item.id)}>
                    <Archive size={12} /> Archive
                  </button>
                  <button className="notif-btn danger" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Notifications;