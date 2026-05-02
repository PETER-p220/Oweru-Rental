import { useState, useEffect } from 'react';
import {
  Users, Search, UserPlus, Edit, Trash2, CheckCircle,
  X, Mail, Phone, Ban, RefreshCw,
} from 'lucide-react';
import Api from '../../services/api';

/* ─── TOKENS — matches Home page exactly ─── */
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

const card: React.CSSProperties = {
  background:   t.navy800,
  border:       `1px solid ${t.border}`,
  borderRadius: 12,
  padding:      20,
};

/* Shared input style */
const inp: React.CSSProperties = {
  ...body,
  width: '100%',
  padding: '10px 13px',
  background: t.navy700,
  border: `1px solid ${t.border}`,
  borderRadius: 6,
  color: t.cream,
  fontSize: 13,
  outline: 'none',
};

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  role: 'tenant' as 'admin' | 'agent' | 'landlord' | 'tenant', 
  status: 'active' as 'active' | 'inactive' | 'suspended',
  password: '', confirmPassword: '', notes: '',
};

interface User {
  id: number;
  firstName: string; lastName: string;
  email: string; phone: string;
  role: 'admin' | 'agent' | 'landlord' | 'tenant';
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string; lastLogin: string;
  propertiesCount: number; transactionsCount: number;
  emailVerified: boolean; phoneVerified: boolean; profileCompleted: boolean;
  notes?: string;
}

interface UserStats {
  total: number; active: number; inactive: number; suspended: number;
  admins: number; agents: number; landlords: number; tenants: number;
  newThisMonth: number;
}

type FormData = typeof EMPTY_FORM;

const roleColor = (r: string) =>
  r === 'admin' ? t.purple : r === 'agent' ? t.gold : r === 'landlord' ? t.blue : t.green;

const statusColor = (s: string) =>
  s === 'active' ? t.green : s === 'suspended' ? t.red : t.slate;

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

