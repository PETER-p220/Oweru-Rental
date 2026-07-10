import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, MapPin, AlertCircle, ClipboardList, Clock, DollarSign,
  CheckCircle, Loader2, ShieldCheck, Phone, Info, X,
} from 'lucide-react';
import Api from '../../services/api';
import { usePaymentPolling } from '../../hooks/usePaymentPolling';
import { paymentConfirmationMessage, parsePaymentStatus } from '../../utils/paymentStatus';

interface ApplicationItem {
  id: number;
  status?: string;
  message?: string;
  created_at?: string;
  rent_paid?: boolean;
  can_pay_rent?: boolean;
  site_visit_paid?: boolean;
  next_step?: string;
  rejection_reason?: string;
  property?: {
    id?: number;
    title?: string;
    location?: string;
    price?: number | string;
  };
}

/* ─────────────────────────────────────────────────────────────────
   Design tokens — matches the Properties (browse listings) page:
   slate-100 #F1F5F9 (page bg) · slate-800 #1E293B (header/nav)
   white #FFFFFF (cards) · slate-200 #E2E8F0 (border)
   slate-900 #0F172A (text-1) · slate-600 #475569 (text-2)
   slate-400 #94A3B8 (text-muted) · gold #C89128 (CTA buttons)
───────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;}

.ap-root{
  --slate-100:#F1F5F9;
  --slate-200:#E2E8F0;
  --slate-400:#94A3B8;
  --slate-600:#475569;
  --slate-800:#1E293B;
  --slate-900:#0F172A;
  --white:#FFFFFF;
  --gold:#C89128;
  --gold-light:#D4A84B;
  --gold-pale:rgba(200,145,40,0.10);
  --gold-border:rgba(200,145,40,0.28);
  --success:#16A34A;
  --success-bg:#DCFCE7;
  --danger:#DC2626;
  --danger-bg:#FFE4E6;
  --warning:#D97706;
  --warning-bg:#FEF3C7;
  --info:#2563EB;
  --info-bg:#DBEAFE;
  --sans:'DM Sans',system-ui,sans-serif;
  --r:12px;--r-sm:8px;

  font-family:var(--sans);
  background:var(--slate-100);
  color:var(--slate-900);
  min-height:100vh;
  padding-bottom:80px;
}

@keyframes spin{to{transform:rotate(360deg);}}

/* ── Header ── */
.ap-header{background:var(--slate-800);border-bottom:1px solid var(--slate-200);}
.ap-header-inner{
  max-width:1280px;margin:0 auto;padding:52px 40px 44px;
  display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;
}
.ap-eyebrow{
  font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;
  color:var(--gold);margin-bottom:10px;display:inline-flex;align-items:center;gap:10px;
  background:var(--gold-pale);border:1px solid var(--gold-border);padding:4px 12px;
}
.ap-title{font-size:clamp(20px,3.5vw,28px);font-weight:800;line-height:1.15;letter-spacing:-.02em;color:var(--white);margin:0;}
.ap-subtitle{font-size:13px;font-weight:400;color:var(--slate-400);margin:8px 0 0;}
.ap-search-wrap{position:relative;min-width:280px;max-width:400px;}
.ap-search-icon{position:absolute;left:18px;top:50%;transform:translateY(-50%);color:var(--slate-400);}
.ap-search-input{
  width:100%;background:var(--slate-900);border:1px solid var(--slate-200);color:var(--white);
  padding:12px 16px 12px 48px;border-radius:12px;font-family:var(--sans);font-size:14px;
  outline:none;transition:border-color .18s,box-shadow .18s;
}
.ap-search-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px var(--gold-pale);}
.ap-search-input::placeholder{color:var(--slate-400);}

/* ── Body ── */
.ap-body{max-width:1280px;margin:0 auto;padding:0 16px;}

.ap-error{
  display:flex;align-items:center;gap:10px;color:var(--danger);background:var(--danger-bg);
  border:1px solid rgba(220,38,38,.25);padding:14px 16px;border-radius:var(--r-sm);margin:20px 0;font-size:13px;
}

.ap-loading{text-align:center;padding:100px 20px;color:var(--slate-600);}
.ap-loading svg{animation:spin 1s linear infinite;margin-bottom:12px;}

