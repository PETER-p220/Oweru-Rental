import { useEffect, useState, useRef, useCallback } from 'react';
import {
  FileText, Download, Eye, Send, AlertCircle, CheckCircle,
  MapPin, PenTool, X, Clock, FileCheck, Shield, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import Api from '../../services/api';
import { formatDate, formatCurrency } from './tenantPageStyles';

// ---------------------------------------------------------------------------
// Color Palette - Oweru Brand
// ---------------------------------------------------------------------------

const B = {
  navy900: '#0F172A',
  navy800: '#162035',
  navy700: '#1E2D4A',
  gold:    '#C89128',
  goldLt:  '#D4A843',
  goldDim: 'rgba(200,145,40,0.12)',
  cream:   '#F8F8F9',
  slate:   '#94A3B8',
  border:  'rgba(200,145,40,0.18)',
  borderF: 'rgba(200,145,40,0.08)',
};

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
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
};

const isVisible   = (c: DigitalContract) => c.status !== 'draft';
const fileLabel   = (c: DigitalContract) => c.file_name ?? c.file_url?.split('/').pop();
const hasFile     = (c: DigitalContract) => !!(c.file_url || c.file_name);

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  pending_signature: {
    label: 'Inasubiri Sahihi Yako',
    color: '#c9a84c',
    icon:  <PenTool size={14} />,
    desc:  'Jaza sehemu zote kisha toa sahihi yako chini ya fomu.',
  },
  pending_review: {
    label: 'Inakaguliwa na Mpangishaji',
    color: '#3b82f6',
    icon:  <Clock size={14} />,
    desc:  'Mpangishaji anakagua mkataba wako uliosainishwa.',
  },
  approved: {
    label: 'Imeidhinishwa',
    color: '#16a34a',
    icon:  <CheckCircle size={14} />,
    desc:  'Mkataba wako umekubaliwa na mpangishaji. Karibu!',
  },
  rejected: {
    label: 'Imekataliwa',
    color: '#dc2626',
    icon:  <AlertCircle size={14} />,
    desc:  'Mkataba ulikataliwa. Wasiliana na mpangishaji.',
  },
};

const getStatusMeta = (s: string) =>
  STATUS_META[s] ?? { label: s.replace(/_/g, ' '), color: B.slate, icon: null, desc: '' };

// Accordion sections
const FIELD_SECTIONS: { title: string; ids: string[] }[] = [
  {
    title: 'Taarifa za Mpangaji',
    ids: [
      'tenant_full_name', 'tenant_nida', 'tenant_phone', 'tenant_nationality',
      'tenant_occupation', 'tenant_address', 'tenant_gender', 'tenant_age',
    ],
  },
  {
    title: 'Taarifa za Mali / Chumba',
    ids: [
      'room_number', 'room_purpose',
      'house_number', 'house_location', 'house_bedrooms', 'house_livingrooms',
      'house_kitchens', 'house_bathrooms', 'house_purpose', 'tenant_count',
    ],
  },
  {
    title: 'Muda na Kodi',
    ids: ['start_date', 'end_date', 'contract_months', 'monthly_rent', 'total_paid', 'paid_months'],
  },
  {
    title: 'Taarifa za Mdhamini',
    ids: ['guarantor_name', 'guarantor_nida', 'guarantor_phone', 'guarantor_address', 'guarantor_nationality'],
  },
  {
    title: 'Masharti ya Ziada',
    ids: ['property_items', 'special_terms'],
  },
];
const ALL_SECTION_IDS = new Set(FIELD_SECTIONS.flatMap(s => s.ids));

// ---------------------------------------------------------------------------
// Signature Pad Component
// ---------------------------------------------------------------------------

interface SignaturePadProps {
  overlayStyle: React.CSSProperties;
  cardStyle: React.CSSProperties;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const SignaturePad = ({ overlayStyle, cardStyle, onSave, onCancel }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);
  const [padError, setPadError] = useState('');

