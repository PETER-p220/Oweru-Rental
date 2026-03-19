import { useState, useEffect } from 'react';
import {
  Settings, Shield, Database, Globe, Bell, Lock,
  Users, Activity, BarChart3, Save, RefreshCw,
  AlertTriangle, CheckCircle, X, Edit2, Trash2,
  Plus, Search, Filter, Download, Upload, Eye, EyeOff,
  ToggleLeft, ToggleRight,
} from 'lucide-react';
import Api from '../../services/api';

/* ─── Types ───────────────────────────────────────────────── */
interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
  defaultUserRole: string;
  enableNotifications: boolean;
  enableAnalytics: boolean;
  enableBackup: boolean;
  backupFrequency: string;
  storageQuota: number;
  enableTwoFactor: boolean;
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireUppercase: boolean;
}

interface SystemLog {
  id: number;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  context: string;
  userId?: number;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

interface SystemBackup {
  id: number;
  filename: string;
  size: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
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
  padding: '14px 16px',
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
  padding: '9px 20px',
  background: `linear-gradient(135deg, ${tk.gold}, ${tk.goldLt})`,
  border: 'none', color: '#111',
  borderRadius: 6, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', letterSpacing: '0.03em',
  boxShadow: `0 3px 14px rgba(201,168,76,0.28)`,
};

const inputStyle: React.CSSProperties = {
  ...body,
  width: '100%', padding: '10px 12px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: tk.cream, borderRadius: 6,
  fontSize: 13, outline: 'none',
};

const selectStyle: React.CSSProperties = { ...inputStyle };

/* ─── Helpers ────────────────────────────────────────────── */
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const logLevelColor = (l: string): string =>
  ({ error: tk.red, warning: tk.amber, info: tk.blue, debug: tk.gray }[l] ?? tk.gray);

const getLogIcon = (level: string) =>
  ({ error: AlertTriangle, warning: AlertTriangle, info: Activity, debug: Database }[level] ?? Activity);

const backupStatusColor = (s: string): string =>
  ({ completed: tk.green, in_progress: tk.amber, failed: tk.red, pending: tk.gray }[s] ?? tk.gray);

/* ── Toggle switch component ───────────────────────────────
   Replaces the missing `Toggle` lucide icon with a real
   interactive toggle built from ToggleLeft / ToggleRight.
─────────────────────────────────────────────────────────── */
function ToggleSwitch({
  label,
  checked,
  onChange,
  dangerWhenOn = false,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  dangerWhenOn?: boolean;
}) {
  const color = dangerWhenOn && checked ? tk.red : checked ? tk.green : tk.gray;
  const Icon  = checked ? ToggleRight : ToggleLeft;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ ...body, fontSize: 12, color: tk.cream }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <Icon size={28} style={{ color, transition: 'color 0.2s' }} />
        <span style={{ ...body, fontSize: 12.5, color, fontWeight: 600 }}>
          {checked ? 'Enabled' : 'Disabled'}
        </span>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
const SystemSettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'backup' | 'logs'>('general');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevel, setLogLevel] = useState('all');

  useEffect(() => { loadSystemData(); }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);

      const settingsRes = await Api.getSystemSettings();
      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }
    } catch (e) {
      console.error('Failed to load system data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await Api.updateSystemSettings(settings);
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBackup = () => {
    const nb: SystemBackup = {
      id: backups.length + 1,
      filename: `oweru_backup_${new Date().toISOString().replace(/[:.]/g, '_').slice(0, 19)}.sql`,
      size: 0, status: 'in_progress', createdAt: new Date().toISOString(),
    };
    setBackups([nb, ...backups]);
    setTimeout(() => {
      setBackups((prev) => prev.map((b) =>
        b.id === nb.id ? { ...b, status: 'completed', size: 52428800, completedAt: new Date().toISOString() } : b
      ));
    }, 3000);
  };

  const handleDownloadBackup = (backup: SystemBackup) => {
    const a = document.createElement('a');
    a.href = '#'; a.download = backup.filename; a.click();
  };

  const handleDeleteBackup = (id: number) => {
    if (!confirm('Delete this backup?')) return;
    setBackups((prev) => prev.filter((b) => b.id !== id));
  };

  const filteredLogs = logs
    .filter((l) => {
      const q = searchTerm.toLowerCase();
      return (
        (l.message.toLowerCase().includes(q) || l.context.toLowerCase().includes(q)) &&
        (logLevel === 'all' || l.level === logLevel)
      );
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(201,168,76,0.15)', borderTop: `3px solid ${tk.gold}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: tk.muted, ...body, fontSize: 13 }}>Loading system settings…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Field row (reused in forms) ── */
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ ...body, fontSize: 11.5, color: tk.cream }}>{label}</label>
      {children}
    </div>
  );

  /* ── Save button ── */
  const SaveBtn = () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
      <button onClick={handleSaveSettings} disabled={saving} style={{ ...solidBtn, opacity: saving ? 0.6 : 1 }} className="ss-btn">
        <Save size={14} />
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );

  /* ── Render ── */
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        .ss-row:hover { border-color: rgba(201,168,76,0.15) !important; background: rgba(201,168,76,0.015) !important; }
        .ss-btn:hover  { filter: brightness(1.1); transform: translateY(-1px); }
        .ss-btn:active { transform: scale(.97); }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Settings size={22} style={{ color: tk.gold }} />
          <h1 style={{ ...serif, fontSize: 26, fontWeight: 600, color: tk.cream, margin: 0, letterSpacing: '-0.02em' }}>
            System Settings
          </h1>
        </div>
        <p style={{ color: tk.muted, ...body, fontSize: 13, margin: 0 }}>
          Configure system-wide settings and preferences.
        </p>
      </div>

      {/* ── Tab toggle ── */}
      <div style={{ ...card, padding: 4, marginBottom: 20, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(['general', 'security', 'notifications', 'backup', 'logs'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, minWidth: 80, padding: '8px 14px',
            backgroundColor: activeTab === tab ? tk.gold : 'transparent',
            border: `1px solid ${activeTab === tab ? tk.gold : 'rgba(201,168,76,0.15)'}`,
            color: activeTab === tab ? '#111' : tk.muted,
            borderRadius: 6, ...body, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ══ GENERAL ══ */}
      {activeTab === 'general' && settings && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: '0 0 22px' }}>General Settings</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20, marginBottom: 20 }}>
            <Field label="Site Name">
              <input type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Contact Email">
              <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Contact Phone">
              <input type="tel" value={settings.contactPhone} onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Default User Role">
              <select value={settings.defaultUserRole} onChange={(e) => setSettings({ ...settings, defaultUserRole: e.target.value })} style={selectStyle}>
                <option value="tenant">Tenant</option>
                <option value="landlord">Landlord</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </div>

          <Field label="Site Description">
            <textarea value={settings.siteDescription} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </Field>

          <SaveBtn />
        </div>
      )}

      {/* ══ SECURITY ══ */}
      {activeTab === 'security' && settings && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: '0 0 22px' }}>Security Settings</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20, marginBottom: 28 }}>
            <Field label="Max Login Attempts">
              <input type="number" value={settings.maxLoginAttempts} onChange={(e) => setSettings({ ...settings, maxLoginAttempts: +e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Session Timeout (minutes)">
              <input type="number" value={settings.sessionTimeout} onChange={(e) => setSettings({ ...settings, sessionTimeout: +e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Storage Quota (GB)">
              <input type="number" value={settings.storageQuota / 1e9} onChange={(e) => setSettings({ ...settings, storageQuota: +e.target.value * 1e9 })} style={inputStyle} />
            </Field>
            <Field label="Min Password Length">
              <input type="number" value={settings.passwordMinLength} onChange={(e) => setSettings({ ...settings, passwordMinLength: +e.target.value })} style={inputStyle} />
            </Field>
          </div>

          <div style={{ borderTop: `1px solid ${tk.border}`, paddingTop: 22 }}>
            <div style={{ ...body, fontSize: 12, color: tk.cream, marginBottom: 16 }}>Password Requirements</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
              <ToggleSwitch label="Require Special Chars" checked={settings.passwordRequireSpecialChars} onChange={(v) => setSettings({ ...settings, passwordRequireSpecialChars: v })} />
              <ToggleSwitch label="Require Numbers"       checked={settings.passwordRequireNumbers}      onChange={(v) => setSettings({ ...settings, passwordRequireNumbers: v })} />
              <ToggleSwitch label="Require Uppercase"     checked={settings.passwordRequireUppercase}    onChange={(v) => setSettings({ ...settings, passwordRequireUppercase: v })} />
              <ToggleSwitch label="Two-Factor Auth"       checked={settings.enableTwoFactor}             onChange={(v) => setSettings({ ...settings, enableTwoFactor: v })} />
            </div>
          </div>

          <SaveBtn />
        </div>
      )}

      {/* ══ NOTIFICATIONS ══ */}
      {activeTab === 'notifications' && settings && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: '0 0 22px' }}>Notification &amp; System Toggles</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
            <ToggleSwitch label="Notifications"     checked={settings.enableNotifications} onChange={(v) => setSettings({ ...settings, enableNotifications: v })} />
            <ToggleSwitch label="Analytics"         checked={settings.enableAnalytics}     onChange={(v) => setSettings({ ...settings, enableAnalytics: v })} />
            <ToggleSwitch label="Allow Registration"checked={settings.allowRegistration}   onChange={(v) => setSettings({ ...settings, allowRegistration: v })} />
            <ToggleSwitch label="Email Verification"checked={settings.requireEmailVerification} onChange={(v) => setSettings({ ...settings, requireEmailVerification: v })} />
            <ToggleSwitch label="Phone Verification"checked={settings.requirePhoneVerification} onChange={(v) => setSettings({ ...settings, requirePhoneVerification: v })} />
            <ToggleSwitch label="Auto Backup"       checked={settings.enableBackup}        onChange={(v) => setSettings({ ...settings, enableBackup: v })} />
            <ToggleSwitch label="Maintenance Mode"  checked={settings.maintenanceMode}     onChange={(v) => setSettings({ ...settings, maintenanceMode: v })} dangerWhenOn />
          </div>

          {settings.enableBackup && (
            <div style={{ marginTop: 24 }}>
              <Field label="Backup Frequency">
                <select value={settings.backupFrequency} onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })} style={{ ...selectStyle, maxWidth: 260 }}>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </Field>
            </div>
          )}

          <SaveBtn />
        </div>
      )}

      {/* ══ BACKUP ══ */}
      {activeTab === 'backup' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>System Backups</h3>
            <button onClick={handleCreateBackup} style={solidBtn} className="ss-btn">
              <Plus size={14} /> Create Backup
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {backups.map((b) => {
              const sColor = backupStatusColor(b.status);
              return (
                <div key={b.id} className="ss-row" style={{ ...innerRow, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <Database size={18} style={{ color: tk.gold, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ ...body, fontSize: 13, fontWeight: 600, color: tk.cream, margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.filename}
                      </p>
                      <p style={{ ...body, fontSize: 11, color: tk.muted, margin: 0 }}>
                        {formatFileSize(b.size)} · {fmtDate(b.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    <span style={pill(sColor)}>{b.status.replace('_', ' ')}</span>
                    <button style={ghostBtn(tk.gold)} className="ss-btn" onClick={() => handleDownloadBackup(b)}>
                      <Download size={13} /> Download
                    </button>
                    <button style={ghostBtn(tk.red)} className="ss-btn" onClick={() => handleDeleteBackup(b.id)}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ LOGS ══ */}
      {activeTab === 'logs' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>System Logs</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={logLevel} onChange={(e) => setLogLevel(e.target.value)}
                style={{ ...selectStyle, minWidth: 130 }}>
                <option value="all">All Levels</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 220 }}>
                <Search size={15} style={{ color: tk.muted, flexShrink: 0 }} />
                <input type="text" placeholder="Search logs…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
          </div>

          {filteredLogs.length === 0 && (
            <p style={{ ...body, fontSize: 13, color: tk.muted, textAlign: 'center', padding: '40px 0', margin: 0 }}>
              No logs match your filters.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredLogs.map((log) => {
              const LogIcon = getLogIcon(log.level);
              const lColor  = logLevelColor(log.level);
              return (
                <div key={log.id} className="ss-row" style={{ ...innerRow, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <LogIcon size={15} style={{ color: lColor, flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ ...body, fontSize: 13, color: tk.cream, margin: '0 0 3px', lineHeight: 1.4 }}>{log.message}</p>
                    <p style={{ ...body, fontSize: 11, color: tk.muted, margin: 0 }}>
                      {log.context} · {fmtDate(log.timestamp)}
                      {log.userEmail ? ` · ${log.userEmail}` : ''}
                    </p>
                  </div>
                  <span style={pill(lColor)}>{log.level}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default SystemSettingsPage;