import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, AlertCircle, ClipboardList, Clock, DollarSign, CheckCircle, Loader2, ShieldCheck, Phone, Info } from 'lucide-react';
import Api from '../../services/api';
import SelcomService from '../../services/selcom';
import { formatCurrency, formatDate } from './tenantPageStyles';

// ── Types ──────────────────────────────────────────────────────────────────
interface ApplicationItem {
  id: number;
  status?: string;
  message?: string;
  created_at?: string;
  rent_paid?: boolean;
  rejection_reason?: string;
  property?: {
    id?: number;
    title?: string;
    location?: string;
    price?: number | string;
  };
}

// ── Strict Color Adherence ──────────────────────────────────────────────────
const B = {
  navy900: '#0F172A',
  navy800: '#162035',
  navy700: '#1E2D4A',
  gold:    '#C89128',
  goldLt:  '#D4A843',
  goldDim: 'rgba(200,145,40,0.12)',
  cream:   '#F8F8F9',
  slate:   '#94A3B8',
  blue:    '#3B82F6',
  border:  'rgba(200,145,40,0.18)',
  borderF: 'rgba(200,145,40,0.08)',
};

const statusColorMap: Record<string, string> = {
  approved:  B.gold,
  pending:   '#f59e0b',
  rejected:  '#ef4444',
  cancelled: '#ef4444',
  active:    '#10b981',
};

