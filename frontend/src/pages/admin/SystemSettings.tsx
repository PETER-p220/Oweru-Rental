import { useState, useEffect } from 'react';
import {
  Settings, Shield, Database, Globe, Bell, Lock,
  Users, Activity, BarChart3, Save, RefreshCw,
  AlertTriangle, CheckCircle, X, Edit2, Trash2,
  Plus, Search, Filter, Download, Upload, Eye, EyeOff,
  ToggleLeft, ToggleRight,
} from 'lucide-react';
import Api from '../../services/api';
import {
  C, body, pageWrap, pageInner, card, inputCss, selectCss, labelCss, btnPrimary, btnGhost, statCard, ADMIN_CSS, adminHeaderStyle, pill, ghostBtn, innerRow,
} from './adminTheme';

const solidBtn: React.CSSProperties = {
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 20px',
  background: `linear-gradient(135deg, ${C.gold}, ${C.gold})`,
  border: 'none', color: '#111',
  borderRadius: 6, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', letterSpacing: '0.03em',
  boxShadow: `0 3px 14px rgba(201,168,76,0.28)`,
};

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
  ({ error: C.red, warning: C.amber, info: C.blue, debug: C.textMuted }[l] ?? C.textMuted);

const getLogIcon = (level: string) =>
  ({ error: AlertTriangle, warning: AlertTriangle, info: Activity, debug: Database }[level] ?? Activity);

