import { useState, useEffect } from 'react';
import {
  Bell, Search, Plus, Edit, Trash2, Eye,
  Calendar, CheckCircle, X, AlertTriangle, Clock,
  Users, Building, Shield, Settings, DollarSign,
  Info, AlertCircle, XCircle, Database, Cpu,
  FileText, Radio, Zap,
} from 'lucide-react';
import Api from '../../services/api';

/* ─── Types ───────────────────────────────────────────────── */
interface Alert {
  id: number;
  title: string;
  description: string;
  type: 'system' | 'security' | 'performance' | 'user_activity' | 'financial' | 'maintenance' | 'notification' | 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  status: 'active' | 'resolved' | 'dismissed' | 'acknowledged';
  source: string;
  category: string;
  metadata: {
    triggeredAt: string;
    resolvedAt?: string;
    acknowledgedAt?: string;
    resolvedBy?: string;
    acknowledgedBy?: string;
    details?: string;
    actionRequired: boolean;
    autoResolve: boolean;
    escalationLevel: number;
    relatedEntity?: { type: string; id: number; name: string };
    metrics?: { value: number; threshold: number; unit: string };
  };
  recipients: { userId?: number; userEmail?: string; type: string; notifiedAt?: string }[];
  actions: { type: string; status: string; sentAt?: string; error?: string }[];
}

interface AlertRule {
  id: number;
  name: string;
  description: string;
  type: 'system' | 'security' | 'performance' | 'user_activity' | 'financial' | 'maintenance';
  condition: string;
  threshold: number;
  operator: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  isActive: boolean;
  recipients: string[];
  autoResolve: boolean;
  escalationRules: { level: number; delay: number; action: string }[];
  createdAt: string;
  updatedAt: string;
}

interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  criticalAlerts: number;
  urgentAlerts: number;
  alertsThisHour: number;
  alertsToday: number;
  alertsThisWeek: number;
  avgResolutionTime: number;
  topAlertType: string;
  topSeverity: string;
}

/* ─── Shared style tokens ────────────────────────────────── */
const tk = {
  gold:   '#c9a84c',
  goldLt: '#e8c97a',
  dark2:  '#0e0e0e',
  cream:  '#e8e4dc',
  muted:  '#7a7060',
  border: 'rgba(201,168,76,0.12)',
  green:  '#10b981',
  amber:  '#f59e0b',
  blue:   '#3b82f6',
  red:    '#ef4444',
  crimson:'#dc2626',
  purple: '#8b5cf6',
  cyan:   '#06b6d4',
  gray:   '#6b7280',
} as const;

const body: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif' };
const serif: React.CSSProperties = { fontFamily: 'Cormorant Garamond, Georgia, serif' };

const card: React.CSSProperties = {
  backgroundColor: tk.dark2,
  border: `1px solid ${tk.border}`,
  borderRadius: 10,
};

const innerRow: React.CSSProperties = {
  border: '1px solid rgba(201,168,76,0.07)',
  borderRadius: 8,
  padding: 20,
  transition: 'all 0.2s',
};

const labelStyle: React.CSSProperties = {
  ...body, fontSize: 10, fontWeight: 500,
  letterSpacing: '0.12em', textTransform: 'uppercase', color: tk.muted,
};

const pill = (color: string): React.CSSProperties => ({
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 9px',
  backgroundColor: `${color}18`,
  border: `1px solid ${color}30`,
  color, borderRadius: 999,
  fontSize: 10, fontWeight: 600,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  whiteSpace: 'nowrap',
});

const ghostBtn = (color: string): React.CSSProperties => ({
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 14px',
  backgroundColor: `${color}10`,
  border: `1px solid ${color}25`,
  color, borderRadius: 6,
  fontSize: 12, fontWeight: 500,
  cursor: 'pointer', transition: 'all 0.18s',
});

const solidBtn: React.CSSProperties = {
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 18px',
  background: `linear-gradient(135deg, ${tk.gold}, ${tk.goldLt})`,
  border: 'none', color: '#111',
  borderRadius: 6, fontSize: 13, fontWeight: 700,
  cursor: 'pointer',
};

const selectStyle: React.CSSProperties = {
  ...body, padding: '8px 12px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: tk.cream, borderRadius: 6,
  fontSize: 13, outline: 'none',
};