.ap-empty{text-align:center;padding:90px 20px;color:var(--slate-600);}
.ap-empty svg{margin:0 auto 20px;opacity:.5;color:var(--slate-400);}
.ap-empty-title{font-size:18px;font-weight:700;color:var(--slate-900);margin-bottom:8px;}
.ap-empty-desc{max-width:280px;margin:0 auto;line-height:1.6;}

/* ── Table (default, desktop/tablet) ── */
.ap-table-wrap{
  background:var(--white);border:1px solid var(--slate-200);border-radius:var(--r);
  overflow:hidden;margin:20px 0 40px;box-shadow:0 4px 20px rgba(0,0,0,.04);
}
.ap-table-scroll{overflow-x:auto;}
.ap-table{width:100%;border-collapse:collapse;min-width:820px;}
.ap-table thead th{
  text-align:left;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
  color:var(--slate-400);background:var(--slate-100);padding:14px 18px;border-bottom:1px solid var(--slate-200);
  white-space:nowrap;
}
.ap-table thead th.ap-th-right{text-align:right;}
.ap-table tbody tr{border-bottom:1px solid var(--slate-200);transition:background .15s;}
.ap-table tbody tr:last-child{border-bottom:none;}
.ap-table tbody tr:hover{background:var(--slate-100);}
.ap-table td{padding:16px 18px;font-size:13.5px;color:var(--slate-900);vertical-align:middle;}
.ap-td-right{text-align:right;}

.ap-row-title{font-weight:600;font-size:14px;color:var(--slate-900);line-height:1.3;}
.ap-row-location{display:flex;align-items:center;gap:5px;color:var(--slate-600);font-size:12px;margin-top:4px;white-space:nowrap;}
.ap-row-location svg{color:var(--gold);flex-shrink:0;}
.ap-row-message{color:var(--slate-400);font-size:12px;margin-top:5px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

.ap-row-price{font-weight:700;color:var(--gold);white-space:nowrap;}

.ap-row-date{display:flex;align-items:center;gap:5px;color:var(--slate-600);font-size:12.5px;white-space:nowrap;}
.ap-row-date svg{color:var(--slate-400);flex-shrink:0;}

.ap-row-next-step{
  display:flex;align-items:flex-start;gap:6px;font-size:12px;color:var(--slate-600);line-height:1.45;max-width:220px;
}
.ap-row-next-step svg{color:var(--gold);flex-shrink:0;margin-top:1px;}

.ap-pay-btn{
  background:var(--gold);color:var(--white);border:none;padding:9px 16px;border-radius:var(--r-sm);
  font-weight:700;font-size:12.5px;display:inline-flex;align-items:center;justify-content:center;gap:6px;
  cursor:pointer;transition:background .18s;box-shadow:0 3px 10px rgba(200,145,40,.25);white-space:nowrap;
}
.ap-pay-btn:hover{background:var(--gold-light);}

.ap-paid-banner{
  display:inline-flex;align-items:center;gap:6px;background:var(--success-bg);
  color:var(--success);padding:8px 14px;border-radius:var(--r-sm);font-weight:600;font-size:12.5px;white-space:nowrap;
}
.ap-dash{color:var(--slate-400);}

/* ── Mobile card fallback (table becomes stacked cards under 760px) ── */
.ap-cards{display:none;}
.ap-card{
  background:var(--white);border:1px solid var(--slate-200);border-radius:var(--r);
  padding:18px;margin-bottom:14px;
}
.ap-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px;}
.ap-card-title{font-weight:700;font-size:15.5px;line-height:1.3;color:var(--slate-900);}
.ap-card-location{display:flex;align-items:center;gap:6px;color:var(--slate-600);font-size:12.5px;margin-top:6px;}
.ap-card-location svg{color:var(--gold);flex-shrink:0;}
.ap-card-price{text-align:right;font-weight:700;font-size:16px;color:var(--gold);white-space:nowrap;}
.ap-card-meta{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
.ap-card-date{font-size:12px;color:var(--slate-400);display:flex;align-items:center;gap:5px;}
.ap-card-message{
  background:var(--slate-100);border:1px solid var(--slate-200);border-radius:10px;
  padding:12px 14px;font-size:13px;color:var(--slate-600);line-height:1.55;margin-bottom:16px;
}
.ap-next-step{
  display:flex;align-items:flex-start;gap:8px;background:var(--gold-pale);border:1px solid var(--gold-border);
  border-radius:var(--r-sm);padding:12px 14px;margin-bottom:12px;font-size:12.5px;color:var(--slate-600);line-height:1.5;
}
.ap-next-step svg{color:var(--gold);flex-shrink:0;margin-top:2px;}
.ap-card .ap-pay-btn{width:100%;padding:13px;font-size:14px;}
.ap-card .ap-paid-banner{width:100%;justify-content:center;padding:11px;}

/* ── Status Badge ── */
.ap-status{
  display:inline-flex;align-items:center;gap:6px;padding:6px 12px;font-size:10px;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;border-radius:9999px;font-family:var(--sans);
}
.ap-status-dot{width:6px;height:6px;border-radius:50%;}
.ap-rejection-reason{margin-top:8px;font-size:12px;color:var(--danger);line-height:1.4;}

/* ── Payment Modal ── */
.ap-overlay{
  position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.6);backdrop-filter:blur(8px) saturate(1.4);
  display:flex;align-items:center;justify-content:center;padding:20px 16px;
}
.ap-modal{
  background:var(--white);border:1px solid var(--slate-200);border-radius:20px;width:100%;max-width:420px;
  max-height:94vh;overflow-y:auto;box-shadow:0 30px 70px rgba(0,0,0,.25);
}
.ap-modal-head{
  background:linear-gradient(135deg,var(--slate-800) 0%,var(--slate-900) 100%);
  padding:24px 24px 20px;border-bottom:1px solid var(--slate-200);position:relative;
}
.ap-modal-head::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,var(--gold),var(--gold-light));
}
.ap-modal-eyebrow{font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--gold);margin-bottom:4px;}
.ap-modal-title{font-size:22px;font-weight:700;color:var(--white);}
.ap-modal-sub{color:var(--slate-400);font-size:13px;margin-top:4px;}
.ap-modal-close{
  position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:9px;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);color:var(--slate-400);
  display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s;
}
.ap-modal-close:hover{background:rgba(255,255,255,.2);color:var(--white);}
.ap-modal-close:disabled{opacity:.4;cursor:not-allowed;}

