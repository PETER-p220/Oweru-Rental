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
    <div className="cd-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .cd-page { background: #F1F5F9; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .cd-header { background: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 32px 40px; }
        .cd-wrap { max-width: 1280px; margin: 0 auto; padding: 32px 40px 80px; }
        
        .cd-card { 
          background: #FFFFFF; 
          border: 1px solid #E2E8F0; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 1px 3px rgba(15,23,42,0.04); 
        }
        
        .cd-stat {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 16px 20px;
        }
        
        .cd-row {
          padding: 20px 24px;
          border-bottom: 1px solid #F1F5F9;
          transition: background 0.2s;
        }
        .cd-row:hover { background: #F8FAFC; }
        .cd-row:last-child { border-bottom: none; }
        
        .cd-filter-input {
          width: 100%;
          padding: 11px 12px 11px 40px;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 14px;
        }
        
        .cd-btn {
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>

      {/* Header */}
      <div className="cd-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#64748B', textTransform: 'uppercase' }}>
              ALERTS
            </div>
            <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 28px)', fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0' }}>
              Notifications
            </h1>
            <p style={{ color: '#64748B' }}>Stay updated with applications, payments, and important events</p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={load} className="cd-btn" style={{ border: '1px solid #CBD5E1', color: '#475569' }}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button onClick={markAllRead} className="cd-btn" style={{ background: '#0F172A', color: 'white' }}>
              <CheckCheck size={16} /> Mark all read
            </button>
          </div>
        </div>
      </div>

      <div className="cd-wrap">
        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          {[
            { label: 'Total', value: stats.total },
            { label: 'Unread', value: stats.unread, accent: true },
            { label: 'This Week', value: stats.this_week },
          ].map((s, i) => (
            <div key={i} className="cd-stat" style={{ flex: 1, minWidth: 160 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.accent ? '#3B82F6' : '#0F172A', marginTop: 6 }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="cd-card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: 13, color: '#94A3B8' }} />
            <input
              className="cd-filter-input"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '16px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="cd-card">
          {loading ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748B' }}>
              <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              Loading notifications...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <Bell size={48} style={{ color: '#CBD5E1', marginBottom: 16 }} />
              <h3 style={{ color: '#0F172A' }}>No notifications yet</h3>
              <p style={{ color: '#64748B', maxWidth: 360, margin: '12px auto 0' }}>
                You will see important updates here when tenants apply, pay rent, or take action on your properties.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const unread = isUnread(item);
              return (
                <div key={item.id} className="cd-row" style={{ display: 'flex', gap: 16 }}>
                  <div style={{ paddingTop: 4 }}>
                    {unread && (
                      <div style={{ width: 8, height: 8, background: '#3B82F6', borderRadius: '50%', boxShadow: '0 0 6px rgba(59,130,246,0.5)' }} />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                      <p style={{ fontWeight: unread ? 700 : 500, color: '#0F172A', fontSize: 15 }}>
                        {item.title || 'System Notification'}
                      </p>
                      <span style={{ color: '#94A3B8', fontSize: 12.5 }}>{fmtDate(item.created_at)}</span>
                    </div>

                    <p style={{ color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>{item.message}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {(item.type || 'system').replace(/_/g, ' ')}
                      </span>

                      {unread && (
                        <button
                          onClick={() => markRead(item.id)}
                          className="cd-btn"
                          style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
                        >
                          <CheckCheck size={14} /> Mark as read
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