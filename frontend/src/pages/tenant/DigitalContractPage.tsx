import { useEffect, useState, useRef, useCallback } from 'react';
import {
  FileText, Download, Eye, Send, AlertCircle, CheckCircle,
  MapPin, PenTool, X, Clock, FileCheck, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatDate, formatCurrency,
  headingStyle, inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  statusPillStyle, tableStyle, tableWrapStyle, tdStyle, thStyle, textareaStyle,
} from '../landlord/landlordPageStyles';

// ---------------------------------------------------------------------------
// Palette safety — tenant page re-uses landlord styles where accent is "amber".
// Alias to GOLD so every reference below is safe regardless of which key exists.
// ---------------------------------------------------------------------------
const GOLD: string = (palette as any).gold ?? (palette as any).amber ?? '#c9a84c';

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
  STATUS_META[s] ?? { label: s.replace(/_/g, ' '), color: palette.muted, icon: null, desc: '' };

// Accordion sections — signature is intentionally absent here.
// It is always rendered as a separate, always-visible block below the accordions.
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
// Signature Pad — separate component so its canvas is always freshly mounted
// and DPI scaling is applied immediately after paint.
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

  // Scale canvas pixels to match CSS size × device pixel ratio.
  // This fixes two bugs: (1) strokes appear offset on retina, (2) getImageData
  // reports the wrong pixels so "hasInk" always returns false.
  const initCanvas = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr  = Math.max(window.devicePixelRatio ?? 1, 1);
    const rect = cv.getBoundingClientRect();
    if (rect.width === 0) return; // not yet painted — will retry on resize
    cv.width  = Math.round(rect.width  * dpr);
    cv.height = Math.round(rect.height * dpr);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }, []);

  useEffect(() => {
    // Small delay so the browser has painted the element and getBoundingClientRect
    // returns the real dimensions.
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
    // Any alpha > 10 counts as ink (accounts for anti-aliasing)
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
            <div style={sectionTitleStyle}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, display: 'inline-block', marginRight: 6 }} />
              Sahihi ya Kidijitali
            </div>
            <h3 style={{ ...headingStyle, fontSize: 18, marginTop: 4 }}>Chora Sahihi Yako</h3>
          </div>
          <button
            style={{ ...buttonStyle('secondary'), padding: 8, borderRadius: 8 }}
            onClick={onCancel}
            aria-label="Funga"
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ color: palette.muted, fontSize: 13, marginBottom: 14 }}>
          Chora sahihi yako kwenye sanduku hapa chini kwa kutumia kidole au panya.
        </p>

        {/* Canvas — CSS dimensions fixed; actual pixel dimensions set by initCanvas */}
        <div style={{
          border: `1.5px solid ${GOLD}55`, borderRadius: 12,
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
            style={{ ...buttonStyle('secondary'), padding: '8px 18px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}
            onClick={clear}
          >
            Futa
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...buttonStyle('secondary'), padding: '8px 16px' }} onClick={onCancel}>
              Ghairi
            </button>
            <button style={{ ...buttonStyle('primary'), padding: '8px 22px' }} onClick={save}>
              Hifadhi Sahihi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Contract Signing / View Modal
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
        return <input style={{ ...inputStyle, width: '100%' }} value={val} placeholder={field.placeholder} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'date':
        return <input type="date" style={{ ...inputStyle, width: '100%' }} value={val} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'number':
        return <input type="number" style={{ ...inputStyle, width: '100%' }} value={val} placeholder={field.placeholder} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'textarea':
        return <textarea style={{ ...textareaStyle, width: '100%', minHeight: 80 }} value={val} placeholder={field.placeholder} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
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
      <div style={{ ...panelStyle, maxWidth: 820, width: '100%', maxHeight: '94vh', overflowY: 'auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, display: 'inline-block', marginRight: 6 }} />
              {contract.status === 'pending_signature' ? 'Sahihi Mkataba' : 'Angalia Mkataba'}
            </div>
            <h2 style={{ ...headingStyle, fontSize: 20, marginTop: 6 }}>{contract.title}</h2>
            {contract.property && (
              <p style={{ color: palette.muted, fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <MapPin size={12} style={{ color: GOLD }} />
                {[contract.property.title, contract.property.location].filter(Boolean).join(' — ')}
                {contract.property.price && (
                  <span style={{ color: GOLD, fontWeight: 600, marginLeft: 4 }}>
                    {formatCurrency(contract.property.price)}/mwezi
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            style={{ ...buttonStyle('secondary'), padding: 8, borderRadius: 8, flexShrink: 0 }}
            onClick={onClose} aria-label="Funga"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Status Banner ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          borderRadius: 10, marginBottom: 20,
          background: `${sm.color}18`, border: `1px solid ${sm.color}38`,
          color: sm.color, fontSize: 14, fontWeight: 600,
        }}>
          {sm.icon} {sm.label}
          {sm.desc && (
            <span style={{ color: palette.muted, fontSize: 12, fontWeight: 400, marginLeft: 4 }}>
              — {sm.desc}
            </span>
          )}
        </div>

        {/* ── File Download Bar ── */}
        {hasFile(contract) && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: `${GOLD}12`, border: `1px solid ${GOLD}30`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={18} style={{ color: GOLD }} />
              <div>
                <div style={{ color: palette.cream, fontSize: 14, fontWeight: 600 }}>{fileLabel(contract)}</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>Hati ya mkataba — pakua ili kusoma vizuri</div>
              </div>
            </div>
            <button
              style={{ ...buttonStyle('secondary'), padding: '6px 14px', fontSize: 12, borderRadius: 8 }}
              onClick={() => onDownload(contract.id, contract.file_name || 'mkataba.pdf')}
            >
              <Download size={12} /> Pakua
            </button>
          </div>
        )}

        {/* ── Fields ── */}
        {visibleFields.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: palette.muted }}>
            <FileCheck size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14 }}>Mkataba huu hauna sehemu za kujaza.</div>
            {hasFile(contract) && <div style={{ fontSize: 12, marginTop: 6 }}>Pakua hati ili kusoma maudhui yote.</div>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* Accordion sections for data fields */}
            {activeSections.map(section => {
              const fields   = getSectionFields(section);
              const isOpen   = activeSection === section.title;
              const filled   = fields.filter(f => fieldValues[f.id]?.trim() || f.tenant_value || f.value);
              const required = fields.filter(f => f.required);
              const complete = required.every(f => fieldValues[f.id]?.trim());

              return (
                <div key={section.title} style={{
                  border: `1px solid ${isOpen ? `${GOLD}30` : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12, overflow: 'hidden', marginBottom: 4, transition: 'border-color 0.2s',
                }}>
                  <button
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', border: 'none', cursor: 'pointer', color: palette.cream,
                      background: isOpen ? `${GOLD}0e` : 'rgba(255,255,255,0.02)',
                    }}
                    onClick={() => setActiveSection(isOpen ? null : section.title)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{section.title}</span>
                      <span style={{
                        fontSize: 11, borderRadius: 6, padding: '2px 8px',
                        color:      complete ? '#16a34a'              : palette.muted,
                        background: complete ? 'rgba(22,163,74,0.12)' : 'rgba(255,255,255,0.05)',
                      }}>
                        {filled.length}/{fields.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {complete && <CheckCircle size={14} style={{ color: '#16a34a' }} />}
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
                          {renderInput(field)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ungrouped data fields */}
            {ungroupedFields.length > 0 && (
              <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: palette.cream }}>Sehemu Nyingine</div>
                {ungroupedFields.map(field => (
                  <div key={field.id}>
                    <label style={{ display: 'block', marginBottom: 7, color: palette.cream, fontSize: 13, fontWeight: 600 }}>
                      {field.label}{field.required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
                    </label>
                    {renderInput(field)}
                  </div>
                ))}
              </div>
            )}

            {/* ── Signature block — ALWAYS VISIBLE, outside all accordions ── */}
            <div
              id="sig-block"
              style={{
                border: signatureDataUrl
                  ? '1.5px solid rgba(22,163,74,0.4)'
                  : `1.5px solid ${GOLD}55`,
                borderRadius: 12,
                padding: '20px 18px',
                marginTop: 6,
                background: signatureDataUrl
                  ? 'rgba(22,163,74,0.05)'
                  : `${GOLD}09`,
              }}
            >
              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <PenTool size={16} style={{ color: GOLD }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: palette.cream }}>
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
                /* ── Signature preview ── */
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{
                    border: `1px solid ${GOLD}35`, borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)', padding: '8px 12px',
                  }}>
                    <img
                      src={signatureDataUrl}
                      alt="Sahihi yako"
                      style={{ display: 'block', maxHeight: 70, maxWidth: 260 }}
                    />
                  </div>
                  {!isReadOnly && (
                    <button
                      style={{ ...buttonStyle('secondary'), padding: '8px 16px', fontSize: 13 }}
                      onClick={() => setShowSignPad(true)}
                    >
                      <PenTool size={13} /> Badilisha Sahihi
                    </button>
                  )}
                </div>
              ) : (
                /* ── Prompt to sign ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ color: palette.muted, fontSize: 13, margin: 0 }}>
                    Bonyeza kitufe hapa chini ili kutoa sahihi yako ya kidijitali.
                    Sahihi ni <strong style={{ color: palette.cream }}>lazima</strong> kabla ya kuwasilisha mkataba.
                  </p>
                  {!isReadOnly && (
                    <button
                      style={{ ...buttonStyle('primary'), padding: '12px 24px', alignSelf: 'flex-start' }}
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

        {/* ── Inline error ── */}
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

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', gap: 12, justifyContent: 'flex-end',
          marginTop: 24, paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexWrap: 'wrap',
        }}>
          <button style={{ ...buttonStyle('secondary'), padding: '10px 20px' }} onClick={onClose}>
            Funga
          </button>
          {contract.status === 'pending_signature' && (
            <button
              style={{ ...buttonStyle('primary'), padding: '10px 28px' }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Inawasilisha…
                </>
              ) : (
                <><Send size={15} /> Wasilisha Mkataba</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Signature Pad — rendered as a separate layer above the modal ── */}
      {showSignPad && (
        <SignaturePad
          overlayStyle={overlay}
          cardStyle={panelStyle}
          onSave={(dataUrl) => {
            setSignatureDataUrl(dataUrl);
            setShowSignPad(false);
            setModalError(''); // clear "please sign" error once signature is provided
          }}
          onCancel={() => setShowSignPad(false)}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Tenant Page
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
    <div style={{ ...pageStyle, padding: '0' }}>

      {/* ── Header ── */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 32, right: 32, height: '2px',
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        }} />
        <div style={sectionTitleStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, display: 'inline-block', marginRight: 6 }} />
          Eneo la Mpangaji
        </div>
        <h1 style={headingStyle}>Mikataba ya Kidijitali</h1>
        <p style={descriptionStyle}>Angalia, jaza, na sahihi mikataba yako ya kukodisha mtandaoni.</p>

        {needsSigning.length > 0 && (
          <div style={{
            marginTop: 20, display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(201,168,76,0.1)', border: `1px solid ${GOLD}45`,
            borderRadius: 10, padding: '14px 18px',
          }}>
            <PenTool size={18} style={{ color: GOLD, flexShrink: 0 }} />
            <div>
              <div style={{ color: palette.cream, fontWeight: 600, fontSize: 14 }}>
                Unahitajika kusaini {needsSigning.length === 1 ? 'mkataba' : `mikataba ${needsSigning.length}`}
              </div>
              <div style={{ color: palette.muted, fontSize: 12, marginTop: 2 }}>
                Bonyeza kitufe cha <strong style={{ color: GOLD }}>&ldquo;Saini&rdquo;</strong> kwenye mkataba husika hapa chini.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Contract list ── */}
      <section style={panelStyle}>

        {(error || success) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 14,
            color:      success ? '#16a34a'              : '#dc2626',
            background: success ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
            border:     `1px solid ${success ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}`,
            borderRadius: 10, padding: '14px 18px', marginBottom: 20,
          }}>
            {success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {success || error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: palette.muted, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Inapakia mikataba…
          </div>

        ) : contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.muted }}>
            <Shield size={52} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block', color: GOLD }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: palette.cream }}>Hakuna mikataba ya sasa</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6, maxWidth: 360, margin: '6px auto 0' }}>
              Mpangishaji wako bado hakutumia mkataba. Mikataba itaonekana hapa mara tu inapokufikia.
            </div>
          </div>

        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Mkataba', 'Mali / Nyumba', 'Tarehe', 'Hali', 'Vitendo'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => {
                  const sm     = getStatusMeta(c.status);
                  const fCount = parseFields(c.fields).filter(f => !f.landlordOnly && f.type !== 'signature').length;
                  return (
                    <tr
                      key={c.id}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: palette.cream }}>{c.title}</div>
                        {fileLabel(c) && <div style={{ color: palette.muted, fontSize: 12, marginTop: 3 }}>📄 {fileLabel(c)}</div>}
                        {fCount > 0 && <div style={{ color: GOLD, fontSize: 11, marginTop: 2 }}>{fCount} sehemu za kujaza</div>}
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: palette.cream, fontWeight: 600 }}>
                          <MapPin size={12} style={{ color: GOLD, flexShrink: 0 }} />
                          {c.property?.title ?? `Mali #${c.property_id}`}
                        </div>
                        {c.property?.location && <div style={{ color: palette.muted, fontSize: 12, marginTop: 2, paddingLeft: 17 }}>{c.property.location}</div>}
                        {c.property?.price && <div style={{ color: GOLD, fontSize: 12, fontWeight: 600, marginTop: 2, paddingLeft: 17 }}>{formatCurrency(c.property.price)}/mwezi</div>}
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
                              style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: 12, borderRadius: 8 }}
                              onClick={() => downloadContract(c.id, c.file_name || 'mkataba.pdf')}
                            >
                              <Download size={11} /> Pakua
                            </button>
                          )}
                          {c.status === 'pending_signature' && (
                            <button
                              style={{ ...buttonStyle('primary'), padding: '5px 10px', fontSize: 12, borderRadius: 8 }}
                              onClick={() => { setError(''); setSuccess(''); setSelectedContract(c); }}
                            >
                              <PenTool size={11} /> Saini
                            </button>
                          )}
                          {['pending_review', 'approved', 'rejected'].includes(c.status) && (
                            <button
                              style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: 12, borderRadius: 8 }}
                              onClick={() => { setError(''); setSuccess(''); setSelectedContract(c); }}
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