const backupStatusColor = (s: string): string =>
  ({ completed: C.green, in_progress: C.amber, failed: C.red, pending: C.textMuted }[s] ?? C.textMuted);

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
  const color = dangerWhenOn && checked ? C.red : checked ? C.green : C.textMuted;
  const Icon  = checked ? ToggleRight : ToggleLeft;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ ...body, fontSize: 12, color: C.text }}>{label}</span>
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
          <div style={{ width: 40, height: 40, border: '3px solid rgba(201,168,76,0.15)', borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: C.textMuted, ...body, fontSize: 13 }}>Loading system settings…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Field row (reused in forms) ── */
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ ...body, fontSize: 11.5, color: C.text }}>{label}</label>
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
    <div className="admin-page" style={pageWrap}>
      <style>{ADMIN_CSS}{`
        .ss-row:hover { border-color: rgba(200,145,40,0.15) !important; background: ${C.goldBg} !important; }
        .ss-btn:hover  { filter: brightness(1.1); transform: translateY(-1px); }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
      `}</style>
      <div style={pageInner}>

      <div style={adminHeaderStyle}>
        <div className="admin-header-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#fff' }}>
          <Settings size={22} />
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>Admin · System</div>
            <h1 style={{ ...body, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>System Settings</h1>
            <p style={{ color: C.textLight, ...body, fontSize: 14, margin: 0 }}>
              Configure system-wide settings and preferences.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab toggle ── */}
      <div style={{ ...card, padding: 4, marginBottom: 20, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(['general', 'security', 'notifications', 'backup', 'logs'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, minWidth: 80, padding: '8px 14px',
            backgroundColor: activeTab === tab ? C.gold : 'transparent',
            border: `1px solid ${activeTab === tab ? C.gold : 'rgba(201,168,76,0.15)'}`,
            color: activeTab === tab ? '#111' : C.textMuted,
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
          <h3 style={{ ...body, fontSize: 18, fontWeight: 500, color: C.text, margin: '0 0 22px' }}>General Settings</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20, marginBottom: 20 }}>
            <Field label="Site Name">
              <input type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} className="admin-input" style={inputCss} />
            </Field>
            <Field label="Contact Email">
              <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} className="admin-input" style={inputCss} />
            </Field>
            <Field label="Contact Phone">
              <input type="tel" value={settings.contactPhone} onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} className="admin-input" style={inputCss} />
            </Field>
            <Field label="Default User Role">
              <select value={settings.defaultUserRole} onChange={(e) => setSettings({ ...settings, defaultUserRole: e.target.value })} className="admin-input" style={selectCss}>
                <option value="tenant">Tenant</option>
                <option value="landlord">Landlord</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </div>

          <Field label="Site Description">
            <textarea value={settings.siteDescription} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} rows={3}
              style={{ ...inputCss, resize: 'vertical', lineHeight: 1.6 }} />
          </Field>

          <SaveBtn />
        </div>
      )}

      {/* ══ SECURITY ══ */}
      {activeTab === 'security' && settings && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <h3 style={{ ...body, fontSize: 18, fontWeight: 500, color: C.text, margin: '0 0 22px' }}>Security Settings</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20, marginBottom: 28 }}>
            <Field label="Max Login Attempts">
              <input type="number" value={settings.maxLoginAttempts} onChange={(e) => setSettings({ ...settings, maxLoginAttempts: +e.target.value })} className="admin-input" style={inputCss} />
            </Field>
            <Field label="Session Timeout (minutes)">
              <input type="number" value={settings.sessionTimeout} onChange={(e) => setSettings({ ...settings, sessionTimeout: +e.target.value })} className="admin-input" style={inputCss} />
            </Field>
            <Field label="Storage Quota (GB)">
              <input type="number" value={settings.storageQuota / 1e9} onChange={(e) => setSettings({ ...settings, storageQuota: +e.target.value * 1e9 })} className="admin-input" style={inputCss} />
            </Field>
            <Field label="Min Password Length">
              <input type="number" value={settings.passwordMinLength} onChange={(e) => setSettings({ ...settings, passwordMinLength: +e.target.value })} className="admin-input" style={inputCss} />
            </Field>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 22 }}>
            <div style={{ ...body, fontSize: 12, color: C.text, marginBottom: 16 }}>Password Requirements</div>
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
          <h3 style={{ ...body, fontSize: 18, fontWeight: 500, color: C.text, margin: '0 0 22px' }}>Notification &amp; System Toggles</h3>

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
                <select value={settings.backupFrequency} onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })} className="admin-input" style={{ ...selectCss, maxWidth: 260 }}>
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
            <h3 style={{ ...body, fontSize: 18, fontWeight: 500, color: C.text, margin: 0 }}>System Backups</h3>
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
                    <Database size={18} style={{ color: C.gold, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ ...body, fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.filename}
                      </p>
                      <p style={{ ...body, fontSize: 11, color: C.textMuted, margin: 0 }}>
                        {formatFileSize(b.size)} · {fmtDate(b.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    <span style={pill(sColor)}>{b.status.replace('_', ' ')}</span>
                    <button style={ghostBtn(C.gold)} className="ss-btn" onClick={() => handleDownloadBackup(b)}>
                      <Download size={13} /> Download
                    </button>
                    <button style={ghostBtn(C.red)} className="ss-btn" onClick={() => handleDeleteBackup(b.id)}>
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
            <h3 style={{ ...body, fontSize: 18, fontWeight: 500, color: C.text, margin: 0 }}>System Logs</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={logLevel} onChange={(e) => setLogLevel(e.target.value)}
                className="admin-input" style={{ ...selectCss, minWidth: 130 }}>
                <option value="all">All Levels</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 220 }}>
                <Search size={15} style={{ color: C.textMuted, flexShrink: 0 }} />
                <input type="text" placeholder="Search logs…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...inputCss, flex: 1 }} />
              </div>
            </div>
          </div>

          {filteredLogs.length === 0 && (
            <p style={{ ...body, fontSize: 13, color: C.textMuted, textAlign: 'center', padding: '40px 0', margin: 0 }}>
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
                    <p style={{ ...body, fontSize: 13, color: C.text, margin: '0 0 3px', lineHeight: 1.4 }}>{log.message}</p>
                    <p style={{ ...body, fontSize: 11, color: C.textMuted, margin: 0 }}>
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
    </div>
  );
};

export default SystemSettingsPage;