import { useEffect, useState, useRef } from 'react';
import {
  FileText, Download, Eye, Send, AlertCircle, CheckCircle,
  MapPin, PenTool, X, Clock, FileCheck, DollarSign,
} from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatDate, formatCurrency, getStatusColor,
  headingStyle, inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  statusPillStyle, tableStyle, tableWrapStyle, tdStyle, thStyle, textareaStyle,
} from '../landlord/landlordPageStyles';

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
    id?: number;
    title?: string;
    location?: string;
    price?: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely parse the `fields` column regardless of how it arrives from the DB.
 * Eloquent JSON casts sometimes return a string when the cast is missing.
 */
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

/**
 * Tenants should only see contracts that have been explicitly sent to them —
 * i.e. anything that is not still in draft on the landlord's side.
 */
const isVisible = (c: DigitalContract) => c.status !== 'draft';

const STATUS_LABEL: Record<string, string> = {
  pending_signature: 'Awaiting Signature',
  pending_review:    'Under Review',
  approved:          'Approved',
  rejected:          'Rejected',
};

const STATUS_COLOR: Record<string, string> = {
  pending_signature: '#c9a84c',
  pending_review:    '#3b82f6',
  approved:          '#16a34a',
  rejected:          '#dc2626',
};

const statusLabel = (s: string) =>
  STATUS_LABEL[s] ?? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const statusColor = (s: string) =>
  STATUS_COLOR[s] ?? palette.muted;

const fileLabel = (c: DigitalContract): string | undefined =>
  c.file_name || (c.file_url ?? c.file_path)?.split('/').pop();

