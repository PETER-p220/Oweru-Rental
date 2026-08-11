import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Building2, CheckCircle2, ClipboardList, Clock,
  Filter, Loader2, Plus, Search, Shield, Wrench, X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Api from '../../services/api';
import {
  palette, pageStyle, panelStyle, headingStyle, headingLightStyle,
  descriptionLightStyle, buttonStyle,
} from '../tenant/tenantPageStyles';
import {
  CATEGORY_OPTIONS, PRIORITY_OPTIONS, STATUS_LABELS,
  type ComplianceRequestItem, type ComplianceStats, type ComplianceStatus,
  formatComplianceDate, priorityTone, statusTone,
} from './complianceShared';

type ViewerRole = 'tenant' | 'owner' | 'admin';

const OWNER_TYPES = new Set(['landlord', 'commercial', 'bnb_owner']);

function resolveViewerRole(user: { user_type?: string; userType?: string } | null): ViewerRole {
  const t = user?.user_type || user?.userType || 'tenant';
  if (t === 'admin') return 'admin';
  if (OWNER_TYPES.has(t)) return 'owner';
  return 'tenant';
}
const categoryIcon = (cat: string) => {
  switch (cat) {
    case 'safety': return Shield;
    case 'maintenance': return Wrench;
    default: return ClipboardList;
  }
};

const PORTAL_LABEL: Record<ViewerRole, string> = {
  tenant: 'Tenant portal',
  owner: 'Property owner portal',
  admin: 'Oweru admin portal',
};

