import { useEffect, useMemo, useState } from 'react';
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
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [contractsResponse, tenantsResponse, propertiesResponse] = await Promise.all([
        Api.getOwnerContracts(),
        Api.getMyTenants(),
        Api.getOwnerProperties(),
      ]);

      setContracts(Array.isArray(contractsResponse.data) ? contractsResponse.data : []);
      setTenants(Array.isArray(tenantsResponse.data) ? tenantsResponse.data : []);
      setProperties(Array.isArray(propertiesResponse.data) ? propertiesResponse.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load contracts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => ({
    total: contracts.length,
    active: contracts.filter((contract) => contract.status === 'active').length,
    expiringSoon: contracts.filter((contract) => {
      if (!contract.end_date) return false;
      const end = new Date(contract.end_date).getTime();
      const now = Date.now();
      const thirtyDays = 1000 * 60 * 60 * 24 * 30;
      return end > now && end - now <= thirtyDays;
    }).length,
  }), [contracts]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await Api.createOwnerContract({
        tenant_id: Number(form.tenant_id),
        property_id: Number(form.property_id),
        start_date: form.start_date,
        end_date: form.end_date,
        rent_amount: Number(form.rent_amount),
        terms: form.terms,
      });
      setSuccess('Contract created successfully.');
      setForm(initialForm);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to create contract.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Landlord Workspace</div>
        <h1 style={headingStyle}>Digital Contracts</h1>
        <p style={descriptionStyle}>
          Manage lease records with the live owner contracts API and create new agreements directly from your landlord dashboard.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginTop: '22px' }}>
          {[
            ['Total contracts', stats.total],
            ['Active', stats.active],
            ['Expiring soon', stats.expiringSoon],
          ].map(([label, value]) => (
            <div key={String(label)} style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{label}</div>
              <div style={{ fontSize: '30px', marginTop: '8px' }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...panelStyle, display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 0.9fr)', gap: '22px' }}>
        <div>
          {error && <div style={{ marginBottom: '16px', color: '#e07070' }}>{error}</div>}
          {success && <div style={{ marginBottom: '16px', color: '#70c490' }}>{success}</div>}
          {loading ? (
            <div style={{ color: '#9f9587' }}>Loading contracts...</div>
          ) : contracts.length === 0 ? (
            <div style={{ color: '#9f9587' }}>No contracts found yet.</div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tenant</th>
                    <th style={thStyle}>Property</th>
                    <th style={thStyle}>Term</th>
                    <th style={thStyle}>Rent</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id}>
                      <td style={tdStyle}>
                        <div>{contract.tenant?.user?.first_name} {contract.tenant?.user?.last_name}</div>
                        <div style={{ color: '#9f9587', marginTop: '4px' }}>{contract.tenant?.user?.email || 'No email'}</div>
                      </td>
                      <td style={tdStyle}>
                        <div>{contract.property?.title || 'Untitled property'}</div>
                        <div style={{ color: '#9f9587', marginTop: '4px' }}>{contract.property?.location || 'No location'}</div>
                      </td>
                      <td style={tdStyle}>
                        <div>{formatDate(contract.start_date)} to {formatDate(contract.end_date)}</div>
                        <div style={{ color: '#9f9587', marginTop: '4px' }}>{contract.terms || 'No terms summary'}</div>
                      </td>
                      <td style={tdStyle}>{formatCurrency(contract.rent_amount)}</td>
                      <td style={tdStyle}>
                        <span style={statusPillStyle(getStatusColor(contract.status))}>{contract.status || 'unknown'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px', alignContent: 'start' }}>
          <div style={{ fontSize: '18px' }}>Create Contract</div>
          <select style={selectStyle} value={form.tenant_id} onChange={(event) => setForm((current) => ({ ...current, tenant_id: event.target.value }))} required>
            <option value="">Select tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {(tenant.user?.first_name || '').trim()} {(tenant.user?.last_name || '').trim()} {tenant.property?.title ? `- ${tenant.property.title}` : ''}
              </option>
            ))}
          </select>
          <select style={selectStyle} value={form.property_id} onChange={(event) => setForm((current) => ({ ...current, property_id: event.target.value }))} required>
            <option value="">Select property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title} {property.location ? `- ${property.location}` : ''}
              </option>
            ))}
          </select>
          <input style={inputStyle} type="date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} required />
          <input style={inputStyle} type="date" value={form.end_date} onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))} required />
          <input style={inputStyle} type="number" min="0" placeholder="Monthly rent amount" value={form.rent_amount} onChange={(event) => setForm((current) => ({ ...current, rent_amount: event.target.value }))} required />
          <textarea style={textareaStyle} placeholder="Contract terms" value={form.terms} onChange={(event) => setForm((current) => ({ ...current, terms: event.target.value }))} required />
          <button type="submit" style={buttonStyle('primary')} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create contract'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default ContractsPage;
