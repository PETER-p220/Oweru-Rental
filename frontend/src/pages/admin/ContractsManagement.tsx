import { useEffect, useMemo, useState } from 'react';
import { FileText, Search, Users } from 'lucide-react';
import Api from '../../services/api';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#0e0e0e',
  border: '1px solid rgba(201,168,76,0.12)',
  borderRadius: 12,
  padding: 20,
};

const money = (value: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(value || 0);

const ContractsManagement = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [contractsRes, statsRes] = await Promise.all([
          Api.getAdminContracts(),
          Api.getAdminContractStats(),
        ]);
        setContracts(contractsRes.data || []);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => contracts.filter((contract) => {
    if (statusFilter !== 'all' && contract.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const haystack = [
      contract.reference,
      contract.title,
      contract.property?.title,
      contract.parties?.tenant?.name,
      contract.parties?.landlord?.name,
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  }), [contracts, searchTerm, statusFilter]);

  if (loading) {
    return <div style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading contracts...</div>;
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <FileText size={22} style={{ color: '#c9a84c' }} />
          <h1 style={{ margin: 0, color: '#e8e4dc', fontSize: 28, fontWeight: 600 }}>Contracts Management</h1>
        </div>
        <p style={{ margin: 0, color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
          Review live rental contracts created across landlord, tenant, and agent activity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          ['Total Contracts', stats?.totalContracts ?? 0, '#e8e4dc'],
          ['Active', stats?.activeContracts ?? 0, '#10b981'],
          ['Pending', stats?.pendingContracts ?? 0, '#f59e0b'],
          ['Total Value', money(stats?.totalValue ?? 0), '#c9a84c'],
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
            placeholder="Search by contract, property, or party"
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#e8e4dc', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ backgroundColor: '#171717', color: '#e8e4dc', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 8, padding: '10px 12px' }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.length === 0 && (
            <div style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>No contracts matched the current filters.</div>
          )}

          {filtered.map((contract) => {
            const statusColor = contract.status === 'active' ? '#10b981' : contract.status === 'pending' ? '#f59e0b' : '#ef4444';
            return (
              <div key={contract.id} style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: '#e8e4dc', fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>{contract.title}</div>
                    <div style={{ color: '#7a7060', fontSize: 13, marginTop: 4, fontFamily: 'DM Sans, sans-serif' }}>{contract.reference} • {contract.property?.title}</div>
                    <div style={{ color: '#7a7060', fontSize: 13, marginTop: 4, fontFamily: 'DM Sans, sans-serif' }}>
                      {new Date(contract.terms?.startDate).toLocaleDateString()} - {new Date(contract.terms?.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 999, backgroundColor: `${statusColor}20`, color: statusColor, fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>{contract.status}</span>
                    <span style={{ padding: '4px 10px', borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>{contract.type}</span>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div style={{ color: '#7a7060', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                    <strong style={{ color: '#e8e4dc' }}>Landlord:</strong> {contract.parties?.landlord?.name || 'Unassigned'}
                  </div>
                  <div style={{ color: '#7a7060', fontSize: 13, fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={14} />
                    <span><strong style={{ color: '#e8e4dc' }}>Tenant:</strong> {contract.parties?.tenant?.name || 'Unassigned'}</span>
                  </div>
                  <div style={{ color: '#7a7060', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                    <strong style={{ color: '#e8e4dc' }}>Rent:</strong> {money(Number(contract.terms?.rentAmount || 0))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContractsManagement;
