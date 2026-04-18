import { useEffect, useState, useRef } from 'react';
import {
  FileText, Download, Eye, Send, AlertCircle, CheckCircle,
  MapPin, PenTool, X, Clock, FileCheck,
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
  file_path?: string;
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

// ── Safely parse fields regardless of how they arrive from the DB ─────────────
// Eloquent JSON casts sometimes return a string if the cast is missing.
const parseFields = (raw: any): ContractField[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  return [];
};

// Only hide genuine drafts. Previous versions also hid contracts without files
// OR without fields, which caused contracts to disappear when fields failed to
// parse or when only file_path (not file_url) was set.
const isContractVisible = (c: DigitalContract) => c.status !== 'draft';

const DigitalContractPage = () => {
  const [contracts, setContracts]                   = useState<DigitalContract[]>([]);
  const [loading, setLoading]                       = useState(true);
  const [error, setError]                           = useState('');
  const [selectedContract, setSelectedContract]     = useState<DigitalContract | null>(null);
  const [showContractModal, setShowContractModal]   = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [fieldValues, setFieldValues]               = useState<Record<string, string>>({});
  const [signatureDataUrl, setSignatureDataUrl]     = useState('');
  const [isDrawing, setIsDrawing]                   = useState(false);
  const canvasRef                                   = useRef<HTMLCanvasElement>(null);
  const [submitting, setSubmitting]                 = useState(false);

  useEffect(() => { loadContracts(); }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await Api.getTenantDigitalContracts();

      console.log('[Tenant DigitalContracts] API response:', response);
      console.log('[Tenant DigitalContracts] Response status:', response.status);
      console.log('[Tenant DigitalContracts] Response data type:', typeof response.data);
      console.log('[Tenant DigitalContracts] Response data:', response.data);

      // ── Unwrap logic ──────────────────────────────────────────────────────
      //
      // Api.request() does: return { data: data.data ?? data, ... }
      //
      // So if backend returns { "data": [...] }:
      //   → response.data = [...]            (array, use directly)
      //
      // If backend returns { "data": { "data": [...], "pagination":{} } }:
      //   → response.data = { data: [...] }  (paginated object, unwrap .data)
      //
      const raw = response.data;
      console.log('[Tenant DigitalContracts] Raw data:', raw);

      let rawArray: any[];
      if (Array.isArray(response.data)) {
        rawArray = response.data;
      } else if (Array.isArray((response.data as any)?.data)) {
        rawArray = (response.data as any).data;
      } else {
        console.warn('[DigitalContracts] Unexpected API shape:', response.data);
        rawArray = [];
      }

      console.log('[DigitalContracts] Raw contracts:', rawArray);

      // Normalise: parse fields JSON, unify file_url/file_path
      const normalised: DigitalContract[] = rawArray.map((c: any) => ({
        ...c,
        fields:   parseFields(c.fields),
        file_url: c.file_url || c.file_path || undefined,
      }));

      console.log('[DigitalContracts] Normalised contracts:', normalised);
      
      const visibleContracts = normalised.filter(isContractVisible);
      console.log('[DigitalContracts] Visible contracts:', visibleContracts);

      setContracts(visibleContracts);
    } catch (err: any) {
      if (err?.response?.status === 503) {
        // Tables not yet migrated — not a real error, just show empty state
        setContracts([]);
      } else {
        setError(err?.response?.data?.message || 'Failed to load contracts');
      }
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowContractModal(false);
    setSelectedContract(null);
    setSignatureDataUrl('');
    setError('');
  };

  const viewContract = (contract: DigitalContract) => {
    setSelectedContract(contract);
    const init: Record<string, string> = {};
    contract.fields.forEach(f => { init[f.id] = f.tenant_value || f.value || ''; });
    setFieldValues(init);
    setSignatureDataUrl('');
    setShowContractModal(true);
  };

  const handleFieldChange = (id: string, val: string) =>
    setFieldValues(prev => ({ ...prev, [id]: val }));

  const downloadContract = async (contractId: number, fileName: string) => {
    try {
      const res  = await Api.downloadDigitalContract(contractId);
      const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: fileName });
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to download contract');
    }
  };

  // ── Signature canvas ──────────────────────────────────────────────────────

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const cv = canvasRef.current; if (!cv) return;
    const r  = cv.getBoundingClientRect();
    const ctx = cv.getContext('2d'); if (!ctx) return;
    ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const cv = canvasRef.current; if (!cv) return;
    const r  = cv.getBoundingClientRect();
    const ctx = cv.getContext('2d'); if (!ctx) return;
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = palette.gold;
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const cv = canvasRef.current; if (!cv) return;
    cv.getContext('2d')?.clearRect(0, 0, cv.width, cv.height);
    setSignatureDataUrl('');
  };

  const saveSignature = () => {
    const cv = canvasRef.current; if (!cv) return;
    const dataUrl = cv.toDataURL();
    // A blank canvas in Chrome produces a non-empty PNG — check pixel data instead
    const ctx = cv.getContext('2d');
    if (ctx) {
      const pixels = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const hasInk = pixels.some((v, i) => i % 4 === 3 && v > 0); // any non-transparent pixel
      if (!hasInk) { setError('Please draw your signature before saving'); return; }
    }
    setSignatureDataUrl(dataUrl);
    setShowSignatureModal(false);
    setError('');
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const statusColor = (s: string) =>
    ({ pending_signature: '#c9a84c', pending_review: '#3b82f6', approved: '#16a34a', rejected: '#dc2626' }[s] ?? '#6b7280');

  const statusText = (s: string) =>
    ({ pending_signature: 'Awaiting Signature', pending_review: 'Under Review', approved: 'Approved', rejected: 'Rejected' }[s]
      ?? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));

  // ── Submit ────────────────────────────────────────────────────────────────

  const submitContract = async () => {
    if (!selectedContract) return;
    const missing = selectedContract.fields.filter(
      f => f.required && f.type !== 'signature' && !fieldValues[f.id]?.trim()
    );
    if (missing.length) { setError(`Please fill in: ${missing.map(f => f.label).join(', ')}`); return; }
    if (!signatureDataUrl) { setError('Please provide your signature before submitting'); return; }

    try {
      setSubmitting(true); setError('');
      await Api.submitDigitalContract({
        contract_id: selectedContract.id,
        fields:      fieldValues,
        signature:   signatureDataUrl,
      });
      await loadContracts();
      closeModal();
      alert('Contract submitted! Your landlord will be notified for review.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit contract');
    } finally { setSubmitting(false); }
  };

  // ── Field renderer ────────────────────────────────────────────────────────

  const renderField = (field: ContractField) => {
    const val        = fieldValues[field.id] ?? '';
    const disabled   = ['approved', 'pending_review'].includes(selectedContract?.status ?? '');
    const base       = { style: { ...inputStyle, width: '100%' }, disabled, required: field.required };

    switch (field.type) {
      case 'text':      return <input {...base} value={val} placeholder={field.placeholder} onChange={e => handleFieldChange(field.id, e.target.value)} />;
      case 'date':      return <input {...base} type="date" value={val} onChange={e => handleFieldChange(field.id, e.target.value)} />;
      case 'number':    return <input {...base} type="number" value={val} placeholder={field.placeholder} onChange={e => handleFieldChange(field.id, e.target.value)} />;
      case 'textarea':  return <textarea style={{ ...textareaStyle, width: '100%', minHeight: '80px' }} value={val} disabled={disabled} required={field.required} placeholder={field.placeholder} onChange={e => handleFieldChange(field.id, e.target.value)} />;
      case 'signature':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {signatureDataUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} style={{ color: '#16a34a' }} />
                <span style={{ color: '#16a34a', fontSize: '14px' }}>Signature provided</span>
                {!disabled && <button style={{ ...buttonStyle('secondary'), padding: '6px 12px', fontSize: '12px' }} onClick={() => setShowSignatureModal(true)}><PenTool size={12} /> Edit</button>}
              </div>
            ) : (
              <button style={{ ...buttonStyle('primary'), padding: '8px 16px' }} onClick={() => setShowSignatureModal(true)} disabled={disabled}>
                <PenTool size={16} /> Add Signature
              </button>
            )}
          </div>
        );
      default: return null;
    }
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)',
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ ...pageStyle, padding: '0' }}>

      {/* Header */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: `linear-gradient(90deg,transparent,${palette.gold},transparent)` }} />
        <div style={sectionTitleStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.gold, display: 'inline-block', marginRight: 6 }} />
          Tenant Workspace
        </div>
        <h1 style={headingStyle}>Digital Contracts</h1>
        <p style={descriptionStyle}>View and sign your rental contracts online.</p>
      </section>

      {/* List */}
      <section style={panelStyle}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#dc2626', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 14 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: palette.gray400, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading contracts…
          </div>
        ) : contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.gray400 }}>
            <FileText size={48} style={{ opacity: 0.25, margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: 16, fontWeight: 600 }}>No contracts yet</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Your landlord will send a contract here once your application is approved.</div>
          </div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>{['Contract', 'Property', 'Status', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {contracts.map(c => (
                  <tr key={c.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,145,40,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: palette.navy900 }}>{c.title}</div>
                      <div style={{ color: palette.gray400, fontSize: 13, marginTop: 4 }}>{formatDate(c.created_at)}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: palette.gray600 }}>
                        <MapPin size={12} style={{ color: palette.gold }} />
                        {c.property?.title || 'Unknown Property'}
                      </div>
                      {c.property?.location && <div style={{ color: palette.gray400, fontSize: 12, marginTop: 2, paddingLeft: 17 }}>{c.property.location}</div>}
                    </td>
                    <td style={tdStyle}>
                      <span style={statusPillStyle(statusColor(c.status))}>{statusText(c.status)}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(c.file_url || c.file_name) && (
                          <button style={{ ...buttonStyle('ghost'), padding: '5px 10px', fontSize: 12 }}
                            onClick={() => downloadContract(c.id, c.file_name || 'contract.pdf')}>
                            <Download size={11} /> Download
                          </button>
                        )}
                        {c.status === 'pending_signature' && (
                          <button style={{ ...buttonStyle('primary'), padding: '5px 10px', fontSize: 12 }} onClick={() => viewContract(c)}>
                            <PenTool size={11} /> Sign Contract
                          </button>
                        )}
                        {['pending_review', 'approved', 'rejected'].includes(c.status) && (
                          <button style={{ ...buttonStyle('ghost'), padding: '5px 10px', fontSize: 12 }} onClick={() => viewContract(c)}>
                            <Eye size={11} /> View Details
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

      {/* Contract Modal */}
      {showContractModal && selectedContract && (
        <div style={overlay}>
          <div style={{ ...panelStyle, maxWidth: 800, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ ...headingStyle, fontSize: 20 }}>{selectedContract.title}</h2>
                <p style={{ color: palette.gray500, fontSize: 14, marginTop: 4 }}>
                  {[selectedContract.property?.title, selectedContract.property?.location].filter(Boolean).join(' — ')}
                </p>
              </div>
              <button style={{ ...buttonStyle('ghost'), padding: 8 }} onClick={closeModal}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {selectedContract.fields.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: palette.gray400, fontSize: 14 }}>
                  <FileCheck size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                  This contract has no fillable fields.
                  {(selectedContract.file_url || selectedContract.file_name) && <div style={{ marginTop: 8 }}>Use the Download button to read the full document.</div>}
                </div>
              ) : selectedContract.fields.map(field => (
                <div key={field.id}>
                  <label style={{ display: 'block', marginBottom: 8, color: palette.navy700, fontSize: 14, fontWeight: 600 }}>
                    {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontSize: 13, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: 8, padding: '10px 14px' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button style={{ ...buttonStyle('ghost'), padding: '10px 20px' }} onClick={closeModal}>Cancel</button>

                {selectedContract.status === 'pending_signature' && (
                  <button style={{ ...buttonStyle('primary'), padding: '10px 20px' }} onClick={submitContract} disabled={submitting}>
                    {submitting
                      ? <><div style={{ width: 14, height: 14, border: `2px solid ${palette.offWhite}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8 }} />Submitting…</>
                      : <><Send size={16} /> Submit for Review</>}
                  </button>
                )}
                {selectedContract.status === 'pending_review' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, color: palette.navy700, fontSize: 14 }}>
                    <Clock size={16} /> Under Review
                  </div>
                )}
                {selectedContract.status === 'approved' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 8, color: '#16a34a', fontSize: 14 }}>
                    <CheckCircle size={16} /> Contract Approved
                  </div>
                )}
                {selectedContract.status === 'rejected' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
                    <AlertCircle size={16} /> Contract Rejected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <div style={{ ...overlay, zIndex: 1001 }}>
          <div style={{ ...panelStyle, maxWidth: 500, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ ...headingStyle, fontSize: 18 }}>Add Your Signature</h3>
              <button style={{ ...buttonStyle('ghost'), padding: 8 }} onClick={() => setShowSignatureModal(false)}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: palette.gray500, fontSize: 14 }}>Draw your signature in the box below:</p>
              <div style={{ border: `1.5px solid ${palette.goldBorder}`, borderRadius: 8, background: palette.offWhite, overflow: 'hidden' }}>
                <canvas ref={canvasRef} width={460} height={150}
                  style={{ width: '100%', height: 150, cursor: 'crosshair', touchAction: 'none', display: 'block' }}
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
              </div>
              {error && <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                <button style={{ ...buttonStyle('ghost'), padding: '8px 16px' }} onClick={clearSignature}>Clear</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ ...buttonStyle('ghost'), padding: '8px 16px' }} onClick={() => setShowSignatureModal(false)}>Cancel</button>
                  <button style={{ ...buttonStyle('primary'), padding: '8px 16px' }} onClick={saveSignature}>Save Signature</button>
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