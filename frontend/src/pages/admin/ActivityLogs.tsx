import { useCallback, useEffect, useState } from 'react';
import { Activity, Search, RefreshCw } from 'lucide-react';
import Api from '../../services/api';
import {
  C, pageWrap, pageInner, card, inputCss, selectCss,
  btnGhost, ADMIN_CSS, adminHeaderStyle,
} from './adminTheme';

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
    <div className="admin-page" style={pageWrap}>
      <style>{ADMIN_CSS}</style>
      <div style={pageInner}>
        <div style={adminHeaderStyle}>
          <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>
                Admin · Audit Trail
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Activity size={22} />
                <h1 style={{ margin: 0, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800 }}>Activity Logs</h1>
              </div>
              <p style={{ margin: 0, color: C.textLight, fontSize: 14, lineHeight: 1.6 }}>
                Authentication events and admin actions across the platform.
              </p>
            </div>
            <div className="admin-header-actions" style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={load} style={btnGhost}>
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color={C.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="admin-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, description..."
              style={{ ...inputCss, paddingLeft: 38 }}
            />
          </div>
          <select
            className="admin-input"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={selectCss}
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>Loading activity logs…</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>No activity logs found.</div>
          ) : (
            <div className="admin-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.slate100 }}>
                    {['When', 'User', 'Action', 'Description', 'IP'].map((h) => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: C.textMuted, whiteSpace: 'nowrap' }}>{formatWhen(log.created_at)}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>
                        <div style={{ fontWeight: 600, color: C.text }}>{log.user?.name || 'System'}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{log.user?.email || ''}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: 999, background: C.goldBg, color: C.gold, fontSize: 11, fontWeight: 700 }}>{log.action}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: C.text }}>{log.description}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: C.textMuted }}>{log.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