/* ─── Helpers ────────────────────────────────────────────── */
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const statusColor = (s: string): string =>
  ({ active: tk.red, resolved: tk.green, dismissed: tk.gray, acknowledged: tk.blue }[s] ?? tk.gray);

const typeColor = (t: string): string =>
  ({ system: tk.red, security: tk.amber, performance: tk.blue, user_activity: tk.green, financial: tk.purple, maintenance: tk.gray, notification: tk.cyan, error: tk.red, warning: tk.amber, info: tk.blue }[t] ?? tk.gray);

const severityColor = (s: string): string =>
  ({ critical: tk.red, urgent: tk.crimson, high: tk.amber, medium: tk.blue, low: tk.green, info: tk.blue }[s] ?? tk.gray);

/* ── Valid lucide-react icons only ─────────────────────────
   Removed all non-existent icons:
   UsbPlug, ZapOn, ZapOff, PowerOff, BatteryFull, BatteryLow,
   BatteryCharging, Battery, BluetoothOff, Bluetooth, SmartphoneNfc,
   SignalZero, SignalLow, SignalHigh, Signal, WifiOff, RadioTower,
   ActivitySquare, AlertOctagon, ShieldX, CheckSquare, Square,
   VolumeX, Volume2, BellRing, Megaphone, etc.
────────────────────────────────────────────────────────── */
const getTypeIcon = (type: string) =>
  ({ system: Database, security: Shield, performance: Cpu, user_activity: Users, financial: DollarSign, maintenance: Settings, notification: Bell, error: XCircle, warning: AlertTriangle, info: Info }[type] ?? Bell);

