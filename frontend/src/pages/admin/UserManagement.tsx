import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, UserPlus, Edit, Trash2, CheckCircle,
  X, Mail, Phone, Ban, RefreshCw, ChevronDown, Shield,
  Home, Briefcase, Coffee, Building2, User, ChevronUp,
} from 'lucide-react';
import Api from '../../services/api';

/* ─── Design Tokens ─── */
const t = {
  navy900: '#0A0F1E',
  navy800: '#111827',
  navy750: '#141D2E',
  navy700: '#1A2540',
  navy600: '#1F2D4A',
  gold:    '#C89128',
  goldLt:  '#D4A843',
  goldDim: 'rgba(200,145,40,0.10)',
  goldBorder: 'rgba(200,145,40,0.20)',
  cream:   '#F0F2F5',
  creamDim:'#8A96A8',
  slate:   '#4A5568',
  green:   '#10b981',
  greenDim:'rgba(16,185,129,0.10)',
  red:     '#ef4444',
  redDim:  'rgba(239,68,68,0.10)',
  purple:  '#8b5cf6',
  purpleDim:'rgba(139,92,246,0.10)',
  blue:    '#3b82f6',
  blueDim: 'rgba(59,130,246,0.10)',
  amber:   '#f59e0b',
  amberDim:'rgba(245,158,11,0.10)',
} as const;

const font: React.CSSProperties = { fontFamily: "'Jost', sans-serif" };

const inp: React.CSSProperties = {
  ...font,
  width: '100%',
  padding: '10px 13px',
  background: t.navy700,
  border: `1px solid ${t.goldBorder}`,
  borderRadius: 8,
  color: t.cream,
  fontSize: 13,
  outline: 'none',
  transition: 'border-color .2s, box-shadow .2s',
};

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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', ...font, whiteSpace: 'nowrap' }}>
      {cfg.icon}{cfg.label}
    </span>
  );
};

