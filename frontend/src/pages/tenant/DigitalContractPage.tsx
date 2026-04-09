import { useEffect, useState, useRef } from 'react';
import { FileText, Download, Eye, Save, Send, AlertCircle, CheckCircle, Calendar, DollarSign, MapPin, User, PenTool, Clock, Check, X } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatCurrency, formatDate, getStatusColor,
  headingStyle, inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  statusPillStyle, tableStyle, tableWrapStyle, tdStyle, thStyle, textareaStyle,
} from './tenantPageStyles';

interface ContractField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'textarea' | 'signature';
  required: boolean;
  value?: string;
  placeholder?: string;
  validation?: string;
  tenant_value?: string;
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
  property?: {
    title?: string;
    location?: string;
    price?: number;
  };
}

const DigitalContractPage = () => {
  const [contracts, setContracts] = useState<DigitalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState<DigitalContract | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await Api.getTenantDigitalContracts();
      setContracts(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const viewContract = (contract: DigitalContract) => {
    setSelectedContract(contract);
    // Initialize field values with existing tenant values
    const initialValues: Record<string, string> = {};
    contract.fields.forEach(field => {
      initialValues[field.id] = field.tenant_value || '';
    });
    setFieldValues(initialValues);
    setShowContractModal(true);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const downloadContract = async (contractId: number, fileName: string) => {
    try {
      const response = await Api.downloadDigitalContract(contractId);
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = palette.amber;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL();
    setSignatureDataUrl(dataUrl);
    setShowSignatureModal(false);
  };

  const submitContract = async () => {
    if (!selectedContract) return;

    // Validate required fields
    const missingFields = selectedContract.fields.filter(field => 
      field.required && !fieldValues[field.id]
    );

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    if (!signatureDataUrl) {
      setError('Please provide your signature');
      return;
    }

    try {
      setSubmitting(true);
      const submissionData = {
        contract_id: selectedContract.id,
        field_values: fieldValues,
        signature: signatureDataUrl,
      };

      await Api.submitDigitalContract(submissionData);
      await loadContracts();
      setShowContractModal(false);
      setSelectedContract(null);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit contract');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: ContractField) => {
    const value = fieldValues[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <input
            style={{ ...inputStyle, width: '100%' }}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={selectedContract?.status === 'signed'}
            required={field.required}
          />
        );

      case 'date':
        return (
          <input
            style={{ ...inputStyle, width: '100%' }}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={selectedContract?.status === 'signed'}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            style={{ ...inputStyle, width: '100%' }}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={selectedContract?.status === 'signed'}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            style={{ ...textareaStyle, width: '100%', minHeight: '80px' }}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={selectedContract?.status === 'signed'}
            required={field.required}
          />
        );

      case 'signature':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {signatureDataUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <span style={{ color: '#10b981', fontSize: '14px' }}>Signature provided</span>
                <button
                  style={{ ...buttonStyle('secondary'), padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => setShowSignatureModal(true)}
                  disabled={selectedContract?.status === 'signed'}
                >
                  <PenTool size={12} /> Edit
                </button>
              </div>
            ) : (
              <button
                style={{ ...buttonStyle('primary'), padding: '8px 16px' }}
                onClick={() => setShowSignatureModal(true)}
                disabled={selectedContract?.status === 'signed'}
              >
                <PenTool size={16} /> Add Signature
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ ...pageStyle, padding: '0' }}>
      {/* Header */}
      <section style={{ ...panelStyle }}>
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: `linear-gradient(90deg, transparent, ${palette.amber}, transparent)` }} />
        <div style={sectionTitleStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.amber, display: 'inline-block' }} />
          Tenant Workspace
        </div>
        <h1 style={headingStyle}>Digital Contracts</h1>
        <p style={descriptionStyle}>View and sign your rental contracts online.</p>
      </section>

      {/* Contracts List */}
      <section style={{ ...panelStyle }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px' }}>
            <AlertCircle size={16} /> {error}
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
            <div style={{ fontSize: '16px' }}>No contracts found</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>Your landlord will send contracts here</div>
          </div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>{['Contract', 'Property', 'Status', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{contract.title}</div>
                      <div style={{ color: palette.muted, fontSize: '13px', marginTop: '4px' }}>
                        {formatDate(contract.created_at)}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} />
                        {contract.property?.title || 'Unknown'}
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
                        <button
                          style={{ ...buttonStyle('primary'), padding: '5px 10px', fontSize: '12px', borderRadius: '8px' }}
                          onClick={() => viewContract(contract)}
                        >
                          <Eye size={11} /> View & Sign
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Contract View Modal */}
      {showContractModal && selectedContract && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ ...panelStyle, maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ ...headingStyle, fontSize: '20px' }}>{selectedContract.title}</h2>
                <p style={{ color: palette.muted, fontSize: '14px', marginTop: '4px' }}>
                  Property: {selectedContract.property?.title} - {selectedContract.property?.location}
                </p>
              </div>
              <button
                style={{ ...buttonStyle('ghost'), padding: '8px', borderRadius: '8px' }}
                onClick={() => { setShowContractModal(false); setSelectedContract(null); }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {selectedContract.fields.map((field) => (
                <div key={field.id}>
                  <label style={{ display: 'block', marginBottom: '8px', color: palette.cream, fontSize: '14px', fontWeight: 500 }}>
                    {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  style={{ ...buttonStyle('ghost'), padding: '10px 20px' }}
                  onClick={() => { setShowContractModal(false); setSelectedContract(null); }}
                >
                  Cancel
                </button>
                {selectedContract.status === 'pending' && (
                  <button
                    style={{ ...buttonStyle('primary'), padding: '10px 20px' }}
                    onClick={submitContract}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div style={{ width: 14, height: 14, border: `2px solid ${palette.cream}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '8px' }} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Submit Contract
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1001, padding: '20px'
        }}>
          <div style={{ ...panelStyle, maxWidth: '500px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ ...headingStyle, fontSize: '18px' }}>Add Your Signature</h3>
              <button
                style={{ ...buttonStyle('ghost'), padding: '8px', borderRadius: '8px' }}
                onClick={() => setShowSignatureModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: palette.muted, fontSize: '14px' }}>
                Draw your signature in the box below:
              </p>

              <div style={{
                border: `2px solid ${palette.borderSoft}`,
                borderRadius: '8px',
                background: '#0a0a0a',
                position: 'relative'
              }}>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  style={{ 
                    width: '100%', 
                    height: '150px',
                    cursor: 'crosshair',
                    touchAction: 'none'
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                <button
                  style={{ ...buttonStyle('secondary'), padding: '8px 16px' }}
                  onClick={clearSignature}
                >
                  Clear
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{ ...buttonStyle('ghost'), padding: '8px 16px' }}
                    onClick={() => setShowSignatureModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    style={{ ...buttonStyle('primary'), padding: '8px 16px' }}
                    onClick={saveSignature}
                  >
                    Save Signature
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DigitalContractPage;
