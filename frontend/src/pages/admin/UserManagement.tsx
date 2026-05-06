import { useState, useEffect } from 'react';
import {
  Users, Search, UserPlus, Edit, Trash2, CheckCircle,
  X, Mail, Phone, Ban, RefreshCw, ChevronDown, Shield,
  Home, Briefcase, Coffee, Building2, User,
} from 'lucide-react';
import Api from '../../services/api';

/* ─── TOKENS — unchanged ─── */
const t = {
  navy900: '#0F172A',
  navy800: '#162035',
  navy700: '#1E2D4A',
  gold:    '#C89128',
  goldLt:  '#D4A843',
  goldDim: 'rgba(200,145,40,0.12)',
  cream:   '#F8F8F9',
  slate:   '#94A3B8',
  border:  'rgba(200,145,40,0.18)',
  green:   '#10b981',
  red:     '#ef4444',
  purple:  '#8b5cf6',
  blue:    '#3b82f6',
  amber:   '#f59e0b',
} as const;

const body: React.CSSProperties  = { fontFamily: "'Jost', sans-serif" };
const serif: React.CSSProperties = { fontFamily: "'Jost', sans-serif", fontWeight: 700 };

const inp: React.CSSProperties = {
  ...body,
  width: '100%',
  padding: '10px 13px',
  background: t.navy700,
  border: `1px solid ${t.border}`,
  borderRadius: 8,
  color: t.cream,
  fontSize: 13,
  outline: 'none',
};

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  role: 'tenant' as 'admin' | 'agent' | 'landlord' | 'tenant' | 'bnb_owner' | 'commercial',
  status: 'active' as 'active' | 'inactive' | 'suspended',
  password: '', confirmPassword: '', notes: '',
};

interface User {
  id: number;
  firstName: string; lastName: string;
  email: string; phone: string;
  role: 'admin' | 'agent' | 'landlord' | 'tenant' | 'bnb_owner' | 'commercial';
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string; lastLogin: string;
  propertiesCount: number; transactionsCount: number;
  emailVerified: boolean; phoneVerified: boolean; profileCompleted: boolean;
  notes?: string;
}

interface UserStats {
  total: number; active: number; inactive: number; suspended: number;
  admins: number; agents: number; landlords: number; tenants: number;
  bnb_owners: number; commercial: number;
  newThisMonth: number;
}

type FormData = typeof EMPTY_FORM;

/* ─── Role config ─── */
const ROLE_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  admin:      { color: '#8b5cf6', icon: <Shield size={11} />,    label: 'Admin'      },
  agent:      { color: '#C89128', icon: <Briefcase size={11} />, label: 'Agent'      },
  landlord:   { color: '#3b82f6', icon: <Home size={11} />,      label: 'Landlord'   },
  bnb_owner:  { color: '#f59e0b', icon: <Coffee size={11} />,    label: 'BNB Owner'  },
  commercial: { color: '#D4A843', icon: <Building2 size={11} />, label: 'Commercial' },
  tenant:     { color: '#10b981', icon: <User size={11} />,      label: 'Tenant'     },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  active:    { color: '#10b981', label: 'Active'    },
  inactive:  { color: '#94A3B8', label: 'Inactive'  },
  suspended: { color: '#ef4444', label: 'Suspended' },
};

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const initials = (u: User) =>
  `${u.firstName?.charAt(0) ?? ''}${u.lastName?.charAt(0) ?? ''}`.toUpperCase();

/* ─── Avatar colour derived from name ─── */
const avatarHue = (u: User) => {
  const s = (u.firstName ?? '') + (u.lastName ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
};

/* ─── Small pill ─── */
const Pill = ({ label, color, icon }: { label: string; color: string; icon?: React.ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: `${color}18`, border: `1px solid ${color}35`, color, borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: "'Jost', sans-serif", whiteSpace: 'nowrap' }}>
    {icon}{label}
  </span>
);