const StatusDot = ({ status }: { status: string }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.inactive;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...font, fontSize: 12, fontWeight: 600, color: cfg.color }}>
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
  const base: React.CSSProperties = { ...font, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', outline: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s', opacity: disabled ? 0.6 : 1, ...s };
  if (variant === 'primary') return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, padding: '10px 20px', background: t.gold, color: t.navy900, borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: '.03em', boxShadow: `0 4px 16px ${t.goldDim}` }}>{children}</button>
  );
  if (variant === 'icon') return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, width: 30, height: 30, borderRadius: 7, background: color ? `${color}15` : t.goldDim, color: color ?? t.gold, border: `1px solid ${color ?? t.gold}25`, fontSize: 12 }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color ?? t.gold}28`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = color ? `${color}15` : t.goldDim; }}>
      {children}
    </button>
  );
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, padding: '9px 14px', background: t.goldDim, border: `1px solid ${t.goldBorder}`, color: t.gold, borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{children}</button>
  );
};

const Label: React.CSSProperties = { ...font, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: t.creamDim, display: 'block', marginBottom: 6 };
const FieldErr = ({ msg }: { msg?: string }) => msg ? <div style={{ ...font, fontSize: 11, color: t.red, marginTop: 4 }}>{msg}</div> : null;

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
    { label: 'Total Users', value: stats.total,           color: t.gold,   bg: t.goldDim   },
    { label: 'Active',      value: stats.active,           color: t.green,  bg: t.greenDim  },
    { label: 'Suspended',   value: stats.suspended,        color: t.red,    bg: t.redDim    },
    { label: 'Admins',      value: stats.admins,           color: t.purple, bg: t.purpleDim },
    { label: 'Agents',      value: stats.agents,           color: t.gold,   bg: t.goldDim   },
    { label: 'Landlords',   value: stats.landlords,        color: t.blue,   bg: t.blueDim   },
    { label: 'BNB Owners',  value: stats.bnb_owners  ?? 0, color: t.amber,  bg: t.amberDim  },
    { label: 'Tenants',     value: stats.tenants,          color: t.green,  bg: t.greenDim  },
    { label: 'New / Month', value: stats.newThisMonth,     color: t.cream,  bg: 'rgba(240,242,245,0.07)' },
  ] : [];

  const hasFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px 72px', background: t.navy900, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .um-inp:focus { border-color: ${t.gold} !important; box-shadow: 0 0 0 3px ${t.goldDim}; }
        .um-sel option { background: ${t.navy700}; color: ${t.cream}; }
        .tbl-row { border-bottom: 1px solid rgba(255,255,255,0.045); cursor: pointer; transition: background .12s; }
        .tbl-row:hover { background: rgba(200,145,40,0.04); }
        .tbl-row:last-child { border-bottom: none; }
        .cell { padding: 13px 14px; }
        .exp-row { background: rgba(200,145,40,0.03); border-bottom: 1px solid rgba(200,145,40,0.08); }
        .exp-inner { padding: 18px 20px 20px 72px; animation: fadeUp .18s ease; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.goldBorder}; border-radius: 4px; }
        @media (max-width: 960px)  { .hide-md { display:none !important; } }
        @media (max-width: 640px)  { .hide-sm { display:none !important; } .stat-grid { grid-template-columns: repeat(3,1fr) !important; } .header-row { flex-direction: column; align-items: flex-start !important; } .filter-row { flex-wrap: wrap !important; } }
      `}</style>

      {/* ── Header ── */}
      <div className="header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...font, fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: t.gold, background: t.goldDim, padding: '4px 12px', border: `1px solid ${t.goldBorder}`, borderRadius: 4, marginBottom: 12 }}>
            Admin Panel
          </div>
          <h1 style={{ ...font, fontWeight: 800, fontSize: 'clamp(20px,3vw,26px)', color: t.cream, letterSpacing: '-.02em', marginBottom: 5 }}>User Management</h1>
          <p style={{ ...font, fontSize: 13, color: t.creamDim }}>
            {stats
              ? `${stats.total} total users · ${stats.active} active · ${stats.newThisMonth} joined this month`
              : 'Manage platform users, roles, and access'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Btn onClick={loadUsers}><RefreshCw size={13} /> Refresh</Btn>
          <Btn onClick={openCreate} variant="primary"><UserPlus size={14} /> Add User</Btn>
        </div>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 10, marginBottom: 24 }}>
          {statCards.map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: t.navy800, border: `1px solid ${t.goldBorder}`, borderRadius: 10, padding: '14px 10px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.8 }} />
              <div style={{ ...font, fontWeight: 800, fontSize: 22, color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
              <div style={{ ...font, fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: t.creamDim }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ background: t.navy800, border: `1px solid ${t.goldBorder}`, borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
        <div className="filter-row" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.creamDim, pointerEvents: 'none' }} />
            <input type="text" placeholder="Search name, email, phone…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="um-inp" style={{ ...inp, paddingLeft: 36 }} />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="um-sel um-inp" style={{ ...inp, width: 'auto', minWidth: 130 }}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="landlord">Landlord</option>
            <option value="bnb_owner">BNB Owner</option>
            <option value="commercial">Commercial</option>
            <option value="tenant">Tenant</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="um-sel um-inp" style={{ ...inp, width: 'auto', minWidth: 130 }}>
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
      <div style={{ background: t.navy800, border: `1px solid ${t.goldBorder}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${t.gold}, ${t.goldLt} 60%, transparent)` }} />

        {/* Table toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid rgba(200,145,40,0.10)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Users size={15} color={t.gold} />
            <span style={{ ...font, fontWeight: 700, fontSize: 14, color: t.cream }}>Users</span>
          </div>
          <span style={{ ...font, fontSize: 11, color: t.creamDim, background: t.navy750, padding: '3px 10px', borderRadius: 20, border: `1px solid ${t.goldBorder}` }}>
            {users.length} result{users.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 34, height: 34, border: `3px solid ${t.goldBorder}`, borderTop: `3px solid ${t.gold}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            <span style={{ ...font, fontSize: 13, color: t.creamDim }}>Loading users…</span>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: t.goldDim, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Users size={22} color={t.gold} />
            </div>
            <div style={{ ...font, fontWeight: 700, fontSize: 14, color: t.cream, marginBottom: 5 }}>No users found</div>
            <div style={{ ...font, fontSize: 13, color: t.creamDim }}>Try adjusting your filters or add a new user.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 52 }} />
                <col style={{ width: '25%' }} />
                <col className="hide-sm" style={{ width: '22%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '11%' }} />
                <col className="hide-md" style={{ width: '10%' }} />
                <col className="hide-md" style={{ width: '12%' }} />
                <col style={{ width: 108 }} />
              </colgroup>

              <thead>
                <tr style={{ borderBottom: `1px solid rgba(200,145,40,0.10)` }}>
                  {['', 'User', 'Contact', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                    <th key={i}
                      className={i === 2 ? 'hide-sm' : i === 5 || i === 6 ? 'hide-md' : ''}
                      style={{ padding: '10px 14px', textAlign: i === 7 ? 'right' : 'left', ...font, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: t.creamDim }}>
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
                              <span style={{ ...font, fontWeight: 700, fontSize: 12, color: `hsl(${hue},65%,70%)`, letterSpacing: '.02em' }}>{initials(user)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Name + verification badges */}
                        <td>
                          <div className="cell">
                            <div style={{ ...font, fontWeight: 700, fontSize: 13, color: t.cream, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {`${user.firstName} ${user.lastName}`.trim() || '—'}
                            </div>
                            <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                              {user.emailVerified && (
                                <span style={{ ...font, fontSize: 9, fontWeight: 700, color: t.green, letterSpacing: '.06em' }}>✓ EMAIL</span>
                              )}
                              {user.phoneVerified && (
                                <span style={{ ...font, fontSize: 9, fontWeight: 700, color: t.green, letterSpacing: '.06em' }}>✓ PHONE</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="hide-sm">
                          <div className="cell">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...font, fontSize: 12, color: t.creamDim, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <Mail size={10} style={{ flexShrink: 0 }} />{user.email || '—'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...font, fontSize: 12, color: t.creamDim }}>
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
                        <td className="hide-md">
                          <div className="cell">
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div>
                                <div style={{ ...font, fontWeight: 700, fontSize: 15, color: t.gold, lineHeight: 1 }}>{user.propertiesCount}</div>
                                <div style={{ ...font, fontSize: 9, color: t.creamDim, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2 }}>props</div>
                              </div>
                              <div style={{ width: 1, background: t.goldBorder, alignSelf: 'stretch' }} />
                              <div>
                                <div style={{ ...font, fontWeight: 700, fontSize: 15, color: t.blue, lineHeight: 1 }}>{user.transactionsCount}</div>
                                <div style={{ ...font, fontSize: 9, color: t.creamDim, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2 }}>txns</div>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Joined */}
                        <td className="hide-md">
                          <div className="cell">
                            <div style={{ ...font, fontSize: 12, color: t.cream }}>{formatDate(user.registrationDate)}</div>
                            <div style={{ ...font, fontSize: 10, color: t.creamDim, marginTop: 2 }}>Login: {formatDate(user.lastLogin)}</div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="cell" style={{ display: 'flex', justifyContent: 'flex-end', gap: 5, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                            <Btn variant="icon" onClick={() => openEdit(user)} color={t.gold}><Edit size={13} /></Btn>
                            {user.status === 'active'
                              ? <Btn variant="icon" onClick={() => handleStatus(user.id, 'suspended')} color={t.red}><Ban size={13} /></Btn>
                              : <Btn variant="icon" onClick={() => handleStatus(user.id, 'active')} color={t.green}><CheckCircle size={13} /></Btn>}
                            <Btn variant="icon" onClick={() => handleDelete(user.id)} color={t.red}><Trash2 size={13} /></Btn>
                            <span style={{ color: t.creamDim, display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
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
                                  <div style={{ ...font, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: t.gold, marginBottom: 10 }}>Contact</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, ...font, fontSize: 12, color: t.creamDim }}><Mail size={11} color={t.gold} />{user.email}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, ...font, fontSize: 12, color: t.creamDim }}><Phone size={11} color={t.gold} />{user.phone || '—'}</div>
                                  </div>
                                </div>

                                {/* Activity */}
                                <div>
                                  <div style={{ ...font, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: t.gold, marginBottom: 10 }}>Activity</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {[
                                      ['Properties',   user.propertiesCount],
                                      ['Transactions', user.transactionsCount],
                                      ['Last Login',   formatDate(user.lastLogin)],
                                      ['Joined',       formatDate(user.registrationDate)],
                                    ].map(([label, val]) => (
                                      <div key={String(label)} style={{ ...font, fontSize: 12, color: t.creamDim }}>
                                        {label}: <span style={{ color: t.cream, fontWeight: 600 }}>{val}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Verification */}
                                <div>
                                  <div style={{ ...font, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: t.gold, marginBottom: 10 }}>Verification</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {[
                                      ['Email verified',   user.emailVerified],
                                      ['Phone verified',   user.phoneVerified],
                                      ['Profile complete', user.profileCompleted],
                                    ].map(([label, ok]) => (
                                      <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 7, ...font, fontSize: 12 }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: ok ? t.green : t.slate, flexShrink: 0, display: 'inline-block' }} />
                                        <span style={{ color: ok ? t.cream : t.creamDim }}>{label}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Notes */}
                                {user.notes && (
                                  <div>
                                    <div style={{ ...font, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: t.gold, marginBottom: 10 }}>Notes</div>
                                    <p style={{ ...font, fontSize: 12, color: t.creamDim, lineHeight: 1.6 }}>{user.notes}</p>
                                  </div>
                                )}

                                {/* Quick actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
                                  <button onClick={() => openEdit(user)} style={{ ...font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', background: t.goldDim, border: `1px solid ${t.goldBorder}`, color: t.gold, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                    <Edit size={12} /> Edit User
                                  </button>
                                  {user.status === 'active' ? (
                                    <button onClick={() => handleStatus(user.id, 'suspended')} style={{ ...font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', background: t.redDim, border: `1px solid ${t.red}28`, color: t.red, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                      <Ban size={12} /> Suspend
                                    </button>
                                  ) : (
                                    <button onClick={() => handleStatus(user.id, 'active')} style={{ ...font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', background: t.greenDim, border: `1px solid ${t.green}28`, color: t.green, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                      <CheckCircle size={12} /> Activate
                                    </button>
                                  )}
                                </div>
                              </div>

                              {userActivity && (
                                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${t.goldBorder}` }}>
                                  <div style={{ ...font, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: t.gold, marginBottom: 12 }}>
                                    Recent Activity Logs
                                  </div>
                                  {userActivity.activityLogs.length === 0 ? (
                                    <div style={{ ...font, fontSize: 12, color: t.creamDim }}>No activity logs for this user.</div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      {userActivity.activityLogs.slice(0, 5).map((log: any) => (
                                        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, ...font, fontSize: 12, color: t.creamDim, padding: '8px 10px', background: t.navy700, borderRadius: 8 }}>
                                          <div>
                                            <span style={{ color: t.gold, fontWeight: 700, marginRight: 8 }}>{log.action}</span>
                                            {log.description}
                                          </div>
                                          <span style={{ whiteSpace: 'nowrap', color: t.creamDim }}>{formatDate(log.created_at)}</span>
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,24,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ background: t.navy800, border: `1px solid ${t.goldBorder}`, borderRadius: 16, maxWidth: 540, width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '28px 24px', boxShadow: `0 40px 80px rgba(0,0,0,0.6)`, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${t.gold}, ${t.goldLt})`, borderRadius: '16px 16px 0 0' }} />

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'inline-block', ...font, fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: t.gold, background: t.goldDim, padding: '3px 10px', border: `1px solid ${t.goldBorder}`, borderRadius: 4, marginBottom: 10 }}>
                  {editMode ? 'Edit User' : 'New User'}
                </div>
                <h2 style={{ ...font, fontWeight: 800, fontSize: 19, color: t.cream }}>
                  {editMode ? `Edit ${selectedUser?.firstName ?? ''}` : 'Add New User'}
                </h2>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: `1px solid ${t.goldBorder}`, color: t.creamDim, cursor: 'pointer', display: 'flex', padding: 7, borderRadius: 8, transition: 'all .15s' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={Label}>First Name *</label>
                  <input type="text" value={formData.firstName} onChange={field('firstName')} className="um-inp" style={inp} placeholder="John" />
                  <FieldErr msg={formErrors.firstName} />
                </div>
                <div>
                  <label style={Label}>Last Name *</label>
                  <input type="text" value={formData.lastName} onChange={field('lastName')} className="um-inp" style={inp} placeholder="Doe" />
                  <FieldErr msg={formErrors.lastName} />
                </div>
              </div>

              {/* Contact row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={Label}>Email *</label>
                  <input type="email" value={formData.email} onChange={field('email')} className="um-inp" style={inp} placeholder="john@example.com" />
                  <FieldErr msg={formErrors.email} />
                </div>
                <div>
                  <label style={Label}>Phone *</label>
                  <input type="tel" value={formData.phone} onChange={field('phone')} className="um-inp" style={inp} placeholder="+255 712 345 678" />
                  <FieldErr msg={formErrors.phone} />
                </div>
              </div>

              {/* Role + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={Label}>Role</label>
                  <select value={formData.role} onChange={field('role')} className="um-sel um-inp" style={inp}>
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
                  <select value={formData.status} onChange={field('status')} className="um-sel um-inp" style={inp}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Role preview chip */}
              <div style={{ background: t.navy750, border: `1px solid ${t.goldBorder}`, borderRadius: 9, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: ROLE_CFG[formData.role]?.bg, border: `1px solid ${ROLE_CFG[formData.role]?.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ROLE_CFG[formData.role]?.color }}>
                  {ROLE_CFG[formData.role]?.icon}
                </div>
                <div>
                  <div style={{ ...font, fontSize: 10, color: t.creamDim }}>Selected role</div>
                  <div style={{ ...font, fontSize: 13, fontWeight: 700, color: ROLE_CFG[formData.role]?.color }}>{ROLE_CFG[formData.role]?.label}</div>
                </div>
              </div>

              {/* Password row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={Label}>Password {editMode ? '(leave blank to keep)' : '*'}</label>
                  <input type="password" value={formData.password} onChange={field('password')} className="um-inp" style={inp} placeholder={editMode ? '••••••••' : 'Min 8 chars'} />
                  <FieldErr msg={formErrors.password} />
                </div>
                <div>
                  <label style={Label}>Confirm {!editMode && '*'}</label>
                  <input type="password" value={formData.confirmPassword} onChange={field('confirmPassword')} className="um-inp" style={inp} placeholder="••••••••" />
                  <FieldErr msg={formErrors.confirmPassword} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={Label}>Notes (optional)</label>
                <textarea value={formData.notes} onChange={field('notes')} rows={3} className="um-inp" style={{ ...inp, resize: 'vertical' }} placeholder="Internal admin notes…" />
              </div>

              {/* Footer buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: `1px solid rgba(200,145,40,0.10)` }}>
                <button type="button" onClick={closeModal} style={{ ...font, padding: '10px 18px', background: 'transparent', border: `1px solid ${t.goldBorder}`, color: t.creamDim, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <Btn variant="primary" disabled={saving}>
                  {saving && <div style={{ width: 13, height: 13, border: `2px solid ${t.navy900}40`, borderTop: `2px solid ${t.navy900}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                  {saving ? 'Saving…' : editMode ? 'Update User' : 'Create User'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;