import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BellRing, Search, ShieldAlert } from 'lucide-react';
import Api from '../../services/api';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#0e0e0e',
  border: '1px solid rgba(201,168,76,0.12)',
  borderRadius: 12,
  padding: 20,
};

const AlertsManagement = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [alertsRes, statsRes] = await Promise.all([
          Api.getAlerts({ status: statusFilter === 'all' ? undefined : statusFilter, severity: severityFilter === 'all' ? undefined : severityFilter, search: searchTerm || undefined }),
          Api.getAlertStats(),
        ]);
        setAlerts(alertsRes.data || []);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [statusFilter, severityFilter, searchTerm]);

  const filtered = useMemo(() => alerts.filter((alert) => {
    if (!searchTerm) return true;
    const haystack = [alert.title, alert.description, alert.category, alert.source].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  }), [alerts, searchTerm]);

  if (loading) {
    return <div style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading alerts...</div>;
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <BellRing size={22} style={{ color: '#c9a84c' }} />
          <h1 style={{ margin: 0, color: '#e8e4dc', fontSize: 28, fontWeight: 600 }}>Alerts Management</h1>
        </div>
        <p style={{ margin: 0, color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
          Real-time operational alerts derived from platform users, contracts, and payment activity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          ['Total Alerts', stats?.totalAlerts ?? 0, '#e8e4dc'],
          ['Active', stats?.activeAlerts ?? 0, '#ef4444'],
          ['Critical', stats?.criticalAlerts ?? 0, '#f59e0b'],
          ['Today', stats?.alertsToday ?? 0, '#3b82f6'],
        ].map(([label, value, color]) => (
          <div key={String(label)} style={cardStyle}>
            <div style={{ color, fontSize: 26, fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>{value as any}</div>
            <div style={{ marginTop: 8, color: '#7a7060', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ color: '#7a7060' }} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search alerts"
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#e8e4dc', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ backgroundColor: '#171717', color: '#e8e4dc', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 8, padding: '10px 12px' }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={{ backgroundColor: '#171717', color: '#e8e4dc', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 8, padding: '10px 12px' }}>
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.length === 0 && (
            <div style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>No alerts matched the current filters.</div>
          )}

          {filtered.map((alert) => {
            const severityColor = alert.severity === 'critical' ? '#ef4444' : alert.severity === 'high' ? '#f59e0b' : alert.severity === 'medium' ? '#3b82f6' : '#10b981';
            return (
              <div key={alert.id} style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ShieldAlert size={16} style={{ color: severityColor }} />
                      <div style={{ color: '#e8e4dc', fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>{alert.title}</div>
                    </div>
                    <div style={{ color: '#7a7060', fontSize: 13, marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{alert.description}</div>
                    <div style={{ color: '#7a7060', fontSize: 13, marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>
                      {alert.source} • {alert.category} • {new Date(alert.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>{alert.type}</span>
                    <span style={{ padding: '4px 10px', borderRadius: 999, backgroundColor: `${severityColor}20`, color: severityColor, fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>{alert.severity}</span>
                    <span style={{ padding: '4px 10px', borderRadius: 999, backgroundColor: alert.status === 'active' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', color: alert.status === 'active' ? '#ef4444' : '#10b981', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>{alert.status}</span>
                  </div>
                </div>

                {alert.metadata?.metrics && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#c9a84c', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                    <AlertTriangle size={14} />
                    Metric: {alert.metadata.metrics.value} / {alert.metadata.metrics.threshold} {alert.metadata.metrics.unit}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AlertsManagement;
