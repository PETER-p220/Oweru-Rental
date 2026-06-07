import { useEffect, useRef, useState } from 'react';
import {
  FileText, Upload, Download, Send, AlertCircle, MapPin,
  User, X, Plus, CheckCircle, Clock, Eye, Building2,
  Home, FileCheck, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency, formatDate } from './landlordPageStyles';

// ── Design tokens — 1:1 with landlordPageStyles / MyProperties
const C = {
  pageBg:    '#F1F5F9',
  headerBg:  '#1E293B',
  cardBg:    '#FFFFFF',
  border:    '#E2E8F0',
  text:      '#0F172A',
  textSub:   '#475569',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',
  slate100:  '#F1F5F9',
  slate200:  '#E2E8F0',
  slate500:  '#64748B',
  gold:      '#C89128',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.26)',
  goldBg:    'rgba(200,145,40,0.08)',
  goldBorder:'rgba(200,145,40,0.28)',
  green:     '#16A34A', greenBg: '#DCFCE7',
  amber:     '#D97706', amberBg: '#FEF3C7',
  red:       '#DC2626', redBg:   '#FFE4E6',
  blue:      '#2563EB', blueBg:  '#DBEAFE',
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface ContractField {
  id: string; label: string;
  type: 'text' | 'date' | 'number' | 'textarea' | 'signature';
  required: boolean; value?: string; placeholder?: string; landlordOnly?: boolean;
}
interface DigitalContract {
  id: number; title: string; property_id: number; tenant_id: number;
  status: 'draft' | 'pending_signature' | 'pending_review' | 'approved' | 'rejected';
  file_url?: string; file_name?: string; file_type?: string; fields: ContractField[];
  landlord_signature?: string; tenant_signature?: string;
  created_at?: string; updated_at?: string;
  property?: { id: number; title?: string; location?: string; price?: number };
  tenant?: { id: number; user?: { first_name?: string; last_name?: string; email?: string } };
}
interface PropertyOption { id: number; title?: string; location?: string; price?: number; }
interface TenantOption   { id: number; user_id?: number; property_id?: number; status?: string; user?: { first_name?: string; last_name?: string; email?: string }; }
interface ApprovedApplicant { id: number; status: string; user_id: number; property_id: number; user?: { first_name?: string; last_name?: string; email?: string }; }
interface ContractFormData  { title: string; contract_type: 'chumba' | 'nyumba' | 'custom'; property_id: string; tenant_id: string; file: File | null; file_url: string; file_name: string; file_type: string; }

// ── Contract field definitions ─────────────────────────────────────────────────