// ── Components ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, rejectionReason }: { status?: string; rejectionReason?: string }) => {
  const s = status || 'unknown';
  const color = statusColorMap[s] ?? B.slate;

  return (
    <div>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px',
        background: `${color}15`, 
        border: `1px solid ${color}30`,
        color, 
        fontSize: '10px', 
        fontWeight: 700,
        letterSpacing: '0.08em', 
        textTransform: 'uppercase',
        borderRadius: '2px', // Professional sharp finish
        fontFamily: "'Jost', sans-serif",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        {s}
      </span>
      {s === 'rejected' && rejectionReason && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#f87171', lineHeight: 1.4, display: 'flex', gap: 6 }}>
          <Info size={12} /> {rejectionReason}
        </div>
      )}
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const parseRent = (price?: number | string): number => {
  if (price == null) return 0;
  if (typeof price === 'number') return price;
  const cleaned = price.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

const makeOrderId = (appId: number) => `RENT-${appId}-${Date.now()}`;

// ── Main Page ────────────────────────────────────────────────────────────────
const ApplicationsPage = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property');

  const [paymentModal, setPaymentModal] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'tigo' | 'mpesa' | 'airtel' | 'halopesa'>('tigo');
  const [payResult, setPayResult] = useState<'success' | 'error' | null>(null);
  const [payMessage, setPayMessage] = useState('');

  useEffect(() => {
    if (propertyId) handleApplyForProperty(propertyId);
  }, [propertyId]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await Api.getTenantApplications();
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForProperty = async (id: string) => {
    try {
      await Api.createApplication({
        property_id: parseInt(id),
        message: 'I am interested in this property.',
      });
      window.history.replaceState({}, '', window.location.pathname);
      await fetchApplications();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to submit application.');
    }
  };

  const handlePayRent = async (appId: number) => {
    if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
      setPayResult('error');
      setPayMessage('Please enter a valid phone number.');
      return;
    }

    const application = applications.find(app => app.id === appId);
    const rentAmount = parseRent(application?.property?.price);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    setPaying(true);
    setPayResult(null);

    try {
      const paymentResponse = await SelcomService.initiateMobileMoneyPayment({
        amount: rentAmount,
        phone_number: phoneNumber,
        provider: paymentProvider,
        property_id: application?.property?.id ?? appId,
        tenant_id: user.id,
        payment_type: 'rent_payment',
        customer_email: user.email ?? '',
        customer_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Tenant',
      });

      if (!paymentResponse.success || !paymentResponse.data) {
        throw new Error(paymentResponse.message || 'Payment initiation failed');
      }

      await Api.updateApplicationPaymentStatus(appId, {
        payment_status: 'paid',
        payment_method: paymentProvider,
        transaction_id: paymentResponse.data.transaction_id,
        amount_paid: rentAmount,
      });

      setPayResult('success');
      setPayMessage(`Payment request sent! Ref: ${paymentResponse.data.transaction_id}`);
      await fetchApplications();
    } catch (err: any) {
      setPayResult('error');
      setPayMessage(err?.message || 'Payment failed.');
    } finally {
      setPaying(false);
    }
  };

  const openPaymentModal = (appId: number) => {
    setPaymentModal(appId);
    setPayResult(null);
  };

  const filtered = useMemo(() => 
    applications.filter(item => 
      `${item.property?.title} ${item.property?.location}`.toLowerCase().includes(search.toLowerCase())
    ), [applications, search]
  );

  const activeApp = paymentModal ? applications.find(a => a.id === paymentModal) : null;
  const modalAmount = activeApp ? parseRent(activeApp.property?.price) : 0;

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: B.navy900, color: B.cream, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }

        .app-container { max-width: 900px; margin: 0 auto; padding: 20px; }
        
        .nav-header {
          background: ${B.navy800};
          border: 1px solid ${B.border};
          padding: 30px;
          margin-bottom: 24px;
          position: relative;
        }

        .search-wrap {
          position: relative;
          margin-top: 20px;
        }

        .search-input {
          width: 100%;
          background: ${B.navy900};
          border: 1px solid ${B.border};
          color: ${B.cream};
          padding: 12px 12px 12px 40px;
          outline: none;
        }

        .app-item {
          background: ${B.navy800};
          border: 1px solid ${B.border};
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
        }

        .app-body { padding: 20px; }
        
        .app-footer {
          background: ${B.navy900};
          border-top: 1px solid ${B.borderF};
          padding: 16px 20px;
        }

        .label-xs {
          font-size: 10px;
          color: ${B.gold};
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .btn-pay {
          width: 100%;
          background: ${B.gold};
          color: ${B.navy900};
          border: none;
          padding: 14px;
          font-weight: 700;
          text-transform: uppercase;
          cursor: pointer;
        }

        .provider-btn {
          background: ${B.navy900};
          border: 1px solid ${B.border};
          color: ${B.slate};
          padding: 10px;
          font-size: 12px;
          cursor: pointer;
        }
        .provider-btn.active {
          border-color: ${B.gold};
          color: ${B.gold};
          background: ${B.goldDim};
        }
      `}</style>

      <div className="app-container">
        {/* Header Section */}
        <div className="nav-header">
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: B.gold }} />
          <div className="label-xs">Personal Dashboard</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '4px 0' }}>My Applications</h1>
          
          <div className="search-wrap">
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: B.slate }} />
            <input 
              className="search-input"
              placeholder="Search by property or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List Section */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}><Loader2 style={{ animation: 'spin 1s linear infinite', color: B.gold, margin: '0 auto' }} /></div>
        ) : filtered.map(item => (
          <div key={item.id} className="app-item">
            <div className="app-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{item.property?.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: B.slate, fontSize: 13, marginTop: 4 }}>
                    <MapPin size={14} /> {item.property?.location}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: B.gold }}>{formatCurrency(item.property?.price)}</div>
                  <div style={{ fontSize: 9, color: B.slate }}>PER MONTH</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
                <div>
                  <div className="label-xs">Status</div>
                  <StatusBadge status={item.status} rejectionReason={item.rejection_reason} />
                </div>
                <div>
                  <div className="label-xs">Applied On</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <Clock size={14} style={{ color: B.slate }} /> {formatDate(item.created_at)}
                  </div>
                </div>
              </div>
            </div>

            <div className="app-footer">
              {item.status === 'approved' && !item.rent_paid ? (
                <button className="btn-pay" onClick={() => openPaymentModal(item.id)}>
                  <DollarSign size={16} style={{ marginRight: 8 }} /> Proceed to Payment
                </button>
              ) : item.rent_paid ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 700, fontSize: 14 }}>
                  <CheckCircle size={18} /> Rent Paid Successfully
                </div>
              ) : (
                <div style={{ fontSize: 12, color: B.slate }}>
                  Waiting for property manager's decision...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {paymentModal && activeApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.95)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: B.navy800, border: `1px solid ${B.border}`, width: '100%', maxWidth: 400 }}>
            <div style={{ padding: 24, borderBottom: `1px solid ${B.border}`, background: B.navy900 }}>
              <div className="label-xs">Secure Checkout</div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Pay Monthly Rent</h2>
            </div>
            
            <div style={{ padding: 24 }}>
              <div style={{ background: B.navy900, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: B.slate }}>Amount Due</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: B.gold }}>Tsh {modalAmount.toLocaleString()}</div>
              </div>

              <div className="label-xs" style={{ marginBottom: 10 }}>Select Provider</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                {['tigo', 'mpesa', 'airtel', 'halopesa'].map(p => (
                  <button 
                    key={p} 
                    className={`provider-btn ${paymentProvider === p ? 'active' : ''}`}
                    onClick={() => setPaymentProvider(p as any)}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="label-xs" style={{ marginBottom: 10 }}>Phone Number</div>
              <div style={{ position: 'relative', marginBottom: 24 }}>
                <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: B.slate }} />
                <input 
                  style={{ width: '100%', background: B.navy900, border: `1px solid ${B.border}`, color: B.cream, padding: '12px 12px 12px 36px', outline: 'none' }}
                  placeholder="07XXXXXXXX"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                />
              </div>

              {payResult && (
                <div style={{ padding: 12, background: `${payResult === 'success' ? '#10b981' : '#ef4444'}20`, color: payResult === 'success' ? '#10b981' : '#ef4444', fontSize: 13, marginBottom: 20 }}>
                  {payMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => setPaymentModal(null)}
                  style={{ flex: 1, padding: 14, background: 'transparent', border: `1px solid ${B.border}`, color: B.cream, fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handlePayRent(paymentModal)}
                  disabled={paying}
                  style={{ flex: 2, background: B.gold, color: B.navy900, border: 'none', padding: 14, fontWeight: 700 }}
                >
                  {paying ? 'Processing...' : 'Confirm Pay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;