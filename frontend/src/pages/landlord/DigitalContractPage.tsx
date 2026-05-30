import { useEffect, useState, useRef } from 'react';
import {
  FileText, Upload, Download, Send, AlertCircle, MapPin,
  User, X, Plus, CheckCircle, Clock, Eye, Building2,
  Home, FileCheck, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatCurrency, formatDate,
  headingStyle, inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  statusPillStyle, tableStyle, tableWrapStyle, tdStyle, thStyle,
} from './landlordPageStyles';

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
  property?: { id: number; title?: string; location?: string; price?: number };
  tenant?: {
    id: number;
    user?: { first_name?: string; last_name?: string; email?: string };
  };
}

interface PropertyOption {
  id: number;
  title?: string;
  location?: string;
  price?: number;
}

interface TenantOption {
  id: number;
  user_id?: number;
  property_id?: number;
  status?: string;
  user?: { first_name?: string; last_name?: string; email?: string };
}

interface ApprovedApplicant {
  id: number;
  status: string;
  user_id: number;
  property_id: number;
  user?: { first_name?: string; last_name?: string; email?: string };
}

interface ContractFormData {
  title: string;
  contract_type: 'chumba' | 'nyumba' | 'custom';
  property_id: string;
  tenant_id: string;
  file: File | null;
  file_url: string;
  file_name: string;
  file_type: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE_MB = 10;

// Contract fields derived from Oweru contract templates
const CHUMBA_CONTRACT_FIELDS: ContractField[] = [
  { id: 'tenant_full_name',    label: 'Jina Kamili la Mpangaji',           type: 'text',      required: true,  placeholder: 'Jina kamili la mpangaji' },
  { id: 'tenant_nida',         label: 'Namba ya NIDA / Pasport',           type: 'text',      required: true,  placeholder: 'Namba ya kitambulisho' },
  { id: 'tenant_phone',        label: 'Namba ya Simu',                     type: 'text',      required: true,  placeholder: '+255 xxx xxx xxx' },
  { id: 'tenant_nationality',  label: 'Utaifa wa Mpangaji',                type: 'text',      required: true,  placeholder: 'Africa / Nchi nyingine' },
  { id: 'tenant_occupation',   label: 'Kazi / Shughuli ya Mpangaji',       type: 'text',      required: false, placeholder: 'Kazi au biashara' },
  { id: 'tenant_address',      label: 'Makazi ya Sasa ya Mpangaji',        type: 'text',      required: false, placeholder: 'Mtaa, Kata, Wilaya' },
  { id: 'tenant_gender',       label: 'Jinsia ya Mpangaji',               type: 'text',      required: false, placeholder: 'Mwanaume / Mwanamke' },
  { id: 'tenant_age',          label: 'Umri wa Mpangaji',                  type: 'number',    required: false, placeholder: 'Miaka' },
  { id: 'room_number',         label: 'Namba / Maelezo ya Chumba',        type: 'text',      required: true,  placeholder: 'Chumba namba / maelezo' },
  { id: 'room_purpose',        label: 'Matumizi ya Chumba',               type: 'text',      required: true,  placeholder: 'Makazi / Biashara' },
  { id: 'start_date',          label: 'Tarehe ya Kuanza (Mkataba)',        type: 'date',      required: true },
  { id: 'end_date',            label: 'Tarehe ya Kumalizika (Mkataba)',    type: 'date',      required: true },
  { id: 'contract_months',     label: 'Muda wa Mkataba (Miezi)',           type: 'number',    required: true,  placeholder: 'Idadi ya miezi' },
  { id: 'monthly_rent',        label: 'Kodi ya Kila Mwezi (TZS)',         type: 'number',    required: true,  placeholder: 'Kiasi cha kodi' },
  { id: 'total_paid',          label: 'Jumla Iliyolipwa (TZS)',            type: 'number',    required: true,  placeholder: 'Jumla iliyolipwa' },
  { id: 'paid_months',         label: 'Kodi ya Miezi Mingapi Imelipwa',   type: 'number',    required: true,  placeholder: 'Idadi ya miezi' },
  { id: 'guarantor_name',      label: 'Jina la Mdhamini',                 type: 'text',      required: true,  placeholder: 'Jina kamili la mdhamini' },
  { id: 'guarantor_nida',      label: 'NIDA ya Mdhamini',                 type: 'text',      required: false, placeholder: 'Namba ya kitambulisho cha mdhamini' },
  { id: 'guarantor_phone',     label: 'Simu ya Mdhamini',                 type: 'text',      required: false, placeholder: '+255 xxx xxx xxx' },
  { id: 'guarantor_address',   label: 'Makazi ya Mdhamini',               type: 'text',      required: false, placeholder: 'Mtaa, Kata, Wilaya' },
  { id: 'guarantor_nationality',label:'Utaifa wa Mdhamini',               type: 'text',      required: false, placeholder: 'Africa / Nchi nyingine' },
  { id: 'property_items',      label: 'Mali za Mpangishaji (kama zipo)',  type: 'textarea',  required: false, placeholder: 'Orodha ya vitu/mali zilizopo ndani ya chumba' },
  { id: 'special_terms',       label: 'Masharti Maalum (kama yapo)',      type: 'textarea',  required: false, placeholder: 'Masharti yoyote ya ziada' },
  { id: 'landlord_signature',  label: 'Sahihi ya Mpangishaji',            type: 'signature', required: true,  landlordOnly: true },
  { id: 'tenant_signature',    label: 'Sahihi ya Mpangaji',               type: 'signature', required: true },
];

const NYUMBA_CONTRACT_FIELDS: ContractField[] = [
  { id: 'landlord_full_name',  label: 'Jina Kamili la Mpangishaji',        type: 'text',      required: true,  placeholder: 'Jina kamili la mmiliki/msimamizi', landlordOnly: true },
  { id: 'landlord_nida',       label: 'Namba ya NIDA ya Mpangishaji',     type: 'text',      required: true,  placeholder: 'Namba ya kitambulisho', landlordOnly: true },
  { id: 'landlord_phone',      label: 'Simu ya Mpangishaji',              type: 'text',      required: false, placeholder: '+255 xxx xxx xxx', landlordOnly: true },
  { id: 'tenant_full_name',    label: 'Jina Kamili la Mpangaji',           type: 'text',      required: true,  placeholder: 'Jina kamili la mpangaji' },
  { id: 'tenant_nida',         label: 'Namba ya NIDA / Pasport',           type: 'text',      required: true,  placeholder: 'Namba ya kitambulisho' },
  { id: 'tenant_phone',        label: 'Namba ya Simu',                     type: 'text',      required: true,  placeholder: '+255 xxx xxx xxx' },
  { id: 'tenant_nationality',  label: 'Utaifa wa Mpangaji',                type: 'text',      required: true,  placeholder: 'Africa / Nchi nyingine' },
  { id: 'tenant_occupation',   label: 'Kazi / Shughuli ya Mpangaji',       type: 'text',      required: false, placeholder: 'Kazi au biashara' },
  { id: 'tenant_address',      label: 'Makazi ya Sasa ya Mpangaji',        type: 'text',      required: false, placeholder: 'Mtaa, Kata, Wilaya' },
  { id: 'house_number',        label: 'Namba ya Nyumba',                  type: 'text',      required: true,  placeholder: 'Namba ya nyumba' },
  { id: 'house_location',      label: 'Eneo la Nyumba (Mtaa/Kata/Wilaya/Mkoa)', type: 'text', required: true, placeholder: 'Mtaa, Kata, Wilaya, Mkoa' },
  { id: 'house_bedrooms',      label: 'Idadi ya Vyumba vya Kulala',       type: 'number',    required: false, placeholder: 'Idadi' },
  { id: 'house_livingrooms',   label: 'Idadi ya Sebule',                  type: 'number',    required: false, placeholder: 'Idadi' },
  { id: 'house_kitchens',      label: 'Idadi ya Jiko',                    type: 'number',    required: false, placeholder: 'Idadi' },
  { id: 'house_bathrooms',     label: 'Idadi ya Bafu',                    type: 'number',    required: false, placeholder: 'Idadi' },
  { id: 'house_purpose',       label: 'Matumizi ya Nyumba',               type: 'text',      required: true,  placeholder: 'Makazi / Biashara' },
  { id: 'tenant_count',        label: 'Jumla ya Wapangaji',               type: 'number',    required: false, placeholder: 'Idadi ya wapangaji' },
  { id: 'start_date',          label: 'Tarehe ya Kuanza (Mkataba)',        type: 'date',      required: true },
  { id: 'end_date',            label: 'Tarehe ya Kumalizika (Mkataba)',    type: 'date',      required: true },
  { id: 'contract_months',     label: 'Muda wa Mkataba (Miezi)',           type: 'number',    required: true,  placeholder: 'Idadi ya miezi' },
  { id: 'monthly_rent',        label: 'Kodi ya Kila Mwezi (TZS)',         type: 'number',    required: true,  placeholder: 'Kiasi cha kodi' },
  { id: 'total_paid',          label: 'Jumla Iliyolipwa (TZS)',            type: 'number',    required: true,  placeholder: 'Jumla iliyolipwa' },
  { id: 'paid_months',         label: 'Kodi ya Miezi Mingapi Imelipwa',   type: 'number',    required: true,  placeholder: 'Idadi ya miezi' },
  { id: 'guarantor_name',      label: 'Jina la Mdhamini',                 type: 'text',      required: true,  placeholder: 'Jina kamili la mdhamini' },
  { id: 'guarantor_nida',      label: 'NIDA ya Mdhamini',                 type: 'text',      required: false, placeholder: 'Namba ya kitambulisho cha mdhamini' },
  { id: 'guarantor_phone',     label: 'Simu ya Mdhamini',                 type: 'text',      required: false, placeholder: '+255 xxx xxx xxx' },
  { id: 'guarantor_address',   label: 'Makazi ya Mdhamini',               type: 'text',      required: false, placeholder: 'Mtaa, Kata, Wilaya' },
  { id: 'guarantor_nationality',label:'Utaifa wa Mdhamini',               type: 'text',      required: false, placeholder: 'Africa / Nchi nyingine' },
  { id: 'property_items',      label: 'Mali za Mpangishaji (kama zipo)',  type: 'textarea',  required: false, placeholder: 'Orodha ya vitu/mali zilizopo ndani ya nyumba' },
  { id: 'special_terms',       label: 'Masharti Maalum (kama yapo)',      type: 'textarea',  required: false, placeholder: 'Masharti yoyote ya ziada' },
  { id: 'landlord_signature',  label: 'Sahihi ya Mpangishaji',            type: 'signature', required: true,  landlordOnly: true },
  { id: 'tenant_signature',    label: 'Sahihi ya Mpangaji',               type: 'signature', required: true },
];

const EMPTY_FORM: ContractFormData = {
  title: '', contract_type: 'nyumba', property_id: '', tenant_id: '',
  file: null, file_url: '', file_name: '', file_type: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getTenantLabel = (t: TenantOption): string => {
  const name = `${t.user?.first_name ?? ''} ${t.user?.last_name ?? ''}`.trim() || `User #${t.user_id ?? t.id}`;
  const email = t.user?.email ? ` — ${t.user.email}` : '';
  return `${name}${email}`;
};

const resolveContractTenant = (contract: DigitalContract, tenants: TenantOption[]): string => {
  if (contract.tenant?.user) {
    return `${contract.tenant.user.first_name ?? ''} ${contract.tenant.user.last_name ?? ''}`.trim() || `Tenant #${contract.tenant_id}`;
  }
  const match = tenants.find(t => t.id === contract.tenant_id || t.user_id === contract.tenant_id);
  if (!match) return `Tenant #${contract.tenant_id}`;
  return `${match.user?.first_name ?? ''} ${match.user?.last_name ?? ''}`.trim() || `User #${contract.tenant_id}`;
};

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:             { label: 'Rasimu',          color: palette.muted,  icon: <FileText size={12} /> },
  pending_signature: { label: 'Inasubiri Sahihi', color: '#c9a84c',     icon: <Clock size={12} /> },
  pending_review:    { label: 'Inakaguliwa',      color: '#3b82f6',     icon: <Eye size={12} /> },
  approved:          { label: 'Imeidhinishwa',    color: '#16a34a',     icon: <CheckCircle size={12} /> },
  rejected:          { label: 'Imekataliwa',      color: '#dc2626',     icon: <AlertCircle size={12} /> },
};

const getStatusMeta = (s: string) => STATUS_META[s] ?? { label: s.replace(/_/g, ' '), color: palette.muted, icon: null };

const CONTRACT_TYPE_LABELS: Record<string, { label: string; sublabel: string; icon: React.ReactNode }> = {
  chumba: { label: 'Mkataba wa Chumba',  sublabel: 'Oweru International Ltd (Mpangishaji)', icon: <Building2 size={16} /> },
  nyumba: { label: 'Mkataba wa Nyumba',  sublabel: 'Mmiliki binafsi (Mpangishaji)',          icon: <Home size={16} /> },
  custom: { label: 'Mkataba wa Kawaida', sublabel: 'Mkataba na muundo maalum',               icon: <FileText size={16} /> },
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, width: '100%', color: '#ffffff', backgroundColor: '#1e1a12',
};
const optionStyle: React.CSSProperties = { color: '#ffffff', backgroundColor: '#2a2418' };

// ---------------------------------------------------------------------------
// Contract Preview Modal
// ---------------------------------------------------------------------------

interface PreviewModalProps {
  contract: DigitalContract;
  tenants: TenantOption[];
  onClose: () => void;
  onDownload: (id: number, name: string) => void;
  onSend: (id: number) => void;
  onApprove: (id: number) => void;
}

const ContractPreviewModal = ({ contract, tenants, onClose, onDownload, onSend, onApprove }: PreviewModalProps) => {
  const sm = getStatusMeta(contract.status);
  const tenantName = resolveContractTenant(contract, tenants);
  const [showFields, setShowFields] = useState(false);

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(10,15,30,0.88)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px', backdropFilter: 'blur(6px)',
  };