const CHUMBA_CONTRACT_FIELDS: ContractField[] = [
  { id: 'tenant_full_name',   label: 'Jina Kamili la Mpangaji',      type: 'text',    required: true,  placeholder: 'Jina kamili la mpangaji' },
  { id: 'tenant_nida',        label: 'Namba ya NIDA / Pasport',      type: 'text',    required: true,  placeholder: 'Namba ya kitambulisho' },
  { id: 'tenant_phone',       label: 'Namba ya Simu',                type: 'text',    required: true,  placeholder: '+255 xxx xxx xxx' },
  { id: 'room_number',        label: 'Namba / Maelezo ya Chumba',   type: 'text',    required: true,  placeholder: 'Chumba namba / maelezo' },
  { id: 'start_date',         label: 'Tarehe ya Kuanza',             type: 'date',    required: true  },
  { id: 'end_date',           label: 'Tarehe ya Kumalizika',         type: 'date',    required: true  },
  { id: 'monthly_rent',       label: 'Kodi ya Kila Mwezi (TZS)',    type: 'number',  required: true,  placeholder: 'Kiasi cha kodi' },
  { id: 'guarantor_name',     label: 'Jina la Mdhamini',             type: 'text',    required: true,  placeholder: 'Jina kamili la mdhamini' },
  { id: 'landlord_signature', label: 'Sahihi ya Mpangishaji',        type: 'signature',required: true, landlordOnly: true },
  { id: 'tenant_signature',   label: 'Sahihi ya Mpangaji',           type: 'signature',required: true },
];
const NYUMBA_CONTRACT_FIELDS: ContractField[] = [
  { id: 'landlord_full_name', label: 'Jina Kamili la Mpangishaji',   type: 'text',    required: true, placeholder: 'Jina kamili la mmiliki', landlordOnly: true },
  { id: 'tenant_full_name',   label: 'Jina Kamili la Mpangaji',      type: 'text',    required: true, placeholder: 'Jina kamili la mpangaji' },
  { id: 'tenant_nida',        label: 'Namba ya NIDA / Pasport',      type: 'text',    required: true, placeholder: 'Namba ya kitambulisho' },
  { id: 'tenant_phone',       label: 'Namba ya Simu',                type: 'text',    required: true, placeholder: '+255 xxx xxx xxx' },
  { id: 'house_location',     label: 'Eneo la Nyumba',               type: 'text',    required: true, placeholder: 'Mtaa, Kata, Wilaya, Mkoa' },
  { id: 'start_date',         label: 'Tarehe ya Kuanza',             type: 'date',    required: true },
  { id: 'end_date',           label: 'Tarehe ya Kumalizika',         type: 'date',    required: true },
  { id: 'monthly_rent',       label: 'Kodi ya Kila Mwezi (TZS)',    type: 'number',  required: true, placeholder: 'Kiasi cha kodi' },
  { id: 'guarantor_name',     label: 'Jina la Mdhamini',             type: 'text',    required: true, placeholder: 'Jina kamili la mdhamini' },
  { id: 'landlord_signature', label: 'Sahihi ya Mpangishaji',        type: 'signature',required: true, landlordOnly: true },
  { id: 'tenant_signature',   label: 'Sahihi ya Mpangaji',           type: 'signature',required: true },
];

const EMPTY_FORM: ContractFormData = { title: '', contract_type: 'nyumba', property_id: '', tenant_id: '', file: null, file_url: '', file_name: '', file_type: '' };
const ALLOWED_FILE_TYPES = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE_MB = 10;

const CONTRACT_TYPE_META: Record<string, { label: string; sublabel: string; icon: React.ReactNode }> = {
  chumba: { label: 'Mkataba wa Chumba',  sublabel: 'Oweru International Ltd',   icon: <Building2 size={18} /> },
  nyumba: { label: 'Mkataba wa Nyumba',  sublabel: 'Mmiliki binafsi',            icon: <Home size={18} /> },
  custom: { label: 'Mkataba wa Kawaida', sublabel: 'Muundo maalum',              icon: <FileText size={18} /> },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:             { label: 'Rasimu',           color: C.textMuted, bg: C.slate100 },
  pending_signature: { label: 'Inasubiri Sahihi', color: C.amber,     bg: C.amberBg  },
  pending_review:    { label: 'Inakaguliwa',       color: C.blue,      bg: C.blueBg   },
  approved:          { label: 'Imeidhinishwa',     color: C.green,     bg: C.greenBg  },
  rejected:          { label: 'Imekataliwa',       color: C.red,       bg: C.redBg    },
};
const getStatusMeta = (s: string) => STATUS_META[s] ?? { label: s.replace(/_/g, ' '), color: C.textMuted, bg: C.slate100 };

const getTenantLabel = (t: TenantOption) => {
  const name = `${t.user?.first_name ?? ''} ${t.user?.last_name ?? ''}`.trim() || `User #${t.user_id ?? t.id}`;
  return t.user?.email ? `${name} — ${t.user.email}` : name;
};
const resolveContractTenant = (c: DigitalContract, tenants: TenantOption[]) => {
  if (c.tenant?.user) return `${c.tenant.user.first_name ?? ''} ${c.tenant.user.last_name ?? ''}`.trim() || `Tenant #${c.tenant_id}`;
  const m = tenants.find(t => t.id === c.tenant_id || t.user_id === c.tenant_id);
  if (!m) return `Tenant #${c.tenant_id}`;
  return `${m.user?.first_name ?? ''} ${m.user?.last_name ?? ''}`.trim() || `User #${c.tenant_id}`;
};

