import { useEffect, useState, useRef } from 'react';
import {
  FileText, Download, Eye, Send, AlertCircle, CheckCircle,
  MapPin, PenTool, X, Clock, User, Calendar, FileCheck,
} from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatDate, getStatusColor,
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
  status: 'draft' | 'pending_signature' | 'pending_review' | 'approved' | 'rejected';
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
  const [contracts, setContracts]             = useState<DigitalContract[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');
  const [selectedContract, setSelectedContract] = useState<DigitalContract | null>(null);
  const [showContractModal, setShowContractModal]   = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [fieldValues, setFieldValues]         = useState<Record<string, string>>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [isDrawing, setIsDrawing]             = useState(false);
  const canvasRef                             = useRef<HTMLCanvasElement>(null);
  const [submitting, setSubmitting]           = useState(false);

  useEffect(() => { loadContracts(); }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await Api.getTenantDigitalContracts();
      setContracts(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load contracts');
    } finally { setLoading(false); }
  };

  const viewContract = (contract: DigitalContract) => {
    setSelectedContract(contract);
    const initialValues: Record<string, string> = {};
    (contract.fields || []).forEach(field => { initialValues[field.id] = field.tenant_value || ''; });
    setFieldValues(initialValues);
    setShowContractModal(true);
  };

  const handleFieldChange = (fieldId: string, value: string) =>
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));

  const downloadContract = async (contractId: number, fileName: string) => {
    try {
      const response = await Api.downloadDigitalContract(contractId);
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to download contract');
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current; if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const ctx    = canvas.getContext('2d'); if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const ctx    = canvas.getContext('2d'); if (!ctx) return;
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.strokeStyle = palette.gold;           // Oweru gold signature
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    if (dataUrl === 'data:,') {
      setError('Please provide a signature before saving');
      return;
    }
    setSignatureDataUrl(dataUrl);
    setShowSignatureModal(false);
  };

  // Helper functions for contract status
  const getContractStatusColor = (status: string): string => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'pending_signature': return '#c9a84c';
      case 'pending_review': return '#3b82f6';
      case 'approved': return '#16a34a';
      case 'rejected': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getContractStatusText = (status: string): string => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'pending_signature': return 'Awaiting Signature';
      case 'pending_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getContractActionButton = (contract: DigitalContract) => {
    if (contract.status === 'pending_signature') {
      return (
        <button
          style={{ ...buttonStyle('primary'), padding: '5px 10px', fontSize: '12px' }}
          onClick={() => viewContract(contract)}
        >
          <PenTool size={11} /> Sign Contract
        </button>
      );
    }
    
    if (['pending_review', 'approved'].includes(contract.status)) {
      return (
        <button
          style={{ ...buttonStyle('ghost'), padding: '5px 10px', fontSize: '12px' }}
          onClick={() => viewContract(contract)}
        >
          <Eye size={11} /> View Details
        </button>
      );
    }
    
    return (
      <button
        style={{ ...buttonStyle('ghost'), padding: '5px 10px', fontSize: '12px' }}
        onClick={() => viewContract(contract)}
      >
        <Eye size={11} /> View
      </button>
    );
  };

  const submitContract = async () => {
    if (!selectedContract) return;
    const missingFields = (selectedContract.fields || []).filter(f => f.required && !fieldValues[f.id]);
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }
    if (!signatureDataUrl) { setError('Please provide your signature'); return; }
    try {
      setSubmitting(true);
      await Api.submitDigitalContract({
        contract_id: selectedContract.id,
        fields: fieldValues,
        signature: signatureDataUrl,
      });
      await loadContracts();
      setShowContractModal(false); setSelectedContract(null); 
      setError('');
      alert('Contract submitted successfully! Your landlord will be notified for review.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit contract');
    } finally { setSubmitting(false); }
  };

  const renderField = (field: ContractField) => {
    const value    = fieldValues[field.id] || '';
    const isDisabled = ['approved', 'pending_review'].includes(selectedContract?.status || '');
    const common   = { style: { ...inputStyle, width: '100%' }, disabled: isDisabled, required: field.required };

    switch (field.type) {
      case 'text':
        return <input {...common} value={value} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} />;
      case 'date':
        return <input {...common} type="date" value={value} onChange={e => handleFieldChange(field.id, e.target.value)} />;
      case 'number':
        return <input {...common} type="number" value={value} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} />;
      case 'textarea':
        return (
          <textarea
            style={{ ...textareaStyle, width: '100%', minHeight: '80px' }}
            value={value}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={isDisabled} required={field.required}
          />
        );
      case 'signature':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {signatureDataUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} style={{ color: '#16a34a' }} />
                <span style={{ color: '#16a34a', fontSize: '14px' }}>Signature provided</span>
                <button
                  style={{ ...buttonStyle('secondary'), padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => setShowSignatureModal(true)} disabled={isDisabled}
                >
                  <PenTool size={12} /> Edit
                </button>
              </div>
            ) : (
              <button
                style={{ ...buttonStyle('primary'), padding: '8px 16px' }}
                onClick={() => setShowSignatureModal(true)} disabled={isDisabled}
              >
                <PenTool size={16} /> Add Signature
              </button>
            )}
          </div>
        );
      default: return null;
    }
  };

  // ── Shared overlay style ──────────────────────────────────────────────────
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(15, 23, 42, 0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
    backdropFilter: 'blur(4px)',
  };

  return (
    <div style={{ ...pageStyle, padding: '0' }}>

      {/* ── Header ── */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 32, right: 32, height: '2px',
          background: `linear-gradient(90deg, transparent, ${palette.gold}, transparent)`,
        }} />
        <div style={sectionTitleStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.gold, display: 'inline-block', marginRight: 6 }} />
          Tenant Workspace
        </div>
        <h1 style={headingStyle}>Digital Contracts</h1>
        <p style={descriptionStyle}>View and sign your rental contracts online.</p>
      </section>

      {/* ── Contracts list ── */}
      <section style={{ ...panelStyle }}>
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            color: '#dc2626', background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.18)',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px',
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.gray400, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading contracts…
          </div>
        ) : contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.gray400 }}>
            <FileText size={48} style={{ opacity: 0.25, margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '16px', fontWeight: 600 }}>No contracts found</div>
            <div style={{ fontSize: '13px', opacity: 0.7, marginTop: 4 }}>Your landlord will send contracts here</div>
          </div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>{['Contract', 'Property', 'Status', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr
                    key={contract.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,145,40,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: palette.navy900 }}>{contract.title}</div>
                      <div style={{ color: palette.gray400, fontSize: '13px', marginTop: '4px' }}>{formatDate(contract.created_at)}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: palette.gray600 }}>
                        <MapPin size={12} style={{ color: palette.gold }} />
                        {contract.property?.title || 'Unknown'}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={statusPillStyle(getContractStatusColor(contract.status))}>
                        {getContractStatusText(contract.status)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          style={{ ...buttonStyle('ghost'), padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => downloadContract(contract.id, contract.file_name || 'contract.pdf')}
                        >
                          <Download size={11} /> Download
                        </button>
                        {getContractActionButton(contract)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Contract View Modal ── */}
      {showContractModal && selectedContract && (
        <div style={overlayStyle}>
          <div style={{ ...panelStyle, maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ ...headingStyle, fontSize: '20px' }}>{selectedContract.title}</h2>
                <p style={{ color: palette.gray500, fontSize: '14px', marginTop: '4px' }}>
                  {selectedContract.property?.title} — {selectedContract.property?.location}
                </p>
              </div>
              <button
                style={{ ...buttonStyle('ghost'), padding: '8px' }}
                onClick={() => { setShowContractModal(false); setSelectedContract(null); }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(selectedContract.fields || []).map((field) => (
                <div key={field.id}>
                  <label style={{ display: 'block', marginBottom: '8px', color: palette.navy700, fontSize: '14px', fontWeight: 600 }}>
                    {field.label}{' '}
                    {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  color: '#dc2626', fontSize: '13px',
                  background: 'rgba(220,38,38,0.06)',
                  border: '1px solid rgba(220,38,38,0.18)',
                  borderRadius: 8, padding: '10px 14px',
                }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  style={{ ...buttonStyle('ghost'), padding: '10px 20px' }}
                  onClick={() => { setShowContractModal(false); setSelectedContract(null); }}
                >
                  Cancel
                </button>
                {selectedContract.status === 'pending_signature' && (
                  <button
                    style={{ ...buttonStyle('primary'), padding: '10px 20px' }}
                    onClick={submitContract} disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div style={{ width: 14, height: 14, border: `2px solid ${palette.offWhite}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8 }} />
                        Submitting…
                      </>
                    ) : (
                      <><Send size={16} /> Submit for Review</>
                    )}
                  </button>
                )}
                {selectedContract.status === 'pending_review' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px', background: 'rgba(37,99,235,0.1)',
                    border: '1px solid rgba(37,99,235,0.2)', borderRadius: '8px',
                    color: palette.navy700, fontSize: '14px'
                  }}>
                    <Clock size={16} /> Under Review
                  </div>
                )}
                {selectedContract.status === 'approved' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px', background: 'rgba(22,163,74,0.1)',
                    border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px',
                    color: '#16a34a', fontSize: '14px'
                  }}>
                    <CheckCircle size={16} /> Contract Approved
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Signature Modal ── */}
      {showSignatureModal && (
        <div style={{ ...overlayStyle, zIndex: 1001 }}>
          <div style={{ ...panelStyle, maxWidth: '500px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ ...headingStyle, fontSize: '18px' }}>Add Your Signature</h3>
              <button style={{ ...buttonStyle('ghost'), padding: '8px' }} onClick={() => setShowSignatureModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: palette.gray500, fontSize: '14px' }}>Draw your signature in the box below:</p>

              {/* Canvas */}
              <div style={{
                border: `1.5px solid ${palette.goldBorder}`,
                borderRadius: '8px',
                background: palette.offWhite,
                overflow: 'hidden',
              }}>
                <canvas
                  ref={canvasRef}
                  width={460} height={150}
                  style={{ width: '100%', height: '150px', cursor: 'crosshair', touchAction: 'none', display: 'block' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                <button style={{ ...buttonStyle('ghost'), padding: '8px 16px' }} onClick={clearSignature}>
                  Clear
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ ...buttonStyle('ghost'), padding: '8px 16px' }} onClick={() => setShowSignatureModal(false)}>
                    Cancel
                  </button>
                  <button style={{ ...buttonStyle('primary'), padding: '8px 16px' }} onClick={saveSignature}>
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