import { useState, useEffect } from 'react';
import {
  Search, Download, Eye, FileText, CheckCircle, XCircle,
  Clock, AlertCircle, RefreshCw, ChevronDown, ChevronUp,
  Building, DollarSign,
} from 'lucide-react';
import Api from '../../services/api';
import {
  C, body, pageWrap, pageInner, card, inputCss, selectCss,
  btnPrimary, btnGhost, statCard, ADMIN_CSS, adminHeaderStyle, accentBtn,
} from './adminTheme';

type Contract = {
  id: number;
  tenant_id: number; property_id: number; landlord_id: number; agent_id: number;
  start_date: string; end_date: string;
  rent_amount: number; deposit_amount: number;
  status: string; type: string; terms: string;
  tenant_signature: string; landlord_signature: string; agent_signature: string;
  created_at: string; updated_at: string;
  tenant?:   { name: string; email: string; phone: string };
  property?: { title: string; address: string; type: string; bedrooms: number; bathrooms: number };
  landlord?: { name: string; email: string; phone: string };
  agent?:    { name: string; email: string; phone: string };
};

const statusColor = (s: string) =>
  s === 'active' ? C.green : s === 'pending' ? C.amber : s === 'expired' || s === 'terminated' ? C.red : s === 'draft' ? C.blue : C.textMuted;

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'active')   return <CheckCircle size={13} />;
  if (status === 'pending')  return <Clock size={13} />;
  if (status === 'draft')    return <FileText size={13} />;
  return <XCircle size={13} />;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(n || 0);

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

/* ── Detail row reused in modal ── */
const DRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: 'rgba(200,145,40,0.07) 1px solid' }}>
    <span style={{ ...body, fontSize: 12, color: C.textMuted, flexShrink: 0, width: 130 }}>{label}</span>
    <span style={{ ...body, fontSize: 13, color: C.text, textAlign: 'right', flex: 1 }}>{children}</span>
  </div>
);

