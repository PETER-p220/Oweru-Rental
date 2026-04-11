import { useEffect, useMemo, useState } from 'react';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle,
  descriptionStyle,
  formatCurrency,
  formatDate,
  getStatusColor,
  headingStyle,
  inputStyle,
  pageStyle,
  panelStyle,
  palette,
  sectionTitleStyle,
  selectStyle,
  statusPillStyle,
  tableStyle,
  tableWrapStyle,
  tdStyle,
  textareaStyle,
  thStyle,
} from './landlordPageStyles';

interface ContractItem {
  id: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  rent_amount?: number | string;
  terms?: string;
  property?: { id: number; title?: string; location?: string };
  tenant?: { id: number; user?: { first_name?: string; last_name?: string; email?: string } };
}

interface TenantOption {
  id: number;
  user?: { first_name?: string; last_name?: string };
  property?: { id: number; title?: string };
}

interface PropertyOption {
  id: number;
  title?: string;
  location?: string;
  price?: number | string;
}

const initialForm = {
  tenant_id: '',
  property_id: '',
  start_date: '',
  end_date: '',
  rent_amount: '',
  terms: '',
};

const ContractsPage = () => {
  const [contracts, setContracts]     = useState<ContractItem[]>([]);
  const [tenants, setTenants]         = useState<TenantOption[]>([]);
  const [properties, setProperties]   = useState<PropertyOption[]>([]);
  const [form, setForm]               = useState(initialForm);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const loadData = async () => {
    try {
      setLoading(true); setError('');
      const [contractsRes, tenantsRes, propertiesRes] = await Promise.all([
        Api.getOwnerContracts(),
        Api.getMyTenants(),
        Api.getOwnerProperties(),
      ]);
      setContracts(Array.isArray(contractsRes.data) ? contractsRes.data : []);
      setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : []);
      setProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load contracts.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => ({
    total: contracts.length,
    active: contracts.filter((c) => c.status === 'active').length,
    expiringSoon: contracts.filter((c) => {
      if (!c.end_date) return false;
      const end = new Date(c.end_date).getTime();
      const now = Date.now();
      return end > now && end - now <= 1000 * 60 * 60 * 24 * 30;
    }).length,
  }), [contracts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    try {
      await Api.createOwnerContract({
        tenant_id:   Number(form.tenant_id),
        property_id: Number(form.property_id),
        start_date:  form.start_date,
        end_date:    form.end_date,
        rent_amount: Number(form.rent_amount),
        terms:       form.terms,
      });
      setSuccess('Contract created successfully.');
      setForm(initialForm);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to create contract.');
    } finally { setSubmitting(false); }
  };

  const statCards = [
    { label: 'Total contracts', value: stats.total,        accent: palette.gold  },
    { label: 'Active',          value: stats.active,       accent: palette.green },
    { label: 'Expiring soon',   value: stats.expiringSoon, accent: palette.amber },
  ];

  return (
    <div style={pageStyle}>

      {/* ── Header ── */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 28, right: 28, height: '2px',
          background: `linear-gradient(90deg, transparent, ${palette.gold}, transparent)`,
        }} />

        <div style={sectionTitleStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.gold, display: 'inline-block', marginRight: 6 }} />
          Landlord Workspace
        </div>
        <h1 style={headingStyle}>Digital Contracts</h1>
        <p style={{ ...descriptionStyle, marginTop: 6 }}>
          Manage lease records and create new agreements directly from your landlord dashboard.
        </p>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginTop: '24px' }}>
          {statCards.map(({ label, value, accent }) => (
            <div key={label} style={{
              padding: '18px 20px', borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${accent}25`,
            }}>
              <div style={{ color: palette.gray400, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>
                {label}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: accent, marginTop: '6px', letterSpacing: '-0.02em' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Split: table + form ── */}
      <section style={{
        ...panelStyle,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.3fr) minmax(300px, 0.85fr)',
        gap: '28px',
      }}>

        {/* Contracts table */}
        <div>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              color: palette.red, background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.18)',
              borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px',
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              color: palette.green, background: 'rgba(22,163,74,0.08)',
              border: '1px solid rgba(22,163,74,0.22)',
              borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px',
            }}>
              <CheckCircle size={16} /> {success}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.gray400, padding: '40px 0' }}>
              <div style={{ width: 16, height: 16, border: `2px solid ${palette.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Loading contracts…
            </div>
          ) : contracts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: palette.gray400 }}>
              <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: '16px', fontWeight: 600 }}>No contracts yet</div>
              <div style={{ fontSize: '13px', opacity: 0.7, marginTop: 4 }}>Create your first contract using the form.</div>
            </div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {['Tenant', 'Property', 'Term', 'Rent', 'Status'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr
                      key={contract.id}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,145,40,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>
                          {contract.tenant?.user?.first_name} {contract.tenant?.user?.last_name}
                        </div>
                        <div style={{ color: palette.gray400, marginTop: '4px', fontSize: '13px' }}>
                          {contract.tenant?.user?.email || 'No email'}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{contract.property?.title || 'Untitled property'}</div>
                        <div style={{ color: palette.gray400, marginTop: '4px', fontSize: '13px' }}>
                          {contract.property?.location || 'No location'}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '13px' }}>
                          {formatDate(contract.start_date)} → {formatDate(contract.end_date)}
                        </div>
                        <div style={{ color: palette.gray400, marginTop: '4px', fontSize: '12px' }}>
                          {contract.terms || 'No terms summary'}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: palette.gold, fontWeight: 600 }}>
                        {formatCurrency(contract.rent_amount)}
                      </td>
                      <td style={tdStyle}>
                        <span style={statusPillStyle(getStatusColor(contract.status))}>
                          {contract.status || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create contract form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px', alignContent: 'start' }}>
          {/* Form title */}
          <div style={{
            fontSize: '13px', fontWeight: 700, color: palette.gray400,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            marginBottom: '4px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <FileText size={14} style={{ color: palette.gold }} /> Create Contract
          </div>

          {/* Gold divider */}
          <div style={{ height: '1px', background: `linear-gradient(90deg, ${palette.gold}40, transparent)`, marginBottom: '4px' }} />

          <select
            style={selectStyle}
            value={form.tenant_id}
            onChange={(e) => setForm(c => ({ ...c, tenant_id: e.target.value }))}
            required
          >
            <option value="">Select tenant…</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {(t.user?.first_name || '').trim()} {(t.user?.last_name || '').trim()}
                {t.property?.title ? ` — ${t.property.title}` : ''}
              </option>
            ))}
          </select>

          <select
            style={selectStyle}
            value={form.property_id}
            onChange={(e) => setForm(c => ({ ...c, property_id: e.target.value }))}
            required
          >
            <option value="">Select property…</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}{p.location ? ` — ${p.location}` : ''}
              </option>
            ))}
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: palette.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 5 }}>
                Start date
              </label>
              <input
                style={inputStyle}
                type="date"
                value={form.start_date}
                onChange={(e) => setForm(c => ({ ...c, start_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: palette.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 5 }}>
                End date
              </label>
              <input
                style={inputStyle}
                type="date"
                value={form.end_date}
                onChange={(e) => setForm(c => ({ ...c, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <input
            style={inputStyle}
            type="number"
            min="0"
            placeholder="Monthly rent amount (TZS)"
            value={form.rent_amount}
            onChange={(e) => setForm(c => ({ ...c, rent_amount: e.target.value }))}
            required
          />

          <textarea
            style={textareaStyle}
            placeholder="Contract terms and conditions…"
            value={form.terms}
            onChange={(e) => setForm(c => ({ ...c, terms: e.target.value }))}
            required
          />

          <button type="submit" style={{ ...buttonStyle('primary'), padding: '12px 20px', fontSize: '14px' }} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Contract'}
          </button>
        </form>
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ContractsPage;