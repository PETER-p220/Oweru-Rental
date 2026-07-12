import React, { useEffect, useState } from 'react';
import { CreditCard, Search, RefreshCw, Building2, AlertCircle } from 'lucide-react';
import { TOKEN_KEY } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface PaymentRow {
  id: number;
  type?: string;
  description?: string;
  amount: number;
  status: string;
  reference?: string;
  paid_at?: string | null;
  created_at?: string | null;
  tenant_name?: string;
  tenant_email?: string;
  property?: { id: number; title: string; location?: string } | null;
}

interface Summary {
  total_received: number;
  completed_count: number;
  pending_count: number;
  this_month: number;
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_received: 0,
    completed_count: 0,
    pending_count: 0,
    this_month: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n || 0);

  const fmtDate = (s?: string | null) =>
    s
      ? new Date(s).toLocaleDateString('en-TZ', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem(TOKEN_KEY);
      const params = new URLSearchParams({ per_page: '50' });
      if (status !== 'all') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`${API_BASE}/api/commercial/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Unable to load payments');
      }
      const data = await res.json();
      setPayments(Array.isArray(data.data) ? data.data : []);
      setSummary(data.summary || summary);
    } catch (e: any) {
      setError(e.message || 'Unable to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const statusStyle = (s: string) => {
    const key = s === 'completed' ? 'paid' : s;
    if (key === 'paid') return { bg: 'rgba(16,185,129,0.12)', color: '#10B981' };
    if (key === 'pending' || key === 'processing') return { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' };
    if (key === 'failed') return { bg: 'rgba(239,68,68,0.12)', color: '#EF4444' };
    return { bg: 'rgba(100,116,139,0.12)', color: '#94A3B8' };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080E1A', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .card-panel { background: #0F1829; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; }
        .form-input {
          width: 100%; padding: 10px 16px; background: #0C1420;
          border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
          color: #E2D5B0; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none;
        }
        .form-input:focus { border-color: rgba(212,175,55,0.5); }
        select option { background: #0C1420; color: #E2D5B0; }
        .pay-row { display: flex; align-items: center; gap: 14px; padding: 14px 22px; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .pay-row:last-child { border-bottom: none; }
        .pay-row:hover { background: rgba(212,175,55,0.025); }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .filter-grid { grid-template-columns: 1fr !important; }
          .hide-sm { display: none !important; }
          .pay-row { align-items: flex-start; padding: 14px 16px; gap: 12px; flex-wrap: wrap; }
          .pay-row > div:last-child { margin-left: auto; }
        }
        @media (max-width: 400px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Finance</span>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, color: '#F1EDD8', fontFamily: "'Playfair Display', serif", lineHeight: 1.1, marginBottom: 4 }}>Payment Records</h1>
            <p style={{ color: '#4A5568', fontSize: 13 }}>Every rent and site-visit payment for your commercial properties</p>
          </div>
          <button
            onClick={load}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 12, color: '#D4AF37', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Total received', value: fmt(summary.total_received) },
            { label: 'This month', value: fmt(summary.this_month) },
            { label: 'Completed', value: String(summary.completed_count) },
            { label: 'Pending', value: String(summary.pending_count) },
          ].map((s) => (
            <div key={s.label} className="card-panel" style={{ padding: 18 }}>
              <p style={{ fontSize: 11, color: '#4A5568', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#F1EDD8' }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="card-panel" style={{ padding: '18px 22px' }}>
          <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 180px auto', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#4A5568" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="Search tenant, property, or reference…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button
              onClick={load}
              style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #D4AF37, #B8960C)', color: '#080E1A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Search
            </button>
          </div>
        </div>

        {error && (
          <div className="card-panel" style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'center', color: '#FCA5A5' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="card-panel">
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#4A5568' }}>
              <div style={{ width: 32, height: 32, border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Loading payment records…
            </div>
          ) : payments.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <CreditCard size={24} color="#2D3748" />
              </div>
              <p style={{ color: '#E2D5B0', fontWeight: 600, marginBottom: 6 }}>No payment records yet</p>
              <p style={{ color: '#4A5568', fontSize: 13 }}>When tenants pay rent or site-visit fees on your listings, receipts appear here.</p>
            </div>
          ) : (
            payments.map((p) => {
              const st = statusStyle(p.status);
              return (
                <div key={p.id} className="pay-row">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={16} color="#D4AF37" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#E2D5B0', fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.property?.title || 'Property'}
                    </p>
                    <p style={{ color: '#4A5568', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.tenant_name || 'Tenant'} · {p.description || (p.type || '').replace(/_/g, ' ')}
                      {p.reference ? ` · ${p.reference}` : ''}
                    </p>
                  </div>
                  <div className="hide-sm" style={{ width: 140, color: '#64748B', fontSize: 12 }}>
                    {fmtDate(p.paid_at || p.created_at)}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: 13 }}>{fmt(p.amount)}</p>
                    <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color, textTransform: 'uppercase' }}>
                      {p.status === 'completed' ? 'paid' : p.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
