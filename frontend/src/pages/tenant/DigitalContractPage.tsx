import { useEffect, useState, useRef, useCallback } from 'react';
import {
  FileText, Download, Eye, Send, AlertCircle, CheckCircle,
  MapPin, PenTool, X, Clock, FileCheck, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatDate, formatCurrency,
  headingStyle, inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  statusPillStyle, textareaStyle,
} from '../landlord/landlordPageStyles';

const GOLD: string = (palette as any).gold ?? (palette as any).amber ?? '#c9a84c';

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
  fields: ContractField[];
  tenant_signature?: string;
  created_at?: string;
  property?: { id?: number; title?: string; location?: string; price?: number };
}

// ====================== HELPERS ======================
const parseFields = (raw: any): ContractField[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
};

const isVisible = (c: DigitalContract) => c.status !== 'draft';
const fileLabel = (c: DigitalContract) => c.file_name ?? c.file_url?.split('/').pop() ?? 'mkataba.pdf';
const hasFile = (c: DigitalContract) => !!(c.file_url || c.file_name);

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  pending_signature: { label: 'Inasubiri Sahihi Yako', color: '#c9a84c', icon: <PenTool size={14} />, desc: 'Jaza sehemu zote kisha sahihi.' },
  pending_review:    { label: 'Inakaguliwa na Mpangishaji', color: '#3b82f6', icon: <Clock size={14} />, desc: 'Mpangishaji anakagua mkataba.' },
  approved:          { label: 'Imeidhinishwa', color: '#16a34a', icon: <CheckCircle size={14} />, desc: 'Mkataba umekubaliwa.' },
  rejected:          { label: 'Imekataliwa', color: '#dc2626', icon: <AlertCircle size={14} />, desc: 'Mkataba ulikataliwa.' },
};

const getStatusMeta = (s: string) => STATUS_META[s] ?? { label: s.replace(/_/g, ' '), color: palette.muted || '#94a3b8', icon: null, desc: '' };

const FIELD_SECTIONS = [
  { title: 'Taarifa za Mpangaji', ids: ['tenant_full_name', 'tenant_nida', 'tenant_phone', 'tenant_nationality', 'tenant_occupation', 'tenant_address', 'tenant_gender', 'tenant_age'] },
  { title: 'Taarifa za Mali / Chumba', ids: ['room_number', 'room_purpose', 'house_number', 'house_location', 'house_bedrooms', 'house_livingrooms', 'house_kitchens', 'house_bathrooms', 'house_purpose', 'tenant_count'] },
  { title: 'Muda na Kodi', ids: ['start_date', 'end_date', 'contract_months', 'monthly_rent', 'total_paid', 'paid_months'] },
  { title: 'Taarifa za Mdhamini', ids: ['guarantor_name', 'guarantor_nida', 'guarantor_phone', 'guarantor_address', 'guarantor_nationality'] },
  { title: 'Masharti ya Ziada', ids: ['property_items', 'special_terms'] },
];

const ALL_SECTION_IDS = new Set(FIELD_SECTIONS.flatMap(s => s.ids));

