import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Search, ShieldCheck } from 'lucide-react';
import Api from '../../services/api';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#0e0e0e',
  border: '1px solid rgba(201,168,76,0.12)',
  borderRadius: 12,
  padding: 20,
};

const VerificationManagement = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [requestsRes, statsRes] = await Promise.all([
          Api.getVerificationRequests({ status: statusFilter === 'all' ? undefined : statusFilter, search: searchTerm || undefined }),
          Api.getVerificationStats(),
        ]);
        setRequests(requestsRes.data || []);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [statusFilter, searchTerm]);

  const filtered = useMemo(() => requests.filter((item) => {
    if (!searchTerm) return true;
    const needle = searchTerm.toLowerCase();
    return [item.user?.name, item.user?.email, item.user?.type].filter(Boolean).join(' ').toLowerCase().includes(needle);
  }), [requests, searchTerm]);

  if (loading) {
    return <div style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading verification requests...</div>;
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <ShieldCheck size={22} style={{ color: '#c9a84c' }} />
          <h1 style={{ margin: 0, color: '#e8e4dc', fontSize: 28, fontWeight: 600 }}>Verification Management</h1>
        </div>
        <p style={{ margin: 0, color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
          Review live account verification status and surface the users still waiting for approval.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          ['Total Requests', stats?.totalRequests ?? 0, '#e8e4dc'],
          ['Pending', stats?.pendingRequests ?? 0, '#f59e0b'],
          ['Approved', stats?.approvedRequests ?? 0, '#10b981'],
          ['Urgent', stats?.urgentRequests ?? 0, '#ef4444'],
        ].map(([label, value, color]) => (
          <div key={String(label)} style={cardStyle}>
            <div style={{ color, fontSize: 26, fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>{value as any}</div>
            <div style={{ marginTop: 8, color: '#7a7060', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ color: '#7a7060' }} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email"
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#e8e4dc', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ backgroundColor: '#171717', color: '#e8e4dc', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 8, padding: '10px 12px' }}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.length === 0 && (
            <div style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>No verification requests matched the current filters.</div>
          )}

          {filtered.map((item) => {
            const isApproved = item.status === 'approved';
            const statusColor = isApproved ? '#10b981' : '#f59e0b';
            const StatusIcon = isApproved ? CheckCircle2 : Clock3;

            return (
              <div key={item.id} style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: '#e8e4dc', fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>{item.user?.name}</div>
                    <div style={{ color: '#7a7060', fontSize: 13, marginTop: 4, fontFamily: 'DM Sans, sans-serif' }}>{item.user?.email}</div>
                    <div style={{ color: '#7a7060', fontSize: 13, marginTop: 4, fontFamily: 'DM Sans, sans-serif' }}>{item.user?.type} • submitted {new Date(item.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: statusColor, fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>
                    <StatusIcon size={16} />
                    {item.status}
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
                    {item.type}
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: 999, backgroundColor: item.priority === 'high' ? 'rgba(239,68,68,0.12)' : 'rgba(201,168,76,0.12)', color: item.priority === 'high' ? '#ef4444' : '#c9a84c', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
                    {item.priority} priority
                  </span>
                  {!isApproved && (
                    <span style={{ padding: '4px 10px', borderRadius: 999, backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: 12, fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} /> Needs review
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VerificationManagement;