/* ─── Icon button ─── */
const IconBtn = ({ color, onClick, title, children }: { color: string; onClick?: () => void; title?: string; children: React.ReactNode }) => (
  <button title={title} onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: `${color}15`, border: `1px solid ${color}28`, color, borderRadius: 7, fontSize: 12, cursor: 'pointer', flexShrink: 0, transition: 'all .15s' }}
    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}28`; }}
    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}15`; }}>
    {children}
  </button>
);

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
  const [formErrors,   setFormErrors]   = useState<Partial<FormData>>({});
  const [expandedRow,  setExpandedRow]  = useState<number | null>(null);

  useEffect(() => { loadUsers(); }, [searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (roleFilter !== 'all') filters.user_type = roleFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;
      const [usersRes, statsRes] = await Promise.all([
        Api.getUsers(filters), Api.getUserStats(),
      ]);
      // Map backend user_type to frontend role field
      const mappedUsers = (usersRes.data || []).map((user: any) => ({
        ...user,
        role: user.user_type || 'tenant', // Map user_type to role
        status: user.is_active ? 'active' : (user.user_type === 'admin' ? 'inactive' : 'suspended'),
        registrationDate: user.created_at,
        lastLogin: user.updated_at,
        propertiesCount: user.properties_count || 0,
        transactionsCount: user.transactions_count || 0,
        emailVerified: user.email_verified || false,
        phoneVerified: user.phone_verified || false,
        profileCompleted: user.profile_completed || false,
      }));
      setUsers(mappedUsers);
      setStats(statsRes.data || null);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!formData.firstName.trim()) e.firstName = 'Required';
    if (!formData.lastName.trim())  e.lastName  = 'Required';
    if (!formData.email.trim())     e.email     = 'Required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email';
    if (!formData.phone.trim())     e.phone     = 'Required';
    if (!editMode) {
      if (!formData.password)                e.password        = 'Required (min 8 chars)';
      else if (formData.password.length < 8) e.password        = 'Min 8 characters';
      if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setEditMode(false); setSelectedUser(null); setFormData(EMPTY_FORM); setFormErrors({}); setShowModal(true); };
  const openEdit   = (u: User) => {
    setEditMode(true); setSelectedUser(u);
    setFormData({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone, role: u.role, status: u.status, password: '', confirmPassword: '', notes: u.notes || '' });
    setFormErrors({}); setShowModal(true);
  };
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
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try { await Api.deleteUser(id); loadUsers(); } catch { alert('Delete failed'); }
  };

  const handleStatus = async (id: number, status: 'active' | 'suspended') => {
    try { await Api.updateUserStatus(id, status); loadUsers(); } catch { /* silent */ }
  };

  const f = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData(p => ({ ...p, [k]: e.target.value }));

  /* stat cards */
  const statCards = stats ? [
    { label: 'Total',     value: stats.total,        color: t.gold },
    { label: 'Active',    value: stats.active,        color: t.green },
    { label: 'Admins',    value: stats.admins,        color: t.purple },
    { label: 'Agents',    value: stats.agents,        color: t.gold },
    { label: 'Landlords', value: stats.landlords,     color: t.blue },
    { label: 'BNB Owners',value: stats.bnb_owners || 0, color: '#f59e0b' },
    { label: 'Commercial',value: stats.commercial || 0, color: '#D4A843' },
    { label: 'Tenants',   value: stats.tenants,       color: t.green },
    { label: 'New / Mo',  value: stats.newThisMonth,  color: t.amber },
  ] : [];

  /* table col widths */
  const COL = { avatar: 52, name: '22%', contact: '24%', role: '13%', status: '10%', stats: '12%', date: '11%', actions: 100 };

  const LabelStyle: React.CSSProperties = { ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.slate, display: 'block', marginBottom: 6 };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 20px 60px', background: t.navy900, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .um-input:focus { border-color: ${t.gold} !important; box-shadow: 0 0 0 2px ${t.goldDim}; }
        .um-select option { background: ${t.navy700}; color: ${t.cream}; }
        .tbl-row { border-bottom: 1px solid rgba(200,145,40,0.07); transition: background .15s; animation: fadeIn .2s ease; }
        .tbl-row:hover { background: rgba(200,145,40,0.05); }
        .tbl-row:last-child { border-bottom: none; }
        .tbl-row td { padding: 0; vertical-align: middle; }
        .cell { padding: 14px 12px; }
        .expand-row { background: rgba(200,145,40,0.04); border-bottom: 1px solid rgba(200,145,40,0.1); }
        .expand-row td { padding: 0; }
        .expand-inner { padding: 16px 20px 18px 76px; animation: fadeIn .18s ease; }
        .sort-th { cursor: pointer; user-select: none; }
        .sort-th:hover { color: ${t.gold} !important; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${t.navy900}; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 4px; }
        @media (max-width: 900px) {
          .hide-md { display: none !important; }
        }
        @media (max-width: 640px) {
          .hide-sm { display: none !important; }
          .um-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .um-header { flex-direction: column !important; align-items: flex-start !important; }
          .um-filters { flex-direction: column !important; }
          .um-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="um-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: t.gold, background: t.goldDim, padding: '4px 12px', border: `1px solid ${t.border}`, marginBottom: 10, fontFamily: "'Jost', sans-serif" }}>
            Admin Panel
          </div>
          <h1 style={{ ...serif, fontSize: 'clamp(20px,3vw,28px)', color: t.cream, margin: '0 0 4px' }}>User Management</h1>
          <p style={{ ...body, fontSize: 13, color: t.slate, margin: 0 }}>
            {stats ? `${stats.total} users · ${stats.active} active · ${stats.newThisMonth} joined this month` : 'Manage users and their roles'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={loadUsers} style={{ ...body, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: t.goldDim, border: `1px solid ${t.border}`, color: t.gold, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={openCreate} style={{ ...body, display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: t.gold, border: 'none', color: t.navy900, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', boxShadow: `0 4px 18px ${t.goldDim}` }}>
            <UserPlus size={15} /> Add User
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      {stats && (
        <div className="um-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: 10, marginBottom: 22 }}>
          {statCards.map(({ label, value, color }) => (
            <div key={label} style={{ background: t.navy800, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 12px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, borderRadius: '12px 12px 0 0' }} />
              <div style={{ ...serif, fontSize: 24, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
              <div style={{ ...body, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.slate }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ background: t.navy800, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
        <div className="um-filters" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.slate, pointerEvents: 'none' }} />
            <input type="text" placeholder="Search name, email, phone…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="um-input" style={{ ...inp, paddingLeft: 36 }} />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="um-select um-input" style={{ ...inp, width: 'auto', minWidth: 140 }}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="landlord">Landlord</option>
            <option value="bnb_owner">BNB Owner</option>
            <option value="commercial">Commercial</option>
            <option value="tenant">Tenant</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="um-select um-input" style={{ ...inp, width: 'auto', minWidth: 140 }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); }} style={{ ...body, display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', background: 'transparent', border: `1px solid ${t.border}`, color: t.slate, borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: t.navy800, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {/* gold top bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${t.gold}, ${t.goldLt})` }} />

        {/* Table header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={16} color={t.gold} />
            <span style={{ ...serif, fontSize: 15, color: t.cream }}>Users</span>
          </div>
          <span style={{ ...body, fontSize: 12, color: t.slate, background: t.navy700, padding: '3px 10px', borderRadius: 20, border: `1px solid ${t.border}` }}>
            {users.length} result{users.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '56px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${t.border}`, borderTop: `3px solid ${t.gold}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ ...body, fontSize: 13, color: t.slate }}>Loading users…</span>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: t.goldDim, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Users size={24} color={t.gold} />
            </div>
            <div style={{ ...body, fontSize: 15, fontWeight: 600, color: t.cream, marginBottom: 6 }}>No users found</div>
            <div style={{ ...body, fontSize: 13, color: t.slate }}>Try adjusting your filters or add a new user.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              {/* Column headers */}
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  <th style={{ width: COL.avatar, padding: '10px 12px' }} />
                  <th style={{ width: COL.name, padding: '10px 12px', textAlign: 'left', ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.slate }}>User</th>
                  <th className="hide-sm" style={{ width: COL.contact, padding: '10px 12px', textAlign: 'left', ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.slate }}>Contact</th>
                  <th style={{ width: COL.role, padding: '10px 12px', textAlign: 'left', ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.slate }}>Role</th>
                  <th style={{ width: COL.status, padding: '10px 12px', textAlign: 'left', ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.slate }}>Status</th>
                  <th className="hide-md" style={{ width: COL.stats, padding: '10px 12px', textAlign: 'center', ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.slate }}>Props / Txns</th>
                  <th className="hide-md" style={{ width: COL.date, padding: '10px 12px', textAlign: 'left', ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.slate }}>Joined</th>
                  <th style={{ width: COL.actions, padding: '10px 12px', textAlign: 'right', ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.slate }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map(user => {
                  const role   = ROLE_CONFIG[user.role]   || ROLE_CONFIG.tenant;
                  const status = STATUS_CONFIG[user.status] || STATUS_CONFIG.inactive;
                  const hue    = avatarHue(user);
                  const isOpen = expandedRow === user.id;

                  return (
                    <>
                      <tr key={user.id} className="tbl-row" onClick={() => setExpandedRow(isOpen ? null : user.id)} style={{ cursor: 'pointer' }}>
                        {/* Avatar */}
                        <td>
                          <div className="cell" style={{ paddingRight: 4 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: `hsl(${hue},55%,20%)`, border: `1.5px solid hsl(${hue},55%,35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ ...serif, fontSize: 13, color: `hsl(${hue},70%,72%)`, letterSpacing: '0.03em' }}>{initials(user)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Name */}
                        <td>
                          <div className="cell">
                            <div style={{ ...body, fontSize: 13, fontWeight: 700, color: t.cream, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {user.firstName || ''} {user.lastName || ''}
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                              {user.emailVerified && <span style={{ ...body, fontSize: 9, color: t.green, fontWeight: 700, letterSpacing: '0.06em' }}>✓ EMAIL</span>}
                              {user.phoneVerified && <span style={{ ...body, fontSize: 9, color: t.green, fontWeight: 700, letterSpacing: '0.06em' }}>✓ PHONE</span>}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="hide-sm">
                          <div className="cell">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 12, color: t.slate, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <Mail size={10} style={{ flexShrink: 0 }} />{user.email || '—'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 12, color: t.slate }}>
                              <Phone size={10} style={{ flexShrink: 0 }} />{user.phone || '—'}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td>
                          <div className="cell">
                            <Pill label={role.label} color={role.color} icon={role.icon} />
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <div className="cell">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: status.color, boxShadow: `0 0 6px ${status.color}80`, flexShrink: 0 }} />
                              <span style={{ ...body, fontSize: 12, color: status.color, fontWeight: 600 }}>{status.label}</span>
                            </div>
                          </div>
                        </td>

                        {/* Props / Txns */}
                        <td className="hide-md">
                          <div className="cell" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ ...serif, fontSize: 16, color: t.gold, lineHeight: 1 }}>{user.propertiesCount}</div>
                                <div style={{ ...body, fontSize: 9, color: t.slate, textTransform: 'uppercase', letterSpacing: '0.1em' }}>props</div>
                              </div>
                              <div style={{ width: 1, background: t.border, alignSelf: 'stretch' }} />
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ ...serif, fontSize: 16, color: t.blue, lineHeight: 1 }}>{user.transactionsCount}</div>
                                <div style={{ ...body, fontSize: 9, color: t.slate, textTransform: 'uppercase', letterSpacing: '0.1em' }}>txns</div>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Joined */}
                        <td className="hide-md">
                          <div className="cell">
                            <div style={{ ...body, fontSize: 12, color: t.cream }}>{formatDate(user.registrationDate)}</div>
                            <div style={{ ...body, fontSize: 10, color: t.slate, marginTop: 2 }}>Last: {formatDate(user.lastLogin)}</div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="cell" style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }} onClick={e => e.stopPropagation()}>
                            <IconBtn color={t.gold} onClick={() => openEdit(user)} title="Edit user">
                              <Edit size={13} />
                            </IconBtn>
                            {user.status === 'active' ? (
                              <IconBtn color={t.red} onClick={() => handleStatus(user.id, 'suspended')} title="Suspend user">
                                <Ban size={13} />
                              </IconBtn>
                            ) : (
                              <IconBtn color={t.green} onClick={() => handleStatus(user.id, 'active')} title="Activate user">
                                <CheckCircle size={13} />
                              </IconBtn>
                            )}
                            <IconBtn color={t.red} onClick={() => handleDelete(user.id)} title="Delete user">
                              <Trash2 size={13} />
                            </IconBtn>
                            <div style={{ width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ChevronDown size={13} color={t.slate} style={{ transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expanded detail row ── */}
                      {isOpen && (
                        <tr className="expand-row" key={`exp-${user.id}`}>
                          <td colSpan={8}>
                            <div className="expand-inner">
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                                {/* Contact details */}
                                <div>
                                  <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, marginBottom: 10 }}>Contact Details</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, ...body, fontSize: 12, color: t.slate }}>
                                      <Mail size={11} color={t.gold} />{user.email}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, ...body, fontSize: 12, color: t.slate }}>
                                      <Phone size={11} color={t.gold} />{user.phone || '—'}
                                    </div>
                                  </div>
                                </div>
                                {/* Activity */}
                                <div>
                                  <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, marginBottom: 10 }}>Activity</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <div style={{ ...body, fontSize: 12, color: t.slate }}>Properties: <span style={{ color: t.cream, fontWeight: 600 }}>{user.propertiesCount}</span></div>
                                    <div style={{ ...body, fontSize: 12, color: t.slate }}>Transactions: <span style={{ color: t.cream, fontWeight: 600 }}>{user.transactionsCount}</span></div>
                                    <div style={{ ...body, fontSize: 12, color: t.slate }}>Last login: <span style={{ color: t.cream, fontWeight: 600 }}>{formatDate(user.lastLogin)}</span></div>
                                    <div style={{ ...body, fontSize: 12, color: t.slate }}>Joined: <span style={{ color: t.cream, fontWeight: 600 }}>{formatDate(user.registrationDate)}</span></div>
                                  </div>
                                </div>
                                {/* Verification */}
                                <div>
                                  <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, marginBottom: 10 }}>Verification</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {[
                                      { label: 'Email verified',   ok: user.emailVerified },
                                      { label: 'Phone verified',   ok: user.phoneVerified },
                                      { label: 'Profile complete', ok: user.profileCompleted },
                                    ].map(({ label, ok }) => (
                                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, ...body, fontSize: 12 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: ok ? t.green : t.slate, flexShrink: 0 }} />
                                        <span style={{ color: ok ? t.cream : t.slate }}>{label}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* Notes */}
                                {user.notes && (
                                  <div>
                                    <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, marginBottom: 10 }}>Notes</div>
                                    <p style={{ ...body, fontSize: 12, color: t.slate, lineHeight: 1.6, margin: 0 }}>{user.notes}</p>
                                  </div>
                                )}
                                {/* Quick actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
                                  <button onClick={() => openEdit(user)} style={{ ...body, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', background: t.goldDim, border: `1px solid ${t.border}`, color: t.gold, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                    <Edit size={12} /> Edit User
                                  </button>
                                  {user.status === 'active' ? (
                                    <button onClick={() => handleStatus(user.id, 'suspended')} style={{ ...body, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: t.red, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                      <Ban size={12} /> Suspend
                                    </button>
                                  ) : (
                                    <button onClick={() => handleStatus(user.id, 'active')} style={{ ...body, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: t.green, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                      <CheckCircle size={12} /> Activate
                                    </button>
                                  )}
                                </div>
                              </div>
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,16,30,0.93)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ background: t.navy800, border: `1px solid ${t.border}`, borderRadius: 16, maxWidth: 540, width: '100%', maxHeight: '92vh', overflowY: 'auto', position: 'relative', padding: '28px 26px', boxShadow: `0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px ${t.border}` }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${t.gold}, ${t.goldLt})`, borderRadius: '16px 16px 0 0' }} />

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: t.gold, background: t.goldDim, padding: '3px 10px', border: `1px solid ${t.border}`, marginBottom: 8, fontFamily: "'Jost', sans-serif" }}>
                  {editMode ? 'Edit User' : 'New User'}
                </div>
                <h2 style={{ ...serif, fontSize: 20, color: t.cream, margin: 0 }}>
                  {editMode ? `Edit ${selectedUser?.firstName}` : 'Add New User'}
                </h2>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: `1px solid ${t.border}`, color: t.slate, cursor: 'pointer', display: 'flex', padding: 7, borderRadius: 8, transition: 'all .15s' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="um-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={LabelStyle}>First Name *</label>
                  <input type="text" value={formData.firstName} onChange={f('firstName')} className="um-input" style={inp} placeholder="John" />
                  {formErrors.firstName && <div style={{ ...body, fontSize: 11, color: t.red, marginTop: 4 }}>{formErrors.firstName}</div>}
                </div>
                <div>
                  <label style={LabelStyle}>Last Name *</label>
                  <input type="text" value={formData.lastName} onChange={f('lastName')} className="um-input" style={inp} placeholder="Doe" />
                  {formErrors.lastName && <div style={{ ...body, fontSize: 11, color: t.red, marginTop: 4 }}>{formErrors.lastName}</div>}
                </div>
              </div>

              <div className="um-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={LabelStyle}>Email *</label>
                  <input type="email" value={formData.email} onChange={f('email')} className="um-input" style={inp} placeholder="john@example.com" />
                  {formErrors.email && <div style={{ ...body, fontSize: 11, color: t.red, marginTop: 4 }}>{formErrors.email}</div>}
                </div>
                <div>
                  <label style={LabelStyle}>Phone *</label>
                  <input type="tel" value={formData.phone} onChange={f('phone')} className="um-input" style={inp} placeholder="+255 712 345 678" />
                  {formErrors.phone && <div style={{ ...body, fontSize: 11, color: t.red, marginTop: 4 }}>{formErrors.phone}</div>}
                </div>
              </div>

              <div className="um-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={LabelStyle}>Role</label>
                  <select value={formData.role} onChange={f('role')} className="um-select um-input" style={inp}>
                    <option value="tenant">Tenant</option>
                    <option value="landlord">Landlord</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                    <option value="bnb_owner">BNB Owner</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label style={LabelStyle}>Status</label>
                  <select value={formData.status} onChange={f('status')} className="um-select um-input" style={inp}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Role preview */}
              <div style={{ background: t.navy700, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ROLE_CONFIG[formData.role]?.color}18`, border: `1px solid ${ROLE_CONFIG[formData.role]?.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ROLE_CONFIG[formData.role]?.color }}>
                  {ROLE_CONFIG[formData.role]?.icon}
                </div>
                <div>
                  <div style={{ ...body, fontSize: 11, color: t.slate }}>Selected role</div>
                  <div style={{ ...body, fontSize: 13, fontWeight: 700, color: ROLE_CONFIG[formData.role]?.color }}>{ROLE_CONFIG[formData.role]?.label}</div>
                </div>
              </div>

              <div className="um-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={LabelStyle}>Password {editMode ? '(leave blank to keep)' : '*'}</label>
                  <input type="password" value={formData.password} onChange={f('password')} className="um-input" style={inp} placeholder={editMode ? '••••••••' : 'Min 8 chars'} />
                  {formErrors.password && <div style={{ ...body, fontSize: 11, color: t.red, marginTop: 4 }}>{formErrors.password}</div>}
                </div>
                <div>
                  <label style={LabelStyle}>Confirm {editMode ? '' : '*'}</label>
                  <input type="password" value={formData.confirmPassword} onChange={f('confirmPassword')} className="um-input" style={inp} placeholder="••••••••" />
                  {formErrors.confirmPassword && <div style={{ ...body, fontSize: 11, color: t.red, marginTop: 4 }}>{formErrors.confirmPassword}</div>}
                </div>
              </div>

              <div>
                <label style={LabelStyle}>Notes (optional)</label>
                <textarea value={formData.notes} onChange={f('notes')} rows={3} className="um-input" style={{ ...inp, resize: 'vertical' }} placeholder="Internal admin notes…" />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 6, borderTop: `1px solid ${t.border}` }}>
                <button type="button" onClick={closeModal} style={{ ...body, padding: '10px 20px', background: 'transparent', border: `1px solid ${t.border}`, color: t.slate, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ ...body, display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: t.gold, border: 'none', color: t.navy900, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: `0 4px 16px ${t.goldDim}` }}>
                  {saving && <div style={{ width: 14, height: 14, border: `2px solid ${t.navy900}40`, borderTop: `2px solid ${t.navy900}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                  {saving ? 'Saving…' : editMode ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;