const hasFile = (c: DigitalContract) =>
  !!(c.file_url || c.file_path || c.file_name);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DigitalContractPage = () => {
  const [contracts,          setContracts]          = useState<DigitalContract[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState('');
  const [selectedContract,   setSelectedContract]   = useState<DigitalContract | null>(null);
  const [showContractModal,  setShowContractModal]  = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [fieldValues,        setFieldValues]        = useState<Record<string, string>>({});
  const [signatureDataUrl,   setSignatureDataUrl]   = useState('');
  const [isDrawing,          setIsDrawing]          = useState(false);
  const [submitting,         setSubmitting]         = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { loadContracts(); }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await Api.getTenantDigitalContracts();
      console.log('[Tenant DigitalContracts] API response:', response);
      const raw = response.data;
      console.log('[Tenant DigitalContracts] Raw data:', raw);

      // Api.request() already unwraps one level, so response.data should be the array
      // But handle both array and paginated structures just in case
      const rawArray: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.data)
          ? (raw as any).data
          : [];

      console.log('[Tenant DigitalContracts] Raw array length:', rawArray.length);
      console.log('[Tenant DigitalContracts] Raw array:', rawArray);

      const normalised: DigitalContract[] = rawArray.map((c: any) => ({
        ...c,
        fields:   parseFields(c.fields),
        // Unify file_url / file_path so the rest of the component only checks file_url
        file_url: c.file_url || c.file_path || undefined,
      }));

      console.log('[Tenant DigitalContracts] Normalised contracts:', normalised);
      console.log('[Tenant DigitalContracts] Contract statuses:', normalised.map(c => ({ id: c.id, title: c.title, status: c.status })));
      console.log('[Tenant DigitalContracts] Visible contracts (non-draft):', normalised.filter(isVisible));

      // Temporarily show all contracts for debugging
      setContracts(normalised);
      // setContracts(normalised.filter(isVisible));

    } catch (err: any) {
      if (err?.response?.status === 503) {
        setContracts([]); // table not yet migrated — show empty state, not an error
      } else {
        setError(err?.response?.data?.message || 'Failed to load contracts.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openContract = (contract: DigitalContract) => {
    const init: Record<string, string> = {};
    contract.fields.forEach(f => { init[f.id] = f.tenant_value || f.value || ''; });
    setSelectedContract(contract);
    setFieldValues(init);
    setSignatureDataUrl('');
    setError('');
    setShowContractModal(true);
  };

  const closeContract = () => {
    setShowContractModal(false);
    setSelectedContract(null);
    setSignatureDataUrl('');
    setError('');
  };

  // ── Field helpers ──────────────────────────────────────────────────────────

  const setFieldValue = (id: string, val: string) =>
    setFieldValues(prev => ({ ...prev, [id]: val }));

  // ── Download ───────────────────────────────────────────────────────────────

  const downloadContract = async (contractId: number, fileName: string) => {
    try {
      const res  = await Api.downloadDigitalContract(contractId);
      const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: fileName });
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to download contract.');
    }
  };

  // ── Signature canvas ───────────────────────────────────────────────────────

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const cv  = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const r   = cv.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const cv  = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const r   = cv.getBoundingClientRect();
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.strokeStyle = palette.gold;
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const cv = canvasRef.current; if (!cv) return;
    cv.getContext('2d')?.clearRect(0, 0, cv.width, cv.height);
    setSignatureDataUrl('');
  };

  const saveSignature = () => {
    const cv  = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    // A blank canvas produces a non-empty PNG — check for any opaque pixels
    const hasInk = ctx.getImageData(0, 0, cv.width, cv.height).data
      .some((v, i) => i % 4 === 3 && v > 0);
    if (!hasInk) { setError('Please draw your signature before saving.'); return; }
    setSignatureDataUrl(cv.toDataURL());
    setShowSignatureModal(false);
    setError('');
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submitContract = async () => {
    if (!selectedContract) return;

    const missing = selectedContract.fields.filter(
      f => f.required && f.type !== 'signature' && !fieldValues[f.id]?.trim(),
    );
    if (missing.length) {
      setError(`Please fill in: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    if (!signatureDataUrl) {
      setError('Please provide your signature before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await Api.submitDigitalContract({
        contract_id: selectedContract.id,
        fields:      fieldValues,
        signature:   signatureDataUrl,
      });
      await loadContracts();
      closeContract();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit contract.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Field renderer ─────────────────────────────────────────────────────────

  const renderField = (field: ContractField) => {
    const val      = fieldValues[field.id] ?? '';
    const disabled = ['approved', 'pending_review'].includes(selectedContract?.status ?? '');
    const shared   = { disabled, required: field.required };

    switch (field.type) {
      case 'text':
        return (
          <input
            style={{ ...inputStyle, width: '100%' }}
            value={val}
            placeholder={field.placeholder}
            onChange={e => setFieldValue(field.id, e.target.value)}
            {...shared}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            style={{ ...inputStyle, width: '100%' }}
            value={val}
            onChange={e => setFieldValue(field.id, e.target.value)}
            {...shared}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            style={{ ...inputStyle, width: '100%' }}
            value={val}
            placeholder={field.placeholder}
            onChange={e => setFieldValue(field.id, e.target.value)}
            {...shared}
          />
        );
      case 'textarea':
        return (
          <textarea
            style={{ ...textareaStyle, width: '100%', minHeight: '80px' }}
            value={val}
            placeholder={field.placeholder}
            onChange={e => setFieldValue(field.id, e.target.value)}
            {...shared}
          />
        );
      case 'signature':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {signatureDataUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} style={{ color: '#16a34a' }} />
                <span style={{ color: '#16a34a', fontSize: '14px' }}>Signature provided</span>
                {!disabled && (
                  <button
                    style={{ ...buttonStyle('secondary'), padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => setShowSignatureModal(true)}
                  >
                    <PenTool size={12} /> Edit
                  </button>
                )}
              </div>
            ) : (
              <button
                style={{ ...buttonStyle('primary'), padding: '8px 16px' }}
                onClick={() => setShowSignatureModal(true)}
                disabled={disabled}
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

  // ── Shared overlay style ───────────────────────────────────────────────────

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(10,15,30,0.88)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
    backdropFilter: 'blur(6px)',
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ ...pageStyle, padding: '0' }}>

      {/* ── Header ── */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 32, right: 32, height: '2px',
          background: `linear-gradient(90deg, transparent, ${palette.gold}, transparent)`,
        }} />
        <div style={sectionTitleStyle}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: palette.gold, display: 'inline-block', marginRight: 6,
          }} />
          Tenant Workspace
        </div>
        <h1 style={headingStyle}>Digital Contracts</h1>
        <p style={descriptionStyle}>View and sign your rental contracts online.</p>
      </section>

      {/* ── Contract list ── */}
      <section style={panelStyle}>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            color: palette.red, background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 14,
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: palette.muted, padding: '40px 0' }}>
            <div style={{
              width: 16, height: 16,
              border: `2px solid ${palette.gold}`, borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            Loading contracts…
          </div>

        ) : contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.muted }}>
            <FileText size={48} style={{ opacity: 0.25, margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: palette.cream }}>No contracts yet</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
              Your landlord will send a contract here once your application is approved.
            </div>
          </div>

        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Contract', 'Property', 'Sent', 'Status', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => (
                  <tr
                    key={c.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Contract details */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: palette.cream }}>{c.title}</div>
                      {fileLabel(c) && (
                        <div style={{ color: palette.muted, fontSize: 12, marginTop: 3 }}>
                          📄 {fileLabel(c)}
                        </div>
                      )}
                      {c.fields?.length > 0 && (
                        <div style={{ color: palette.gold, fontSize: 11, marginTop: 2 }}>
                          {c.fields.length} fillable field{c.fields.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </td>

                    {/* Property */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: palette.cream }}>
                        <MapPin size={12} style={{ color: palette.gold, flexShrink: 0 }} />
                        {c.property?.title || 'Property'}
                      </div>
                      {c.property?.location && (
                        <div style={{ color: palette.muted, fontSize: 12, marginTop: 2, paddingLeft: 17 }}>
                          {c.property.location}
                        </div>
                      )}
                      {c.property?.price && (
                        <div style={{ color: palette.gold, fontSize: 12, fontWeight: 600, marginTop: 2, paddingLeft: 17 }}>
                          {formatCurrency(c.property.price)} / mo
                        </div>
                      )}
                    </td>

                    {/* Date sent */}
                    <td style={{ ...tdStyle, color: palette.muted, fontSize: 13 }}>
                      {formatDate(c.created_at)}
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <span style={statusPillStyle(statusColor(c.status))}>
                        {statusLabel(c.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {hasFile(c) && (
                          <button
                            style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: 12, borderRadius: '8px' }}
                            onClick={() => downloadContract(c.id, c.file_name || 'contract.pdf')}
                          >
                            <Download size={11} /> Download
                          </button>
                        )}
                        {c.status === 'pending_signature' && (
                          <button
                            style={{ ...buttonStyle('primary'), padding: '5px 10px', fontSize: 12, borderRadius: '8px' }}
                            onClick={() => openContract(c)}
                          >
                            <PenTool size={11} /> Sign
                          </button>
                        )}
                        {['pending_review', 'approved', 'rejected'].includes(c.status) && (
                          <button
                            style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: 12, borderRadius: '8px' }}
                            onClick={() => openContract(c)}
                          >
                            <Eye size={11} /> View
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

      {/* ── Contract detail / signing modal ── */}
      {showContractModal && selectedContract && (
        <div style={overlay}>
          <div style={{
            ...panelStyle,
            maxWidth: 820, width: '100%',
            maxHeight: '92vh', overflowY: 'auto',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ ...headingStyle, fontSize: 20 }}>{selectedContract.title}</h2>
                <p style={{ color: palette.muted, fontSize: 14, marginTop: 6 }}>
                  {[selectedContract.property?.title, selectedContract.property?.location]
                    .filter(Boolean).join(' — ')}
                </p>
                {selectedContract.property?.price && (
                  <p style={{ color: palette.gold, fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                    <DollarSign size={12} style={{ display: 'inline', marginRight: 2 }} />
                    {formatCurrency(selectedContract.property.price)} / month
                  </p>
                )}
              </div>
              <button
                style={{ ...buttonStyle('secondary'), padding: 8, borderRadius: '8px' }}
                onClick={closeContract}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* File info bar */}
            {hasFile(selectedContract) && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(200,145,40,0.08)', border: `1px solid ${palette.goldBorder}`,
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={18} style={{ color: palette.gold }} />
                  <div>
                    <div style={{ color: palette.cream, fontSize: 14, fontWeight: 600 }}>
                      {fileLabel(selectedContract)}
                    </div>
                    <div style={{ color: palette.muted, fontSize: 12 }}>
                      Contract document uploaded by landlord
                    </div>
                  </div>
                </div>
                <button
                  style={{ ...buttonStyle('secondary'), padding: '6px 14px', fontSize: 12, borderRadius: '8px' }}
                  onClick={() => downloadContract(selectedContract.id, selectedContract.file_name || 'contract.pdf')}
                >
                  <Download size={12} /> Download
                </button>
              </div>
            )}

            {/* Status banner */}
            {selectedContract.status !== 'pending_signature' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 10, marginBottom: 20,
                background: `${statusColor(selectedContract.status)}12`,
                border: `1px solid ${statusColor(selectedContract.status)}30`,
                color: statusColor(selectedContract.status),
                fontSize: 14, fontWeight: 600,
              }}>
                {selectedContract.status === 'pending_review' && <Clock size={16} />}
                {selectedContract.status === 'approved'       && <CheckCircle size={16} />}
                {selectedContract.status === 'rejected'       && <AlertCircle size={16} />}
                {statusLabel(selectedContract.status)}
              </div>
            )}

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {selectedContract.fields.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: palette.muted, fontSize: 14 }}>
                  <FileCheck size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 10px' }} />
                  This contract has no fillable fields.
                  {hasFile(selectedContract) && (
                    <div style={{ marginTop: 8 }}>Download the document above to read the full contract.</div>
                  )}
                </div>
              ) : (
                selectedContract.fields.map(field => (
                  <div key={field.id}>
                    <label style={{
                      display: 'block', marginBottom: 8,
                      color: palette.cream, fontSize: 14, fontWeight: 600,
                    }}>
                      {field.label}
                      {field.required && <span style={{ color: palette.red, marginLeft: 4 }}>*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))
              )}

              {/* Inline error */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  color: palette.red, fontSize: 13,
                  background: 'rgba(220,38,38,0.08)',
                  border: '1px solid rgba(220,38,38,0.25)',
                  borderRadius: 8, padding: '10px 14px',
                }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Footer actions */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, flexWrap: 'wrap' }}>
                <button
                  style={{ ...buttonStyle('secondary'), padding: '10px 20px' }}
                  onClick={closeContract}
                >
                  Close
                </button>

                {selectedContract.status === 'pending_signature' && (
                  <button
                    style={{ ...buttonStyle('primary'), padding: '10px 20px' }}
                    onClick={submitContract}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div style={{
                          width: 14, height: 14,
                          border: `2px solid rgba(255,255,255,0.4)`, borderTopColor: 'transparent',
                          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                        }} />
                        Submitting…
                      </>
                    ) : (
                      <><Send size={16} /> Submit for Review</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Signature drawing modal ── */}
      {showSignatureModal && (
        <div style={{ ...overlay, zIndex: 1001 }}>
          <div style={{ ...panelStyle, maxWidth: 520, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ ...headingStyle, fontSize: 18 }}>Draw Your Signature</h3>
              <button
                style={{ ...buttonStyle('secondary'), padding: 8, borderRadius: '8px' }}
                onClick={() => { setShowSignatureModal(false); setError(''); }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: palette.muted, fontSize: 14 }}>
                Draw your signature in the box below using your mouse or finger.
              </p>

              <div style={{
                border: `1.5px solid ${palette.goldBorder}`,
                borderRadius: 10, overflow: 'hidden',
                background: 'rgba(255,255,255,0.03)',
              }}>
                <canvas
                  ref={canvasRef}
                  width={480} height={160}
                  style={{ width: '100%', height: 160, cursor: 'crosshair', touchAction: 'none', display: 'block' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>

              {error && (
                <div style={{ color: palette.red, fontSize: 13 }}>{error}</div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                <button
                  style={{ ...buttonStyle('danger'), padding: '8px 16px' }}
                  onClick={clearSignature}
                >
                  Clear
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{ ...buttonStyle('secondary'), padding: '8px 16px' }}
                    onClick={() => { setShowSignatureModal(false); setError(''); }}
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