.ap-modal-body{padding:24px;}

.ap-property-summary{
  background:var(--slate-100);border:1px solid var(--slate-200);border-radius:14px;padding:16px;margin-bottom:24px;
}
.ap-property-name{font-weight:600;font-size:15.5px;color:var(--slate-900);}
.ap-property-loc{display:flex;align-items:center;gap:6px;color:var(--slate-600);margin-top:6px;font-size:13px;}
.ap-property-loc svg{color:var(--gold);}
.ap-amount-row{
  margin-top:14px;padding-top:14px;border-top:1px solid var(--slate-200);
  display:flex;justify-content:space-between;align-items:center;
}
.ap-amount-label{color:var(--slate-600);font-size:13px;}
.ap-amount-value{font-size:22px;font-weight:700;color:var(--gold);}

.ap-field-label{
  font-size:11px;font-weight:600;letter-spacing:.8px;color:var(--slate-600);
  text-transform:uppercase;margin-bottom:10px;
}
.ap-provider-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;}
.ap-provider-btn{
  flex:1;padding:12px 10px;font-size:12px;font-weight:600;border:2px solid var(--slate-200);
  background:var(--slate-100);color:var(--slate-600);border-radius:10px;transition:all .18s;cursor:pointer;
}
.ap-provider-btn:disabled{opacity:.5;cursor:not-allowed;}
.ap-provider-btn[data-active='true'].tigo{border-color:#00D4AA;background:rgba(0,212,170,.10);color:#049c7c;}
.ap-provider-btn[data-active='true'].mpesa{border-color:#00C853;background:rgba(0,200,83,.10);color:#0a9142;}
.ap-provider-btn[data-active='true'].airtel{border-color:#FF6B35;background:rgba(255,107,53,.10);color:#c94e21;}
.ap-provider-btn[data-active='true'].halopesa{border-color:#9C27B0;background:rgba(156,39,176,.10);color:#7b1d8a;}

.ap-phone-wrap{position:relative;margin-bottom:24px;}
.ap-phone-icon{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--slate-400);}
.ap-phone-input{
  width:100%;padding:14px 14px 14px 52px;background:var(--slate-100);border:1px solid var(--slate-200);
  border-radius:12px;color:var(--slate-900);font-size:16px;outline:none;font-family:var(--sans);
  transition:border-color .18s,box-shadow .18s;
}
.ap-phone-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px var(--gold-pale);}
.ap-phone-input:disabled{opacity:.6;}
.ap-phone-input::placeholder{color:var(--slate-400);}

.ap-secure-row{
  display:flex;align-items:center;gap:10px;background:var(--success-bg);border:1px solid rgba(22,163,74,.25);
  border-radius:var(--r-sm);padding:12px 16px;margin-bottom:24px;font-size:13px;color:var(--success);
}

.ap-result{
  padding:14px 16px;border-radius:var(--r-sm);margin-bottom:20px;display:flex;gap:12px;font-size:13.5px;line-height:1.5;
}
.ap-result.success{background:var(--success-bg);border:1px solid rgba(22,163,74,.3);color:var(--success);}
.ap-result.waiting{background:var(--gold-pale);border:1px solid var(--gold-border);color:var(--gold);}
.ap-result.error{background:var(--danger-bg);border:1px solid rgba(220,38,38,.3);color:var(--danger);}
.ap-result svg{flex-shrink:0;}

.ap-modal-actions{display:flex;gap:12px;}
.ap-btn-cancel{
  flex:1;padding:14px;background:var(--slate-100);border:1px solid var(--slate-200);color:var(--slate-900);
  border-radius:var(--r-sm);font-weight:600;font-family:var(--sans);cursor:pointer;transition:all .18s;
}
.ap-btn-cancel:hover:not(:disabled){border-color:var(--gold);color:var(--gold);}
.ap-btn-cancel:disabled{opacity:.5;cursor:not-allowed;}
.ap-btn-pay{
  flex:1.8;padding:14px;background:var(--gold);color:var(--white);border:none;border-radius:var(--r-sm);
  font-weight:700;font-size:15px;font-family:var(--sans);cursor:pointer;transition:background .18s;
  display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 20px rgba(200,145,40,.3);
}
.ap-btn-pay:hover:not(:disabled){background:var(--gold-light);}
.ap-btn-pay:disabled{opacity:.55;cursor:not-allowed;box-shadow:none;}

@media(max-width:768px){
  .ap-header-inner{padding:36px 20px 28px;}
  .ap-body{padding:0 12px;}
}
@media(max-width:760px){
  .ap-table-wrap{display:none;}
  .ap-cards{display:block;margin-top:20px;}
}
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const parseRent = (price?: number | string): number => {
  if (price == null) return 0;
  if (typeof price === 'number') return price;
  const cleaned = price.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

const formatCurrency = (price?: number | string): string => {
  const n = parseRent(price);
  if (!n) return 'Price on request';
  return `Tsh ${n.toLocaleString()}`;
};

const formatDate = (d?: string): string => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#D97706',
  approved: '#16A34A',
  accepted: '#16A34A',
  rejected: '#DC2626',
  cancelled: '#94A3B8',
  unknown: '#94A3B8',
};
const getStatusColor = (status?: string) => STATUS_COLORS[status || 'unknown'] ?? '#94A3B8';

const PROVIDERS = [
  { value: 'tigo', label: 'Tigo Pesa' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'airtel', label: 'Airtel Money' },
  { value: 'halopesa', label: 'Halopesa' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

const StatusBadge = memo(({ status, rejectionReason }: { status?: string; rejectionReason?: string }) => {
  const s = status || 'unknown';
  const color = getStatusColor(status);

  return (
    <div>
      <span className="ap-status" style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
        <span className="ap-status-dot" style={{ background: color }} />
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
      {s === 'rejected' && rejectionReason && (
        <div className="ap-rejection-reason">{rejectionReason}</div>
      )}
    </div>
  );
});
StatusBadge.displayName = 'StatusBadge';

const PayAction = memo(({ item, onPay }: { item: ApplicationItem; onPay: (id: number) => void }) => {
  if (item.can_pay_rent) {
    return (
      <button className="ap-pay-btn" onClick={() => onPay(item.id)}>
        <DollarSign size={14} /> Pay Rent
      </button>
    );
  }
  if (item.rent_paid) {
    return (
      <span className="ap-paid-banner">
        <CheckCircle size={14} /> Paid
      </span>
    );
  }
  return <span className="ap-dash">—</span>;
});
PayAction.displayName = 'PayAction';

const ApplicationRow = memo(({ item, onPay }: { item: ApplicationItem; onPay: (id: number) => void }) => (
  <tr>
    <td>
      <div className="ap-row-title">{item.property?.title || 'Untitled Property'}</div>
      <div className="ap-row-location">
        <MapPin size={12} />
        {item.property?.location || 'Location not specified'}
      </div>
      {item.message && <div className="ap-row-message" title={item.message}>"{item.message}"</div>}
    </td>
    <td className="ap-row-price">{formatCurrency(item.property?.price)}</td>
    <td>
      <StatusBadge status={item.status} rejectionReason={item.rejection_reason} />
    </td>
    <td>
      <div className="ap-row-date">
        <Clock size={12} /> {formatDate(item.created_at)}
      </div>
    </td>
    <td>
      {item.next_step ? (
        <div className="ap-row-next-step">
          <Info size={13} />
          {item.next_step}
        </div>
      ) : (
        <span className="ap-dash">—</span>
      )}
    </td>
    <td className="ap-td-right">
      <PayAction item={item} onPay={onPay} />
    </td>
  </tr>
));
ApplicationRow.displayName = 'ApplicationRow';

const ApplicationCard = memo(({ item, onPay }: { item: ApplicationItem; onPay: (id: number) => void }) => (
  <div className="ap-card">
    <div className="ap-card-top">
      <div style={{ flex: 1 }}>
        <div className="ap-card-title">{item.property?.title || 'Untitled Property'}</div>
        <div className="ap-card-location">
          <MapPin size={14} />
          {item.property?.location || 'Location not specified'}
        </div>
      </div>
      <div className="ap-card-price">{formatCurrency(item.property?.price)}</div>
    </div>

    <div className="ap-card-meta">
      <StatusBadge status={item.status} rejectionReason={item.rejection_reason} />
      <div className="ap-card-date">
        <Clock size={13} /> {formatDate(item.created_at)}
      </div>
    </div>

    {item.message && <div className="ap-card-message">"{item.message}"</div>}

    <div>
      {item.next_step && (
        <div className="ap-next-step">
          <Info size={16} />
          {item.next_step}
        </div>
      )}

      {item.can_pay_rent ? (
        <button className="ap-pay-btn" style={{ width: '100%', padding: 13, fontSize: 14 }} onClick={() => onPay(item.id)}>
          <DollarSign size={18} /> Pay Rent Now
        </button>
      ) : item.rent_paid ? (
        <div className="ap-paid-banner" style={{ width: '100%', justifyContent: 'center', padding: 11 }}>
          <CheckCircle size={18} /> Rent Paid Successfully
        </div>
      ) : null}
    </div>
  </div>
));
ApplicationCard.displayName = 'ApplicationCard';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property');

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'tigo' | 'mpesa' | 'airtel' | 'halopesa'>('tigo');
  const [payResult, setPayResult] = useState<'success' | 'error' | 'waiting' | null>(null);
  const [payMessage, setPayMessage] = useState('');
  const [rentOrderId, setRentOrderId] = useState('');
  const [rentApplicationId, setRentApplicationId] = useState<number | null>(null);

  const refreshApplications = useCallback(async () => {
    const res = await Api.getTenantApplications();
    setApplications(Array.isArray(res.data) ? res.data : []);
  }, []);

  const handleApplyForProperty = useCallback(async (id: string) => {
    try {
      if (!id || isNaN(parseInt(id))) throw new Error('Invalid property ID');
      await Api.createApplication({
        property_id: parseInt(id),
        message: 'I am interested in this property and would like to schedule a viewing.',
      });
      alert('Application submitted successfully!');
      window.history.replaceState({}, '', window.location.pathname);
      await refreshApplications();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to submit application.');
    }
  }, [refreshApplications]);

  useEffect(() => {
    if (propertyId) handleApplyForProperty(propertyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await Api.getTenantApplications();
        setApplications(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load applications.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const pollRent = useCallback(async () => {
    const res = await Api.checkRentPaymentStatus(rentOrderId);
    if (parsePaymentStatus(res.data) === 'paid') {
      return res;
    }
    if (rentApplicationId) {
      const appsRes = await Api.getTenantApplications();
      const apps = Array.isArray(appsRes.data) ? appsRes.data : [];
      const app = apps.find((a: ApplicationItem) => a.id === rentApplicationId);
      if (app?.rent_paid || (app as any)?.rent_payment_status === 'paid') {
        return {
          data: {
            status: 'paid',
            rent_payment_status: 'paid',
            rent_paid: true,
            message: 'Rent payment confirmed.',
          },
          message: 'Rent payment confirmed.',
        };
      }
    }
    return res;
  }, [rentOrderId, rentApplicationId]);

  usePaymentPolling(
    payResult === 'waiting' && !!rentOrderId,
    rentOrderId,
    pollRent,
    {
      onPaid: async (message) => {
        setPayResult('success');
        setPayMessage(message || paymentConfirmationMessage('rent', 'paid'));
        await refreshApplications();
      },
      onFailed: (message) => {
        setPayResult('error');
        setPayMessage(message || paymentConfirmationMessage('rent', 'failed'));
      },
      onTimeout: (msg) => setPayMessage(msg),
    },
  );

  const handlePayRent = useCallback(async (appId: number) => {
    if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
      setPayResult('error');
      setPayMessage('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    setPaying(true);
    setPayResult(null);
    setPayMessage('');

    try {
      const res = await Api.initiateRentPayment({
        applicationId: appId,
        phoneNumber: phoneNumber.trim(),
        provider: paymentProvider,
      });

      if (res.data?.order_id) {
        setRentOrderId(res.data.order_id);
        setRentApplicationId(appId);
        setPayResult('waiting');
        setPayMessage('USSD prompt sent. Waiting for confirmation...');
      } else {
        throw new Error(res.message || 'Payment initiation failed');
      }
    } catch (err: any) {
      setPayResult('error');
      setPayMessage(err?.response?.data?.message || err?.message || 'Failed to process rent payment.');
    } finally {
      setPaying(false);
    }
  }, [phoneNumber, paymentProvider]);

  const openPaymentModal = useCallback((appId: number) => {
    setPaymentModal(appId);
    setPayResult(null);
    setPayMessage('');
    setRentOrderId('');
    setRentApplicationId(null);
    setPhoneNumber('');
  }, []);

  const closePaymentModal = useCallback(() => {
    setPaymentModal(null);
    setPayResult(null);
    setPayMessage('');
    setRentOrderId('');
    setRentApplicationId(null);
    setPhoneNumber('');
  }, []);

  const filtered = useMemo(() =>
    applications.filter(item => {
      const hay = `${item.property?.title || ''} ${item.property?.location || ''} ${item.message || ''}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    }),
    [applications, search]
  );

  const activeApp = paymentModal ? applications.find(a => a.id === paymentModal) : null;
  const modalAmount = activeApp ? parseRent(activeApp.property?.price) : 0;

  return (
    <div className="ap-root">
      <style>{CSS}</style>

      {/* Header */}
      <div className="ap-header">
        <div className="ap-header-inner">
          <div>
            <div className="ap-eyebrow">Tenant Workspace</div>
            <h1 className="ap-title">My Applications</h1>
            <p className="ap-subtitle">Track and manage all your rental applications</p>
          </div>

          <div className="ap-search-wrap">
            <Search size={18} className="ap-search-icon" />
            <input
              className="ap-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search properties or locations..."
            />
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="ap-body">
        {error && (
          <div className="ap-error">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className="ap-loading">
            <Loader2 size={28} />
            <div>Loading your applications...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="ap-empty">
            <ClipboardList size={48} />
            <div className="ap-empty-title">No applications yet</div>
            <div className="ap-empty-desc">Start exploring properties and submit your first application.</div>
          </div>
        ) : (
          <>
            {/* Table view — desktop/tablet */}
            <div className="ap-table-wrap">
              <div className="ap-table-scroll">
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Rent</th>
                      <th>Status</th>
                      <th>Applied</th>
                      <th>Next Step</th>
                      <th className="ap-th-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => (
                      <ApplicationRow key={item.id} item={item} onPay={openPaymentModal} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stacked cards — mobile */}
            <div className="ap-cards">
              {filtered.map(item => (
                <ApplicationCard key={item.id} item={item} onPay={openPaymentModal} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal && activeApp && (
        <div className="ap-overlay" onClick={() => payResult !== 'waiting' && closePaymentModal()}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <div className="ap-modal-head">
              {payResult !== 'waiting' && (
                <button className="ap-modal-close" onClick={closePaymentModal} disabled={paying}>
                  <X size={15} />
                </button>
              )}
              <div className="ap-modal-eyebrow">SECURE PAYMENT</div>
              <div className="ap-modal-title">Pay Monthly Rent</div>
              <div className="ap-modal-sub">Powered by Selcom · Oweru</div>
            </div>

            <div className="ap-modal-body">
              {/* Property Summary */}
              <div className="ap-property-summary">
                <div className="ap-property-name">{activeApp.property?.title}</div>
                {activeApp.property?.location && (
                  <div className="ap-property-loc">
                    <MapPin size={15} /> {activeApp.property.location}
                  </div>
                )}
                <div className="ap-amount-row">
                  <span className="ap-amount-label">Amount Due</span>
                  <span className="ap-amount-value">Tsh {modalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Provider Selection */}
              <div className="ap-field-label">PAYMENT PROVIDER</div>
              <div className="ap-provider-grid">
                {PROVIDERS.map(p => (
                  <button
                    key={p.value}
                    className={`ap-provider-btn ${p.value}`}
                    data-active={paymentProvider === p.value ? 'true' : 'false'}
                    onClick={() => setPaymentProvider(p.value)}
                    disabled={paying}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Phone Input */}
              <div className="ap-field-label">PHONE NUMBER</div>
              <div className="ap-phone-wrap">
                <Phone size={18} className="ap-phone-icon" />
                <input
                  type="tel"
                  className="ap-phone-input"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="0712 345 678"
                  disabled={paying}
                />
              </div>

              {/* Security */}
              <div className="ap-secure-row">
                <ShieldCheck size={18} /> 256-bit SSL Secured · Trusted by Selcom
              </div>

              {/* Result Messages */}
              {payResult && (
                <div className={`ap-result ${payResult}`}>
                  {payResult === 'success' ? <CheckCircle size={20} /> : payResult === 'waiting' ? <Loader2 size={20} style={{ animation: 'spin 0.9s linear infinite' }} /> : <AlertCircle size={20} />}
                  <span>{payMessage}</span>
                </div>
              )}

              {payResult === 'waiting' && (
                <button
                  type="button"
                  className="ap-btn-cancel"
                  style={{ width: '100%', marginBottom: 12 }}
                  onClick={async () => {
                    const res = await pollRent();
                    if (parsePaymentStatus(res.data) === 'paid') {
                      setPayResult('success');
                      setPayMessage(res.data?.message as string || paymentConfirmationMessage('rent', 'paid'));
                      await refreshApplications();
                    } else {
                      setPayMessage('Still checking… If you approved on your phone, wait a few seconds and tap again.');
                    }
                  }}
                >
                  I completed payment — check again
                </button>
              )}

              {/* Buttons */}
              <div className="ap-modal-actions">
                <button
                  className="ap-btn-cancel"
                  onClick={closePaymentModal}
                  disabled={paying}
                >
                  {payResult === 'success' ? 'Done' : payResult === 'waiting' ? 'Close (payment may still complete)' : 'Cancel'}
                </button>

                {payResult !== 'success' && payResult !== 'waiting' && (
                  <button
                    className="ap-btn-pay"
                    onClick={() => handlePayRent(paymentModal)}
                    disabled={paying || !phoneNumber || phoneNumber.length < 10}
                  >
                    {paying ? (
                      <> <Loader2 size={18} style={{ animation: 'spin 0.9s linear infinite' }} /> Processing... </>
                    ) : (
                      <> <DollarSign size={18} /> Pay Tsh {modalAmount.toLocaleString()} </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;