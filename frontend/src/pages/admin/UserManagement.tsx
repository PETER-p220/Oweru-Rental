import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, UserPlus, Edit, Trash2, CheckCircle,
  X, Mail, Phone, Ban, RefreshCw, ChevronDown, Shield,
  Home, Briefcase, Coffee, Building2, User, ChevronUp,
} from 'lucide-react';
import Api from '../../services/api';
import {
  C, body, pageWrap, pageInner, card, inputCss, selectCss, labelCss,
  btnPrimary, btnGhost, statCard, ADMIN_CSS, adminHeaderStyle,
} from './adminTheme';

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  role: 'tenant' as 'admin' | 'agent' | 'landlord' | 'tenant' | 'bnb_owner' | 'commercial',
  status: 'active' as 'active' | 'inactive' | 'suspended',
  password: '', confirmPassword: '', notes: '',
};

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'agent' | 'landlord' | 'tenant' | 'bnb_owner' | 'commercial';
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string;
  lastLogin: string;
  propertiesCount: number;
  transactionsCount: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileCompleted: boolean;
  notes?: string;
}

interface UserStats {
  total: number; active: number; inactive: number; suspended: number;
  admins: number; agents: number; landlords: number; tenants: number;
  bnb_owners: number; commercial: number; newThisMonth: number;
}

type FormData = typeof EMPTY_FORM;

/* ─── Role / Status config ─── */
const ROLE_CFG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  admin:      { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: <Shield size={11} />,    label: 'Admin'      },
  agent:      { color: '#C89128', bg: 'rgba(200,145,40,0.12)',  icon: <Briefcase size={11} />, label: 'Agent'      },
  landlord:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: <Home size={11} />,      label: 'Landlord'   },
  bnb_owner:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: <Coffee size={11} />,    label: 'BNB Owner'  },
  commercial: { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: <Building2 size={11} />, label: 'Commercial' },
  tenant:     { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: <User size={11} />,      label: 'Tenant'     },
};

const STATUS_CFG: Record<string, { color: string; dot: string; label: string }> = {
  active:    { color: '#10b981', dot: '#10b981', label: 'Active'    },
  inactive:  { color: '#94A3B8', dot: '#4A5568', label: 'Inactive'  },
  suspended: { color: '#ef4444', dot: '#ef4444', label: 'Suspended' },
};

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const initials = (u: User) =>
  `${u.firstName?.charAt(0) ?? ''}${u.lastName?.charAt(0) ?? ''}`.toUpperCase();

const avatarHue = (u: User) => {
  const s = (u.firstName ?? '') + (u.lastName ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
};

/* ─── Sub-components ─── */
const RoleBadge = ({ role }: { role: string }) => {
  const cfg = ROLE_CFG[role] || ROLE_CFG.tenant;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', ...body, whiteSpace: 'nowrap' }}>
      {cfg.icon}{cfg.label}
    </span>
  );
};

const StatusDot = ({ status }: { status: string }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.inactive;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...body, fontSize: 12, fontWeight: 600, color: cfg.color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}88`, flexShrink: 0, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
};

const Btn = ({
  children, onClick, variant = 'ghost', disabled, color, style: s,
}: {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'icon'; disabled?: boolean;
  color?: string; style?: React.CSSProperties;
}) => {
  const base: React.CSSProperties = { ...body, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', outline: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s', opacity: disabled ? 0.6 : 1, ...s };
  if (variant === 'primary') return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...btnPrimary, color: '#fff' }}>{children}</button>
  );
  if (variant === 'icon') return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, width: 30, height: 30, borderRadius: 7, background: color ? `${color}15` : C.goldBg, color: color ?? C.gold, border: `1px solid ${color ?? C.gold}25`, fontSize: 12 }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color ?? C.gold}28`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = color ? `${color}15` : C.goldBg; }}>
      {children}
    </button>
  );
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, padding: '9px 14px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.gold, borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{children}</button>
  );
};