// ── Input / select shared styles ───────────────────────────────────────────────
const inputCss: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '8px', background: C.slate100, border: `1.5px solid ${C.border}`, color: C.text, fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' };
const selectCss: React.CSSProperties = { ...inputCss, appearance: 'none', cursor: 'pointer' };

// ── Contract Preview Modal ──────────────────────────────────────────────────────

interface PreviewModalProps {
  contract: DigitalContract; tenants: TenantOption[];
  onClose: () => void; onDownload: (id: number, name: string) => void;
  onSend: (id: number) => void; onApprove: (id: number) => void;
}
const ContractPreviewModal = ({ contract, tenants, onClose, onDownload, onSend, onApprove }: PreviewModalProps) => {
  const sm = getStatusMeta(contract.status);
  const tenantName = resolveContractTenant(contract, tenants);
  const [showFields, setShowFields] = useState(false);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', maxWidth: 680, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(15,23,42,0.20)', padding: '28px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.slate500, fontWeight: 700, marginBottom: '4px' }}>Maelezo ya Mkataba</div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>{contract.title}</h2>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, background: C.slate100, border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSub }}>
            <X size={16} />
          </button>
        </div>

        {/* Status badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', background: sm.bg, border: `1px solid ${sm.color}30`, color: sm.color, fontSize: '13px', fontWeight: 700, marginBottom: '20px' }}>
          {sm.label}
          {contract.tenant?.user?.email && <span style={{ marginLeft: '8px', fontSize: '12px', color: C.textMuted, fontWeight: 400 }}>{contract.tenant.user.email}</span>}
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Mpangaji',       value: tenantName,                                                           icon: <User size={13} /> },
            { label: 'Mali / Nyumba',  value: contract.property?.title ?? `Property #${contract.property_id}`,     icon: <MapPin size={13} /> },
            { label: 'Tarehe',         value: formatDate(contract.created_at),                                      icon: <Clock size={13} /> },
            { label: 'Kodi',           value: contract.property?.price ? formatCurrency(contract.property.price) : '—', icon: <FileCheck size={13} /> },
          ].map(item => (
            <div key={item.label} style={{ background: C.slate100, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.textMuted, fontSize: '11px', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.icon} {item.label}</div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: '14px' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* File info */}
        {contract.file_name && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={18} style={{ color: C.gold }} />
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: '14px' }}>{contract.file_name}</div>
                <div style={{ color: C.textMuted, fontSize: '12px' }}>Faili la mkataba lililopakiwa</div>
              </div>
            </div>
            <button onClick={() => onDownload(contract.id, contract.file_name || 'mkataba.pdf')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.textSub, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              <Download size={13} /> Pakua
            </button>
          </div>
        )}

        {/* Tenant signature */}
        {contract.tenant_signature && (
          <div style={{ background: C.greenBg, border: `1px solid rgba(22,163,74,0.25)`, borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.green, fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
              <CheckCircle size={15} /> Mkataba umesainiwa na mpangaji
            </div>
            <img src={contract.tenant_signature} alt="Tenant Signature"
              style={{ maxHeight: 60, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '4px', background: '#fff' }} />
          </div>
        )}

        {/* Fields toggle */}
        {Array.isArray(contract.fields) && contract.fields.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <button onClick={() => setShowFields(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: C.gold, fontSize: '13px', fontWeight: 700, padding: 0 }}>
              {showFields ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showFields ? 'Ficha' : 'Ona'} sehemu ({contract.fields.filter(f => f.value).length}/{contract.fields.length})
            </button>
            {showFields && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', background: C.slate100, borderRadius: '10px', padding: '14px 16px', border: `1px solid ${C.border}` }}>
                {contract.fields.filter(f => f.type !== 'signature' && f.value).map(f => (
                  <div key={f.id} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                    <span style={{ color: C.textMuted, minWidth: 180, fontWeight: 600 }}>{f.label}:</span>
                    <span style={{ color: C.text }}>{f.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap', borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: C.cardBg, border: `1.5px solid ${C.border}`, borderRadius: '8px', color: C.textSub, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Funga
          </button>
          {contract.file_name && (
            <button onClick={() => onDownload(contract.id, contract.file_name || 'mkataba.pdf')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: C.cardBg, border: `1.5px solid ${C.border}`, borderRadius: '8px', color: C.textSub, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              <Download size={14} /> Pakua
            </button>
          )}
          {contract.status === 'draft' && (
            <button onClick={() => { onSend(contract.id); onClose(); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: C.goldGlow }}>
              <Send size={14} /> Tuma kwa Mpangaji
            </button>
          )}
          {contract.status === 'pending_review' && (
            <button onClick={() => { onApprove(contract.id); onClose(); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: C.greenBg, color: C.green, border: `1px solid rgba(22,163,74,0.28)`, borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              <CheckCircle size={14} /> Idhinisha Mkataba
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const DigitalContractPage = () => {
  const [contracts,       setContracts]       = useState<DigitalContract[]>([]);
  const [properties,      setProperties]      = useState<PropertyOption[]>([]);
  const [tenants,         setTenants]         = useState<TenantOption[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');
  const [showModal,       setShowModal]       = useState(false);
  const [uploading,       setUploading]       = useState(false);
  const [creating,        setCreating]        = useState(false);
  const [previewContract, setPreviewContract] = useState<DigitalContract | null>(null);
  const [formData,        setFormData]        = useState<ContractFormData>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true); setError('');
      const [contractsRes, propertiesRes] = await Promise.all([Api.getDigitalContracts(), Api.getOwnerProperties()]);
      const rawContracts: DigitalContract[] =
        Array.isArray((contractsRes as any).data) ? (contractsRes as any).data :
        Array.isArray((contractsRes as any).data?.data) ? (contractsRes as any).data.data : [];
      setContracts(rawContracts);
      setProperties(Array.isArray((propertiesRes as any).data) ? (propertiesRes as any).data : []);

      const seen = new Set<string>(); const merged: TenantOption[] = [];
      const dedupe = (t: TenantOption) => { const k = `${t.user_id ?? t.id}-${t.property_id ?? ''}`; if (!seen.has(k)) { seen.add(k); merged.push(t); } };
      try { const r = await Api.getMyTenants(); (Array.isArray(r.data) ? r.data : []).forEach(dedupe); } catch {}
      try {
        const r = await Api.getOwnerApplications();
        (Array.isArray(r.data) ? r.data : []).filter((a: ApprovedApplicant) => a.status === 'approved')
          .forEach((a: ApprovedApplicant) => dedupe({ id: a.user_id, user_id: a.user_id, property_id: a.property_id, status: a.status, user: a.user }));
      } catch {}
      setTenants(merged);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Imeshindwa kupakia data.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!ALLOWED_FILE_TYPES.includes(file.type)) { setError('Tafadhali pakia faili la PDF au Word tu.'); return; }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) { setError(`Ukubwa wa faili hauzidi ${MAX_FILE_SIZE_MB} MB.`); return; }
    setUploading(true); setError('');
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('tenant_id', formData.tenant_id);
      const res = await Api.uploadContractFile(fd);
      setFormData(prev => ({ ...prev, file, file_url: res.data.file_path, file_name: file.name, file_type: file.type }));
    } catch (err: any) { setError(err?.response?.data?.message || 'Imeshindwa kupakia faili.'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.property_id || !formData.tenant_id) { setError('Tafadhali jaza sehemu zote.'); return; }
    if (!formData.file) { setError('Tafadhali pakia hati ya mkataba.'); return; }
    setCreating(true); setError('');
    const fields = formData.contract_type === 'chumba' ? CHUMBA_CONTRACT_FIELDS : formData.contract_type === 'nyumba' ? NYUMBA_CONTRACT_FIELDS : [];
    try {
      await Api.createDigitalContract({ title: formData.title, property_id: parseInt(formData.property_id), tenant_id: parseInt(formData.tenant_id), file_url: formData.file_url, file_name: formData.file_name, file_type: formData.file_type, fields, status: 'draft' });
      setSuccess('Mkataba umeundwa! Unaweza kutumwa kwa mpangaji sasa.');
      await loadData(); closeModal();
    } catch (err: any) { setError(err?.response?.data?.message || 'Imeshindwa kuunda mkataba.'); }
    finally { setCreating(false); }
  };

  const sendToTenant    = async (id: number) => { try { setError(''); await Api.sendContractToTenant(id); setSuccess('Mkataba umetumwa.'); await loadData(); } catch (err: any) { setError(err?.response?.data?.message || 'Imeshindwa kutuma.'); } };
  const approveContract = async (id: number) => { try { setError(''); await Api.approveSignedContract(id); setSuccess('Mkataba umeidhinishwa.'); await loadData(); } catch (err: any) { setError(err?.response?.data?.message || 'Imeshindwa kuidhinisha.'); } };
  const downloadContract = async (id: number, fileName: string) => {
    try {
      const res = await Api.downloadLandlordDigitalContract(id);
      const blob = new Blob([res.data as BlobPart], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (err: any) { setError(err?.response?.data?.message || 'Imeshindwa kupakua.'); }
  };

  const openModal  = () => { setShowModal(true); setError(''); setSuccess(''); };
  const closeModal = () => { setShowModal(false); setFormData(EMPTY_FORM); setError(''); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const setField   = (key: keyof ContractFormData, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  const summaryStats = {
    total: contracts.length,
    draft: contracts.filter(c => c.status === 'draft').length,
    pending: contracts.filter(c => c.status === 'pending_signature').length,
    review: contracts.filter(c => c.status === 'pending_review').length,
    approved: contracts.filter(c => c.status === 'approved').length,
  };

  return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .dc-input:focus { border-color: ${C.gold} !important; } tr.dc-row:hover td { background: #f8fafc; }`}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── Slate-800 Header ── */}
        <div style={{ background: C.headerBg, borderRadius: '14px', padding: '24px 28px', marginBottom: '20px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '6px' }}>Eneo la Mpangishaji</div>
              <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Mikataba ya Kidijitali</h1>
              <p style={{ margin: 0, color: C.textLight, fontSize: '14px', lineHeight: 1.6 }}>Pakia mikataba ya kukodisha na simamia sahihi za kidijitali.</p>
            </div>
            <button onClick={openModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px', background: C.gold, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: C.goldGlow, alignSelf: 'flex-start' }}>
              <Plus size={16} /> Unda Mkataba Mpya
            </button>
          </div>

          {/* Stats */}
          {!loading && contracts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginTop: '20px' }}>
              {[
                { label: 'Jumla',               val: summaryStats.total   },
                { label: 'Rasimu',              val: summaryStats.draft   },
                { label: 'Zinasubiri Sahihi',   val: summaryStats.pending },
                { label: 'Zinakaguliwa',        val: summaryStats.review  },
                { label: 'Zilizoidhinishwa',    val: summaryStats.approved},
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{s.val}</div>
                  <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Alerts ── */}
        {(error || success) && (
          <div style={{ background: success ? C.greenBg : C.redBg, border: `1px solid ${success ? 'rgba(22,163,74,0.22)' : 'rgba(220,38,38,0.22)'}`, borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: success ? C.green : C.red, fontSize: '13px' }}>
            {success ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {success || error}
          </div>
        )}

        {/* ── Contracts Table ── */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '56px 28px', color: C.textMuted }}>
              <div style={{ width: 18, height: 18, border: `2.5px solid ${C.border}`, borderTop: `2.5px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Inapakia mikataba…
            </div>
          ) : contracts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '72px 24px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '16px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Shield size={28} style={{ color: C.gold }} />
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>Hakuna mikataba ya kidijitali</div>
              <p style={{ color: C.textSub, fontSize: '14px', marginBottom: '24px' }}>Unda mkataba wako wa kwanza wa kidijitali kwa mpangaji wako.</p>
              <button onClick={openModal}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 24px', background: C.gold, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: C.goldGlow }}>
                <Plus size={16} /> Unda Mkataba wa Kwanza
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
                <thead>
                  <tr>
                    {['Mkataba', 'Mali / Nyumba', 'Mpangaji', 'Tarehe', 'Hali', 'Vitendo'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '13px 18px', fontSize: '11px', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, color: C.slate500, borderBottom: `1px solid ${C.border}`, background: C.slate100 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(c => {
                    const sm = getStatusMeta(c.status);
                    const prop = c.property ?? properties.find(p => p.id === c.property_id);
                    return (
                      <tr key={c.id} className="dc-row" style={{ transition: 'background 0.15s' }}>
                        <td style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: C.text }}>{c.title}</div>
                          {c.file_name && <div style={{ color: C.textMuted, fontSize: '12px', marginTop: '3px' }}>📄 {c.file_name}</div>}
                          {Array.isArray(c.fields) && c.fields.length > 0 && (
                            <div style={{ fontSize: '11px', color: C.gold, fontWeight: 700, marginTop: '3px' }}>{c.fields.length} sehemu</div>
                          )}
                        </td>
                        <td style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: C.text }}>{prop?.title ?? `Mali #${c.property_id}`}</div>
                          {prop?.location && <div style={{ color: C.textMuted, fontSize: '12px', marginTop: '2px' }}>{prop.location}</div>}
                          {prop?.price && <div style={{ color: C.gold, fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>{formatCurrency(prop.price)}/mwezi</div>}
                        </td>
                        <td style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: C.text }}>{resolveContractTenant(c, tenants)}</div>
                          {c.tenant?.user?.email && <div style={{ color: C.textMuted, fontSize: '12px', marginTop: '2px' }}>{c.tenant.user.email}</div>}
                        </td>
                        <td style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top', color: C.textMuted, fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {formatDate(c.created_at)}
                        </td>
                        <td style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '999px', background: sm.bg, border: `1px solid ${sm.color}30`, color: sm.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em' }}>
                            {sm.label}
                          </span>
                          {c.status === 'pending_review' && (
                            <div style={{ fontSize: '11px', color: C.blue, marginTop: '5px', fontWeight: 600 }}>Inakungoja idhini yako</div>
                          )}
                        </td>
                        <td style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button onClick={() => setPreviewContract(c)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: C.slate100, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.textSub, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                              <Eye size={12} /> Angalia
                            </button>
                            {c.file_name && (
                              <button onClick={() => downloadContract(c.id, c.file_name || 'mkataba.pdf')}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: C.slate100, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.textSub, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                <Download size={12} /> Pakua
                              </button>
                            )}
                            {c.status === 'draft' && (
                              <button onClick={() => sendToTenant(c.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: C.gold, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                <Send size={12} /> Tuma
                              </button>
                            )}
                            {c.status === 'pending_review' && (
                              <button onClick={() => approveContract(c.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: C.greenBg, border: `1px solid rgba(22,163,74,0.25)`, borderRadius: '8px', color: C.green, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                <CheckCircle size={12} /> Idhini
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
      </div>

      {/* ── Preview Modal ── */}
      {previewContract && (
        <ContractPreviewModal contract={previewContract} tenants={tenants}
          onClose={() => setPreviewContract(null)} onDownload={downloadContract}
          onSend={sendToTenant} onApprove={approveContract} />
      )}

      {/* ── Create Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', maxWidth: 680, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(15,23,42,0.20)', padding: '28px' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.slate500, fontWeight: 700, marginBottom: '4px' }}>Mkataba Mpya</div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: C.text }}>Unda Mkataba wa Kidijitali</h2>
              </div>
              <button onClick={closeModal} style={{ width: 34, height: 34, background: C.slate100, border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSub }}>
                <X size={16} />
              </button>
            </div>

            {error && (
              <div style={{ background: C.redBg, border: `1px solid rgba(220,38,38,0.22)`, borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: C.red, fontSize: '13px' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Contract type */}
                <div>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, fontSize: '13px', color: C.text }}>Aina ya Mkataba *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {Object.entries(CONTRACT_TYPE_META).map(([key, meta]) => {
                      const sel = formData.contract_type === key;
                      return (
                        <button key={key} type="button" onClick={() => setField('contract_type', key)}
                          style={{ padding: '14px 10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', border: `2px solid ${sel ? C.gold : C.border}`, background: sel ? C.goldBg : C.slate100, color: sel ? C.gold : C.textSub, transition: 'all 0.2s' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px', color: sel ? C.gold : C.textMuted }}>{meta.icon}</div>
                          <div style={{ fontWeight: 700, fontSize: '12px', color: sel ? C.text : C.textSub }}>{meta.label}</div>
                          <div style={{ fontSize: '10px', marginTop: '2px', color: C.textMuted }}>{meta.sublabel}</div>
                        </button>
                      );
                    })}
                  </div>
                  {formData.contract_type !== 'custom' && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: C.textMuted, padding: '8px 12px', background: C.slate100, borderRadius: '8px', border: `1px solid ${C.border}` }}>
                      ℹ️ Mkataba huu una {formData.contract_type === 'chumba' ? CHUMBA_CONTRACT_FIELDS.length : NYUMBA_CONTRACT_FIELDS.length} sehemu.
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Kichwa cha Mkataba *</label>
                  <input className="dc-input" style={inputCss} value={formData.title} onChange={e => setField('title', e.target.value)}
                    placeholder={formData.contract_type === 'chumba' ? 'Mfano: Mkataba wa Chumba — Nyumba Namba 5' : 'Mfano: Mkataba wa Nyumba — Mikocheni A'} required />
                </div>

                {/* Property + Tenant */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Mali / Nyumba *</label>
                    <select className="dc-input" style={selectCss} value={formData.property_id} onChange={e => setField('property_id', e.target.value)} required>
                      <option value="">Chagua mali…</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.title}{p.location ? ` — ${p.location}` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Mpangaji *</label>
                    {tenants.length === 0 ? (
                      <div style={{ ...inputCss, color: C.textMuted, fontStyle: 'italic' }}>Hakuna wapangaji waliopitishwa</div>
                    ) : (
                      <select className="dc-input" style={selectCss} value={formData.tenant_id} onChange={e => setField('tenant_id', e.target.value)} required>
                        <option value="">Chagua mpangaji…</option>
                        {tenants.map(t => <option key={`${t.id}-${t.user_id ?? ''}`} value={t.id}>{getTenantLabel(t)}</option>)}
                      </select>
                    )}
                    {tenants.length > 0 && <div style={{ fontSize: '11px', color: C.textMuted, marginTop: '4px' }}>{tenants.length} mpangaji wanapatikana</div>}
                  </div>
                </div>

                {/* File upload */}
                <div>
                  <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>
                    Hati ya Mkataba * <span style={{ color: C.textMuted, fontWeight: 400 }}>(PDF au Word, max {MAX_FILE_SIZE_MB} MB)</span>
                  </label>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '16px', borderRadius: '10px', border: `2px dashed ${formData.file_name ? C.gold : C.border}`, background: formData.file_name ? C.goldBg : C.slate100, cursor: 'pointer', color: formData.file_name ? C.gold : C.textMuted, fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}>
                    {uploading ? (
                      <><div style={{ width: 14, height: 14, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Inapakia…</>
                    ) : formData.file_name ? (
                      <><CheckCircle size={16} style={{ color: C.green }} /> {formData.file_name}</>
                    ) : (
                      <><Upload size={16} /> Chagua faili la mkataba</>
                    )}
                  </button>
                </div>

                {/* Footer actions */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                  <button type="button" onClick={closeModal}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: C.cardBg, border: `1.5px solid ${C.border}`, borderRadius: '8px', color: C.textSub, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    Ghairi
                  </button>
                  <button type="submit" disabled={uploading || creating}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 24px', background: uploading || creating ? C.slate500 : C.gold, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: uploading || creating ? 'not-allowed' : 'pointer', boxShadow: uploading || creating ? 'none' : C.goldGlow }}>
                    {creating ? (
                      <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Inaundia…</>
                    ) : (
                      <><FileText size={15} /> Unda Mkataba</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalContractPage;