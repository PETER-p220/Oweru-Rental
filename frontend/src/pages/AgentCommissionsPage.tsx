import React from 'react';
import { DollarSign, Users, Target } from 'lucide-react';

const AgentCommissionsPage: React.FC = () => {
  console.log('AgentCommissionsPage rendered - this should appear in console when clicking Commissions link');
  
  const commissions = [
    { id: 1, property: 'Modern Apartment', client: 'John Doe', amount: 45000, date: '2024-03-14', status: 'paid' },
    { id: 2, property: 'Beach House', client: 'Jane Smith', amount: 120000, date: '2024-03-13', status: 'paid' },
    { id: 3, property: 'City Villa', client: 'Bob Johnson', amount: 85000, date: '2024-03-12', status: 'pending' },
    { id: 4, property: 'Modern Apartment', client: 'Alice Brown', amount: 45000, date: '2024-03-11', status: 'paid' },
    { id: 5, property: 'Beach House', client: 'Charlie Wilson', amount: 60000, date: '2024-03-10', status: 'pending' },
  ];

  const totalEarned = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

  return (
    <div style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: '#F1F5F9',
      color: '#0F172A',
      minHeight: '100vh',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '52px 40px 44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C89128', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', padding: '4px 12px' }}>
              Agent Workspace
            </div>
            <h1 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>Commissions</h1>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 400, color: '#94A3B8', margin: '8px 0 0' }}>
              Track your earnings and commission payments from property deals.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 40px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#C89128' }} />
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <DollarSign size={24} style={{ color: '#C89128' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '4px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Total Earned</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>
              {new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(totalEarned)}
            </div>
          </div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#10b981' }} />
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Target size={24} style={{ color: '#10b981' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '4px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Pending</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>
              {new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(totalPending)}
            </div>
          </div>
        </div>
      </div>

      {/* Commissions Table */}
      <div style={{ maxWidth: '1280px', margin: '24px auto 0', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Property</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{commission.property}</td>
                  <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{commission.client}</td>
                  <td style={{ padding: '12px', color: '#0F172A', fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    {new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(commission.amount)}
                  </td>
                  <td style={{ padding: '12px', color: '#64748B', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{commission.date}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      backgroundColor: commission.status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: commission.status === 'paid' ? '#10b981' : '#f59e0b',
                      border: commission.status === 'paid' ? '1px solid rgba(16,185,129,0.28)' : '1px solid rgba(245,158,11,0.28)'
                    }}>
                      {commission.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{
                        padding: '6px 12px',
                        background: 'rgba(200,145,40,0.1)',
                        border: '1px solid rgba(200,145,40,0.28)',
                        borderRadius: '6px',
                        color: '#C89128',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', system-ui, sans-serif"
                      }}>
                        <Users size={14} />
                      </button>
                      {commission.status === 'pending' && (
                        <button style={{
                          padding: '6px 12px',
                          background: 'rgba(16,185,129,0.1)',
                          border: '1px solid rgba(16,185,129,0.28)',
                          borderRadius: '6px',
                          color: '#10b981',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontFamily: "'DM Sans', system-ui, sans-serif"
                        }}>
                          <DollarSign size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentCommissionsPage;