/* ─── Pill badge ─── */
const Pill = ({ label, color }: { label: string; color: string }) => (
  <span style={{ ...body, display: 'inline-flex', alignItems: 'center', padding: '3px 9px', background: `${color}18`, border: `1px solid ${color}30`, color, borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
    {label}
  </span>
);

/* ─── Action button ─── */
const Btn = ({ color, onClick, children, full }: { color: string; onClick?: () => void; children: React.ReactNode; full?: boolean }) => (
  <button onClick={onClick} style={{ ...body, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', background: `${color}15`, border: `1px solid ${color}28`, color, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .18s', width: full ? '100%' : undefined, letterSpacing: '0.04em' }}>
    {children}
  </button>
);

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const UserManagement = () => {
  const [users,           setUsers]           = useState<User[]>([]);
  const [stats,           setStats]           = useState<UserStats | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [searchTerm,      setSearchTerm]      = useState('');
  const [roleFilter,      setRoleFilter]      = useState('all');
  const [statusFilter,    setStatusFilter]    = useState('all');
  const [showModal,       setShowModal]       = useState(false);
  const [editMode,        setEditMode]        = useState(false);
  const [selectedUser,    setSelectedUser]    = useState<User | null>(null);
  const [formData,        setFormData]        = useState<FormData>(EMPTY_FORM);
  const [formErrors,      setFormErrors]      = useState<Partial<FormData>>({});

  useEffect(() => { loadUsers(); }, [searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (roleFilter !== 'all') filters.user_type = roleFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;
      const [usersRes, statsRes] = await Promise.all([
        Api.getUsers(filters),
        Api.getUserStats(),
      ]);
      setUsers(usersRes.data || []);
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
      if (!formData.password)               e.password        = 'Required (min 8 chars)';
      else if (formData.password.length < 8) e.password       = 'Min 8 characters';
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
      closeModal();
      loadUsers();
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

  /* ── STAT CARDS config ── */
  const statCards = stats ? [
    { label: 'Total Users',    value: stats.total,        color: t.gold   },
    { label: 'Active',         value: stats.active,       color: t.green  },
    { label: 'Admins',         value: stats.admins,       color: t.purple },
    { label: 'Agents',         value: stats.agents,       color: t.gold   },
    { label: 'Landlords',      value: stats.landlords,    color: t.blue   },
    { label: 'Tenants',        value: stats.tenants,      color: t.green  },
    { label: 'New This Month', value: stats.newThisMonth, color: t.amber  },
  ] : [];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 16px 60px', background: t.navy900, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        :root {
          --navy-900:#0F172A; --navy-800:#162035; --navy-700:#1E2D4A;
          --gold:#C89128; --gold-dim:rgba(200,145,40,0.12);
          --cream:#F8F8F9; --slate:#94A3B8; --border:rgba(200,145,40,0.18);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:.9} }
        .um-btn { transition: filter .15s, transform .15s; }
        .um-btn:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .um-btn:active { transform: scale(.97); }
        .um-row { transition: background .18s; border-bottom: 1px solid rgba(200,145,40,0.08); }
        .um-row:hover { background: var(--gold-dim); }
        .um-row:last-child { border-bottom: none; }
        .um-input:focus { border-color: var(--gold) !important; }
        .um-select option { background: #1E2D4A; color: #F8F8F9; }
        .section-tag {
          display:inline-flex; align-items:center; gap:6px;
          font-size:10px; font-weight:700; letter-spacing:.22em;
          text-transform:uppercase; color:var(--gold);
          background:var(--gold-dim); padding:4px 12px;
          border:1px solid var(--border); font-family:'Jost',sans-serif;
        }

        /* ── Mobile overrides ── */
        @media (max-width: 640px) {
          .um-stats-grid { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .um-filters { flex-direction: column !important; }
          .um-filters > * { width: 100% !important; }
          .um-user-row { flex-direction: column !important; gap: 14px !important; align-items: flex-start !important; }
          .um-user-actions { width: 100% !important; flex-wrap: wrap !important; }
          .um-user-meta { text-align: left !important; }
          .um-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .um-form-grid { grid-template-columns: 1fr !important; }
          .um-modal-inner { padding: 20px 16px !important; }
        }
        @media (max-width: 400px) {
          .um-stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="um-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="section-tag" style={{ marginBottom: 10 }}>Admin Panel</div>
          <h1 style={{ ...serif, fontSize: 'clamp(20px,3vw,30px)', color: t.cream, margin: '0 0 4px' }}>User Management</h1>
          <p style={{ ...body, fontSize: 13, color: t.slate, margin: 0 }}>
            {stats ? `${stats.total} users in system` : 'Manage users and their roles'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadUsers} className="um-btn" style={{ ...body, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: t.goldDim, border: `1px solid ${t.border}`, color: t.gold, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={openCreate} className="um-btn" style={{ ...body, display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: t.gold, border: 'none', color: t.navy900, borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}>
            <UserPlus size={15} /> Add User
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      {stats && (
        <div className="um-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 12, marginBottom: 24 }}>
          {statCards.map(({ label, value, color }) => (
            <div key={label} style={{ ...card, padding: '16px 14px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />
              <div style={{ ...serif, fontSize: 22, color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
              <div style={{ ...body, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.slate }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div className="um-filters" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.slate }} />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="um-input"
              style={{ ...inp, paddingLeft: 36 }}
            />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="um-select um-input" style={{ ...inp, width: 'auto', minWidth: 130 }}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="landlord">Landlord</option>
            <option value="tenant">Tenant</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="um-select um-input" style={{ ...inp, width: 'auto', minWidth: 130 }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* ── Users List ── */}
      <div style={{ ...card, padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: 2, background: t.gold }} />
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ ...serif, fontSize: 18, color: t.cream, margin: 0 }}>Users</h2>
          <span style={{ ...body, fontSize: 12, color: t.slate }}>{users.length} result{users.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div style={{ padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, color: t.slate }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${t.border}`, borderTop: `3px solid ${t.gold}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ ...body, fontSize: 13 }}>Loading users…</span>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '56px 20px', textAlign: 'center', color: t.slate }}>
            <Users size={40} style={{ color: t.gold, opacity: 0.35, marginBottom: 14, display: 'block', margin: '0 auto 14px' }} />
            <div style={{ ...body, fontSize: 15, fontWeight: 600, color: t.cream, marginBottom: 4 }}>No users found</div>
            <div style={{ ...body, fontSize: 13 }}>Try adjusting your filters or add a new user.</div>
          </div>
        ) : (
          <div>
            {users.map(user => (
              <div key={user.id} className="um-row" style={{ padding: '16px 20px' }}>
                <div className="um-user-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

                  {/* Avatar + info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: t.goldDim, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ ...serif, fontSize: 16, color: t.gold }}>
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ ...body, fontSize: 14, fontWeight: 700, color: t.cream, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.firstName} {user.lastName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 12, color: t.slate, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Mail size={10} style={{ flexShrink: 0 }} /> {user.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 12, color: t.slate, marginBottom: 7, flexWrap: 'wrap' }}>
                        <Phone size={10} style={{ flexShrink: 0 }} /> {user.phone || '—'}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Pill label={user.role}   color={roleColor(user.role)} />
                        <Pill label={user.status} color={statusColor(user.status)} />
                        {user.emailVerified   && <Pill label="Email ✓"   color={t.green} />}
                        {user.phoneVerified   && <Pill label="Phone ✓"   color={t.green} />}
                      </div>
                    </div>
                  </div>

                  {/* Meta + actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                    <div className="um-user-meta" style={{ ...body, fontSize: 11, color: t.slate, textAlign: 'right', lineHeight: 1.7 }}>
                      <div>Props: {user.propertiesCount} · Txns: {user.transactionsCount}</div>
                      <div>Last login: {formatDate(user.lastLogin)}</div>
                      <div>Joined: {formatDate(user.registrationDate)}</div>
                    </div>
                    <div className="um-user-actions" style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                      <Btn color={t.gold} onClick={() => openEdit(user)}>
                        <Edit size={12} /> Edit
                      </Btn>
                      {user.status === 'active' ? (
                        <Btn color={t.red} onClick={() => handleStatus(user.id, 'suspended')}>
                          <Ban size={12} /> Suspend
                        </Btn>
                      ) : (
                        <Btn color={t.green} onClick={() => handleStatus(user.id, 'active')}>
                          <CheckCircle size={12} /> Activate
                        </Btn>
                      )}
                      <Btn color={t.red} onClick={() => handleDelete(user.id)}>
                        <Trash2 size={12} />
                      </Btn>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="um-modal-inner" style={{ ...card, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '28px 26px' }}>
            {/* Gold top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: t.gold, borderRadius: '12px 12px 0 0' }} />

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <div className="section-tag" style={{ marginBottom: 8 }}>{editMode ? 'Edit User' : 'New User'}</div>
                <h2 style={{ ...serif, fontSize: 20, color: t.cream, margin: 0 }}>
                  {editMode ? `Edit ${selectedUser?.firstName}` : 'Add New User'}
                </h2>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: t.slate, cursor: 'pointer', display: 'flex', padding: 6, borderRadius: 6 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name row */}
              <div className="um-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ ...body, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.slate, display: 'block', marginBottom: 6 }}>First Name *</label>
                  <input type="text" value={formData.firstName} onChange={f('firstName')} className="um-input" style={inp} placeholder="John" />
                  {formErrors.firstName && <div style={{ ...body, fontSize: 11, color: t.red, marginTop: 4 }}>{formErrors.firstName}</div>}
                </div>
                <div>
                  <label style={{ ...body, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.slate, display: 'block', marginBottom: 6 }}>Last Name *</label>
                  <input type="text" value={formData.lastName} onChange={f('lastName')} className="um-input" style={inp} placeholder="Doe" />
                  {formErrors.lastName && <div style={{ ...body, fontSize: 11, color: t.red, marginTop: 4 }}>{formErrors.lastName}</div>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ ...body, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.slate, display: 'block', marginBottom: 6 }}>Email *</label>
                <input type="email" value={formData.email} onChange={f('email')} className="um-input" style={inp} placeholder="john@example.com" />
                {formErrors.email && <div style={{ ...body, fontSize: 11, color: t.red, marginTop: 4 }}>{formErrors.email}</div>}
              </div>

              {/* Phone */}
              <div>
                <label style={{ ...body, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.slate, display: 'block', marginBottom: 6 }}>Phone *</label>
                <input type="tel" value={formData.phone} onChange={f('phone')} className="um-input" style={inp} placeholder="+255 712 345 678" />
                {formErrors.phone && <div style={{ ...body, fontSize: 11, color: t.red, marginTop: 4 }}>{formErrors.phone}</div>}
              </div>

              {/* Role + Status */}
              <div className="um-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ ...body, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.slate, display: 'block', marginBottom: 6 }}>Role</label>
                  <select value={formData.role} onChange={f('role')} className="um-select um-input" style={inp}>
                    <option value="tenant">Tenant</option>
                    <option value="landlord">Landlord</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ ...body, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.slate, display: 'block', marginBottom: 6 }}>Status</label>
                  <select value={formData.status} onChange={f('status')} className="um-select um-input" style={inp}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Password — always shown on create, optional on edit */}
              <div className="um-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ ...body, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.slate, display: 'block', marginBottom: 6 }}>
                    Password {editMode ? '(leave blank to keep)' : '*'}
                  </label>
                  <input type="password" value={formData.password} onChange={f('password')} className="um-input" style={inp} placeholder={editMode ? '••••••••' : 'Min 8 chars'} />
                  {formErrors.password && <div style={{ ...body, fontSize: 11, color: t.red, marginTop: 4 }}>{formErrors.password}</div>}
                </div>
                <div>
                  <label style={{ ...body, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.slate, display: 'block', marginBottom: 6 }}>
                    Confirm {editMode ? '' : '*'}
                  </label>
                  <input type="password" value={formData.confirmPassword} onChange={f('confirmPassword')} className="um-input" style={inp} placeholder="••••••••" />
                  {formErrors.confirmPassword && <div style={{ ...body, fontSize: 11, color: t.red, marginTop: 4 }}>{formErrors.confirmPassword}</div>}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ ...body, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.slate, display: 'block', marginBottom: 6 }}>Notes (optional)</label>
                <textarea value={formData.notes} onChange={f('notes')} rows={3} className="um-input" style={{ ...inp, resize: 'vertical' }} placeholder="Internal admin notes…" />
              </div>

              {/* Footer buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" onClick={closeModal} style={{ ...body, padding: '10px 20px', background: 'transparent', border: `1px solid ${t.border}`, color: t.slate, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="um-btn" style={{ ...body, padding: '10px 22px', background: t.gold, border: 'none', color: t.navy900, borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
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