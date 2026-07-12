import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { TOKEN_KEY } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface NotificationItem {
  id: number;
  title?: string;
  message?: string;
  type?: string;
  is_read?: boolean;
  read_at?: string | null;
  created_at?: string;
}

interface Stats {
  total: number;
  unread: number;
  this_week: number;
}

const isUnread = (item: NotificationItem) => {
  if (typeof item.is_read === 'boolean') return !item.is_read;
  if (item.read_at) return false;
  return true;
};

const Notifications: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, unread: 0, this_week: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const authHeaders = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  };

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [listRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/commercial/notifications`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/commercial/notification-stats`, { headers: authHeaders() }),
      ]);

      if (!listRes.ok) {
        const body = await listRes.json().catch(() => ({}));
        throw new Error(body.message || 'Unable to load notifications');
      }

      const listData = await listRes.json();
      const statsData = statsRes.ok ? await statsRes.json() : { data: {} };
      setItems(Array.isArray(listData.data) ? listData.data : []);
      setStats({
        total: statsData.data?.total ?? 0,
        unread: statsData.data?.unread ?? 0,
        this_week: statsData.data?.this_week ?? 0,
      });
    } catch (e: any) {
      setError(e.message || 'Unable to load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter(({ title = '', message = '' }) =>
        `${title} ${message}`.toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  );

  const markRead = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/commercial/notifications/${id}/read`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      load();
    } catch {
      /* non-critical */
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/commercial/notifications/read-all`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      load();
    } catch {
      /* non-critical */
    }
  };

  const fmtDate = (s?: string) =>
    s
      ? new Date(s).toLocaleDateString('en-TZ', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  return (
    <div style={{ minHeight: '100vh', background: '#080E1A', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .card-panel { background: #0F1829; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; }
        .form-input {
          width: 100%; padding: 10px 16px 10px 40px; background: #0C1420;
          border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
          color: #E2D5B0; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none;
        }
        .form-input:focus { border-color: rgba(212,175,55,0.5); }
        .n-row { display: flex; gap: 14px; padding: 16px 22px; border-bottom: 1px solid rgba(255,255,255,0.03); align-items: flex-start; }
        .n-row:last-child { border-bottom: none; }
        .n-row:hover { background: rgba(212,175,55,0.025); }
        @media (max-width: 640px) {
          .stats-row { flex-direction: column; align-items: stretch !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Alerts</span>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, color: '#F1EDD8', fontFamily: "'Playfair Display', serif", lineHeight: 1.1, marginBottom: 4 }}>Notifications</h1>
            <p style={{ color: '#4A5568', fontSize: 13 }}>Applications, payments, contracts, and other updates for your commercial account</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={load}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#94A3B8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={markAllRead}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 12, color: '#D4AF37', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>
        </div>

        <div className="stats-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Total', value: stats.total },
            { label: 'Unread', value: stats.unread, accent: true },
            { label: 'This week', value: stats.this_week },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                background: s.accent ? 'rgba(212,175,55,0.08)' : '#0F1829',
                border: s.accent ? '1px solid rgba(212,175,55,0.18)' : '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A5568', fontWeight: 700 }}>{s.label}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: s.accent ? '#D4AF37' : '#F1EDD8' }}>{s.value}</span>
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 200, maxWidth: 320, position: 'relative' }}>
            <Search size={14} color="#4A5568" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input className="form-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications…" />
          </div>
        </div>

        {error && (
          <div className="card-panel" style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'center', color: '#FCA5A5' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="card-panel">
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#4A5568' }}>
              <div style={{ width: 32, height: 32, border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Loading notifications…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Bell size={24} color="#2D3748" />
              </div>
              <p style={{ color: '#E2D5B0', fontWeight: 600, marginBottom: 6 }}>No notifications yet</p>
              <p style={{ color: '#4A5568', fontSize: 13 }}>You will see alerts here when tenants apply, pay, or take other actions on your properties.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const unread = isUnread(item);
              return (
                <div key={item.id} className="n-row">
                  <div style={{ width: 8, paddingTop: 6 }}>
                    {unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 8px rgba(212,175,55,0.6)' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                      <p style={{ color: '#E2D5B0', fontWeight: unread ? 700 : 500, fontSize: 14 }}>{item.title || 'Notification'}</p>
                      <span style={{ color: '#4A5568', fontSize: 11 }}>{fmtDate(item.created_at)}</span>
                    </div>
                    <p style={{ color: '#64748B', fontSize: 13, marginBottom: 8 }}>{item.message}</p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4A5568', fontWeight: 700 }}>
                        {(item.type || 'system').replace(/_/g, ' ')}
                      </span>
                      {unread && (
                        <button
                          onClick={() => markRead(item.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.08)', color: '#D4AF37', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          <CheckCheck size={12} /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