const Label: React.CSSProperties = { ...body, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.textMuted, display: 'block', marginBottom: 6 };
const FieldErr = ({ msg }: { msg?: string }) => msg ? <div style={{ ...body, fontSize: 11, color: C.red, marginTop: 4 }}>{msg}</div> : null;

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const UserManagement = () => {
  const [users,        setUsers]        = useState<User[]>([]);
  const [stats,        setStats]        = useState<UserStats | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [roleFilter,   setRoleFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal,    setShowModal]    = useState(false);
  const [editMode,     setEditMode]     = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData,     setFormData]     = useState<FormData>(EMPTY_FORM);
  const [formErrors,   setFormErrors]   = useState<Partial<Record<keyof FormData, string>>>({});
  const [expandedRow,  setExpandedRow]  = useState<number | null>(null);
  const [activityByUser, setActivityByUser] = useState<Record<number, { sessions: any[]; activityLogs: any[] }>>({});

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (searchTerm) filters.search = searchTerm;
      if (roleFilter !== 'all') filters.user_type = roleFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;

      const [usersRes, statsRes] = await Promise.all([
        Api.getUsers(filters),
        Api.getUserStats(),
      ]);

      const mapped = (usersRes.data || []).map((u: any): User => ({
        id: u.id,
        firstName: u.first_name ?? '',
        lastName:  u.last_name  ?? '',
        email:     u.email      ?? '',
        phone:     u.phone      ?? '',
        role:      u.user_type  ?? 'tenant',
        status:    u.is_active  ? 'active' : 'inactive',
        registrationDate: u.created_at  ?? '',
        lastLogin:        u.updated_at  ?? '',
        propertiesCount:  u.properties_count   ?? 0,
        transactionsCount:u.transactions_count ?? 0,
        emailVerified:    u.email_verified   ?? false,
        phoneVerified:    u.phone_verified   ?? false,
        profileCompleted: u.profile_completed ?? false,
        notes: u.notes ?? '',
      }));

      setUsers(mapped);
      setStats(statsRes.data || null);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  /* ─── Validation ─── */
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!formData.firstName.trim()) e.firstName = 'Required';
    if (!formData.lastName.trim())  e.lastName  = 'Required';
    if (!formData.email.trim())     e.email     = 'Required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email';
    if (!formData.phone.trim())     e.phone     = 'Required';
    if (!editMode) {
      if (!formData.password || formData.password.length < 8) e.password = 'Min 8 characters';
      if (formData.password !== formData.confirmPassword)     e.confirmPassword = 'Passwords do not match';
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setEditMode(false); setSelectedUser(null); setFormData(EMPTY_FORM); setFormErrors({}); setShowModal(true); };
  const openEdit   = (u: User) => { setEditMode(true); setSelectedUser(u); setFormData({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone, role: u.role, status: u.status, password: '', confirmPassword: '', notes: u.notes || '' }); setFormErrors({}); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setSelectedUser(null); setFormData(EMPTY_FORM); setFormErrors({}); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { first_name: formData.firstName, last_name: formData.lastName, email: formData.email, phone: formData.phone, user_type: formData.role, status: formData.status, notes: formData.notes };
      if (editMode && selectedUser) {
        await Api.updateUser(selectedUser.id, { ...payload, ...(formData.password && { password: formData.password }) });
      } else {
        await Api.createUser({ ...payload, password: formData.password });
      }
      closeModal(); loadUsers();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try { await Api.deleteUser(id); loadUsers(); } catch { alert('Delete failed'); }
  };

  const loadUserActivity = async (userId: number) => {
    if (activityByUser[userId]) return;

    try {
      const response = await Api.getUserActivity(userId);
      setActivityByUser(prev => ({
        ...prev,
        [userId]: {
          sessions: response.data?.sessions || [],
          activityLogs: response.data?.activity_logs || response.data?.activityLogs || [],
        },
      }));
    } catch {
      setActivityByUser(prev => ({ ...prev, [userId]: { sessions: [], activityLogs: [] } }));
    }
  };

  const toggleRow = (userId: number) => {
    const nextOpen = expandedRow !== userId;
    setExpandedRow(nextOpen ? userId : null);
    if (nextOpen) {
      loadUserActivity(userId);
    }
  };

  const handleStatus = async (id: number, status: 'active' | 'suspended') => {
    try { await Api.updateUserStatus(id, status); loadUsers(); } catch { /* silent */ }
  };

  const field = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData(p => ({ ...p, [k]: e.target.value }));

  /* ─── Stat cards ─── */
  const statCards = stats ? [
    { label: 'Total Users', value: stats.total,           color: C.gold,   bg: C.goldBg   },
    { label: 'Active',      value: stats.active,           color: C.green,  bg: C.greenBg  },
    { label: 'Suspended',   value: stats.suspended,        color: C.red,    bg: C.redBg    },
    { label: 'Admins',      value: stats.admins,           color: C.purple, bg: C.purpleBg },
    { label: 'Agents',      value: stats.agents,           color: C.gold,   bg: C.goldBg   },
    { label: 'Landlords',   value: stats.landlords,        color: C.blue,   bg: C.blueBg   },
    { label: 'BNB Owners',  value: stats.bnb_owners  ?? 0, color: C.amber,  bg: C.amberBg  },
    { label: 'Tenants',     value: stats.tenants,          color: C.green,  bg: C.greenBg  },
    { label: 'New / Month', value: stats.newThisMonth,     color: C.text,  bg: 'rgba(240,242,245,0.07)' },
  ] : [];

  const hasFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="admin-page" style={pageWrap}>
      <style>{ADMIN_CSS}{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .tbl-row { border-bottom: 1px solid ${C.border}; cursor: pointer; transition: background .12s; }
        .tbl-row:hover { background: ${C.goldBg}; }
        .tbl-row:last-child { border-bottom: none; }
        .cell { padding: 13px 14px; }
        .exp-row { background: ${C.goldBg}; border-bottom: 1px solid ${C.goldBorder}; }
        .exp-inner { padding: 18px 20px 20px 72px; animation: fadeUp .18s ease; }
        @media (max-width: 960px)  { .admin-hide-mobile { display:none !important; } }
      `}</style>
      <div style={pageInner}>

      {/* ── Header ── */}
      <div style={adminHeaderStyle}>
        <div className="admin-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, color: '#fff' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>
              Admin · Users
            </div>
            <h1 style={{ ...body, fontWeight: 800, fontSize: 'clamp(20px,3vw,26px)', color: '#fff', letterSpacing: '-.02em', marginBottom: 5 }}>User Management</h1>
            <p style={{ ...body, fontSize: 14, color: C.textLight }}>
              {stats
                ? `${stats.total} total users · ${stats.active} active · ${stats.newThisMonth} joined this month`
                : 'Manage platform users, roles, and access'}
            </p>
          </div>
          <div className="admin-header-actions" style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <Btn onClick={loadUsers}><RefreshCw size={13} /> Refresh</Btn>
            <Btn onClick={openCreate} variant="primary"><UserPlus size={14} /> Add User</Btn>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="admin-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 24 }}>
          {statCards.map(({ label, value, color }) => (
            <div key={label} style={{ ...statCard, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.8 }} />
              <div style={{ ...body, fontWeight: 800, fontSize: 22, color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
              <div style={{ ...body, fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.textMuted }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ ...card, padding: '12px 14px', marginBottom: 14 }}>
        <div className="admin-grid-3" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
            <input type="text" placeholder="Search name, email, phone…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="admin-input" style={{ ...inputCss, paddingLeft: 36 }} />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="admin-input" style={selectCss}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="landlord">Landlord</option>
            <option value="bnb_owner">BNB Owner</option>
            <option value="commercial">Commercial</option>
            <option value="tenant">Tenant</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-input" style={selectCss}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          {hasFilters && (
            <Btn onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); }}>
              <X size={12} /> Clear
            </Btn>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>

        {/* Table toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid rgba(200,145,40,0.10)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Users size={15} color={C.gold} />
            <span style={{ ...body, fontWeight: 700, fontSize: 14, color: C.text }}>Users</span>
          </div>
          <span style={{ ...body, fontSize: 11, color: C.textMuted, background: C.slate100, padding: '3px 10px', borderRadius: 20, border: `1px solid ${C.goldBorder}` }}>
            {users.length} result{users.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 34, height: 34, border: `3px solid ${C.goldBorder}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            <span style={{ ...body, fontSize: 13, color: C.textMuted }}>Loading users…</span>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: C.goldBg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Users size={22} color={C.gold} />
            </div>
            <div style={{ ...body, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 5 }}>No users found</div>
            <div style={{ ...body, fontSize: 13, color: C.textMuted }}>Try adjusting your filters or add a new user.</div>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 52 }} />
                <col style={{ width: '25%' }} />
                <col className="admin-hide-mobile" style={{ width: '22%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '11%' }} />
                <col className="admin-hide-mobile" style={{ width: '10%' }} />
                <col className="admin-hide-mobile" style={{ width: '12%' }} />
                <col style={{ width: 108 }} />
              </colgroup>

              <thead>
                <tr style={{ borderBottom: `1px solid rgba(200,145,40,0.10)` }}>
                  {['', 'User', 'Contact', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                    <th key={i}
                      className={i === 2 ? 'hide-sm' : i === 5 || i === 6 ? 'hide-md' : ''}
                      style={{ padding: '10px 14px', textAlign: i === 7 ? 'right' : 'left', ...body, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.textMuted }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {users.map(user => {
                  const hue    = avatarHue(user);
                  const isOpen = expandedRow === user.id;
                  const userActivity = activityByUser[user.id];

                  return (
                    <>
                      <tr key={user.id} className="tbl-row" onClick={() => toggleRow(user.id)}>

                        {/* Avatar */}
                        <td>
                          <div className="cell" style={{ paddingRight: 6 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: `hsl(${hue},45%,18%)`, border: `1.5px solid hsl(${hue},50%,32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ ...body, fontWeight: 700, fontSize: 12, color: `hsl(${hue},65%,70%)`, letterSpacing: '.02em' }}>{initials(user)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Name + verification badges */}
                        <td>
                          <div className="cell">
                            <div style={{ ...body, fontWeight: 700, fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {`${user.firstName} ${user.lastName}`.trim() || '—'}
                            </div>
                            <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                              {user.emailVerified && (
                                <span style={{ ...body, fontSize: 9, fontWeight: 700, color: C.green, letterSpacing: '.06em' }}>✓ EMAIL</span>
                              )}
                              {user.phoneVerified && (
                                <span style={{ ...body, fontSize: 9, fontWeight: 700, color: C.green, letterSpacing: '.06em' }}>✓ PHONE</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="admin-hide-mobile">
                          <div className="cell">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 12, color: C.textMuted, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <Mail size={10} style={{ flexShrink: 0 }} />{user.email || '—'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 12, color: C.textMuted }}>
                              <Phone size={10} style={{ flexShrink: 0 }} />{user.phone || '—'}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td>
                          <div className="cell"><RoleBadge role={user.role} /></div>
                        </td>

                        {/* Status */}
                        <td>
                          <div className="cell"><StatusDot status={user.status} /></div>
                        </td>

                        {/* Activity */}
                        <td className="admin-hide-mobile">
                          <div className="cell">
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div>
                                <div style={{ ...body, fontWeight: 700, fontSize: 15, color: C.gold, lineHeight: 1 }}>{user.propertiesCount}</div>
                                <div style={{ ...body, fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2 }}>props</div>
                              </div>
                              <div style={{ width: 1, background: C.goldBorder, alignSelf: 'stretch' }} />
                              <div>
                                <div style={{ ...body, fontWeight: 700, fontSize: 15, color: C.blue, lineHeight: 1 }}>{user.transactionsCount}</div>
                                <div style={{ ...body, fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2 }}>txns</div>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Joined */}
                        <td className="admin-hide-mobile">
                          <div className="cell">
                            <div style={{ ...body, fontSize: 12, color: C.text }}>{formatDate(user.registrationDate)}</div>
                            <div style={{ ...body, fontSize: 10, color: C.textMuted, marginTop: 2 }}>Login: {formatDate(user.lastLogin)}</div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="cell" style={{ display: 'flex', justifyContent: 'flex-end', gap: 5, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                            <Btn variant="icon" onClick={() => openEdit(user)} color={C.gold}><Edit size={13} /></Btn>
                            {user.status === 'active'
                              ? <Btn variant="icon" onClick={() => handleStatus(user.id, 'suspended')} color={C.red}><Ban size={13} /></Btn>
                              : <Btn variant="icon" onClick={() => handleStatus(user.id, 'active')} color={C.green}><CheckCircle size={13} /></Btn>}
                            <Btn variant="icon" onClick={() => handleDelete(user.id)} color={C.red}><Trash2 size={13} /></Btn>
                            <span style={{ color: C.textMuted, display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
                              {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expanded Row ── */}
                      {isOpen && (
                        <tr className="exp-row" key={`exp-${user.id}`}>
                          <td colSpan={8}>
                            <div className="exp-inner">
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 20 }}>

                                {/* Contact Details */}
                                <div>
                                  <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 10 }}>Contact</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, ...body, fontSize: 12, color: C.textMuted }}><Mail size={11} color={C.gold} />{user.email}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, ...body, fontSize: 12, color: C.textMuted }}><Phone size={11} color={C.gold} />{user.phone || '—'}</div>
                                  </div>
                                </div>

                                {/* Activity */}
                                <div>
                                  <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 10 }}>Activity</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {[
                                      ['Properties',   user.propertiesCount],
                                      ['Transactions', user.transactionsCount],
                                      ['Last Login',   formatDate(user.lastLogin)],
                                      ['Joined',       formatDate(user.registrationDate)],
                                    ].map(([label, val]) => (
                                      <div key={String(label)} style={{ ...body, fontSize: 12, color: C.textMuted }}>
                                        {label}: <span style={{ color: C.text, fontWeight: 600 }}>{val}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Verification */}
                                <div>
                                  <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 10 }}>Verification</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {[
                                      ['Email verified',   user.emailVerified],
                                      ['Phone verified',   user.phoneVerified],
                                      ['Profile complete', user.profileCompleted],
                                    ].map(([label, ok]) => (
                                      <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 7, ...body, fontSize: 12 }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: ok ? C.green : C.textMuted, flexShrink: 0, display: 'inline-block' }} />
                                        <span style={{ color: ok ? C.text : C.textMuted }}>{label}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Notes */}
                                {user.notes && (
                                  <div>
                                    <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 10 }}>Notes</div>
                                    <p style={{ ...body, fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>{user.notes}</p>
                                  </div>
                                )}

                                {/* Quick actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
                                  <button onClick={() => openEdit(user)} style={{ ...body, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.gold, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                    <Edit size={12} /> Edit User
                                  </button>
                                  {user.status === 'active' ? (
                                    <button onClick={() => handleStatus(user.id, 'suspended')} style={{ ...body, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', background: C.redBg, border: `1px solid ${C.red}28`, color: C.red, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                      <Ban size={12} /> Suspend
                                    </button>
                                  ) : (
                                    <button onClick={() => handleStatus(user.id, 'active')} style={{ ...body, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', background: C.greenBg, border: `1px solid ${C.green}28`, color: C.green, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                      <CheckCircle size={12} /> Activate
                                    </button>
                                  )}
                                </div>
                              </div>

                              {userActivity && (
                                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.goldBorder}` }}>
                                  <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>
                                    Recent Activity Logs
                                  </div>
                                  {userActivity.activityLogs.length === 0 ? (
                                    <div style={{ ...body, fontSize: 12, color: C.textMuted }}>No activity logs for this user.</div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      {userActivity.activityLogs.slice(0, 5).map((log: any) => (
                                        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, ...body, fontSize: 12, color: C.textMuted, padding: '8px 10px', background: C.slate100, borderRadius: 8 }}>
                                          <div>
                                            <span style={{ color: C.gold, fontWeight: 700, marginRight: 8 }}>{log.action}</span>
                                            {log.description}
                                          </div>
                                          <span style={{ whiteSpace: 'nowrap', color: C.textMuted }}>{formatDate(log.created_at)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="admin-modal" style={{ ...card, maxWidth: 540, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'inline-block', ...body, fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: C.gold, background: C.goldBg, padding: '3px 10px', border: `1px solid ${C.goldBorder}`, borderRadius: 4, marginBottom: 10 }}>
                  {editMode ? 'Edit User' : 'New User'}
                </div>
                <h2 style={{ ...body, fontWeight: 800, fontSize: 19, color: C.text }}>
                  {editMode ? `Edit ${selectedUser?.firstName ?? ''}` : 'Add New User'}
                </h2>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: `1px solid ${C.goldBorder}`, color: C.textMuted, cursor: 'pointer', display: 'flex', padding: 7, borderRadius: 8, transition: 'all .15s' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={Label}>First Name *</label>
                  <input type="text" value={formData.firstName} onChange={field('firstName')} className="admin-input" style={inputCss} placeholder="John" />
                  <FieldErr msg={formErrors.firstName} />
                </div>
                <div>
                  <label style={Label}>Last Name *</label>
                  <input type="text" value={formData.lastName} onChange={field('lastName')} className="admin-input" style={inputCss} placeholder="Doe" />
                  <FieldErr msg={formErrors.lastName} />
                </div>
              </div>

              {/* Contact row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={Label}>Email *</label>
                  <input type="email" value={formData.email} onChange={field('email')} className="admin-input" style={inputCss} placeholder="john@example.com" />
                  <FieldErr msg={formErrors.email} />
                </div>
                <div>
                  <label style={Label}>Phone *</label>
                  <input type="tel" value={formData.phone} onChange={field('phone')} className="admin-input" style={inputCss} placeholder="+255 712 345 678" />
                  <FieldErr msg={formErrors.phone} />
                </div>
              </div>

              {/* Role + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={Label}>Role</label>
                  <select value={formData.role} onChange={field('role')} className="admin-input" style={inputCss}>
                    <option value="tenant">Tenant</option>
                    <option value="landlord">Landlord</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                    <option value="bnb_owner">BNB Owner</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label style={Label}>Status</label>
                  <select value={formData.status} onChange={field('status')} className="admin-input" style={inputCss}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Role preview chip */}
              <div style={{ background: C.slate100, border: `1px solid ${C.goldBorder}`, borderRadius: 9, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: ROLE_CFG[formData.role]?.bg, border: `1px solid ${ROLE_CFG[formData.role]?.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ROLE_CFG[formData.role]?.color }}>
                  {ROLE_CFG[formData.role]?.icon}
                </div>
                <div>
                  <div style={{ ...body, fontSize: 10, color: C.textMuted }}>Selected role</div>
                  <div style={{ ...body, fontSize: 13, fontWeight: 700, color: ROLE_CFG[formData.role]?.color }}>{ROLE_CFG[formData.role]?.label}</div>
                </div>
              </div>

              {/* Password row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={Label}>Password {editMode ? '(leave blank to keep)' : '*'}</label>
                  <input type="password" value={formData.password} onChange={field('password')} className="admin-input" style={inputCss} placeholder={editMode ? '••••••••' : 'Min 8 chars'} />
                  <FieldErr msg={formErrors.password} />
                </div>
                <div>
                  <label style={Label}>Confirm {!editMode && '*'}</label>
                  <input type="password" value={formData.confirmPassword} onChange={field('confirmPassword')} className="admin-input" style={inputCss} placeholder="••••••••" />
                  <FieldErr msg={formErrors.confirmPassword} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={Label}>Notes (optional)</label>
                <textarea value={formData.notes} onChange={field('notes')} rows={3} className="admin-input" style={{ ...inputCss, resize: 'vertical' }} placeholder="Internal admin notes…" />
              </div>

              {/* Footer buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: `1px solid rgba(200,145,40,0.10)` }}>
                <button type="button" onClick={closeModal} style={{ ...body, padding: '10px 18px', background: 'transparent', border: `1px solid ${C.goldBorder}`, color: C.textMuted, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <Btn variant="primary" disabled={saving}>
                  {saving && <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'admin-spin 0.8s linear infinite' }} />}
                  {saving ? 'Saving…' : editMode ? 'Update User' : 'Create User'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default UserManagement;