import { useCallback, useEffect, useState } from 'react';
import { Activity, Search, RefreshCw } from 'lucide-react';
import Api from '../../services/api';

const t = {
  dark: '#0F172A',
  dark2: '#162035',
  gold: '#C89128',
  cream: '#F8F8F9',
  muted: '#94A3B8',
  border: 'rgba(200,145,40,0.18)',
};

const formatWhen = (iso?: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Api.getActivityLogs({
        search: search || undefined,
        action: actionFilter || undefined,
        per_page: 50,
      });
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const actions = Array.from(new Set(logs.map((l) => l.action).filter(Boolean)));

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: t.dark, minHeight: '100vh', color: t.cream, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Activity size={22} color={t.gold} />
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Activity Logs</h1>
          </div>
          <p style={{ margin: 0, color: t.muted, fontSize: 13 }}>Authentication events and admin actions across the platform.</p>
        </div>
        <button
          onClick={load}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: t.dark2, border: `1px solid ${t.border}`, color: t.gold, borderRadius: 8, cursor: 'pointer' }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} color={t.muted} style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, action, description..."
            style={{ width: '100%', padding: '10px 12px 10px 38px', background: t.dark2, border: `1px solid ${t.border}`, borderRadius: 8, color: t.cream }}
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ padding: '10px 12px', background: t.dark2, border: `1px solid ${t.border}`, borderRadius: 8, color: t.cream, minWidth: 180 }}
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div style={{ background: t.dark2, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: t.muted }}>Loading activity logs…</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: t.muted }}>No activity logs found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {['When', 'User', 'Action', 'Description', 'IP'].map((h) => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: t.muted, whiteSpace: 'nowrap' }}>{formatWhen(log.created_at)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{log.user?.name || 'System'}</div>
                      <div style={{ fontSize: 11, color: t.muted }}>{log.user?.email || ''}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(200,145,40,0.12)', color: t.gold, fontSize: 11, fontWeight: 700 }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: t.cream }}>{log.description}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: t.muted }}>{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