const ContractsManagement = () => {
  const [contracts,         setContracts]         = useState<Contract[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [searchTerm,        setSearchTerm]        = useState('');
  const [statusFilter,      setStatusFilter]      = useState('all');
  const [typeFilter,        setTypeFilter]        = useState('all');
  const [selectedContract,  setSelectedContract]  = useState<Contract | null>(null);
  const [showDetails,       setShowDetails]       = useState(false);
  const [sortBy,            setSortBy]            = useState('created_at');
  const [sortOrder,         setSortOrder]         = useState<'asc' | 'desc'>('desc');

  useEffect(() => { loadContracts(); }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const res = await Api.getAdminContracts();
      setContracts(res.data || []);
    } catch { setContracts([]); }
    finally { setLoading(false); }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
  };

  const filtered = [...contracts]
    .sort((a: any, b: any) => {
      const mod = sortOrder === 'asc' ? 1 : -1;
      return a[sortBy] < b[sortBy] ? -mod : a[sortBy] > b[sortBy] ? mod : 0;
    })
    .filter(c =>
      (!searchTerm ||
        c.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.landlord?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.agent?.name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'all' || c.status === statusFilter) &&
      (typeFilter === 'all' || c.type === typeFilter)
    );

  const totalMonthlyRent = filtered
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + (c.rent_amount || 0), 0);

  const handleExport = () => {
    const csv = [
      ['ID', 'Tenant', 'Property', 'Landlord', 'Agent', 'Rent', 'Status', 'Start', 'End'],
      ...filtered.map(c => [c.id, c.tenant?.name ?? 'N/A', c.property?.title ?? 'N/A', c.landlord?.name ?? 'N/A', c.agent?.name ?? 'N/A', c.rent_amount, c.status, c.start_date, c.end_date]),
    ].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `contracts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  /* stat counts */
  const counts = {
    active:     filtered.filter(c => c.status === 'active').length,
    pending:    filtered.filter(c => c.status === 'pending').length,
    expired:    filtered.filter(c => c.status === 'expired').length,
    terminated: filtered.filter(c => c.status === 'terminated').length,
  };

  /* ── sort-able TH ── */
  const SortTh = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      onClick={() => handleSort(field)}
      style={{ ...body, padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: sortBy === field ? C.gold : C.textMuted, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', background: C.slate100 }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortBy === field && (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
      </span>
    </th>
  );

  const PlainTh = ({ children }: { children: React.ReactNode }) => (
    <th style={{ ...body, padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textMuted, background: C.slate100, whiteSpace: 'nowrap' }}>
      {children}
    </th>
  );

  return (
    <div className="admin-page" style={pageWrap}>
      <style>{ADMIN_CSS}{`
        .cm-btn:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .cm-row { border-bottom: 1px solid ${C.border}; transition: background .18s; }
        .cm-row:hover { background: ${C.goldBg}; }
        .cm-row:last-child { border-bottom: none; }
      `}</style>
      <div style={pageInner}>

      <div style={adminHeaderStyle}>
        <div className="admin-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, color: '#fff' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>Admin · Contracts</div>
            <h1 style={{ ...body, fontSize: 'clamp(20px,3vw,30px)', color: '#fff', margin: '0 0 4px', fontWeight: 800 }}>Contracts Management</h1>
            <p style={{ ...body, fontSize: 14, color: C.textLight, margin: 0 }}>Manage and monitor all rental contracts</p>
          </div>
          <div className="admin-header-actions" style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleExport} className="cm-btn" style={accentBtn(C.green)}>
              <Download size={14} /> Export CSV
            </button>
            <button onClick={loadContracts} className="cm-btn" style={accentBtn(C.blue)}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="admin-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active',      count: counts.active,     color: C.green,  Icon: CheckCircle },
          { label: 'Pending',     count: counts.pending,    color: C.amber, Icon: Clock       },
          { label: 'Expired',     count: counts.expired,    color: C.red,    Icon: XCircle     },
          { label: 'Monthly Rent (Active)', count: null,    color: C.gold,   Icon: DollarSign, rent: totalMonthlyRent },
        ].map(({ label, count, color, Icon, rent }) => (
          <div key={label} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, borderRadius: '12px 12px 0 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, background: `${color}18`, border: `1px solid ${color}28`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 4 }}>{label}</div>
                <div style={{ ...body, fontSize: rent !== undefined ? 16 : 24, color: C.text, lineHeight: 1 }}>
                  {rent !== undefined ? formatCurrency(rent) : count}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div className="cm-filters" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
            <input
              type="text"
              placeholder="Search tenant, property, landlord…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="admin-input"
              style={{ ...inputCss, paddingLeft: 36 }}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-input" style={{ ...inputCss, width: 'auto', minWidth: 130 }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
            <option value="draft">Draft</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="admin-input" style={{ ...inputCss, width: 'auto', minWidth: 130 }}>
            <option value="all">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="vacation">Vacation</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 2, background: C.gold }} />

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '56px 20px', color: C.textMuted }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ ...body, fontSize: 13 }}>Loading contracts…</span>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <SortTh field="id">ID</SortTh>
                  <PlainTh>Tenant</PlainTh>
                  <PlainTh>Property</PlainTh>
                  <PlainTh>Rent</PlainTh>
                  <PlainTh>Type</PlainTh>
                  <PlainTh>Status</PlainTh>
                  <SortTh field="start_date">Start</SortTh>
                  <SortTh field="end_date">End</SortTh>
                  <PlainTh>Action</PlainTh>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ ...body, padding: '52px 20px', textAlign: 'center', color: C.textMuted }}>
                      <Search size={32} style={{ color: C.gold, opacity: 0.35, display: 'block', margin: '0 auto 12px' }} />
                      No contracts found
                    </td>
                  </tr>
                ) : filtered.map(c => (
                  <tr key={c.id} className="cm-row">
                    {/* ID */}
                    <td style={{ ...body, padding: '13px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', color: C.gold, fontSize: 13 }}>#{c.id}</span>
                    </td>

                    {/* Tenant */}
                    <td style={{ ...body, padding: '13px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.tenant?.name || 'N/A'}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{c.tenant?.email || ''}</div>
                    </td>

                    {/* Property */}
                    <td style={{ ...body, padding: '13px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.property?.title || 'N/A'}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{c.property?.address || ''}</div>
                    </td>

                    {/* Rent */}
                    <td style={{ ...body, padding: '13px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{formatCurrency(c.rent_amount)}</span>
                    </td>

                    {/* Type */}
                    <td style={{ ...body, padding: '13px 14px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: C.goldBg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'capitalize', letterSpacing: '0.06em' }}>
                        <Building size={10} /> {c.type || 'N/A'}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ ...body, padding: '13px 14px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${statusColor(c.status)}15`, border: `1px solid ${statusColor(c.status)}28`, borderRadius: 4, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: statusColor(c.status), textTransform: 'capitalize', letterSpacing: '0.06em' }}>
                        <StatusIcon status={c.status} /> {c.status}
                      </div>
                    </td>

                    {/* Dates */}
                    <td style={{ ...body, padding: '13px 14px', fontSize: 12, color: C.text, whiteSpace: 'nowrap' }}>{formatDate(c.start_date)}</td>
                    <td style={{ ...body, padding: '13px 14px', fontSize: 12, color: C.text, whiteSpace: 'nowrap' }}>{formatDate(c.end_date)}</td>

                    {/* Action */}
                    <td style={{ padding: '13px 14px' }}>
                      <button
                        onClick={() => { setSelectedContract(c); setShowDetails(true); }}
                        className="cm-btn"
                        style={{ ...accentBtn(C.blue), padding: '7px 12px', fontSize: 12 }}
                        title="View Details"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Details Modal ── */}
      {showDetails && selectedContract && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowDetails(false); }}
        >
          <div style={{ ...card, maxWidth: 720, width: '100%', maxHeight: '88vh', overflowY: 'auto', position: 'relative', padding: 0 }}>
            <div style={{ height: 3, background: C.gold, borderRadius: '12px 12px 0 0' }} />

            <div style={{ padding: '26px 28px 28px' }}>
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <div className="section-tag" style={{ marginBottom: 8 }}>Contract #{selectedContract.id}</div>
                  <h2 style={{ ...body, fontSize: 22, color: C.text, margin: 0 }}>Contract Details</h2>
                </div>
                <button onClick={() => setShowDetails(false)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', display: 'flex', padding: 6, borderRadius: 6 }}>
                  <XCircle size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gap: 20 }}>

                {/* Top row — status + type + dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>Contract Info</div>
                    <DRow label="Status">
                      <span style={{ color: statusColor(selectedContract.status), display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <StatusIcon status={selectedContract.status} />
                        {selectedContract.status}
                      </span>
                    </DRow>
                    <DRow label="Type">{selectedContract.type || 'N/A'}</DRow>
                    <DRow label="Start Date">{formatDate(selectedContract.start_date)}</DRow>
                    <DRow label="End Date">{formatDate(selectedContract.end_date)}</DRow>
                    <DRow label="Created">{formatDate(selectedContract.created_at)}</DRow>
                  </div>

                  <div style={{ background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>Financials</div>
                    <DRow label="Monthly Rent">
                      <span style={{ color: C.gold, fontWeight: 700 }}>{formatCurrency(selectedContract.rent_amount)}</span>
                    </DRow>
                    <DRow label="Deposit">
                      <span style={{ color: C.gold }}>{formatCurrency(selectedContract.deposit_amount)}</span>
                    </DRow>
                    <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, margin: '14px 0 10px' }}>Signatures</div>
                    {[
                      { label: 'Tenant',   signed: selectedContract.tenant_signature   },
                      { label: 'Landlord', signed: selectedContract.landlord_signature },
                      { label: 'Agent',    signed: selectedContract.agent_signature    },
                    ].map(({ label, signed }) => (
                      <DRow key={label} label={label}>
                        <span style={{ color: signed ? C.green : C.amber, fontWeight: 600 }}>
                          {signed ? '✓ Signed' : '⏳ Pending'}
                        </span>
                      </DRow>
                    ))}
                  </div>
                </div>

                {/* Parties */}
                <div style={{ background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>Parties Involved</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                    {[
                      { role: 'Tenant',   party: selectedContract.tenant   },
                      { role: 'Landlord', party: selectedContract.landlord },
                      { role: 'Agent',    party: selectedContract.agent    },
                    ].map(({ role, party }) => (
                      <div key={role}>
                        <div style={{ ...body, fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{role}</div>
                        <div style={{ ...body, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{party?.name || 'N/A'}</div>
                        <div style={{ ...body, fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{party?.email || ''}</div>
                        <div style={{ ...body, fontSize: 11, color: C.textMuted }}>{party?.phone || ''}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Property */}
                <div style={{ background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>Property</div>
                  <DRow label="Title">{selectedContract.property?.title || 'N/A'}</DRow>
                  <DRow label="Address">{selectedContract.property?.address || 'N/A'}</DRow>
                  <DRow label="Type">{selectedContract.property?.type || 'N/A'}</DRow>
                  {selectedContract.property?.bedrooms !== undefined && (
                    <DRow label="Beds / Baths">{selectedContract.property.bedrooms} bed · {selectedContract.property.bathrooms} bath</DRow>
                  )}
                </div>

                {/* Terms */}
                {selectedContract.terms && (
                  <div style={{ background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 10 }}>Terms & Conditions</div>
                    <p style={{ ...body, fontSize: 13, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>
                      {typeof selectedContract.terms === 'string' ? selectedContract.terms : JSON.stringify(selectedContract.terms)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ContractsManagement;