const getSeverityIcon = (severity: string) =>
  ({ critical: AlertCircle, urgent: Zap, high: AlertTriangle, medium: Info, low: CheckCircle, info: Info }[severity] ?? Bell);

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
const AlertsManagement = () => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules' | 'analytics'>('alerts');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => { loadAlertData(); }, [activeTab]);

  const loadAlertData = async () => {
    try {
      setLoading(true);

      const [alertsRes, statsRes] = await Promise.all([
        Api.getAlerts({
          search: searchTerm,
          type: typeFilter,
          severity: severityFilter,
          status: statusFilter,
        }),
        Api.getAlertStats(),
      ]);

      if (alertsRes.data) {
        setAlerts(alertsRes.data);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
      const mockStats: AlertStats = {
        totalAlerts: 5, activeAlerts: 3, resolvedAlerts: 1, criticalAlerts: 1, urgentAlerts: 1,
        alertsThisHour: 1, alertsToday: 3, alertsThisWeek: 5,
        avgResolutionTime: 2.5, topAlertType: 'system', topSeverity: 'critical',
      };

      setAlerts(mockAlerts);
      setRules(mockRules);
      setStats(mockStats);
    } catch (e) {
      console.error('Failed to load alert data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = (id: number) => {
    setAlerts((prev) => prev.map((a) =>
      a.id === id ? { ...a, status: 'acknowledged' as const, metadata: { ...a.metadata, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'Admin' } } : a
    ));
  };

  const handleResolveAlert = (id: number) => {
    setAlerts((prev) => prev.map((a) =>
      a.id === id ? { ...a, status: 'resolved' as const, metadata: { ...a.metadata, resolvedAt: new Date().toISOString(), resolvedBy: 'Admin' } } : a
    ));
  };

  const handleDismissAlert = (id: number) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'dismissed' as const } : a));
  };

  const openDetailModal = (alert: Alert) => {
    setSelectedAlert(alert);
    setShowDetailModal(true);
  };

  const toggleRule = (id: number) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  /* ── Filtered alerts ── */
  const filteredAlerts = alerts.filter((a) =>
    (statusFilter   === 'all' || a.status   === statusFilter) &&
    (typeFilter     === 'all' || a.type     === typeFilter) &&
    (severityFilter === 'all' || a.severity === severityFilter)
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(201,168,76,0.15)', borderTop: `3px solid ${tk.gold}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: tk.muted, ...body, fontSize: 13 }}>Loading alert data…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        .am-row:hover  { border-color: rgba(201,168,76,0.15) !important; background: rgba(201,168,76,0.015) !important; }
        .am-card:hover { border-color: rgba(201,168,76,0.15) !important; }
        .am-btn:hover  { filter: brightness(1.1); transform: translateY(-1px); }
        .am-btn:active { transform: scale(.97); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Bell size={22} style={{ color: tk.gold }} />
          <h1 style={{ ...serif, fontSize: 26, fontWeight: 600, color: tk.cream, margin: 0, letterSpacing: '-0.02em' }}>
            Alerts Management
          </h1>
        </div>
        <p style={{ color: tk.muted, ...body, fontSize: 13, margin: 0 }}>
          Monitor system alerts, notifications, and security events.
        </p>
      </div>

      {/* ── Stats strip ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total',       value: stats.totalAlerts,         color: tk.cream   },
            { label: 'Active',      value: stats.activeAlerts,        color: tk.red     },
            { label: 'Resolved',    value: stats.resolvedAlerts,      color: tk.green   },
            { label: 'Critical',    value: stats.criticalAlerts,      color: tk.crimson },
            { label: 'Urgent',      value: stats.urgentAlerts,        color: tk.amber   },
            { label: 'Today',       value: stats.alertsToday,         color: tk.cream   },
            { label: 'This Week',   value: stats.alertsThisWeek,      color: tk.cream   },
            { label: 'Avg. Resolve',value: `${stats.avgResolutionTime}h`, color: tk.gold },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...card, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ ...body, fontSize: 18, fontWeight: 700, color, marginBottom: 3, lineHeight: 1.2 }}>{value}</div>
              <div style={{ ...labelStyle, marginBottom: 0 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab toggle ── */}
      <div style={{ ...card, padding: 4, marginBottom: 20, display: 'flex', gap: 4 }}>
        {(['alerts', 'rules', 'analytics'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '8px 14px',
            backgroundColor: activeTab === tab ? tk.gold : 'transparent',
            border: `1px solid ${activeTab === tab ? tk.gold : 'rgba(201,168,76,0.15)'}`,
            color: activeTab === tab ? '#111' : tk.muted,
            borderRadius: 6, ...body, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
          }}>
            {tab === 'alerts' ? 'Alerts' : tab === 'rules' ? 'Rules' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* ══ ALERTS TAB ══ */}
      {activeTab === 'alerts' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>System Alerts</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select value={statusFilter}   onChange={(e) => setStatusFilter(e.target.value)}   style={selectStyle}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
                <option value="acknowledged">Acknowledged</option>
              </select>
              <select value={typeFilter}     onChange={(e) => setTypeFilter(e.target.value)}     style={selectStyle}>
                <option value="all">All Types</option>
                <option value="system">System</option>
                <option value="security">Security</option>
                <option value="performance">Performance</option>
                <option value="user_activity">User Activity</option>
                <option value="financial">Financial</option>
                <option value="maintenance">Maintenance</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
              <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={selectStyle}>
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {filteredAlerts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: tk.muted, ...body, fontSize: 13 }}>
              No alerts match your filters.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredAlerts.map((alert) => {
              const TypeIcon     = getTypeIcon(alert.type);
              const SeverityIcon = getSeverityIcon(alert.severity);
              const sColor  = statusColor(alert.status);
              const tColor  = typeColor(alert.type);
              const svColor = severityColor(alert.severity);

              return (
                <div key={alert.id} className="am-row" style={innerRow}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

                    {/* Icon */}
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: `${sColor}12`, border: `1px solid ${sColor}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <SeverityIcon size={20} style={{ color: sColor }} />
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                        <div>
                          <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: '0 0 5px' }}>{alert.title}</h4>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                              <TypeIcon size={11} style={{ color: tColor }} /> {alert.source}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                              <Clock size={11} /> {fmtDate(alert.metadata.triggeredAt)}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flexShrink: 0 }}>
                          <span style={pill(sColor)}>{alert.status.replace('_', ' ')}</span>
                          <span style={pill(tColor)}>{alert.type.replace('_', ' ')}</span>
                          <span style={pill(svColor)}>{alert.severity}</span>
                        </div>
                      </div>

                      <p style={{ ...body, fontSize: 12.5, color: '#9a9080', margin: '0 0 10px', lineHeight: 1.6 }}>
                        {alert.description}
                      </p>

                      {/* Meta chips */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                          <AlertTriangle size={11} /> {alert.category}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                          <Users size={11} /> {alert.recipients.length} recipients
                        </span>
                        {alert.metadata.actionRequired && (
                          <span style={pill(tk.red)}>Action Required</span>
                        )}
                        {alert.metadata.escalationLevel > 0 && (
                          <span style={pill(tk.crimson)}>Level {alert.metadata.escalationLevel}</span>
                        )}
                        {alert.metadata.metrics && (
                          <span style={pill(tk.gold)}>
                            {alert.metadata.metrics.value}/{alert.metadata.metrics.threshold} {alert.metadata.metrics.unit}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button style={ghostBtn(tk.gold)}  className="am-btn" onClick={() => openDetailModal(alert)}>
                          <Eye size={13} /> View Details
                        </button>
                        {alert.status === 'active' && (
                          <>
                            <button style={ghostBtn(tk.blue)}  className="am-btn" onClick={() => handleAcknowledgeAlert(alert.id)}>
                              <CheckCircle size={13} /> Acknowledge
                            </button>
                            <button style={ghostBtn(tk.green)} className="am-btn" onClick={() => handleResolveAlert(alert.id)}>
                              <CheckCircle size={13} /> Resolve
                            </button>
                          </>
                        )}
                        <button style={ghostBtn(tk.gray)} className="am-btn" onClick={() => handleDismissAlert(alert.id)}>
                          <X size={13} /> Dismiss
                        </button>
                      </div>

                    </div>{/* /body */}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ RULES TAB ══ */}
      {activeTab === 'rules' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>Alert Rules</h3>
            <button style={solidBtn} className="am-btn">
              <Bell size={14} /> Create Rule
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 18 }}>
            {rules.map((rule) => {
              const TypeIcon = getTypeIcon(rule.type);
              const tColor   = typeColor(rule.type);
              const svColor  = severityColor(rule.severity);

              return (
                <div key={rule.id} className="am-card" style={{ ...innerRow, display: 'flex', flexDirection: 'column', gap: 14, transition: 'all 0.2s' }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: rule.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.10)',
                      border: `1px solid ${rule.isActive ? 'rgba(16,185,129,0.28)' : 'rgba(107,114,128,0.22)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <TypeIcon size={20} style={{ color: rule.isActive ? tk.green : tk.muted }} />
                    </div>
                    <div>
                      <div style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, marginBottom: 4 }}>{rule.name}</div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <span style={pill(rule.isActive ? tk.green : tk.muted)}>{rule.isActive ? 'Active' : 'Inactive'}</span>
                        <span style={pill(tColor)}>{rule.type.replace('_', ' ')}</span>
                        <span style={pill(svColor)}>{rule.severity}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ ...body, fontSize: 12.5, color: '#9a9080', margin: 0, lineHeight: 1.6 }}>{rule.description}</p>

                  <div style={{ ...body, fontSize: 11.5, color: tk.muted }}>
                    Condition: <span style={{ color: tk.gold, fontFamily: 'monospace' }}>{rule.condition} {rule.operator.replace('_', ' ')} {rule.threshold}</span>
                    &nbsp;·&nbsp; Auto-resolve: <strong style={{ color: rule.autoResolve ? tk.green : tk.amber }}>{rule.autoResolve ? 'Yes' : 'No'}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={ghostBtn(tk.gold)} className="am-btn"><Edit size={13} /> Edit</button>
                    <button style={ghostBtn(rule.isActive ? tk.red : tk.green)} className="am-btn" onClick={() => toggleRule(rule.id)}>
                      {rule.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ ANALYTICS TAB ══ */}
      {activeTab === 'analytics' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: '0 0 22px' }}>Alert Analytics</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>

            <div style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 8, padding: 20 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: '0 0 16px' }}>Performance</h4>
              {stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Avg. Resolution', value: `${stats.avgResolutionTime}h`, color: tk.cream },
                    { label: 'Alerts Today',    value: stats.alertsToday,             color: tk.cream },
                    { label: 'This Week',        value: stats.alertsThisWeek,          color: tk.cream },
                    { label: 'Top Type',         value: stats.topAlertType,            color: tk.gold  },
                    { label: 'Top Severity',     value: stats.topSeverity,             color: tk.amber },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
                      <span style={{ ...body, fontSize: 12, color: tk.muted }}>{label}</span>
                      <span style={{ ...body, fontSize: 13, fontWeight: 600, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 8, padding: 20 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: '0 0 16px' }}>By Type</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(['system','security','performance','user_activity','financial','maintenance','error','warning','info'] as const).map((type) => {
                  const count = alerts.filter((a) => a.type === type).length;
                  const color = typeColor(type);
                  return (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...body, fontSize: 12, color: tk.muted }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </span>
                      <span style={{ ...body, fontSize: 13, fontWeight: 700, color }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 8, padding: 20 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: '0 0 16px' }}>Status Breakdown</h4>
              {stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Active',       value: stats.activeAlerts,   color: tk.red   },
                    { label: 'Resolved',     value: stats.resolvedAlerts, color: tk.green },
                    { label: 'Critical',     value: stats.criticalAlerts, color: tk.crimson },
                    { label: 'Urgent',       value: stats.urgentAlerts,   color: tk.amber },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...body, fontSize: 12, color: tk.muted }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                        {label}
                      </span>
                      <span style={{ ...body, fontSize: 13, fontWeight: 700, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ DETAIL MODAL ══ */}
      {showDetailModal && selectedAlert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 999 }}>
          <div style={{ ...card, padding: 28, maxWidth: 520, width: '100%', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setShowDetailModal(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: tk.muted, cursor: 'pointer' }}>
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Bell size={15} style={{ color: tk.gold }} />
              <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>Alert Details</h3>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
              <span style={pill(statusColor(selectedAlert.status))}>{selectedAlert.status.replace('_', ' ')}</span>
              <span style={pill(typeColor(selectedAlert.type))}>{selectedAlert.type.replace('_', ' ')}</span>
              <span style={pill(severityColor(selectedAlert.severity))}>{selectedAlert.severity}</span>
            </div>

            <p style={{ ...body, fontSize: 13, color: '#b8b0a0', margin: '0 0 16px', lineHeight: 1.7 }}>
              {selectedAlert.description}
            </p>

            {[
              { label: 'Source',       value: selectedAlert.source },
              { label: 'Category',     value: selectedAlert.category },
              { label: 'Triggered',    value: fmtDate(selectedAlert.metadata.triggeredAt) },
              selectedAlert.metadata.resolvedAt    ? { label: 'Resolved',    value: `${fmtDate(selectedAlert.metadata.resolvedAt)} by ${selectedAlert.metadata.resolvedBy}` } : null,
              selectedAlert.metadata.acknowledgedAt? { label: 'Acknowledged',value: `${fmtDate(selectedAlert.metadata.acknowledgedAt)} by ${selectedAlert.metadata.acknowledgedBy}` } : null,
              { label: 'Action Req.',  value: selectedAlert.metadata.actionRequired ? 'Yes' : 'No' },
              { label: 'Auto Resolve', value: selectedAlert.metadata.autoResolve ? 'Yes' : 'No' },
              { label: 'Escalation',   value: `Level ${selectedAlert.metadata.escalationLevel}` },
              selectedAlert.metadata.metrics ? { label: 'Metrics', value: `${selectedAlert.metadata.metrics.value} / ${selectedAlert.metadata.metrics.threshold} ${selectedAlert.metadata.metrics.unit}` } : null,
            ].filter(Boolean).map(({ label, value }: any) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '8px 0', borderBottom: '1px solid rgba(201,168,76,0.07)' }}>
                <span style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ ...body, fontSize: 12.5, color: tk.cream, textAlign: 'right' }}>{value}</span>
              </div>
            ))}

            {selectedAlert.metadata.details && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(201,168,76,0.04)', borderRadius: 6, border: '1px solid rgba(201,168,76,0.09)' }}>
                <div style={{ ...labelStyle, marginBottom: 6 }}>Details</div>
                <p style={{ ...body, fontSize: 12.5, color: '#b8b0a0', margin: 0, lineHeight: 1.6 }}>{selectedAlert.metadata.details}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {selectedAlert.status === 'active' && (
                <>
                  <button style={{ ...ghostBtn(tk.blue), flex: 1, justifyContent: 'center' }} className="am-btn"
                    onClick={() => { handleAcknowledgeAlert(selectedAlert.id); setShowDetailModal(false); }}>
                    <CheckCircle size={13} /> Acknowledge
                  </button>
                  <button style={{ ...ghostBtn(tk.green), flex: 1, justifyContent: 'center' }} className="am-btn"
                    onClick={() => { handleResolveAlert(selectedAlert.id); setShowDetailModal(false); }}>
                    <CheckCircle size={13} /> Resolve
                  </button>
                </>
              )}
              <button style={{ ...ghostBtn(tk.muted), flex: 1, justifyContent: 'center' }} className="am-btn"
                onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AlertsManagement;