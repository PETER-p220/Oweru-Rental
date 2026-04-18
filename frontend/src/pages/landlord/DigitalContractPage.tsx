import { useEffect, useState, useRef } from 'react';
import { FileText, Upload, Download, Save, Send, AlertCircle, MapPin, User, X, Plus } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatCurrency, formatDate, getStatusColor,
  headingStyle, inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  statusPillStyle, tableStyle, tableWrapStyle, tdStyle, thStyle,
} from './landlordPageStyles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContractField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'textarea' | 'signature';
  required: boolean;
  value?: string;
  placeholder?: string;
  validation?: string;
}

interface DigitalContract {
  id: number;
  title: string;
  property_id: number;
  tenant_id: number;
  status: 'draft' | 'pending' | 'signed' | 'rejected' | 'pending_signature' | 'pending_review' | 'approved';
  file_url?: string;
  file_name?: string;
  file_type?: string;
  fields: ContractField[];
  landlord_signature?: string;
  tenant_signature?: string;
  created_at?: string;
  updated_at?: string;
  property?: {
    id: number;
    title?: string;
    location?: string;
    price?: number;
  };
  tenant?: {
    id: number;
    user?: {
      first_name?: string;
      last_name?: string;
      email?: string;
    };
  };
}

interface PropertyOption {
  id: number;
  title?: string;
  location?: string;
  price?: number;
}

