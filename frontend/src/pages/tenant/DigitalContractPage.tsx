import { useEffect, useState, useRef } from 'react';
import {
  FileText, Download, Eye, Send, AlertCircle, CheckCircle,
  MapPin, PenTool, X, Clock, FileCheck, Shield,
  ChevronDown, ChevronUp, Building2, Home, User,
} from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatDate, formatCurrency,
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
  landlordOnly?: boolean;
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
  property?: { id?: number; title?: string; location?: string; price?: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseFields = (raw: any): ContractField[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

const isVisible = (c: DigitalContract) => c.status !== 'draft';
const fileLabel = (c: DigitalContract): string | undefined =>
  c.file_name || (c.file_url)?.split('/').pop();
const hasFile = (c: DigitalContract) => !!(c.file_url || c.file_name);

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  pending_signature: { label: 'Inasubiri Sahihi Yako',  color: '#c9a84c', icon: <PenTool size={14} />,     desc: 'Tafadhali jaza sehemu zote na kutoa sahihi yako.' },
  pending_review:    { label: 'Inakaguliwa na Mpangishaji', color: '#3b82f6', icon: <Clock size={14} />,       desc: 'Mpangishaji anakagua mkataba wako uliosaiinishwa.' },
  approved:          { label: 'Imeidhinishwa',           color: '#16a34a', icon: <CheckCircle size={14} />, desc: 'Mkataba wako umekubaliwa na mpangishaji. Karibu!' },
  rejected:          { label: 'Imekataliwa',             color: '#dc2626', icon: <AlertCircle size={14} />, desc: 'Mkataba ulikataliwa. Wasiliana na mpangishaji.' },
};
const getStatusMeta = (s: string) => STATUS_META[s] ?? { label: s.replace(/_/g, ' '), color: palette.muted, icon: null, desc: '' };

// Group tenant-visible fields into logical sections for Oweru contracts
const FIELD_SECTIONS: { title: string; ids: string[] }[] = [
  { title: 'Taarifa za Mpangaji',    ids: ['tenant_full_name', 'tenant_nida', 'tenant_phone', 'tenant_nationality', 'tenant_occupation', 'tenant_address', 'tenant_gender', 'tenant_age'] },
  { title: 'Taarifa za Mali',        ids: ['room_number', 'room_purpose', 'house_number', 'house_location', 'house_bedrooms', 'house_livingrooms', 'house_kitchens', 'house_bathrooms', 'house_purpose', 'tenant_count'] },
  { title: 'Muda na Kodi',           ids: ['start_date', 'end_date', 'contract_months', 'monthly_rent', 'total_paid', 'paid_months'] },
  { title: 'Taarifa za Mdhamini',    ids: ['guarantor_name', 'guarantor_nida', 'guarantor_phone', 'guarantor_address', 'guarantor_nationality'] },
  { title: 'Masharti ya Ziada',      ids: ['property_items', 'special_terms'] },
  { title: 'Sahihi',                 ids: ['tenant_signature'] },
];

// ---------------------------------------------------------------------------
// Contract Detail / Signing Modal
// ---------------------------------------------------------------------------

interface SigningModalProps {
  contract: DigitalContract;
  onClose: () => void;
  onSubmit: (contractId: number, fields: Record<string, string>, signature: string) => Promise<void>;
  onDownload: (id: number, name: string) => void;
  submitting: boolean;
}

const ContractSigningModal = ({ contract, onClose, onSubmit, onDownload, submitting }: SigningModalProps) => {
  const visibleFields = parseFields(contract.fields).filter(f => !f.landlordOnly);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    visibleFields.forEach(f => { init[f.id] = f.tenant_value || f.value || ''; });
    return init;
  });
  const [signatureDataUrl, setSignatureDataUrl] = useState(contract.tenant_signature || '');
  const [showSignPad, setShowSignPad] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(FIELD_SECTIONS[0]?.title ?? null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const disabled = ['approved', 'pending_review'].includes(contract.status);
  const sm = getStatusMeta(contract.status);

  const setVal = (id: string, val: string) => setFieldValues(prev => ({ ...prev, [id]: val }));

  // Group fields by section — fall through to "Mengine" for unrecognized ids
  const getSectionFields = (section: { title: string; ids: string[] }) =>
    visibleFields.filter(f => section.ids.includes(f.id));
  const ungroupedFields = visibleFields.filter(f =>
    !FIELD_SECTIONS.flatMap(s => s.ids).includes(f.id) && f.type !== 'signature'
  );

  const renderFieldInput = (field: ContractField) => {
    const val = fieldValues[field.id] ?? '';
    const shared = { disabled, required: field.required };
    switch (field.type) {
      case 'text':
        return <input style={{ ...inputStyle, width: '100%' }} value={val} placeholder={field.placeholder} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'date':
        return <input type="date" style={{ ...inputStyle, width: '100%' }} value={val} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'number':
        return <input type="number" style={{ ...inputStyle, width: '100%' }} value={val} placeholder={field.placeholder} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'textarea':
        return <textarea style={{ ...textareaStyle, width: '100%', minHeight: 80 }} value={val} placeholder={field.placeholder} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'signature':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {signatureDataUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <img src={signatureDataUrl} alt="Sahihi" style={{ height: 44, border: `1px solid ${palette.amber}40`, borderRadius: 6, background: 'rgba(255,255,255,0.03)', padding: 4 }} />
                <span style={{ color: '#16a34a', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={14} /> Sahihi imetolewa
                </span>
                {!disabled && (
                  <button style={{ ...buttonStyle('secondary'), padding: '6px 12px', fontSize: 12 }} onClick={() => setShowSignPad(true)}>
                    <PenTool size={12} /> Badilisha
                  </button>
                )}
              </div>
            ) : (
              <button style={{ ...buttonStyle('primary'), padding: '10px 18px' }} onClick={() => setShowSignPad(true)} disabled={disabled}>
                <PenTool size={15} /> Toa Sahihi Yako
              </button>
            )}
          </div>
        );
      default: return null;
    }
  };

  // Signature canvas handlers
  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, cv: HTMLCanvasElement) => {
    const r = cv.getBoundingClientRect();
    if ('touches' in e) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: (e as React.MouseEvent).clientX - r.left, y: (e as React.MouseEvent).clientY - r.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); setIsDrawing(true);
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const p = getPos(e, cv); ctx.beginPath(); ctx.moveTo(p.x, p.y);
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); if (!isDrawing) return;
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const p = getPos(e, cv);
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = palette.gold ?? '#c9a84c';
    ctx.lineTo(p.x, p.y); ctx.stroke();
  };
  const stopDraw = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); setIsDrawing(false); };
  const clearSig = () => { const cv = canvasRef.current; if (!cv) return; cv.getContext('2d')?.clearRect(0, 0, cv.width, cv.height); setSignatureDataUrl(''); };
  const saveSig = () => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const hasInk = ctx.getImageData(0, 0, cv.width, cv.height).data.some((v, i) => i % 4 === 3 && v > 0);
    if (!hasInk) { setError('Tafadhali toa sahihi kabla ya kuhifadhi.'); return; }
    setSignatureDataUrl(cv.toDataURL()); setShowSignPad(false); setError('');
  };

  const handleSubmit = async () => {
    setError('');
    const missing = visibleFields.filter(f => f.required && f.type !== 'signature' && !fieldValues[f.id]?.trim());
    if (missing.length) { setError(`Tafadhali jaza: ${missing.map(f => f.label).join(', ')}`); return; }
    if (!signatureDataUrl) { setError('Tafadhali toa sahihi yako kabla ya kuwasilisha.'); return; }
    await onSubmit(contract.id, fieldValues, signatureDataUrl);
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(10,15,30,0.88)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px', backdropFilter: 'blur(6px)',
  };

  const activeSections = FIELD_SECTIONS.filter(s => getSectionFields(s).length > 0);

  return (
    <div style={overlay}>
      <div style={{ ...panelStyle, maxWidth: 820, width: '100%', maxHeight: '94vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.gold ?? '#c9a84c', display: 'inline-block', marginRight: 6 }} />
              {contract.status === 'pending_signature' ? 'Sahihi Mkataba' : 'Angalia Mkataba'}
            </div>
            <h2 style={{ ...headingStyle, fontSize: 20, marginTop: 6 }}>{contract.title}</h2>
            {contract.property && (
              <p style={{ color: palette.muted, fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={12} style={{ color: palette.gold }} />
                {[contract.property.title, contract.property.location].filter(Boolean).join(' — ')}
                {contract.property.price && <span style={{ color: palette.gold, fontWeight: 600, marginLeft: 6 }}>{formatCurrency(contract.property.price)}/mwezi</span>}
              </p>
            )}
          </div>
          <button style={{ ...buttonStyle('secondary'), padding: 8, borderRadius: '8px' }} onClick={onClose}><X size={16} /></button>
        </div>

        {/* Status Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          borderRadius: 10, marginBottom: 20,
          background: `${sm.color}15`, border: `1px solid ${sm.color}35`,
          color: sm.color, fontSize: 14, fontWeight: 600,
        }}>
          {sm.icon} {sm.label}
          {sm.desc && <span style={{ color: palette.muted, fontSize: 12, fontWeight: 400, marginLeft: 4 }}>— {sm.desc}</span>}
        </div>

        {/* File Download Bar */}
        {hasFile(contract) && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(200,145,40,0.08)', border: `1px solid ${palette.gold ?? '#c9a84c'}35`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={18} style={{ color: palette.gold }} />
              <div>
                <div style={{ color: palette.cream, fontSize: 14, fontWeight: 600 }}>{fileLabel(contract)}</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>Hati ya mkataba — pakua ili kusoma</div>
              </div>
            </div>
            <button
              style={{ ...buttonStyle('secondary'), padding: '6px 14px', fontSize: 12, borderRadius: '8px' }}
              onClick={() => onDownload(contract.id, contract.file_name || 'mkataba.pdf')}
            >
              <Download size={12} /> Pakua
            </button>
          </div>
        )}

        {/* Fields */}
        {visibleFields.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: palette.muted }}>
            <FileCheck size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14 }}>Mkataba huu hauna sehemu za kujaza.</div>
            {hasFile(contract) && <div style={{ fontSize: 12, marginTop: 6 }}>Pakua hati ili kusoma maudhui yote ya mkataba.</div>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Accordions per section */}
            {activeSections.map(section => {
              const fields = getSectionFields(section);
              const isOpen = activeSection === section.title;
              const filled = fields.filter(f => f.type !== 'signature' && (fieldValues[f.id]?.trim() || f.tenant_value || f.value));
              const required = fields.filter(f => f.required && f.type !== 'signature');
              const isComplete = required.every(f => fieldValues[f.id]?.trim());
              return (
                <div key={section.title} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', marginBottom: 6 }}>
                  <button
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', background: isOpen ? 'rgba(200,145,40,0.08)' : 'rgba(255,255,255,0.02)',
                      border: 'none', cursor: 'pointer', color: palette.cream,
                    }}
                    onClick={() => setActiveSection(isOpen ? null : section.title)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{section.title}</span>
                      <span style={{ fontSize: 11, color: isComplete ? '#16a34a' : palette.muted, background: isComplete ? 'rgba(22,163,74,0.12)' : 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '2px 8px' }}>
                        {filled.length}/{fields.filter(f => f.type !== 'signature').length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isComplete && <CheckCircle size={14} style={{ color: '#16a34a' }} />}
                      {isOpen ? <ChevronUp size={16} style={{ color: palette.muted }} /> : <ChevronDown size={16} style={{ color: palette.muted }} />}
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {fields.map(field => (
                        <div key={field.id}>
                          <label style={{ display: 'block', marginBottom: 7, color: palette.cream, fontSize: 13, fontWeight: 600 }}>
                            {field.label}
                            {field.required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
                          </label>
                          {renderFieldInput(field)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ungrouped fields */}
            {ungroupedFields.length > 0 && (
              <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: palette.cream }}>Sehemu Nyingine</div>
                {ungroupedFields.map(field => (
                  <div key={field.id}>
                    <label style={{ display: 'block', marginBottom: 7, color: palette.cream, fontSize: 13, fontWeight: 600 }}>
                      {field.label}{field.required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
                    </label>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontSize: 13, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8, padding: '10px 14px', marginTop: 16 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
          <button style={{ ...buttonStyle('secondary'), padding: '10px 20px' }} onClick={onClose}>Funga</button>
          {contract.status === 'pending_signature' && (
            <button
              style={{ ...buttonStyle('primary'), padding: '10px 24px' }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <><div style={{ width: 14, height: 14, border: `2px solid rgba(255,255,255,0.4)`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Inawasilisha…</>
              ) : (
                <><Send size={15} /> Wasilisha Mkataba</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignPad && (
        <div style={{ ...overlay, zIndex: 1001 }}>
          <div style={{ ...panelStyle, maxWidth: 520, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={sectionTitleStyle}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.gold, display: 'inline-block', marginRight: 6 }} />
                  Sahihi ya Kidijitali
                </div>
                <h3 style={{ ...headingStyle, fontSize: 18, marginTop: 4 }}>Chora Sahihi Yako</h3>
              </div>
              <button style={{ ...buttonStyle('secondary'), padding: 8, borderRadius: '8px' }} onClick={() => { setShowSignPad(false); setError(''); }}><X size={16} /></button>
            </div>
            <p style={{ color: palette.muted, fontSize: 13, marginBottom: 16 }}>
              Chora sahihi yako kwenye sanduku hapa chini kwa kutumia kidole au kipanya chako.
            </p>
            <div style={{ border: `1.5px solid ${palette.gold ?? '#c9a84c'}50`, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
              <canvas
                ref={canvasRef} width={480} height={160}
                style={{ width: '100%', height: 160, cursor: 'crosshair', touchAction: 'none', display: 'block' }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={e => { if (isDrawing) stopDraw(e); }}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
              />
            </div>
            {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button style={{ ...buttonStyle('danger' as any), padding: '8px 16px' }} onClick={clearSig}>Futa</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...buttonStyle('secondary'), padding: '8px 16px' }} onClick={() => { setShowSignPad(false); setError(''); }}>Ghairi</button>
                <button style={{ ...buttonStyle('primary'), padding: '8px 20px' }} onClick={saveSig}>Hifadhi Sahihi</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Tenant Component
// ---------------------------------------------------------------------------

const DigitalContractPage = () => {
  const [contracts,        setContracts]        = useState<DigitalContract[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [success,          setSuccess]          = useState('');
  const [selectedContract, setSelectedContract] = useState<DigitalContract | null>(null);
  const [submitting,       setSubmitting]       = useState(false);

  const loadContracts = async () => {
    try {
      setLoading(true); setError('');
      const response = await Api.getTenantDigitalContracts();
      const raw = response.data;
      const rawArray: any[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.data) ? (raw as any).data : [];
      const normalised: DigitalContract[] = rawArray.map(c => ({ ...c, fields: parseFields(c.fields), file_url: c.file_url || c.file_path || undefined }));
      setContracts(normalised.filter(isVisible));
    } catch (err: any) {
      if (err?.response?.status === 503) setContracts([]);
      else setError(err?.response?.data?.message || 'Imeshindwa kupakia mikataba.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadContracts(); }, []);

  const handleSubmitContract = async (contractId: number, fields: Record<string, string>, signature: string) => {
    try {
      setSubmitting(true); setError(''); setSuccess('');
      await Api.submitDigitalContract({ contract_id: contractId, fields, signature });
      setSuccess('Mkataba wako umewasilishwa. Mpangishaji atakagua na kukuarifu.');
      await loadContracts();
      setSelectedContract(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Imeshindwa kuwasilisha mkataba.');
    } finally { setSubmitting(false); }
  };

  const downloadContract = async (contractId: number, fileName: string) => {
    try {
      const res = await Api.downloadDigitalContract(contractId);
      const blob = new Blob([res.data as BlobPart], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const msg = err?.response?.data?.message || '';
        setError(msg.includes('File not found on disk') ? 'Faili lipo kwenye mfumo lakini halipatikani. Wasiliana na mpangishaji.' : msg);
      } else { setError(err?.response?.data?.message || 'Imeshindwa kupakua mkataba.'); }
    }
  };

  const contractsByStatus = {
    action: contracts.filter(c => c.status === 'pending_signature'),
    review: contracts.filter(c => c.status === 'pending_review'),
    done:   contracts.filter(c => c.status === 'approved' || c.status === 'rejected'),
  };

  return (
    <div style={{ ...pageStyle, padding: '0' }}>

      {/* Header */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 32, right: 32, height: '2px',
          background: `linear-gradient(90deg, transparent, ${palette.gold ?? '#c9a84c'}, transparent)`,
        }} />
        <div style={sectionTitleStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.gold, display: 'inline-block', marginRight: 6 }} />
          Eneo la Mpangaji
        </div>
        <h1 style={headingStyle}>Mikataba ya Kidijitali</h1>
        <p style={descriptionStyle}>Angalia, jaza, na sahihi mikataba yako ya kukodisha mtandaoni.</p>

        {/* Action needed banner */}
        {contractsByStatus.action.length > 0 && (
          <div style={{
            marginTop: 20, display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 10, padding: '14px 18px',
          }}>
            <PenTool size={18} style={{ color: palette.gold, flexShrink: 0 }} />
            <div>
              <div style={{ color: palette.cream, fontWeight: 600, fontSize: 14 }}>
                Unahitajika kusaini {contractsByStatus.action.length === 1 ? 'mkataba' : `mikataba ${contractsByStatus.action.length}`}
              </div>
              <div style={{ color: palette.muted, fontSize: 12, marginTop: 2 }}>
                Bonyeza kitufe cha &quot;Saini&quot; kwenye mkataba husika hapa chini.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* List */}
      <section style={panelStyle}>
        {(error || success) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 14,
            color: success ? '#16a34a' : '#dc2626',
            background: success ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
            border: `1px solid ${success ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}`,
            borderRadius: 10, padding: '14px 18px', marginBottom: 20,
          }}>
            {success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {success || error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: palette.muted, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Inapakia mikataba…
          </div>
        ) : contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.muted }}>
            <Shield size={52} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block', color: palette.gold }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: palette.cream }}>Hakuna mikataba ya sasa</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6, maxWidth: 360, margin: '6px auto 0' }}>
              Mpangishaji wako bado hajakutumia mkataba. Mikataba itaonekana hapa mara tu inapokufikia.
            </div>
          </div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Mkataba', 'Mali / Nyumba', 'Tarehe ya Kutumwa', 'Hali', 'Vitendo'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => {
                  const sm = getStatusMeta(c.status);
                  return (
                    <tr
                      key={c.id}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: palette.cream }}>{c.title}</div>
                        {fileLabel(c) && <div style={{ color: palette.muted, fontSize: 12, marginTop: 3 }}>📄 {fileLabel(c)}</div>}
                        {parseFields(c.fields).filter(f => !f.landlordOnly).length > 0 && (
                          <div style={{ color: palette.gold, fontSize: 11, marginTop: 2 }}>
                            {parseFields(c.fields).filter(f => !f.landlordOnly).length} sehemu za kujaza
                          </div>
                        )}
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: palette.cream, fontWeight: 600 }}>
                          <MapPin size={12} style={{ color: palette.gold, flexShrink: 0 }} />
                          {c.property?.title ?? `Mali #${c.property_id}`}
                        </div>
                        {c.property?.location && <div style={{ color: palette.muted, fontSize: 12, marginTop: 2, paddingLeft: 17 }}>{c.property.location}</div>}
                        {c.property?.price && <div style={{ color: palette.gold, fontSize: 12, fontWeight: 600, marginTop: 2, paddingLeft: 17 }}>{formatCurrency(c.property.price)}/mwezi</div>}
                      </td>

                      <td style={{ ...tdStyle, color: palette.muted, fontSize: 13 }}>{formatDate(c.created_at)}</td>

                      <td style={tdStyle}>
                        <span style={{ ...statusPillStyle(sm.color), display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          {sm.icon} {sm.label}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {hasFile(c) && (
                            <button
                              style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: 12, borderRadius: '8px' }}
                              onClick={() => downloadContract(c.id, c.file_name || 'mkataba.pdf')}
                            >
                              <Download size={11} /> Pakua
                            </button>
                          )}
                          {c.status === 'pending_signature' && (
                            <button
                              style={{ ...buttonStyle('primary'), padding: '5px 10px', fontSize: 12, borderRadius: '8px' }}
                              onClick={() => setSelectedContract(c)}
                            >
                              <PenTool size={11} /> Saini
                            </button>
                          )}
                          {['pending_review', 'approved', 'rejected'].includes(c.status) && (
                            <button
                              style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: 12, borderRadius: '8px' }}
                              onClick={() => setSelectedContract(c)}
                            >
                              <Eye size={11} /> Angalia
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

      {/* Contract Modal */}
      {selectedContract && (
        <ContractSigningModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onSubmit={handleSubmitContract}
          onDownload={downloadContract}
          submitting={submitting}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DigitalContractPage;