  const initCanvas = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr  = Math.max(window.devicePixelRatio ?? 1, 1);
    const rect = cv.getBoundingClientRect();
    if (rect.width === 0) return;
    cv.width  = Math.round(rect.width  * dpr);
    cv.height = Math.round(rect.height * dpr);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = B.gold;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }, []);

  useEffect(() => {
    const t = window.setTimeout(initCanvas, 40);
    window.addEventListener('resize', initCanvas);
    return () => { window.clearTimeout(t); window.removeEventListener('resize', initCanvas); };
  }, [initCanvas]);

  const getXY = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const cv   = canvasRef.current!;
    const rect = cv.getBoundingClientRect();
    const src  = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const onDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = true;
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const { x, y } = getXY(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!drawing.current) return;
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const { x, y } = getXY(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onUp = (e: React.SyntheticEvent) => { e.preventDefault(); drawing.current = false; };

  const clear = () => {
    const cv = canvasRef.current; if (!cv) return;
    cv.getContext('2d')?.clearRect(0, 0, cv.width, cv.height);
    setPadError('');
  };

  const save = () => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const hasInk = d.some((v, i) => i % 4 === 3 && v > 10);
    if (!hasInk) { setPadError('Tafadhali chora sahihi yako kwanza.'); return; }
    onSave(cv.toDataURL('image/png'));
  };

  return (
    <div style={{ ...overlayStyle, zIndex: 1100 }}>
      <div style={{ ...cardStyle, maxWidth: 520, width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: B.gold, marginBottom: 4 }}>
              SAHIHI YA KIDIJITALI
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: B.cream, margin: 0 }}>Chora Sahihi Yako</h3>
          </div>
          <button
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: B.cream, padding: 8, borderRadius: 8 }}
            onClick={onCancel}
            aria-label="Funga"
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ color: B.slate, fontSize: 13, marginBottom: 14 }}>
          Chora sahihi yako kwenye sanduku hapa chini kwa kutumia kidole au panya.
        </p>

        {/* Canvas */}
        <div style={{
          border: `1.5px solid ${B.gold}55`, borderRadius: 12,
          overflow: 'hidden', background: 'rgba(255,255,255,0.025)',
        }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: 160, touchAction: 'none', cursor: 'crosshair' }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          />
        </div>

        {padError && (
          <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={13} /> {padError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <button
            style={{ background: 'transparent', border: `1px solid rgba(220,38,68,0.3)`, color: '#dc2626', padding: '8px 18px', borderRadius: 8 }}
            onClick={clear}
          >
            Futa
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: B.cream, padding: '8px 16px', borderRadius: 8 }} onClick={onCancel}>
              Ghairi
            </button>
            <button style={{ background: B.gold, border: 'none', color: B.navy900, padding: '8px 22px', borderRadius: 8, fontWeight: 600 }} onClick={save}>
              Hifadhi Sahihi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Contract Signing Modal
// ---------------------------------------------------------------------------

interface SigningModalProps {
  contract: DigitalContract;
  onClose: () => void;
  onSubmit: (contractId: number, fields: Record<string, string>, signature: string) => Promise<void>;
  onDownload: (id: number, name: string) => void;
  submitting: boolean;
}

const ContractSigningModal = ({ contract, onClose, onSubmit, onDownload, submitting }: SigningModalProps) => {
  const allFields     = parseFields(contract.fields);
  const visibleFields = allFields.filter(f => !f.landlordOnly);
  const dataFields    = visibleFields.filter(f => f.type !== 'signature');

  const [fieldValues,      setFieldValues]      = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    dataFields.forEach(f => { init[f.id] = f.tenant_value || f.value || ''; });
    return init;
  });
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>(contract.tenant_signature || '');
  const [showSignPad,      setShowSignPad]      = useState(false);
  const [activeSection,    setActiveSection]    = useState<string | null>(FIELD_SECTIONS[0]?.title ?? null);
  const [modalError,       setModalError]       = useState('');

  const isReadOnly   = ['approved', 'pending_review'].includes(contract.status);
  const sm           = getStatusMeta(contract.status);
  const setVal       = (id: string, val: string) => setFieldValues(prev => ({ ...prev, [id]: val }));

  const getSectionFields = (sec: { ids: string[] }) => dataFields.filter(f => sec.ids.includes(f.id));
  const ungroupedFields  = dataFields.filter(f => !ALL_SECTION_IDS.has(f.id));
  const activeSections   = FIELD_SECTIONS.filter(s => getSectionFields(s).length > 0);

  const renderInput = (field: ContractField) => {
    const val    = fieldValues[field.id] ?? '';
    const shared = { disabled: isReadOnly, required: field.required };
    switch (field.type) {
      case 'text':
        return <input style={{ width: '100%', background: B.navy900, border: '1px solid rgba(255,255,255,0.1)', color: B.cream, padding: '12px', borderRadius: 8, outline: 'none' }} value={val} placeholder={field.placeholder} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'date':
        return <input type="date" style={{ width: '100%', background: B.navy900, border: '1px solid rgba(255,255,255,0.1)', color: B.cream, padding: '12px', borderRadius: 8, outline: 'none' }} value={val} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'number':
        return <input type="number" style={{ width: '100%', background: B.navy900, border: '1px solid rgba(255,255,255,0.1)', color: B.cream, padding: '12px', borderRadius: 8, outline: 'none' }} value={val} placeholder={field.placeholder} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'textarea':
        return <textarea style={{ width: '100%', minHeight: 80, background: B.navy900, border: '1px solid rgba(255,255,255,0.1)', color: B.cream, padding: '12px', borderRadius: 8, outline: 'none', resize: 'vertical' }} value={val} placeholder={field.placeholder} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    setModalError('');
    const missing = dataFields.filter(f => f.required && !fieldValues[f.id]?.trim());
    if (missing.length) {
      setModalError(`Tafadhali jaza: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    if (!signatureDataUrl) {
      setModalError('Tafadhali toa sahihi yako kabla ya kuwasilisha.');
      document.getElementById('sig-block')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    await onSubmit(contract.id, fieldValues, signatureDataUrl);
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(10,15,30,0.88)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px', backdropFilter: 'blur(6px)',
  };

  return (
    <div style={overlay}>
      <div style={{ background: B.navy800, border: `1px solid ${B.border}`, maxWidth: 820, width: '100%', maxHeight: '94vh', overflowY: 'auto', borderRadius: 16 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, padding: '24px 24px 0' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: B.gold, marginBottom: 4 }}>
              {contract.status === 'pending_signature' ? 'SAHIHI MKATABA' : 'ANGALIA MKATABA'}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: B.cream, margin: '0 0 6px' }}>{contract.title}</h2>
            {contract.property && (
              <p style={{ color: B.slate, fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <MapPin size={12} style={{ color: B.gold }} />
                {[contract.property.title, contract.property.location].filter(Boolean).join(' — ')}
                {contract.property.price && (
                  <span style={{ color: B.gold, fontWeight: 600, marginLeft: 4 }}>
                    {formatCurrency(contract.property.price)}/mwezi
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: B.cream, padding: 8, borderRadius: 8, flexShrink: 0 }}
            onClick={onClose} aria-label="Funga"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          {/* Status Banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            borderRadius: 10, marginBottom: 20,
            background: `${sm.color}18`, border: `1px solid ${sm.color}38`,
            color: sm.color, fontSize: 14, fontWeight: 600,
          }}>
            {sm.icon} {sm.label}
            {sm.desc && (
              <span style={{ color: B.slate, fontSize: 12, fontWeight: 400, marginLeft: 4 }}>
                — {sm.desc}
              </span>
            )}
          </div>

          {/* File Download Bar */}
          {hasFile(contract) && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: `${B.goldDim}`, border: `1px solid ${B.gold}30`,
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} style={{ color: B.gold }} />
                <div>
                  <div style={{ color: B.cream, fontSize: 14, fontWeight: 600 }}>{fileLabel(contract)}</div>
                  <div style={{ color: B.slate, fontSize: 12 }}>Hati ya mkataba — pakua ili kusoma vizuri</div>
                </div>
              </div>
              <button
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: B.cream, padding: '6px 14px', fontSize: 12, borderRadius: 8 }}
                onClick={() => onDownload(contract.id, contract.file_name || 'mkataba.pdf')}
              >
                <Download size={12} /> Pakua
              </button>
              <img
                src={contract.tenant_signature}
                alt="Tenant Signature"
                style={{ marginTop: 10, maxHeight: 60, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, background: 'rgba(255,255,255,0.03)', padding: 4 }}
                loading="lazy"
                decoding="async"
              />
            </div>
          )}

          {/* Fields */}
          {visibleFields.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: B.slate }}>
              <FileCheck size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 14 }}>Mkataba huu hauna sehemu za kujaza.</div>
              {hasFile(contract) && <div style={{ fontSize: 12, marginTop: 6 }}>Pakua hati ili kusoma maudhui yote.</div>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

              {/* Accordion sections */}
              {activeSections.map(section => {
                const fields   = getSectionFields(section);
                const isOpen   = activeSection === section.title;
                const filled   = fields.filter(f => fieldValues[f.id]?.trim() || f.tenant_value || f.value);
                const required = fields.filter(f => f.required);
                const complete = required.every(f => fieldValues[f.id]?.trim());

                return (
                  <div key={section.title} style={{
                    border: `1px solid ${isOpen ? `${B.gold}30` : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 12, overflow: 'hidden', marginBottom: 4, transition: 'border-color 0.2s',
                  }}>
                    <button
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 18px', border: 'none', cursor: 'pointer', color: B.cream,
                        background: isOpen ? `${B.goldDim}` : 'rgba(255,255,255,0.02)',
                      }}
                      onClick={() => setActiveSection(isOpen ? null : section.title)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{section.title}</span>
                        <span style={{
                          fontSize: 11, borderRadius: 6, padding: '2px 8px',
                          color:      complete ? '#16a34a'              : B.slate,
                          background: complete ? 'rgba(22,163,74,0.12)' : 'rgba(255,255,255,0.05)',
                        }}>
                          {filled.length}/{fields.length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {complete && <CheckCircle size={14} style={{ color: '#16a34a' }} />}
                        {isOpen ? <ChevronUp size={16} style={{ color: B.slate }} /> : <ChevronDown size={16} style={{ color: B.slate }} />}
                      </div>
                    </button>

                    {isOpen && (
                      <div style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {fields.map(field => (
                          <div key={field.id}>
                            <label style={{ display: 'block', marginBottom: 7, color: B.cream, fontSize: 13, fontWeight: 600 }}>
                              {field.label}
                              {field.required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
                            </label>
                            {renderInput(field)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ungrouped fields */}
              {ungroupedFields.length > 0 && (
                <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: B.cream }}>Sehemu Nyingine</div>
                  {ungroupedFields.map(field => (
                    <div key={field.id}>
                      <label style={{ display: 'block', marginBottom: 7, color: B.cream, fontSize: 13, fontWeight: 600 }}>
                        {field.label}{field.required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
                      </label>
                      {renderInput(field)}
                    </div>
                  ))}
                </div>
              )}

              {/* Signature block */}
              <div
                id="sig-block"
                style={{
                  border: signatureDataUrl
                    ? '1.5px solid rgba(22,163,74,0.4)'
                    : `1.5px solid ${B.gold}55`,
                  borderRadius: 12,
                  padding: '20px 18px',
                  marginTop: 6,
                  background: signatureDataUrl
                    ? 'rgba(22,163,74,0.05)'
                    : `${B.goldDim}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <PenTool size={16} style={{ color: B.gold }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: B.cream }}>
                    Sahihi ya Mpangaji
                    {!isReadOnly && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
                  </span>
                  {signatureDataUrl && (
                    <span style={{ marginLeft: 'auto', color: '#16a34a', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={13} /> Imewekwa
                    </span>
                  )}
                </div>

                {signatureDataUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{
                      border: `1px solid ${B.gold}35`, borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)', padding: '8px 12px',
                    }}>
              <img
                src={signatureDataUrl}
                alt="Sahihi yako"
                style={{ display: 'block', maxHeight: 70, maxWidth: 260 }}
                loading="lazy"
                decoding="async"
              />
                    </div>
                    {!isReadOnly && (
                      <button
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: B.cream, padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
                        onClick={() => setShowSignPad(true)}
                      >
                        <PenTool size={13} /> Badilisha Sahihi
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ color: B.slate, fontSize: 13, margin: 0 }}>
                      Bonyeza kitufe hapa chini ili kutoa sahihi yako ya kidijitali.
                      Sahihi ni <strong style={{ color: B.cream }}>lazima</strong> kabla ya kuwasilisha mkataba.
                    </p>
                    {!isReadOnly && (
                      <button
                        style={{ background: B.gold, border: 'none', color: B.navy900, padding: '12px 24px', alignSelf: 'flex-start', borderRadius: 8, fontWeight: 600 }}
                        onClick={() => setShowSignPad(true)}
                      >
                        <PenTool size={15} /> Toa Sahihi Yako
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {modalError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#dc2626', fontSize: 13,
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 8, padding: '10px 14px', marginTop: 16,
            }}>
              <AlertCircle size={14} /> {modalError}
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'flex-end',
            marginTop: 24, paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexWrap: 'wrap',
          }}>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: B.cream, padding: '10px 20px', borderRadius: 8 }} onClick={onClose}>
              Funga
            </button>
            {contract.status === 'pending_signature' && (
              <button
                style={{ background: B.gold, border: 'none', color: B.navy900, padding: '10px 28px', borderRadius: 8, fontWeight: 600 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                    Inawasilisha…
                  </>
                ) : (
                  <><Send size={15} /> Wasilisha Mkataba</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Signature Pad */}
      {showSignPad && (
        <SignaturePad
          overlayStyle={overlay}
          cardStyle={{ background: B.navy800, border: `1px solid ${B.border}`, borderRadius: 16 }}
          onSave={(dataUrl) => {
            setSignatureDataUrl(dataUrl);
            setShowSignPad(false);
            setModalError('');
          }}
          onCancel={() => setShowSignPad(false)}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
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
      const raw      = response.data;
      const arr: any[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.data) ? (raw as any).data : [];
      const normalised: DigitalContract[] = arr.map(c => ({
        ...c,
        fields:   parseFields(c.fields),
        file_url: c.file_url || c.file_path || undefined,
      }));
      setContracts(normalised.filter(isVisible));
    } catch (err: any) {
      if (err?.response?.status === 503) setContracts([]);
      else setError(err?.response?.data?.message || 'Imeshindwa kupakia mikataba.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContracts(); }, []);

  const handleSubmitContract = async (
    contractId: number,
    fields: Record<string, string>,
    signature: string,
  ) => {
    try {
      setSubmitting(true); setError(''); setSuccess('');
      await Api.submitDigitalContract({ contract_id: contractId, fields, signature });
      setSuccess('Mkataba wako umewasilishwa. Mpangishaji atakagua na kukuarifu hivi karibuni.');
      await loadContracts();
      setSelectedContract(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Imeshindwa kuwasilisha mkataba. Jaribu tena.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadContract = async (contractId: number, fileName: string) => {
    try {
      const res  = await Api.downloadDigitalContract(contractId);
      const blob = res.data instanceof Blob
        ? res.data
        : new Blob([res.data as BlobPart], { type: 'application/octet-stream' });
      const url  = window.URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: fileName });
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const msg = err?.response?.data?.message || '';
        setError(
          msg.includes('File not found on disk')
            ? 'Faili lipo kwenye mfumo lakini halipatikani kwenye seva. Wasiliana na mpangishaji.'
            : msg || 'Faili halipatikani.',
        );
      } else {
        setError(err?.response?.data?.message || 'Imeshindwa kupakua mkataba.');
      }
    }
  };

  const needsSigning = contracts.filter(c => c.status === 'pending_signature');

  return (
    <div className="dc-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .dc-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px 24px;
          background: #0F172A;
          min-height: 100vh;
        }

        .dc-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .dc-title {
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 16px;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .dc-subtitle {
          font-size: 18px;
          color: #94A3B8;
          font-weight: 400;
          margin-bottom: 32px;
        }

        .dc-alert {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(200,145,40,0.1);
          border: 1px solid rgba(200,145,40,0.2);
          padding: 16px 24px;
          border-radius: 12px;
          color: #C89128;
          font-weight: 600;
          font-size: 14px;
          max-width: 600px;
          margin: 0 auto;
        }

        .dc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 32px;
        }

        .dc-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
        }
        .dc-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          border-color: rgba(200,145,40,0.3);
        }

        .dc-card-header {
          padding: 24px 24px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .dc-card-title {
          font-size: 20px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .dc-card-property {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94A3B8;
          font-size: 15px;
        }

        .dc-card-body {
          padding: 20px 24px;
        }

        .dc-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: '0.05em';
          text-transform: uppercase;
        }

        .dc-card-footer {
          padding: 20px 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          gap: 12px;
        }

        .dc-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .dc-btn-primary {
          background: #C89128;
          color: #FFFFFF;
        }
        .dc-btn-primary:hover {
          background: #D4A843;
          transform: translateY(-1px);
        }

        .dc-btn-secondary {
          background: rgba(255,255,255,0.05);
          color: #FFFFFF;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .dc-btn-secondary:hover {
          background: rgba(255,255,255,0.08);
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .dc-container { padding: 20px 16px; }
          .dc-title { font-size: 32px; }
          .dc-subtitle { font-size: 16px; }
          .dc-grid { grid-template-columns: 1fr; gap: 24px; }
          .dc-card-header { padding: 20px; }
          .dc-card-body { padding: 20px; }
          .dc-card-footer { padding: 20px; }
        }

        @media (max-width: 480px) {
          .dc-container { padding: 16px 12px; }
          .dc-title { font-size: 28px; }
          .dc-subtitle { font-size: 15px; }
          .dc-card-header { padding: 16px; }
          .dc-card-body { padding: 16px; }
          .dc-card-footer { padding: 16px; flex-direction: column; }
          .dc-btn { width: 100%; }
        }
      `}</style>

      {/* Header */}
      <div className="dc-header">
        <h1 className="dc-title">Digital Contracts</h1>
        <p className="dc-subtitle">View, fill, and sign your rental contracts online</p>
        
        {needsSigning.length > 0 && (
          <div className="dc-alert">
            <PenTool size={20} />
            <div>
              <div>You need to sign {needsSigning.length === 1 ? 'a contract' : `${needsSigning.length} contracts`}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Click the "Sign" button on the relevant contract below</div>
            </div>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {(error || success) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, fontSize: 14,
          color:      success ? '#16a34a'              : '#dc2626',
          background: success ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
          border:     `1px solid ${success ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}`,
          borderRadius: 12, padding: '16px 20px', marginBottom: 32, maxWidth: 800, margin: '0 auto 32px',
        }}>
          {success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {success || error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#94A3B8', minHeight: '200px' }}>
          <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite' }} />
          <span>Loading contracts...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && contracts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94A3B8' }}>
          <div style={{ width: 80, height: 80, background: 'rgba(200,145,40,0.1)', border: '1px solid rgba(200,145,40,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', borderRadius: '50%' }}>
            <Shield size={36} style={{ color: '#C89128' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#FFFFFF', marginBottom: 12 }}>No contracts yet</div>
          <div style={{ fontSize: 16, opacity: 0.7, maxWidth: 400, margin: '0 auto' }}>
            Your landlord hasn't created any contracts yet. Contracts will appear here once they're available.
          </div>
        </div>
      )}

      {/* Contracts Grid */}
      {!loading && contracts.length > 0 && (
        <div className="dc-grid">
          {contracts.map(contract => {
            const sm = getStatusMeta(contract.status);
            const fCount = parseFields(contract.fields).filter(f => !f.landlordOnly && f.type !== 'signature').length;
            
            return (
              <div key={contract.id} className="dc-card">
                <div className="dc-card-header">
                  <div className="dc-card-title">{contract.title}</div>
                  <div className="dc-card-property">
                    <MapPin size={16} />
                    {contract.property?.title ?? `Property #${contract.property_id}`}
                  </div>
                  {contract.property?.location && (
                    <div style={{ color: '#94A3B8', fontSize: 13, marginTop: 4, paddingLeft: 24 }}>
                      {contract.property.location}
                    </div>
                  )}
                </div>

                <div className="dc-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div className="dc-status-badge" style={{
                      background: `${sm.color}18`,
                      border: `1px solid ${sm.color}40`,
                      color: sm.color
                    }}>
                      {sm.icon} {sm.label}
                    </div>
                    {contract.property?.price && (
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#C89128' }}>
                        {formatCurrency(contract.property.price)}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: '#94A3B8' }}>
                    {fileLabel(contract) && <span>📄 {fileLabel(contract)}</span>}
                    {fCount > 0 && <span>{fCount} fields to fill</span>}
                    <span>📅 {formatDate(contract.created_at)}</span>
                  </div>
                </div>

                <div className="dc-card-footer">
                  {hasFile(contract) && (
                    <button
                      className="dc-btn dc-btn-secondary"
                      onClick={() => downloadContract(contract.id, contract.file_name || 'contract.pdf')}
                    >
                      <Download size={16} /> Download
                    </button>
                  )}
                  {contract.status === 'pending_signature' && (
                    <button
                      className="dc-btn dc-btn-primary"
                      onClick={() => { setError(''); setSuccess(''); setSelectedContract(contract); }}
                    >
                      <PenTool size={16} /> Sign
                    </button>
                  )}
                  {['pending_review', 'approved', 'rejected'].includes(contract.status) && (
                    <button
                      className="dc-btn dc-btn-secondary"
                      onClick={() => { setError(''); setSuccess(''); setSelectedContract(contract); }}
                    >
                      <Eye size={16} /> View
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
};

export default DigitalContractPage;
