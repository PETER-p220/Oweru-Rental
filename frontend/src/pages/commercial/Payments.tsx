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
    if (key === 'paid') return { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' };
    if (key === 'pending' || key === 'processing') return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
    if (key === 'failed') return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
    return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
  };

  return (
    <div className="cd-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .cd-page { background: #F1F5F9; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .cd-header { background: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 32px 40px; }
        .cd-wrap { max-width: 1280px; margin: 0 auto; padding: 32px 40px 80px; }
        
        .cd-card { 
          background: #FFFFFF; 
          border: 1px solid #E2E8F0; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 1px 3px rgba(15,23,42,0.04); 
        }
        
        .cd-stat-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 20px;
        }
        
        .cd-row {
          padding: 18px 24px;
          border-bottom: 1px solid #F1F5F9;
          transition: background 0.2s;
        }
        .cd-row:hover { background: #F8FAFC; }
        .cd-row:last-child { border-bottom: none; }
        
        .cd-filter-input {
          width: 100%;
          padding: 11px 12px 11px 40px;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 14px;
        }
        
        .cd-btn {
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
      `}</style>

      {/* Header */}
      <div className="cd-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#64748B', textTransform: 'uppercase' }}>
              FINANCE
            </div>
            <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 28px)', fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0' }}>
              Payment Records
            </h1>
            <p style={{ color: '#64748B' }}>Track all rent and site-visit payments</p>
          </div>
          <button onClick={load} className="cd-btn" style={{ border: '1px solid #CBD5E1', color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="cd-wrap">
        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Received', value: fmt(summary.total_received) },
            { label: 'This Month', value: fmt(summary.this_month) },
            { label: 'Completed', value: summary.completed_count.toLocaleString() },
            { label: 'Pending', value: summary.pending_count.toLocaleString() },
          ].map((item, i) => (
            <div key={i} className="cd-stat-card">
              <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.label}
              </p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="cd-card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 12, alignItems: 'end' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: 13, color: '#94A3B8' }} />
              <input
                className="cd-filter-input"
                placeholder="Search tenant, property, or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>

            <select 
              className="cd-filter-input" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <button onClick={load} className="cd-btn" style={{ background: '#0F172A', color: 'white', height: '46px' }}>
              Apply Filters
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '16px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="cd-card">
          {loading ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748B' }}>
              <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              Loading payment records...
            </div>
          ) : payments.length === 0 ? (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <CreditCard size={48} style={{ color: '#CBD5E1', marginBottom: 16 }} />
              <h3 style={{ color: '#0F172A' }}>No payments yet</h3>
              <p style={{ color: '#64748B', maxWidth: 320, margin: '12px auto 0' }}>
                When tenants make payments, they will appear here.
              </p>
            </div>
          ) : (
            payments.map((p) => {
              const st = statusStyle(p.status);
              return (
                <div key={p.id} className="cd-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ width: 48, height: 48, background: '#EFF6FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={22} style={{ color: '#3B82F6' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 220 }}>
                      <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>
                        {p.property?.title || 'Property Payment'}
                      </p>
                      <p style={{ color: '#64748B', fontSize: 13 }}>
                        {p.tenant_name || 'Tenant'} • {p.description || p.type?.replace(/_/g, ' ')}
                        {p.reference && ` • ${p.reference}`}
                      </p>
                    </div>

                    <div style={{ color: '#64748B', fontSize: 13, minWidth: 140 }}>
                      {fmtDate(p.paid_at || p.created_at)}
                    </div>

                    <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                      <p style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>{fmt(p.amount)}</p>
                      <span style={{
                        display: 'inline-block',
                        marginTop: 6,
                        padding: '3px 12px',
                        borderRadius: 9999,
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: st.bg,
                        color: st.text,
                        border: `1px solid ${st.border}`
                      }}>
                        {p.status === 'completed' ? 'PAID' : p.status.toUpperCase()}
                      </span>
                    </div>
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