interface TenantOption {
  id: number;
  user_id?: number;
  property_id?: number;
  status?: string;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface ApprovedApplicant {
  id: number;
  status: string;
  user_id: number;
  property_id: number;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface ContractFormData {
  title: string;
  property_id: string;
  tenant_id: string;
  file: File | null;
  file_url: string;
  file_name: string;
  file_type: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE_MB = 10;

const DEFAULT_CONTRACT_FIELDS: ContractField[] = [
  { id: '1',  label: 'Full Name',                  type: 'text',      required: true,  placeholder: 'Enter your full name' },
  { id: '2',  label: 'Email Address',               type: 'text',      required: true,  placeholder: 'Enter your email' },
  { id: '3',  label: 'Phone Number',                type: 'text',      required: true,  placeholder: 'Enter your phone number' },
  { id: '4',  label: 'National ID / Passport',      type: 'text',      required: true,  placeholder: 'Enter ID number' },
  { id: '5',  label: 'Emergency Contact',           type: 'text',      required: false, placeholder: 'Name and phone number' },
  { id: '6',  label: 'Start Date',                  type: 'date',      required: true  },
  { id: '7',  label: 'End Date',                    type: 'date',      required: true  },
  { id: '8',  label: 'Monthly Rent',                type: 'number',    required: true,  placeholder: 'Amount in local currency' },
  { id: '9',  label: 'Security Deposit',            type: 'number',    required: true,  placeholder: 'Amount in local currency' },
  { id: '10', label: 'Special Terms',               type: 'textarea',  required: false, placeholder: 'Additional terms or conditions' },
  { id: '11', label: 'Landlord Signature',          type: 'signature', required: true  },
  { id: '12', label: 'Tenant Signature',            type: 'signature', required: true  },
];

const EMPTY_FORM: ContractFormData = {
  title: '', property_id: '', tenant_id: '',
  file: null, file_url: '', file_name: '', file_type: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getTenantLabel = (t: TenantOption): string => {
  const name  = `${t.user?.first_name ?? ''} ${t.user?.last_name ?? ''}`.trim()
                  || `User #${t.user_id ?? t.id}`;
  const email = t.user?.email ? ` — ${t.user.email}` : '';
  return `${name}${email}`;
};

const resolveContractTenant = (contract: DigitalContract, tenants: TenantOption[]): string => {
  const match = tenants.find(
    (t) => t.id === contract.tenant_id || t.user_id === contract.tenant_id,
  );
  if (!match) return 'Unknown';
  return `${match.user?.first_name ?? ''} ${match.user?.last_name ?? ''}`.trim()
    || `User #${contract.tenant_id}`;
};

const formatStatus = (status: string): string =>
  status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');

// ---------------------------------------------------------------------------
// Inline styles (kept co-located for portability)
// ---------------------------------------------------------------------------

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  width: '100%',
  color: '#ffffff',
  backgroundColor: '#1e1a12',
};

const optionStyle: React.CSSProperties = {
  color: '#ffffff',
  backgroundColor: '#2a2418',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DigitalContractPage = () => {
  const [contracts,   setContracts]   = useState<DigitalContract[]>([]);
  const [properties,  setProperties]  = useState<PropertyOption[]>([]);
  const [tenants,     setTenants]     = useState<TenantOption[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [formData,    setFormData]    = useState<ContractFormData>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [contractsRes, propertiesRes] = await Promise.all([
        Api.getDigitalContracts(),
        Api.getOwnerProperties(),
      ]);

      const contractsData: DigitalContract[] =
        Array.isArray((contractsRes as any).data)       ? (contractsRes as any).data :
        Array.isArray((contractsRes as any).data?.data) ? (contractsRes as any).data.data : [];

      setContracts(contractsData);
      setProperties(Array.isArray((propertiesRes as any).data) ? (propertiesRes as any).data : []);

      // Merge active tenants + approved applicants into a single de-duped list
      const seen    = new Set<string>();
      const merged: TenantOption[] = [];

      const dedupe = (t: TenantOption) => {
        const key = `${t.user_id ?? t.id}-${t.property_id ?? ''}`;
        if (!seen.has(key)) { seen.add(key); merged.push(t); }
      };

      try {
        const tenantsRes = await Api.getMyTenants();
        (Array.isArray(tenantsRes.data) ? tenantsRes.data : []).forEach(dedupe);
      } catch { /* no active tenants yet — that's fine */ }

      try {
        const applicationsRes = await Api.getOwnerApplications();
        const approved: ApprovedApplicant[] = (
          Array.isArray(applicationsRes.data) ? applicationsRes.data : []
        ).filter((a: ApprovedApplicant) => a.status === 'approved');

        approved.forEach((a) =>
          dedupe({
            id:          a.user_id,
            user_id:     a.user_id,
            property_id: a.property_id,
            status:      a.status,
            user:        a.user,
          }),
        );
      } catch { /* applications endpoint may not be available */ }

      setTenants(merged);

    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── File upload ────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Only PDF and Word documents (.pdf, .doc, .docx) are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size must be less than ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tenant_id', formData.tenant_id);

      const uploadResponse = await Api.uploadContractFile(fd);

      setFormData((prev) => ({
        ...prev,
        file,
        file_url:  uploadResponse.data.file_path,
        file_name: file.name,
        file_type: file.type,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  // ── Create contract ────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.property_id || !formData.tenant_id) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!formData.file) {
      setError('Please upload a contract document before submitting.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await Api.createDigitalContract({
        title:       formData.title,
        property_id: parseInt(formData.property_id),
        tenant_id:   parseInt(formData.tenant_id),
        file_url:    formData.file_url,
        file_name:   formData.file_name,
        file_type:   formData.file_type,
        fields:      DEFAULT_CONTRACT_FIELDS,
        status:      'draft',
      });

      await loadData();
      closeModal();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create contract.');
    } finally {
      setCreating(false);
    }
  };

  // ── Contract actions ───────────────────────────────────────────────────────

  const sendToTenant = async (contractId: number) => {
    try {
      setError('');
      await Api.sendContractToTenant(contractId);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send contract to tenant.');
    }
  };

  const downloadContract = async (contractId: number, fileName: string) => {
    try {
      const response = await Api.downloadLandlordDigitalContract(contractId);
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to download contract.');
    }
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openModal  = () => { setShowModal(true); setError(''); };
  const closeModal = () => {
    setShowModal(false);
    setFormData(EMPTY_FORM);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const setField = (key: keyof ContractFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // ── Property lookup helper ─────────────────────────────────────────────────

  const findProperty = (contract: DigitalContract): PropertyOption | undefined =>
    properties.find((p) => p.id === contract.property_id);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ ...pageStyle, padding: '0' }}>

      {/* ── Header ── */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 32, right: 32, height: '2px',
          background: `linear-gradient(90deg, transparent, ${palette.amber}, transparent)`,
        }} />

        <div style={sectionTitleStyle}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: palette.amber, display: 'inline-block', marginRight: 6,
          }} />
          Landlord Workspace
        </div>
        <h1 style={headingStyle}>Digital Contracts</h1>
        <p style={descriptionStyle}>Upload contract documents and manage digital signatures.</p>

        <button
          style={{ ...buttonStyle('primary'), marginTop: '20px' }}
          onClick={openModal}
        >
          <Plus size={16} /> Create Digital Contract
        </button>
      </section>

      {/* ── Contracts list ── */}
      <section style={panelStyle}>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            color: 'var(--error)', background: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            borderRadius: '12px', padding: '14px 18px',
            marginBottom: '20px', fontSize: '14px',
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.muted, padding: '40px 0' }}>
            <div style={{
              width: 16, height: 16,
              border: `2px solid ${palette.amber}`, borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            Loading contracts…
          </div>

        ) : contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.muted }}>
            <FileText size={48} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '16px', color: palette.cream }}>No digital contracts found</div>
            <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>
              Create your first digital contract to get started.
            </div>
          </div>

        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Contract Details', 'Property', 'Tenant', 'Created', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => {
                  const property = contract.property ?? findProperty(contract);
                  return (
                    <tr
                      key={contract.id}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Contract details */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: palette.cream }}>{contract.title}</div>
                        <div style={{ color: palette.muted, fontSize: '13px', marginTop: '4px' }}>
                          {contract.file_name}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '12px' }}>
                          <span style={{ color: palette.muted }}>
                            {contract.file_type?.split('/').pop()?.toUpperCase() || 'PDF'}
                          </span>
                          {contract.fields?.length > 0 && (
                            <span style={{ color: palette.amber }}>
                              {contract.fields.length} fields
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Property */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: palette.cream }}>
                          {property?.title || 'Unknown Property'}
                        </div>
                        {property?.location && (
                          <div style={{ color: palette.muted, fontSize: '13px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> {property.location}
                          </div>
                        )}
                        {property?.price && (
                          <div style={{ color: palette.amber, fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                            {formatCurrency(property.price)}
                          </div>
                        )}
                      </td>

                      {/* Tenant */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: palette.cream }}>
                          <User size={12} />
                          <div>
                            <div>{resolveContractTenant(contract, tenants)}</div>
                            <div style={{ fontSize: '12px', color: palette.muted, marginTop: '2px' }}>
                              ID: {contract.tenant_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td style={tdStyle}>
                        <div style={{ fontSize: '13px', color: palette.cream }}>
                          {formatDate(contract.created_at)}
                        </div>
                        <div style={{ fontSize: '11px', color: palette.muted, marginTop: '2px' }}>
                          {contract.updated_at && contract.updated_at !== contract.created_at ? 'Updated' : 'Created'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={tdStyle}>
                        <span style={statusPillStyle(getStatusColor(contract.status))}>
                          {formatStatus(contract.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: '12px', borderRadius: '8px' }}
                            onClick={() => downloadContract(contract.id, contract.file_name || 'contract.pdf')}
                          >
                            <Download size={11} /> Download
                          </button>

                          {contract.status === 'draft' && (
                            <button
                              style={{ ...buttonStyle('primary'), padding: '5px 10px', fontSize: '12px', borderRadius: '8px' }}
                              onClick={() => sendToTenant(contract.id)}
                            >
                              <Send size={11} /> Send to Tenant
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Create Contract Modal ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
        }}>
          <div style={{
            ...panelStyle,
            maxWidth: '600px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ ...headingStyle, fontSize: '20px' }}>Create Digital Contract</h2>
              <button
                style={{ ...buttonStyle('secondary'), padding: '8px', borderRadius: '8px' }}
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Inline modal errors */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                color: 'var(--error)', background: 'var(--error-bg)',
                border: '1px solid var(--error-border)',
                borderRadius: '10px', padding: '12px 16px',
                marginBottom: '16px', fontSize: '14px',
              }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Contract title */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: palette.cream, fontSize: '14px', fontWeight: 500 }}>
                    Contract Title *
                  </label>
                  <input
                    style={{ ...inputStyle, width: '100%' }}
                    value={formData.title}
                    onChange={(e) => setField('title', e.target.value)}
                    placeholder="e.g. 12-Month Residential Lease — Unit 4B"
                    required
                  />
                </div>

                {/* Property + Tenant */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: palette.cream, fontSize: '14px', fontWeight: 500 }}>
                      Property *
                    </label>
                    <select
                      style={selectStyle}
                      value={formData.property_id}
                      onChange={(e) => setField('property_id', e.target.value)}
                      required
                    >
                      <option value="" style={optionStyle}>Select property…</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id} style={optionStyle}>
                          {p.title}{p.location ? ` — ${p.location}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: palette.cream, fontSize: '14px', fontWeight: 500 }}>
                      Tenant *
                    </label>
                    {tenants.length === 0 ? (
                      <div style={{
                        ...(inputStyle as React.CSSProperties),
                        width: '100%', display: 'flex', alignItems: 'center',
                        color: palette.muted, fontSize: '13px',
                      }}>
                        No approved tenants found
                      </div>
                    ) : (
                      <select
                        style={selectStyle}
                        value={formData.tenant_id}
                        onChange={(e) => setField('tenant_id', e.target.value)}
                        required
                      >
                        <option value="" style={optionStyle}>Select tenant…</option>
                        {tenants.map((t) => (
                          <option
                            key={`${t.id}-${t.user_id ?? ''}`}
                            value={t.id}
                            style={optionStyle}
                          >
                            {getTenantLabel(t)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {tenants.length > 0 && (
                  <div style={{ fontSize: '12px', color: palette.muted, marginTop: '-8px' }}>
                    {tenants.length} approved tenant{tenants.length !== 1 ? 's' : ''} available
                  </div>
                )}

                {/* File upload */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: palette.cream, fontSize: '14px', fontWeight: 500 }}>
                    Contract Document * <span style={{ color: palette.muted, fontWeight: 400 }}>(PDF or Word, max {MAX_FILE_SIZE_MB} MB)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    style={{
                      ...buttonStyle('secondary'),
                      width: '100%', padding: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload size={16} />
                    {uploading ? 'Uploading…' : formData.file_name ? formData.file_name : 'Choose file'}
                  </button>
                </div>

                {/* Footer actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="button"
                    style={{ ...buttonStyle('secondary'), padding: '10px 20px' }}
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ ...buttonStyle('primary'), padding: '10px 20px' }}
                    disabled={uploading || creating}
                  >
                    <Save size={16} />
                    {creating ? 'Creating…' : 'Create Contract'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DigitalContractPage;