  return (
    <div style={overlay}>
      <div style={{ ...panelStyle, maxWidth: 700, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.amber, display: 'inline-block', marginRight: 6 }} />
              Maelezo ya Mkataba
            </div>
            <h2 style={{ ...headingStyle, fontSize: 20, marginTop: 6 }}>{contract.title}</h2>
          </div>
          <button style={{ ...buttonStyle('secondary'), padding: 8, borderRadius: '8px' }} onClick={onClose}><X size={16} /></button>
        </div>

        {/* Status Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          borderRadius: 10, marginBottom: 20, background: `${sm.color}15`,
          border: `1px solid ${sm.color}35`, color: sm.color, fontSize: 14, fontWeight: 600,
        }}>
          {sm.icon} {sm.label}
          {contract.tenant?.user?.email && (
            <span style={{ marginLeft: 'auto', fontSize: 12, color: palette.muted, fontWeight: 400 }}>
              {contract.tenant.user.email}
            </span>
          )}
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Mpangaji', value: tenantName, icon: <User size={13} /> },
            { label: 'Mali/Nyumba', value: contract.property?.title ?? `Property #${contract.property_id}`, icon: <MapPin size={13} /> },
            { label: 'Tarehe ya Uundaji', value: formatDate(contract.created_at), icon: <Clock size={13} /> },
            { label: 'Kodi ya Mwezi', value: contract.property?.price ? formatCurrency(contract.property.price) : '—', icon: <FileCheck size={13} /> },
          ].map(item => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)`,
              borderRadius: 10, padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: palette.muted, fontSize: 11, marginBottom: 4 }}>
                {item.icon} {item.label}
              </div>
              <div style={{ color: palette.cream, fontWeight: 600, fontSize: 14 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* File Info */}
        {contract.file_name && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(200,145,40,0.08)', border: `1px solid ${palette.amber}35`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={18} style={{ color: palette.amber }} />
              <div>
                <div style={{ color: palette.cream, fontSize: 14, fontWeight: 600 }}>{contract.file_name}</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>Faili la mkataba lililopakiwa</div>
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

        {/* Signed Tenant Signature */}
        {contract.tenant_signature && (
          <div style={{
            background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 600, fontSize: 13 }}>
              <CheckCircle size={16} /> Mkataba umesainiwa na mpangaji
            </div>
            <img
              src={contract.tenant_signature}
              alt="Tenant Signature"
              style={{ marginTop: 10, maxHeight: 60, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, background: 'rgba(255,255,255,0.03)', padding: 4 }}
            />
          </div>
        )}

        {/* Fields toggle */}
        {Array.isArray(contract.fields) && contract.fields.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: palette.amber, fontSize: 13, padding: 0 }}
              onClick={() => setShowFields(v => !v)}
            >
              {showFields ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showFields ? 'Ficha' : 'Ona'} sehemu zilizojazwa ({contract.fields.filter(f => f.value || (f as any).tenant_value).length}/{contract.fields.length})
            </button>
            {showFields && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {contract.fields.filter(f => f.type !== 'signature').map(f => {
                  const val = (f as any).tenant_value || f.value;
                  return val ? (
                    <div key={f.id} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                      <span style={{ color: palette.muted, minWidth: 160 }}>{f.label}:</span>
                      <span style={{ color: palette.cream }}>{val}</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
          <button style={{ ...buttonStyle('secondary'), padding: '10px 20px' }} onClick={onClose}>Funga</button>
          {contract.file_name && (
            <button style={{ ...buttonStyle('secondary'), padding: '10px 20px' }} onClick={() => onDownload(contract.id, contract.file_name || 'mkataba.pdf')}>
              <Download size={14} /> Pakua Mkataba
            </button>
          )}
          {contract.status === 'draft' && (
            <button style={{ ...buttonStyle('primary'), padding: '10px 20px' }} onClick={() => { onSend(contract.id); onClose(); }}>
              <Send size={14} /> Tuma kwa Mpangaji
            </button>
          )}
          {contract.status === 'pending_review' && (
            <button
              style={{ ...buttonStyle('primary'), padding: '10px 20px', background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.4)', color: '#16a34a' }}
              onClick={() => { onApprove(contract.id); onClose(); }}
            >
              <CheckCircle size={14} /> Idhinisha Mkataba
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const DigitalContractPage = () => {
  const [contracts,   setContracts]   = useState<DigitalContract[]>([]);
  const [properties,  setProperties]  = useState<PropertyOption[]>([]);
  const [tenants,     setTenants]     = useState<TenantOption[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [previewContract, setPreviewContract] = useState<DigitalContract | null>(null);
  const [formData,    setFormData]    = useState<ContractFormData>(EMPTY_FORM);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true); setError('');
      const [contractsRes, propertiesRes] = await Promise.all([
        Api.getDigitalContracts(),
        Api.getOwnerProperties(),
      ]);
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
    if (!ALLOWED_FILE_TYPES.includes(file.type)) { setError('Tafadhali pakia faili la PDF au Word (.pdf, .doc, .docx) tu.'); return; }
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
    if (!formData.title || !formData.property_id || !formData.tenant_id) { setError('Tafadhali jaza sehemu zote zinazohitajika.'); return; }
    if (!formData.file) { setError('Tafadhali pakia hati ya mkataba kabla ya kuwasilisha.'); return; }
    setCreating(true); setError('');
    const fields = formData.contract_type === 'chumba' ? CHUMBA_CONTRACT_FIELDS
      : formData.contract_type === 'nyumba' ? NYUMBA_CONTRACT_FIELDS : [];
    try {
      await Api.createDigitalContract({
        title: formData.title, property_id: parseInt(formData.property_id),
        tenant_id: parseInt(formData.tenant_id), file_url: formData.file_url,
        file_name: formData.file_name, file_type: formData.file_type,
        fields, status: 'draft',
      });
      setSuccess('Mkataba umeundwa! Unaweza kutumwa kwa mpangaji sasa.');
      await loadData(); closeModal();
    } catch (err: any) { setError(err?.response?.data?.message || 'Imeshindwa kuunda mkataba.'); }
    finally { setCreating(false); }
  };

  const sendToTenant = async (contractId: number) => {
    try { setError(''); await Api.sendContractToTenant(contractId); setSuccess('Mkataba umetumwa kwa mpangaji.'); await loadData(); }
    catch (err: any) { setError(err?.response?.data?.message || 'Imeshindwa kutuma mkataba.'); }
  };

  const approveContract = async (contractId: number) => {
    try { setError(''); await Api.approveSignedContract(contractId); setSuccess('Mkataba umeidhinishwa.'); await loadData(); }
    catch (err: any) { setError(err?.response?.data?.message || 'Imeshindwa kuidhinisha mkataba.'); }
  };

  const downloadContract = async (contractId: number, fileName: string) => {
    try {
      const res = await Api.downloadLandlordDigitalContract(contractId);
      const blob = new Blob([res.data as BlobPart], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (err: any) { setError(err?.response?.data?.message || 'Imeshindwa kupakua mkataba.'); }
  };

  const openModal = () => { setShowModal(true); setError(''); setSuccess(''); };
  const closeModal = () => {
    setShowModal(false); setFormData(EMPTY_FORM); setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const setField = (key: keyof ContractFormData, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  const summaryStats = {
    total: contracts.length,
    draft: contracts.filter(c => c.status === 'draft').length,
    pending: contracts.filter(c => c.status === 'pending_signature').length,
    review: contracts.filter(c => c.status === 'pending_review').length,
    approved: contracts.filter(c => c.status === 'approved').length,
  };

  return (
    <div style={{ ...pageStyle, padding: '0' }}>

      {/* Header */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 32, right: 32, height: '2px',
          background: `linear-gradient(90deg, transparent, ${palette.amber}, transparent)`,
        }} />
        <div style={sectionTitleStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.amber, display: 'inline-block', marginRight: 6 }} />
          Eneo la Mpangishaji
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={headingStyle}>Mikataba ya Kidijitali</h1>
            <p style={descriptionStyle}>Pakia mikataba ya kukodisha na simamia sahihi za kidijitali kwa mpangaji wako.</p>
          </div>
          <button style={{ ...buttonStyle('primary'), marginTop: 4 }} onClick={openModal}>
            <Plus size={16} /> Unda Mkataba Mpya
          </button>
        </div>

        {/* Stats Row */}
        {!loading && contracts.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Jumla', val: summaryStats.total, color: palette.muted },
              { label: 'Rasimu', val: summaryStats.draft, color: palette.muted },
              { label: 'Zinasubiri Sahihi', val: summaryStats.pending, color: '#c9a84c' },
              { label: 'Zinakaguliwa', val: summaryStats.review, color: '#3b82f6' },
              { label: 'Zilizoidhinishwa', val: summaryStats.approved, color: '#16a34a' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 80,
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: palette.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contracts List */}
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
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.amber}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Inapakia mikataba…
          </div>
        ) : contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.muted }}>
            <Shield size={52} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block', color: palette.amber }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: palette.cream }}>Hakuna mikataba ya kidijitali</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6, maxWidth: 360, margin: '6px auto 0' }}>
              Unda mkataba wako wa kwanza wa kidijitali kwa mpangaji wako.
            </div>
          </div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Mkataba', 'Mali / Nyumba', 'Mpangaji', 'Tarehe', 'Hali', 'Vitendo'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => {
                  const sm = getStatusMeta(c.status);
                  const prop = c.property ?? properties.find(p => p.id === c.property_id);
                  return (
                    <tr
                      key={c.id}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: palette.cream }}>{c.title}</div>
                        {c.file_name && <div style={{ color: palette.muted, fontSize: 12, marginTop: 3 }}>📄 {c.file_name}</div>}
                        {Array.isArray(c.fields) && c.fields.length > 0 && (
                          <div style={{ color: palette.amber, fontSize: 11, marginTop: 2 }}>{c.fields.length} sehemu</div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: palette.cream, fontWeight: 600 }}>
                          <MapPin size={12} style={{ color: palette.amber, flexShrink: 0 }} />
                          {prop?.title ?? `Mali #${c.property_id}`}
                        </div>
                        {prop?.location && <div style={{ color: palette.muted, fontSize: 12, marginTop: 2, paddingLeft: 17 }}>{prop.location}</div>}
                        {prop?.price && <div style={{ color: palette.amber, fontSize: 12, fontWeight: 600, marginTop: 2, paddingLeft: 17 }}>{formatCurrency(prop.price)}/mwezi</div>}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: palette.cream }}>
                          <User size={12} style={{ color: palette.muted }} />
                          {resolveContractTenant(c, tenants)}
                        </div>
                        {c.tenant?.user?.email && <div style={{ color: palette.muted, fontSize: 11, marginTop: 2 }}>{c.tenant.user.email}</div>}
                      </td>
                      <td style={{ ...tdStyle, color: palette.muted, fontSize: 13 }}>{formatDate(c.created_at)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          ...statusPillStyle(sm.color),
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}>
                          {sm.icon} {sm.label}
                        </span>
                        {c.status === 'pending_review' && (
                          <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>Inakungoja idhini yako</div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: 12, borderRadius: '8px' }}
                            onClick={() => setPreviewContract(c)}
                          >
                            <Eye size={11} /> Angalia
                          </button>
                          {c.file_name && (
                            <button
                              style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: 12, borderRadius: '8px' }}
                              onClick={() => downloadContract(c.id, c.file_name || 'mkataba.pdf')}
                            >
                              <Download size={11} /> Pakua
                            </button>
                          )}
                          {c.status === 'draft' && (
                            <button
                              style={{ ...buttonStyle('primary'), padding: '5px 10px', fontSize: 12, borderRadius: '8px' }}
                              onClick={() => sendToTenant(c.id)}
                            >
                              <Send size={11} /> Tuma
                            </button>
                          )}
                          {c.status === 'pending_review' && (
                            <button
                              style={{ ...buttonStyle('primary'), padding: '5px 10px', fontSize: 12, borderRadius: '8px', background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.35)', color: '#16a34a' }}
                              onClick={() => approveContract(c.id)}
                            >
                              <CheckCircle size={11} /> Idhini
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

      {/* Preview Modal */}
      {previewContract && (
        <ContractPreviewModal
          contract={previewContract}
          tenants={tenants}
          onClose={() => setPreviewContract(null)}
          onDownload={downloadContract}
          onSend={sendToTenant}
          onApprove={approveContract}
        />
      )}

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ ...panelStyle, maxWidth: 680, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <div style={{ position: 'absolute', top: -24, left: -24, right: -24, height: '2px', background: `linear-gradient(90deg, transparent, ${palette.amber}, transparent)` }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
                <div>
                  <div style={sectionTitleStyle}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.amber, display: 'inline-block', marginRight: 6 }} />
                    Mkataba Mpya
                  </div>
                  <h2 style={{ ...headingStyle, fontSize: 20 }}>Unda Mkataba wa Kidijitali</h2>
                </div>
                <button style={{ ...buttonStyle('secondary'), padding: 8, borderRadius: '8px' }} onClick={closeModal}><X size={16} /></button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#dc2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
                <AlertCircle size={16} /> {error} 
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Contract Type Selection */}
                <div>
                  <label style={{ display: 'block', marginBottom: 10, color: palette.cream, fontSize: 14, fontWeight: 600 }}>
                    Aina ya Mkataba *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {Object.entries(CONTRACT_TYPE_LABELS).map(([key, meta]) => (
                      <button
                        key={key} type="button"
                        onClick={() => setField('contract_type', key)}
                        style={{
                          padding: '14px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                          border: `1.5px solid ${formData.contract_type === key ? palette.amber : 'rgba(255,255,255,0.1)'}`,
                          background: formData.contract_type === key ? 'rgba(200,145,40,0.12)' : 'rgba(255,255,255,0.03)',
                          color: formData.contract_type === key ? palette.amber : palette.muted,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{meta.icon}</div>
                        <div style={{ fontWeight: 600, fontSize: 12, color: formData.contract_type === key ? palette.cream : palette.muted }}>{meta.label}</div>
                        <div style={{ fontSize: 10, marginTop: 3, opacity: 0.7 }}>{meta.sublabel}</div>
                      </button>
                    ))}
                  </div>
                  {formData.contract_type !== 'custom' && (
                    <div style={{ marginTop: 8, fontSize: 12, color: palette.muted, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                      ℹ️ Mkataba huu utajaza {formData.contract_type === 'chumba' ? CHUMBA_CONTRACT_FIELDS.length : NYUMBA_CONTRACT_FIELDS.length} sehemu kwa mujibu wa kiolezo cha Oweru.
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: palette.cream, fontSize: 14, fontWeight: 600 }}>
                    Kichwa cha Mkataba *
                  </label>
                  <input
                    style={{ ...inputStyle, width: '100%' }}
                    value={formData.title}
                    onChange={e => setField('title', e.target.value)}
                    placeholder={formData.contract_type === 'chumba' ? 'Mfano: Mkataba wa Chumba — Nyumba Namba 5' : 'Mfano: Mkataba wa Nyumba — Mikocheni A'}
                    required
                  />
                </div>

                {/* Property + Tenant */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, color: palette.cream, fontSize: 14, fontWeight: 600 }}>Mali / Nyumba *</label>
                    <select style={selectStyle} value={formData.property_id} onChange={e => setField('property_id', e.target.value)} required>
                      <option value="" style={optionStyle}>Chagua mali…</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id} style={optionStyle}>{p.title}{p.location ? ` — ${p.location}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, color: palette.cream, fontSize: 14, fontWeight: 600 }}>Mpangaji *</label>
                    {tenants.length === 0 ? (
                      <div style={{ ...(inputStyle as React.CSSProperties), width: '100%', display: 'flex', alignItems: 'center', color: palette.muted, fontSize: 13 }}>
                        Hakuna wapangaji waliopitishwa
                      </div>
                    ) : (
                      <select style={selectStyle} value={formData.tenant_id} onChange={e => setField('tenant_id', e.target.value)} required>
                        <option value="" style={optionStyle}>Chagua mpangaji…</option>
                        {tenants.map(t => (
                          <option key={`${t.id}-${t.user_id ?? ''}`} value={t.id} style={optionStyle}>{getTenantLabel(t)}</option>
                        ))}
                      </select>
                    )}
                    {tenants.length > 0 && (
                      <div style={{ fontSize: 11, color: palette.muted, marginTop: 5 }}>
                        {tenants.length} mpangaji {tenants.length !== 1 ? 'waliopatikana' : 'aliyepatikana'}
                      </div>
                    )}
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: palette.cream, fontSize: 14, fontWeight: 600 }}>
                    Hati ya Mkataba * <span style={{ color: palette.muted, fontWeight: 400 }}>(PDF au Word, max {MAX_FILE_SIZE_MB} MB)</span>
                  </label>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
                  <button
                    type="button"
                    style={{
                      ...buttonStyle('secondary'), width: '100%', padding: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      border: formData.file_name ? `1.5px solid ${palette.amber}50` : undefined,
                      background: formData.file_name ? 'rgba(200,145,40,0.08)' : undefined,
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <div style={{ width: 14, height: 14, border: `2px solid rgba(255,255,255,0.4)`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Inapakia…
                      </>
                    ) : formData.file_name ? (
                      <>
                        <CheckCircle size={16} style={{ color: palette.amber }} />
                        <span style={{ color: palette.cream }}>{formData.file_name}</span>
                      </>
                    ) : (
                      <><Upload size={16} /> Chagua faili la mkataba</>
                    )}
                  </button>
                  {formData.contract_type !== 'custom' && !formData.file && (
                    <div style={{ fontSize: 11, color: palette.muted, marginTop: 6 }}>
                      💡 Pakia kiolezo cha mkataba kilichosainishwa na Oweru: <strong>Mkataba wa {formData.contract_type === 'chumba' ? 'Chumba' : 'Nyumba'}</strong>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button type="button" style={{ ...buttonStyle('secondary'), padding: '10px 20px' }} onClick={closeModal}>Ghairi</button>
                  <button type="submit" style={{ ...buttonStyle('primary'), padding: '10px 24px' }} disabled={uploading || creating}>
                    {creating ? (
                      <><div style={{ width: 14, height: 14, border: `2px solid rgba(255,255,255,0.4)`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Inaundia…</>
                    ) : (
                      <><FileText size={16} /> Unda Mkataba</>
                    )}
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