export default function ComplianceRequestsPage() {
  const { user } = useAuth();
  const role = resolveViewerRole(user);
  const canManage = role === 'owner' || role === 'admin';

  const [items, setItems] = useState<ComplianceRequestItem[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [properties, setProperties] = useState<{ id: number; title: string; location?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<ComplianceRequestItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({
    property_id: '',
    category: 'maintenance',
    priority: 'medium',
    title: '',
    description: '',
    location_in_property: '',
    preferred_date: '',
  });

  const [ownerForm, setOwnerForm] = useState({
    status: 'acknowledged' as ComplianceStatus,
    owner_response: '',
    resolution_notes: '',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const payload = role === 'tenant'
        ? await Api.getTenantComplianceRequests(statusFilter !== 'all' ? statusFilter : undefined)
        : role === 'admin'
          ? await Api.getAdminComplianceRequests(statusFilter !== 'all' ? statusFilter : undefined)
          : await Api.getOwnerComplianceRequests(statusFilter !== 'all' ? statusFilter : undefined);
      setItems(Array.isArray(payload.data) ? payload.data : []);
      setStats(payload.stats ?? null);
      if (role === 'tenant' && payload.properties) {
        setProperties(payload.properties);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not load compliance requests.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [role, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) =>
      r.reference.toLowerCase().includes(q)
      || r.title.toLowerCase().includes(q)
      || r.property?.title?.toLowerCase().includes(q)
      || r.tenant?.name?.toLowerCase().includes(q),
    );
  }, [items, search]);

  const openDetail = (item: ComplianceRequestItem) => {
    setSelected(item);
    setOwnerForm({
      status: item.status,
      owner_response: item.owner_response || '',
      resolution_notes: item.resolution_notes || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.property_id) {
      setMessage({ text: 'Select your rental property.', ok: false });
      return;
    }
    try {
      setSubmitting(true);
      setMessage(null);
      const res = await Api.createTenantComplianceRequest({
        property_id: Number(form.property_id),
        category: form.category,
        priority: form.priority,
        title: form.title.trim(),
        description: form.description.trim(),
        location_in_property: form.location_in_property.trim() || undefined,
        preferred_date: form.preferred_date || undefined,
      });
      setMessage({ text: res.message || 'Request submitted to your property owner.', ok: true });
      setShowForm(false);
      setForm({
        property_id: '', category: 'maintenance', priority: 'medium',
        title: '', description: '', location_in_property: '', preferred_date: '',
      });
      await load();
    } catch (e: any) {
      setMessage({ text: e?.response?.data?.message || 'Submission failed.', ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOwnerUpdate = async () => {
    if (!selected) return;
    try {
      setUpdating(true);
      setMessage(null);
      const res = role === 'admin'
        ? await Api.updateAdminComplianceRequest(selected.id, ownerForm)
        : await Api.updateOwnerComplianceRequest(selected.id, ownerForm);
      setMessage({ text: res.message || 'Request updated.', ok: true });
      setSelected(null);
      await load();
    } catch (e: any) {
      setMessage({ text: e?.response?.data?.message || 'Update failed.', ok: false });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={pageStyle}>
      <style>{`
        .cmp-input, .cmp-select, .cmp-textarea {
          width: 100%; padding: 10px 12px; border-radius: 8px;
          border: 1px solid ${palette.slate200}; font-size: 14px;
          font-family: inherit; color: ${palette.slate900}; background: ${palette.white};
        }
        .cmp-textarea { min-height: 120px; resize: vertical; line-height: 1.5; }
        .cmp-row:hover { background: ${palette.slate50}; }
        .cmp-btn:hover { filter: brightness(1.05); }
      `}</style>

      {/* Header */}
      <div style={{ ...panelStyle, background: palette.slate800, color: palette.white, border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: palette.goldLight, marginBottom: 8 }}>
              {PORTAL_LABEL[role]}
            </div>
            <h1 style={{ ...headingLightStyle, margin: '0 0 8px' }}>
              Compliance & maintenance
            </h1>
            <p style={{ ...descriptionLightStyle, margin: 0, maxWidth: 560 }}>
              {role === 'tenant'
                ? 'Submit professional maintenance and compliance requests directly to your property owner. Every submission receives a reference number and status tracking.'
                : role === 'admin'
                  ? 'Review and respond to tenant compliance submissions on Oweru-managed rental properties.'
                  : 'Review and respond to tenant maintenance, safety, and compliance submissions across your properties.'}
            </p>
          </div>
          {role === 'tenant' && (
            <button
              type="button"
              className="cmp-btn"
              style={{ ...buttonStyle('primary'), marginTop: 4 }}
              onClick={() => { setShowForm(true); setMessage(null); }}
              disabled={properties.length === 0}
            >
              <Plus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              New request
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
          {[
            { label: 'Total', value: stats.total, icon: ClipboardList },
            { label: 'Open', value: stats.open, icon: Clock },
            { label: 'In progress', value: stats.in_progress, icon: Wrench },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={{ ...panelStyle, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon size={16} color={palette.gold} />
                <span style={{ fontSize: 12, color: palette.slate500, fontWeight: 600 }}>{label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: palette.slate900 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, fontSize: 14,
          background: message.ok ? palette.greenBg : palette.redBg,
          color: message.ok ? palette.green : palette.red,
          border: `1px solid ${message.ok ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
        }}>
          {message.text}
        </div>
      )}

      {role === 'tenant' && properties.length === 0 && !loading && (
        <div style={{ ...panelStyle, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertTriangle size={20} color={palette.amber} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, color: palette.slate900, marginBottom: 4 }}>No active rental property</div>
            <p style={{ margin: 0, fontSize: 14, color: palette.slate600, lineHeight: 1.5 }}>
              You can submit compliance requests after your rent is paid and you are linked to a property. Complete your application and first rent payment first.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ ...panelStyle, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: palette.slate400 }} />
          <input
            className="cmp-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search reference, title, property…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color={palette.slate400} />
          <select className="cmp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div style={panelStyle}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: palette.slate500 }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <div>Loading requests…</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 40, color: palette.red }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: palette.slate500 }}>
            <ClipboardList size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontWeight: 600, color: palette.slate700, marginBottom: 6 }}>No requests found</div>
            <div style={{ fontSize: 14 }}>
              {role === 'tenant' ? 'Submit your first maintenance or compliance request above.' : 'Tenant submissions will appear here.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filtered.map((item) => {
              const st = statusTone(item.status);
              const pr = priorityTone(item.priority);
              const CatIcon = categoryIcon(item.category);
              return (
                <button
                  key={item.id}
                  type="button"
                  className="cmp-row"
                  onClick={() => openDetail(item)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '16px 4px', border: 'none', borderBottom: `1px solid ${palette.slate200}`,
                    background: 'transparent', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: palette.goldFaint, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CatIcon size={20} color={palette.gold} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: palette.slate900 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: palette.slate500, fontFamily: 'monospace', marginTop: 2 }}>{item.reference}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                            {STATUS_LABELS[item.status]}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: pr.bg, color: pr.color }}>
                            {item.priority}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: palette.slate600, marginBottom: 8, lineHeight: 1.45 }}>
                        {item.description.length > 140 ? `${item.description.slice(0, 140)}…` : item.description}
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: palette.slate500 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Building2 size={12} /> {item.property?.title}
                        </span>
                        {canManage && item.tenant && (
                          <span>Tenant: {item.tenant.name}</span>
                        )}
                        <span>{formatComplianceDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tenant submit modal */}
      {showForm && role === 'tenant' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000,
        }}>
          <div style={{ ...panelStyle, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ ...headingStyle, margin: 0, fontSize: 20 }}>Submit compliance request</h2>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.slate500 }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: palette.slate700 }}>Rental property *</div>
                <select className="cmp-select" required value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })}>
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}{p.location ? ` — ${p.location}` : ''}</option>
                  ))}
                </select>
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: palette.slate700 }}>Category *</div>
                <select className="cmp-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: palette.slate700 }}>Priority *</div>
                <select className="cmp-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: palette.slate700 }}>Subject *</div>
                <input className="cmp-input" required minLength={5} maxLength={180} placeholder="Brief summary of the issue"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: palette.slate700 }}>Detailed description *</div>
                <textarea className="cmp-textarea" required minLength={20} placeholder="Describe the issue clearly: what happened, when, and any impact on your tenancy."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: palette.slate700 }}>Location in property</div>
                <input className="cmp-input" placeholder="e.g. Master bedroom, kitchen sink"
                  value={form.location_in_property} onChange={(e) => setForm({ ...form, location_in_property: e.target.value })} />
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: palette.slate700 }}>Preferred visit / resolution date</div>
                <input type="date" className="cmp-input" value={form.preferred_date}
                  onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} />
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="cmp-btn" style={{ ...buttonStyle('primary'), flex: 1 }} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit to owner'}
                </button>
                <button type="button" className="cmp-btn" style={{ ...buttonStyle('secondary'), flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000,
        }}>
          <div style={{ ...panelStyle, maxWidth: 620, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: palette.slate500, marginBottom: 4 }}>{selected.reference}</div>
                <h2 style={{ ...headingStyle, margin: 0, fontSize: 20 }}>{selected.title}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.slate500 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ ...statusTone(selected.status), fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99 }}>
                {STATUS_LABELS[selected.status]}
              </span>
              <span style={{ ...priorityTone(selected.priority), fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99 }}>
                {selected.priority}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: palette.slate100, color: palette.slate600 }}>
                {CATEGORY_OPTIONS.find((c) => c.value === selected.category)?.label ?? selected.category}
              </span>
            </div>

            {[
              { label: 'Property', value: selected.property?.title },
              selected.location_in_property ? { label: 'Location', value: selected.location_in_property } : null,
              canManage && selected.tenant ? { label: 'Tenant', value: `${selected.tenant.name}${selected.tenant.phone ? ` · ${selected.tenant.phone}` : ''}` } : null,
              role === 'admin' && selected.owner ? { label: 'Property owner', value: selected.owner.name } : null,
              { label: 'Submitted', value: formatComplianceDate(selected.created_at) },
              selected.preferred_date ? { label: 'Preferred date', value: selected.preferred_date } : null,
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: `1px solid ${palette.slate200}`, fontSize: 13 }}>
                <span style={{ color: palette.slate500, fontWeight: 600 }}>{row.label}</span>
                <span style={{ color: palette.slate900, textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}

            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: palette.slate700, marginBottom: 6 }}>Description</div>
              <p style={{ margin: 0, fontSize: 14, color: palette.slate700, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.description}</p>
            </div>

            {selected.owner_response && role === 'tenant' && (
              <div style={{ marginBottom: 16, padding: 14, background: palette.blueBg, borderRadius: 10, border: '1px solid rgba(37,99,235,0.15)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: palette.blue, marginBottom: 6 }}>Owner response</div>
                <p style={{ margin: 0, fontSize: 14, color: palette.slate800, lineHeight: 1.5 }}>{selected.owner_response}</p>
              </div>
            )}

            {canManage && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16, borderTop: `1px solid ${palette.slate200}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: palette.slate900 }}>Update request</div>
                <label>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Status</div>
                  <select className="cmp-select" value={ownerForm.status} onChange={(e) => setOwnerForm({ ...ownerForm, status: e.target.value as ComplianceStatus })}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Message to tenant</div>
                  <textarea className="cmp-textarea" placeholder="Acknowledge the issue and explain next steps…"
                    value={ownerForm.owner_response} onChange={(e) => setOwnerForm({ ...ownerForm, owner_response: e.target.value })} />
                </label>
                <label>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Internal resolution notes</div>
                  <textarea className="cmp-textarea" placeholder="Work done, contractor used, completion date…"
                    value={ownerForm.resolution_notes} onChange={(e) => setOwnerForm({ ...ownerForm, resolution_notes: e.target.value })} />
                </label>
                <button type="button" className="cmp-btn" style={buttonStyle('primary')} disabled={updating} onClick={handleOwnerUpdate}>
                  {updating ? 'Saving…' : 'Save update & notify tenant'}
                </button>
              </div>
            )}

            {selected.resolution_notes && role === 'tenant' && selected.status === 'resolved' && (
              <div style={{ marginTop: 12, padding: 14, background: palette.greenBg, borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: palette.green, marginBottom: 6 }}>Resolution</div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{selected.resolution_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
