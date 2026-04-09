import { useEffect, useState, useRef } from 'react';
import { FileText, Upload, Download, Eye, Save, Send, AlertCircle, CheckCircle, Calendar, DollarSign, MapPin, User, X, Plus } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatCurrency, formatDate, getStatusColor,
  headingStyle, inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  statusPillStyle, tableStyle, tableWrapStyle, tdStyle, thStyle, textareaStyle,
} from './landlordPageStyles';

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
  status: 'draft' | 'pending' | 'signed' | 'rejected';
  file_url?: string;
  file_name?: string;
  file_type?: string;
  fields: ContractField[];
  landlord_signature?: string;
  tenant_signature?: string;
  created_at?: string;
  updated_at?: string;
}

interface PropertyOption {
  id: number;
  title?: string;
  location?: string;
  price?: number;
}

interface TenantOption {
  id: number;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

const DigitalContractPage = () => {
  const [contracts, setContracts] = useState<DigitalContract[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<DigitalContract | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    property_id: '',
    tenant_id: '',
    file: null as File | null,
    file_url: '',
    file_name: '',
    file_type: '',
    fields: [] as ContractField[],
  });

  const defaultFields: ContractField[] = [
    { id: '1', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name' },
    { id: '2', label: 'Email Address', type: 'text', required: true, placeholder: 'Enter your email' },
    { id: '3', label: 'Phone Number', type: 'text', required: true, placeholder: 'Enter your phone number' },
    { id: '4', label: 'National ID/Passport Number', type: 'text', required: true, placeholder: 'Enter ID number' },
    { id: '5', label: 'Emergency Contact', type: 'text', required: false, placeholder: 'Emergency contact name and phone' },
    { id: '6', label: 'Start Date', type: 'date', required: true },
    { id: '7', label: 'End Date', type: 'date', required: true },
    { id: '8', label: 'Monthly Rent', type: 'number', required: true, placeholder: 'Enter monthly rent amount' },
    { id: '9', label: 'Security Deposit', type: 'number', required: true, placeholder: 'Enter security deposit amount' },
    { id: '10', label: 'Special Terms', type: 'textarea', required: false, placeholder: 'Any special terms or conditions' },
    { id: '11', label: 'Landlord Signature', type: 'signature', required: true },
    { id: '12', label: 'Tenant Signature', type: 'signature', required: true },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contractsRes, propertiesRes, tenantsRes] = await Promise.all([
        Api.getOwnerContracts(),
        Api.getOwnerProperties(),
        Api.getMyTenants(),
      ]);

      setContracts(Array.isArray(contractsRes.data) ? contractsRes.data : []);
      setProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : []);
      setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF and Word documents are allowed');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload file to server
      const uploadResponse = await Api.uploadContractFile(formData);
      
      setFormData(prev => ({
        ...prev,
        file,
        file_url: uploadResponse.data.file_url,
        file_name: file.name,
        file_type: file.type,
      }));
      
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.property_id || !formData.tenant_id) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.file) {
      setError('Please upload a contract document');
      return;
    }

    try {
      const contractData = {
        title: formData.title,
        property_id: parseInt(formData.property_id),
        tenant_id: parseInt(formData.tenant_id),
        file_url: formData.file_url,
        file_name: formData.file_name,
        file_type: formData.file_type,
        fields: defaultFields,
        status: 'draft',
      };

      await Api.createDigitalContract(contractData);
      await loadData();
      setShowModal(false);
      resetForm();
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create contract');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      property_id: '',
      tenant_id: '',
      file: null,
      file_url: '',
      file_name: '',
      file_type: '',
      fields: [],
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendToTenant = async (contractId: number) => {
    try {
      await Api.sendContractToTenant(contractId);
      await loadData();
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send contract to tenant');
    }
  };

  const downloadContract = async (contractId: number, fileName: string) => {
    try {
      const response = await Api.downloadLandlordDigitalContract(contractId);
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to download contract');
    }
  };

  return (
    <div style={{ ...pageStyle, padding: '0' }}>
      {/* Header */}
      <section style={{ ...panelStyle }}>
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: `linear-gradient(90deg, transparent, ${palette.amber}, transparent)` }} />
        <div style={sectionTitleStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.amber, display: 'inline-block' }} />
          Landlord Workspace
        </div>
        <h1 style={headingStyle}>Digital Contracts</h1>
        <p style={descriptionStyle}>Upload contract documents and manage digital signatures.</p>
        
        <button
          style={{ ...buttonStyle('primary'), marginTop: '20px' }}
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} /> Create Digital Contract
        </button>
      </section>

      {/* Contracts List */}
      <section style={{ ...panelStyle }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px' }}>
            <AlertCircle size={16} style={{ color: '#f87171' }} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.muted, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.amber}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading contracts...
          </div>
        ) : contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.muted }}>
            <FileText size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <div style={{ fontSize: '16px' }}>No digital contracts found</div>
            <div style={{ fontSize: '13px', opacity: 0.7, color: palette.muted }}>Create your first digital contract to get started</div>
          </div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>{['Contract', 'Property', 'Tenant', 'Status', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{contract.title}</div>
                      <div style={{ color: palette.muted, fontSize: '13px', marginTop: '4px' }}>
                        {contract.file_name}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} />
                        {properties.find(p => p.id === contract.property_id)?.title || 'Unknown'}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} />
                        {tenants.find(t => t.id === contract.tenant_id)?.user?.first_name || 'Unknown'} {tenants.find(t => t.id === contract.tenant_id)?.user?.last_name || ''}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={statusPillStyle(getStatusColor(contract.status))}>
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    </td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create Contract Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ ...panelStyle, maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ ...headingStyle, fontSize: '20px' }}>Create Digital Contract</h2>
              <button
                style={{ ...buttonStyle('secondary'), padding: '8px', borderRadius: '8px' }}
                onClick={() => { setShowModal(false); resetForm(); }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: palette.cream, fontSize: '14px', fontWeight: 500 }}>
                    Contract Title *
                  </label>
                  <input
                    style={{ ...inputStyle, width: '100%' }}
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter contract title"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: palette.cream, fontSize: '14px', fontWeight: 500 }}>
                      Property *
                    </label>
                    <select
                      style={{ ...inputStyle, width: '100%' }}
                      value={formData.property_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, property_id: e.target.value }))}
                      required
                    >
                      <option value="">Select Property</option>
                      {properties.map(property => (
                        <option key={property.id} value={property.id}>
                          {property.title} - {property.location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: palette.cream, fontSize: '14px', fontWeight: 500 }}>
                      Tenant *
                    </label>
                    <select
                      style={{ ...inputStyle, width: '100%' }}
                      value={formData.tenant_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, tenant_id: e.target.value }))}
                      required
                    >
                      <option value="">Select Tenant</option>
                      {tenants.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.user?.first_name} {tenant.user?.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: palette.cream, fontSize: '14px', fontWeight: 500 }}>
                    Contract Document * (PDF or Word)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      style={{ ...buttonStyle('secondary'), width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload size={16} />
                      {uploading ? 'Uploading...' : formData.file ? formData.file_name : 'Choose File'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button
                    type="button"
                    style={{ ...buttonStyle('secondary'), padding: '10px 20px' }}
                    onClick={() => { setShowModal(false); resetForm(); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ ...buttonStyle('primary'), padding: '10px 20px' }}
                    disabled={uploading}
                  >
                    <Save size={16} /> Create Contract
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
