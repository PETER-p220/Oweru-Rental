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
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
      background: '#111',
      color: '#f5f0e8',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#c9a84c' }}>
          Commissions Management
        </h2>
        <p style={{ color: '#8a8070', marginBottom: '24px' }}>
          Track your earnings and commission payments from property deals.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: 'rgba(201,168,76,0.05)',
          border: '1px solid rgba(201,168,76,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <DollarSign size={24} style={{ color: '#c9a84c' }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#8a8070', marginBottom: '4px' }}>Total Earned</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#f5f0e8' }}>
              {new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(totalEarned)}
            </div>
          </div>
        </div>
        <div style={{
          background: 'rgba(16,185,129,0.05)',
          border: '1px solid rgba(16,185,129,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Target size={24} style={{ color: '#10b981' }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#8a8070', marginBottom: '4px' }}>Pending</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#f5f0e8' }}>
              {new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(totalPending)}
            </div>
          </div>
        </div>
      </div>

      {/* Commissions Table */}
      <div style={{
        background: 'rgba(201,168,76,0.05)',
        border: '1px solid rgba(201,168,76,0.1)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Property</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Client</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.id} style={{ borderBottom: '1px solid rgba(201,168,76,0.05)' }}>
                  <td style={{ padding: '12px', color: '#f5f0e8' }}>{commission.property}</td>
                  <td style={{ padding: '12px', color: '#f5f0e8' }}>{commission.client}</td>
                  <td style={{ padding: '12px', color: '#f5f0e8', fontWeight: '600' }}>
                    {new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(commission.amount)}
                  </td>
                  <td style={{ padding: '12px', color: '#8a8070' }}>{commission.date}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: commission.status === 'paid' ? '#10b981' : '#f59e0b',
                      color: '#ffffff'
                    }}>
                      {commission.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{
                        padding: '6px 12px',
                        background: 'rgba(201,168,76,0.1)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        borderRadius: '6px',
                        color: '#f5f0e8',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}>
                        <Users size={14} />
                      </button>
                      {commission.status === 'pending' && (
                        <button style={{
                          padding: '6px 12px',
                          background: 'rgba(16,185,129,0.1)',
                          border: '1px solid rgba(16,185,129,0.2)',
                          borderRadius: '6px',
                          color: '#f5f0e8',
                          fontSize: '12px',
                          cursor: 'pointer'
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