// ====================== SIGNATURE PAD ======================
const SignaturePad = ({ overlayStyle, cardStyle, onSave, onCancel }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [padError, setPadError] = useState('');

  const initCanvas = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const rect = cv.getBoundingClientRect();
    cv.width = Math.round(rect.width * dpr);
    cv.height = Math.round(rect.height * dpr);
    const ctx = cv.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(initCanvas, 50);
    window.addEventListener('resize', initCanvas);
    return () => { clearTimeout(t); window.removeEventListener('resize', initCanvas); };
  }, [initCanvas]);

  const getXY = (e: any) => {
    const cv = canvasRef.current!;
    const rect = cv.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const onDown = (e: any) => { e.preventDefault(); drawing.current = true; const { x, y } = getXY(e); canvasRef.current?.getContext('2d')?.beginPath().moveTo(x, y); };
  const onMove = (e: any) => {
    if (!drawing.current) return;
    const { x, y } = getXY(e);
    canvasRef.current?.getContext('2d')?.lineTo(x, y).stroke();
  };
  const onUp = () => { drawing.current = false; };

  const clear = () => {
    canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setPadError('');
  };

  const save = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const hasInk = cv.getContext('2d')!.getImageData(0, 0, cv.width, cv.height).data.some((v, i) => i % 4 === 3 && v > 10);
    if (!hasInk) return setPadError('Tafadhali chora sahihi yako kwanza.');
    onSave(cv.toDataURL('image/png'));
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...cardStyle, maxWidth: 520, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={sectionTitleStyle}>Sahihi ya Kidijitali</div>
            <h3 style={{ ...headingStyle, fontSize: 18, marginTop: 4 }}>Chora Sahihi Yako</h3>
          </div>
          <button style={{ ...buttonStyle('secondary'), padding: 8 }} onClick={onCancel}><X size={18} /></button>
        </div>

        <p style={{ color: palette.muted, fontSize: 13, marginBottom: 12 }}>Chora sahihi yako hapa chini kwa kidole au panya.</p>

        <div style={{ border: `2px solid ${GOLD}40`, borderRadius: 12, overflow: 'hidden', background: '#0f172a' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 180, touchAction: 'none', cursor: 'crosshair' }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          />
        </div>

        {padError && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}><AlertCircle size={14} /> {padError}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button style={{ ...buttonStyle('secondary'), color: '#ef4444' }} onClick={clear}>Futa Sahihi</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={buttonStyle('secondary')} onClick={onCancel}>Ghairi</button>
            <button style={buttonStyle('primary')} onClick={save}>Hifadhi Sahihi</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================== CONTRACT SIGNING MODAL ======================
const ContractSigningModal = ({ contract, onClose, onSubmit, onDownload, submitting }: any) => {
  const allFields = parseFields(contract.fields);
  const visibleFields = allFields.filter((f: any) => !f.landlordOnly);
  const dataFields = visibleFields.filter((f: any) => f.type !== 'signature');

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    dataFields.forEach((f: any) => init[f.id] = f.tenant_value || f.value || '');
    return init;
  });

  const [signatureDataUrl, setSignatureDataUrl] = useState(contract.tenant_signature || '');
  const [showSignPad, setShowSignPad] = useState(false);
  const [activeSection, setActiveSection] = useState(FIELD_SECTIONS[0]?.title || null);
  const [modalError, setModalError] = useState('');

  const isReadOnly = ['approved', 'pending_review'].includes(contract.status);
  const sm = getStatusMeta(contract.status);

  const setVal = (id: string, val: string) => setFieldValues(prev => ({ ...prev, [id]: val }));

  const getSectionFields = (sec: any) => dataFields.filter((f: any) => sec.ids.includes(f.id));
  const ungroupedFields = dataFields.filter((f: any) => !ALL_SECTION_IDS.has(f.id));
  const activeSections = FIELD_SECTIONS.filter(s => getSectionFields(s).length > 0);

  const renderInput = (field: any) => {
    const val = fieldValues[field.id] ?? '';
    const shared = { disabled: isReadOnly, required: field.required };

    switch (field.type) {
      case 'text': return <input style={{ ...inputStyle, width: '100%' }} value={val} placeholder={field.placeholder} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'date': return <input type="date" style={{ ...inputStyle, width: '100%' }} value={val} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'number': return <input type="number" style={{ ...inputStyle, width: '100%' }} value={val} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      case 'textarea': return <textarea style={{ ...textareaStyle, width: '100%', minHeight: 90 }} value={val} placeholder={field.placeholder} onChange={e => setVal(field.id, e.target.value)} {...shared} />;
      default: return null;
    }
  };

  const handleSubmit = async () => {
    setModalError('');
    const missing = dataFields.filter((f: any) => f.required && !fieldValues[f.id]?.trim());
    if (missing.length) {
      setModalError(`Tafadhali jaza sehemu zifuatazo: ${missing.map((f: any) => f.label).join(', ')}`);
      return;
    }
    if (!signatureDataUrl) {
      setModalError('Sahihi ni lazima kabla ya kuwasilisha mkataba.');
      document.getElementById('sig-block')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    await onSubmit(contract.id, fieldValues, signatureDataUrl);
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...panelStyle, maxWidth: 860, width: '100%', maxHeight: '96vh', overflowY: 'auto', borderRadius: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={sectionTitleStyle}>{contract.status === 'pending_signature' ? 'Sahihi Mkataba' : 'Angalia Mkataba'}</div>
            <h2 style={{ ...headingStyle, fontSize: 22, marginTop: 6 }}>{contract.title}</h2>
            {contract.property && (
              <p style={{ color: palette.muted, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <MapPin size={16} style={{ color: GOLD }} />
                {contract.property.title} — {contract.property.location}
                {contract.property.price && <span style={{ color: GOLD, fontWeight: 600 }}> • {formatCurrency(contract.property.price)}/mwezi</span>}
              </p>
            )}
          </div>
          <button style={{ ...buttonStyle('secondary'), padding: 10 }} onClick={onClose}><X size={20} /></button>
        </div>

        {/* Status */}
        <div style={{ padding: '14px 18px', borderRadius: 12, background: `${sm.color}15`, border: `1px solid ${sm.color}40`, color: sm.color, marginBottom: 20 }}>
          {sm.icon} <strong>{sm.label}</strong> — {sm.desc}
        </div>

        {/* Download File */}
        {hasFile(contract) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${GOLD}10`, border: `1px solid ${GOLD}30`, padding: '14px 18px', borderRadius: 12, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileText size={24} style={{ color: GOLD }} />
              <div>
                <div style={{ fontWeight: 600 }}>{fileLabel(contract)}</div>
                <div style={{ fontSize: 13, color: palette.muted }}>Pakua ili kusoma vizuri</div>
              </div>
            </div>
            <button style={buttonStyle('secondary')} onClick={() => onDownload(contract.id, fileLabel(contract))}>
              <Download size={16} /> Pakua
            </button>
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeSections.map(section => {
            const fields = getSectionFields(section);
            const isOpen = activeSection === section.title;
            const filledCount = fields.filter(f => fieldValues[f.id]?.trim()).length;

            return (
              <div key={section.title} style={{ border: `1px solid ${isOpen ? GOLD + '40' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, overflow: 'hidden' }}>
                <button
                  onClick={() => setActiveSection(isOpen ? null : section.title)}
                  style={{
                    width: '100%', padding: '16px 20px', background: isOpen ? `${GOLD}08` : 'transparent',
                    border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{section.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: filledCount === fields.length ? '#16a34a' : palette.muted }}>
                      {filledCount}/{fields.length}
                    </span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isOpen && (
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {fields.map((field: any) => (
                      <div key={field.id}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                          {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                        </label>
                        {renderInput(field)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Signature Block */}
          <div id="sig-block" style={{
            border: `2px solid ${signatureDataUrl ? '#16a34a' : GOLD}60`,
            borderRadius: 14,
            padding: 20,
            background: signatureDataUrl ? 'rgba(22,163,74,0.08)' : `${GOLD}08`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <PenTool size={18} style={{ color: GOLD }} />
              <strong>Sahihi ya Mpangaji { !isReadOnly && <span style={{ color: '#ef4444' }}>*</span>}</strong>
            </div>

            {signatureDataUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <img src={signatureDataUrl} alt="Sahihi" style={{ maxHeight: 80, border: `1px solid ${GOLD}40`, borderRadius: 8 }} />
                {!isReadOnly && <button style={buttonStyle('secondary')} onClick={() => setShowSignPad(true)}>Badilisha Sahihi</button>}
              </div>
            ) : (
              !isReadOnly && <button style={buttonStyle('primary')} onClick={() => setShowSignPad(true)}>Toa Sahihi Yako</button>
            )}
          </div>
        </div>

        {modalError && <div style={{ color: '#ef4444', marginTop: 16, padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{modalError}</div>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32 }}>
          <button style={buttonStyle('secondary')} onClick={onClose}>Funga</button>
          {contract.status === 'pending_signature' && (
            <button style={buttonStyle('primary')} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Inawasilisha...' : 'Wasilisha Mkataba'}
            </button>
          )}
        </div>
      </div>

      {showSignPad && (
        <SignaturePad
          overlayStyle={overlayStyle}
          cardStyle={panelStyle}
          onSave={(url: string) => { setSignatureDataUrl(url); setShowSignPad(false); }}
          onCancel={() => setShowSignPad(false)}
        />
      )}
    </div>
  );
};

// ====================== MAIN PAGE ======================
const DigitalContractPage = () => {
  const [contracts, setContracts] = useState<DigitalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedContract, setSelectedContract] = useState<DigitalContract | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const res = await Api.getTenantDigitalContracts();
      const data = Array.isArray(res.data) ? res.data : [];
      setContracts(data.map((c: any) => ({ ...c, fields: parseFields(c.fields) })).filter(isVisible));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Imeshindwa kupakia mikataba.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContracts(); }, []);

  const handleSubmitContract = async (contractId: number, fields: Record<string, string>, signature: string) => {
    try {
      setSubmitting(true);
      await Api.submitDigitalContract({ contract_id: contractId, fields, signature });
      setSuccess('Mkataba umewasilishwa kwa mafanikio!');
      await loadContracts();
      setSelectedContract(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Imeshindwa kuwasilisha mkataba.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadContract = async (id: number, filename: string) => {
    try {
      const res = await Api.downloadDigitalContract(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Imeshindwa kupakua faili.');
    }
  };

  return (
    <div style={{ ...pageStyle, background: '#0F172A', minHeight: '100vh', padding: '0' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ ...panelStyle, margin: '20px' }}>
        <div style={sectionTitleStyle}>Eneo la Mpangaji</div>
        <h1 style={{ ...headingStyle, fontSize: 32 }}>Mikataba ya Kidijitali</h1>
        <p style={descriptionStyle}>Angalia, jaza na sahihi mikataba yako mtandaoni.</p>
      </div>

      {/* Table Container */}
      <div style={{ ...panelStyle, margin: '20px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Orodha ya Mikataba Yangu</h2>

        {(error || success) && (
          <div style={{
            padding: '14px 18px', borderRadius: 12, marginBottom: 24,
            background: success ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)',
            color: success ? '#4ade80' : '#f87171',
            border: `1px solid ${success ? '#4ade80' : '#f87171'}40`
          }}>
            {success || error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: palette.muted }}>
            Inapakia mikataba...
          </div>
        ) : contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: palette.muted }}>
            <Shield size={60} style={{ opacity: 0.3, marginBottom: 20 }} />
            Hakuna mikataba kwa sasa
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#162035', borderRadius: 12 }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  <th style={{ padding: '18px 20px', textAlign: 'left' }}>Mkataba</th>
                  <th style={{ padding: '18px 20px', textAlign: 'left' }}>Mali</th>
                  <th style={{ padding: '18px 20px' }}>Tarehe</th>
                  <th style={{ padding: '18px 20px' }}>Hali</th>
                  <th style={{ padding: '18px 20px', textAlign: 'center' }}>Vitendo</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => {
                  const sm = getStatusMeta(c.status);
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '20px', fontWeight: 600 }}>{c.title}</td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <MapPin size={16} style={{ color: GOLD }} />
                          {c.property?.title || `Mali #${c.property_id}`}
                        </div>
                      </td>
                      <td style={{ padding: '20px', color: palette.muted }}>{formatDate(c.created_at)}</td>
                      <td style={{ padding: '20px' }}>
                        <span style={{ padding: '6px 14px', borderRadius: 9999, fontSize: 12, background: `${sm.color}20`, color: sm.color, border: `1px solid ${sm.color}40` }}>
                          {sm.icon} {sm.label}
                        </span>
                      </td>
                      <td style={{ padding: '20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {hasFile(c) && (
                            <button style={{ ...buttonStyle('secondary'), fontSize: 13 }} onClick={() => downloadContract(c.id, fileLabel(c))}>
                              Pakua
                            </button>
                          )}
                          {c.status === 'pending_signature' && (
                            <button style={{ ...buttonStyle('primary'), fontSize: 13 }} onClick={() => setSelectedContract(c)}>
                              Saini
                            </button>
                          )}
                          {['pending_review', 'approved', 'rejected'].includes(c.status) && (
                            <button style={{ ...buttonStyle('secondary'), fontSize: 13 }} onClick={() => setSelectedContract(c)}>
                              Angalia
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
      </div>

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